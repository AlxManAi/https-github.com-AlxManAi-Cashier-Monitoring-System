import os
import json
import logging
from typing import List, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

# --- Configuration & Logging ---
LOG_DIR = "logs"
CONFIG_FILE = "backend/config.json"

if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {
        "gpu_thresholds": {"temp": 85, "vram": 20.0},
        "cameras": [
            {"id": "01", "name": "Касса №4 (Основная)", "url": "rtsp://admin:secret@192.168.1.104:554/stream1", "status": "active"},
            {"id": "02", "name": "Касса №2 (Резерв)", "url": "rtsp://admin:secret@192.168.1.102:554/stream1", "status": "offline"},
            {"id": "03", "name": "Входная группа", "url": "rtsp://admin:secret@192.168.1.103:554/stream1", "status": "active"}
        ]
    }

def save_config(config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)

current_config = load_config()

def log_to_file(level: str, message: str, data: Dict = None):
    """
    Writes a log entry in JSON Lines format as per Task 4.4 spec.
    """
    filename = f"{LOG_DIR}/{level.lower()}_log.jsonl"
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "level": level,
        "message": message,
        "data": data or {}
    }
    try:
        with open(filename, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"Error writing to log file: {e}")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WebSocketServer")

app = FastAPI(title="CashierWatch WebSocket Server")

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class Incident(BaseModel):
    id: str
    timestamp: str
    cashier: str
    operator: str
    type: str
    level: str
    status: str
    description: str = ""
    videoUrl: str = ""
    screenshotUrl: str = ""
    detectedObjects: List[str] = []

class WSMessage(BaseModel):
    type: str
    data: Dict

# --- Workflow Engine Integration ---
from .logic import WorkflowEngine
engine = WorkflowEngine('backend/workflow_config.json')

# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

manager = ConnectionManager()

# --- Routes ---

@app.get("/")
async def get():
    return {"status": "WebSocket Server is running"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    # Security: In production, validate Bearer token here
    # if token != "EXPECTED_TOKEN":
    #     await websocket.close(code=1008)
    #     return

    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client messages if needed
            data = await websocket.receive_text()
            logger.info(f"Received from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/events/handle")
async def handle_event(action_id: str, cashier_name: str = "Кассир #1"):
    """
    Endpoint to process a cashier action and check for compliance.
    """
    incident_dict = engine.handle_event(action_id, cashier_name)
    if incident_dict:
        message = {
            "type": "NEW_INCIDENT",
            "data": incident_dict
        }
        await manager.broadcast(message)
        return {"status": "incident_detected", "incident": incident_dict}
    
    return {"status": "ok", "state": engine.current_state}

@app.post("/api/incidents/report")
async def report_incident(incident: Incident):
    """
    Endpoint for the Python Notebook to report new incidents.
    This will broadcast the incident to all connected UI clients.
    """
    message = {
        "type": "NEW_INCIDENT",
        "data": incident.dict()
    }
    await manager.broadcast(message)
    logger.info(f"Incident broadcasted: {incident.id}")
    
    # Task 4.4: Log security incident
    log_to_file("SECURITY", f"New incident reported: {incident.type}", incident.dict())
    
    return {"status": "broadcasted", "id": incident.id}

@app.get("/api/config")
async def get_config():
    """
    Get current system configuration (Task 4.2).
    """
    return current_config

@app.post("/api/config/gpu/thresholds")
async def update_gpu_thresholds(thresholds: Dict):
    """
    Update GPU monitoring thresholds (Task 4.2).
    """
    logger.info(f"GPU Thresholds updated: {thresholds}")
    current_config["gpu_thresholds"] = thresholds
    save_config(current_config)
    log_to_file("OPERATOR", "GPU Thresholds updated", thresholds)
    return {"status": "updated", "thresholds": thresholds}

@app.post("/api/config/camera/update")
async def update_camera_config(config: Dict):
    """
    Update camera RTSP configuration (Task 4.2).
    """
    logger.info(f"Camera config updated: {config}")
    camera_id = config.get("id")
    for cam in current_config["cameras"]:
        if cam["id"] == camera_id:
            cam["url"] = config.get("url", cam["url"])
            break
    save_config(current_config)
    log_to_file("OPERATOR", f"Camera config updated for {camera_id}", config)
    return {"status": "updated", "config": config}

@app.get("/api/logs/export")
async def export_logs(level: str = "SECURITY"):
    """
    Export logs as a file (Task 4.4).
    """
    filename = f"{LOG_DIR}/{level.lower()}_log.jsonl"
    if not os.path.exists(filename):
        raise HTTPException(status_code=404, detail="Log file not found")
    
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()
    
    return {"content": content, "filename": filename}

@app.post("/api/metrics/system")
async def report_system_metrics(metrics: Dict):
    """
    Broadcast system telemetry (CPU, GPU, Network).
    """
    message = {
        "type": "SYSTEM_METRICS",
        "data": metrics
    }
    await manager.broadcast(message)
    return {"status": "metrics_broadcasted"}

@app.post("/api/metrics/performance")
async def report_model_performance(performance: Dict):
    """
    Broadcast model inference performance (FPS, Latency).
    """
    message = {
        "type": "MODEL_PERFORMANCE",
        "data": performance
    }
    await manager.broadcast(message)
    return {"status": "performance_broadcasted"}

# --- Run ---
# To run: uvicorn server:app --host 0.0.0.0 --port 8000
