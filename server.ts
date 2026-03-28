import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import { createServer } from "http";
import Redis from "ioredis";

// --- Types ---
interface Incident {
  id: string;
  timestamp: string;
  cashier: string;
  operator: string;
  type: string;
  level: string;
  status: string;
  description: string;
  videoUrl?: string;
  screenshotUrl?: string;
  detectedObjects?: string[];
  suggested_action?: string;
}

// --- Configuration & Logging ---
const LOG_DIR = path.join(process.cwd(), "logs");
const CONFIG_FILE = path.join(process.cwd(), "backend", "config.json");
const WORKFLOW_CONFIG_FILE = path.join(process.cwd(), "backend", "workflow_config.json");

// Redis Setup
const REDIS_URL = process.env.REDIS_URL;
let redisPublisher: Redis | null = null;
let redisSubscriber: Redis | null = null;

if (REDIS_URL) {
  console.log("Redis URL detected, initializing Redis...");
  redisPublisher = new Redis(REDIS_URL);
  redisSubscriber = new Redis(REDIS_URL);

  redisSubscriber.subscribe("incidents", (err) => {
    if (err) console.error("Failed to subscribe to Redis channel:", err);
  });
}

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    } catch (e) {
      console.error("Error loading config:", e);
    }
  }
  return {
    gpu_thresholds: { temp: 85, vram: 20.0 },
    cameras: [
      { id: "01", name: "Касса №4 (Основная)", url: "rtsp://admin:secret@192.168.1.104:554/stream1", status: "active" },
      { id: "02", name: "Касса №2 (Резерв)", url: "rtsp://admin:secret@192.168.1.102:554/stream1", status: "offline" },
      { id: "03", name: "Входная группа", url: "rtsp://admin:secret@192.168.1.103:554/stream1", status: "active" }
    ]
  };
}

function saveConfig(config: any) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

let currentConfig = loadConfig();

function logToFile(level: string, message: string, data: any = null) {
  const filename = path.join(LOG_DIR, `${level.toLowerCase()}_log.jsonl`);
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: data || {}
  };
  try {
    fs.appendFileSync(filename, JSON.stringify(logEntry) + "\n");
  } catch (e) {
    console.error("Error writing to log file:", e);
  }
}

// --- Workflow Engine ---
class WorkflowEngine {
  currentState: string = "IDLE";
  workflowConfig: any;
  incidents: any[] = [];

  constructor(configPath: string) {
    if (fs.existsSync(configPath)) {
      const fullConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      this.workflowConfig = fullConfig.workflow_config;
      this.currentState = this.workflowConfig.initial_state || "IDLE";
    }
  }

  handleEvent(actionId: string, cashierName: string = "Кассир #1") {
    const transitions = this.workflowConfig.transitions || [];
    const validTransition = transitions.find((t: any) => 
      t.from_state === this.currentState && t.allowed_actions.includes(actionId)
    );

    if (validTransition) {
      this.currentState = validTransition.to_state;
      return null;
    } else {
      return this.generateIncident(actionId, cashierName);
    }
  }

  generateIncident(actionId: string, cashierName: string) {
    const incId = `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(this.incidents.length + 1).toString().padStart(3, '0')}`;
    const incident: Incident = {
      id: incId,
      timestamp: new Date().toLocaleString(),
      cashier: cashierName,
      operator: "AI System",
      type: "Нарушение регламента",
      level: "High",
      status: "Новое",
      description: `Кассир выполнил операцию '${actionId}', находясь в состоянии '${this.currentState}'. Согласно регламенту, это действие сейчас недопустимо.`,
      suggested_action: "Вернуться к обязательным этапам (пересчет/проверка) или заблокировать операцию.",
      detectedObjects: ["Person", "Cashier", "Cash"]
    };
    this.incidents.push(incident);
    return incident;
  }
}

const engine = new WorkflowEngine(WORKFLOW_CONFIG_FILE);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const PORT = 3000;

  app.use(express.json());

  // --- WebSocket Handling ---
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`New client connected. Total: ${clients.size}`);
    ws.on("close", () => {
      clients.delete(ws);
      console.log(`Client disconnected. Total: ${clients.size}`);
    });
  });

  function broadcast(message: any) {
    const data = JSON.stringify(message);
    
    // If Redis is active, publish to Redis channel as well
    if (redisPublisher) {
      redisPublisher.publish("incidents", data);
    }

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Handle Redis subscriptions
  if (redisSubscriber) {
    redisSubscriber.on("message", (channel, message) => {
      if (channel === "incidents") {
        const data = JSON.parse(message);
        // Broadcast to local WS clients when a message comes from Redis
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    });
  }

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url!, `http://${request.headers.host}`).pathname;
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // --- API Routes ---
  app.get("/api/proxy-model", async (req, res) => {
    const modelUrl = req.query.url as string;
    if (!modelUrl) {
      return res.status(400).send("URL parameter is required");
    }

    try {
      console.log(`Proxying model request: ${modelUrl}`);
      const response = await axios.get(modelUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': '*/*',
        }
      });
      
      // Set appropriate headers
      res.set('Content-Type', 'application/octet-stream');
      res.set('Access-Control-Allow-Origin', '*');
      res.send(Buffer.from(response.data));
    } catch (error: any) {
      console.error(`Proxy error for ${modelUrl}:`, error.message);
      res.status(error.response?.status || 500).send(error.message);
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/config", (req, res) => {
    res.json(currentConfig);
  });

  app.post("/api/config/ml-endpoint", (req, res) => {
    const { url } = req.body;
    currentConfig.ml_endpoint = url;
    saveConfig(currentConfig);
    logToFile("OPERATOR", "ML Integration URL updated", { url });
    res.json({ status: "updated", url });
  });

  // Forward commands to ML Endpoint (e.g., "start_recording", "reset_model")
  app.post("/api/ml/command", async (req, res) => {
    const { command, params } = req.body;
    const mlUrl = currentConfig.ml_endpoint;

    if (!mlUrl) {
      return res.status(400).json({ error: "ML Endpoint not configured" });
    }

    try {
      console.log(`Forwarding command '${command}' to ML Endpoint: ${mlUrl}`);
      const response = await axios.post(`${mlUrl}/command`, { command, params }, { timeout: 5000 });
      res.json(response.data);
    } catch (error: any) {
      console.error(`Error forwarding command to ML:`, error.message);
      res.status(502).json({ error: "ML Endpoint unreachable", message: error.message });
    }
  });

  app.post("/api/config/gpu/thresholds", (req, res) => {
    const thresholds = req.body;
    currentConfig.gpu_thresholds = thresholds;
    saveConfig(currentConfig);
    logToFile("OPERATOR", "GPU Thresholds updated", thresholds);
    res.json({ status: "updated", thresholds });
  });

  app.post("/api/config/camera/update", (req, res) => {
    const config = req.body;
    const cameraId = config.id;
    for (const cam of currentConfig.cameras) {
      if (cam.id === cameraId) {
        cam.url = config.url || cam.url;
        break;
      }
    }
    saveConfig(currentConfig);
    logToFile("OPERATOR", `Camera config updated for ${cameraId}`, config);
    res.json({ status: "updated", config });
  });

  app.get("/api/logs/export", (req, res) => {
    const level = (req.query.level as string) || "SECURITY";
    const filename = path.join(LOG_DIR, `${level.toLowerCase()}_log.jsonl`);
    if (!fs.existsSync(filename)) {
      return res.status(404).json({ error: "Log file not found" });
    }
    const content = fs.readFileSync(filename, "utf-8");
    res.json({ content, filename: path.basename(filename) });
  });

  app.post("/api/incidents/report", (req, res) => {
    const incident = req.body;
    broadcast({ type: "NEW_INCIDENT", data: incident });
    logToFile("SECURITY", `New incident reported: ${incident.type}`, incident);
    res.json({ status: "broadcasted", id: incident.id });
  });

  app.post("/api/metrics/system", (req, res) => {
    broadcast({ type: "SYSTEM_METRICS", data: req.body });
    res.json({ status: "metrics_broadcasted" });
  });

  app.post("/api/metrics/performance", (req, res) => {
    broadcast({ type: "MODEL_PERFORMANCE", data: req.body });
    res.json({ status: "performance_broadcasted" });
  });

  app.post("/api/events/handle", (req, res) => {
    const { action_id, cashier_name } = req.body;
    const incident = engine.handleEvent(action_id, cashier_name);
    if (incident) {
      broadcast({ type: "NEW_INCIDENT", data: incident });
      return res.json({ status: "incident_detected", incident });
    }
    res.json({ status: "ok", state: engine.currentState });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
