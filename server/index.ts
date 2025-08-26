import express from "express";
import * as path from "path"; // Use namespace import for Node built-ins
import cors from "cors";
import { setupVite } from "./vite";
import { registerRoutes } from "./routes";
import { log } from "./vite";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Register API routes
registerRoutes(app);

if (process.env.NODE_ENV === "production") {
  // Serve built client files
  const clientBuildPath = path.resolve(__dirname, "../dist/public");
  app.use(express.static(clientBuildPath));

  // Serve all non-API routes with the React app
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });

  // Production server
  app.listen(port, () => {
    log(`Production server running on port ${port}`);
  });
} else {
  // Development server with Vite integration
  const server = app.listen(port, () => {
    log(`Dev server running on port ${port}`);
    setupVite(app, server);
  });
}

export default app;
