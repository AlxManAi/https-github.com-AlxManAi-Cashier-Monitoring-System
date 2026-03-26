import asyncio
import json
import logging
from typing import List, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

# --- Configuration & Logging ---
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
    cashier: string
    operator: string
    type: string
    level: str
    status: str

class WSMessage(BaseModel):
    type: str
    data: Dict

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
    return {"status": "broadcasted", "id": incident.id}

# --- Run ---
# To run: uvicorn server:app --host 0.0.0.0 --port 8000
