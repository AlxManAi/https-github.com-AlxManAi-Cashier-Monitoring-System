import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Proxy for MediaPipe models to avoid CORS and 404 issues in the browser
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
