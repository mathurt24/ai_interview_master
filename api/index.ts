import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../server/routes';

const app = express();

// Middleware
app.use(cors({
  origin: ['https://ai-interview-master-89fq0jhnt-mathurt24-gmailcoms-projects.vercel.app', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Register all API routes
registerRoutes(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Interview Master API is running' });
});

// Export for Vercel
export default app; 