import express from "express";
import * as path from "path"; // Use namespace import for Node built-ins
import cors from "cors";
import { setupVite } from "./vite";
import { registerRoutes } from "./routes";
import { log } from "./vite";

// Load environment variables from .env file
import dotenv from 'dotenv';

// Debug: Show current working directory and .env file path
console.log('Current working directory:', process.cwd());
console.log('Looking for .env file at:', path.resolve(process.cwd(), '.env'));
console.log('Looking for .env file in parent directory:', path.resolve(process.cwd(), '..', '.env'));

// Try multiple paths to load .env file
const envPaths = [
  path.resolve(process.cwd(), '.env'),                    // Current directory
  path.resolve(process.cwd(), '..', '.env'),             // Parent directory
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (result.parsed) {
      console.log(`✅ Environment variables loaded from: ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    console.log(`❌ Failed to load from: ${envPath}`);
  }
}

if (!envLoaded) {
  console.log('⚠️  No .env file found, using system environment variables');
}

// Debug: Check if environment variables are loaded
console.log('Environment check:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Found' : 'Not found');
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('OPENAI_API_KEY starts with sk-:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.startsWith('sk-') : false);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Found' : 'Not found');
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
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

// Test environment variables endpoint
app.get("/api/test-env", (req, res) => {
  res.json({
    status: "Environment Variables Test",
    timestamp: new Date().toISOString(),
    OPENAI_API_KEY: {
      exists: !!process.env.OPENAI_API_KEY,
      length: process.env.OPENAI_API_KEY?.length || 0,
      startsWithSk: process.env.OPENAI_API_KEY?.startsWith('sk-') || false,
      preview: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'Not found'
    },
    GEMINI_API_KEY: {
      exists: !!process.env.GEMINI_API_KEY,
      length: process.env.GEMINI_API_KEY?.length || 0,
      startsWithAIza: process.env.GEMINI_API_KEY?.startsWith('AIza') || false,
      preview: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'Not found'
    },
    NODE_ENV: process.env.NODE_ENV,
    currentWorkingDir: process.cwd(),
    envFilePaths: [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '..', '.env')
    ]
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
