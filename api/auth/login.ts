import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Import your storage and schema (we'll need to adapt these for serverless)
const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = insertUserSchema.parse(req.body);
    
    // For now, let's create a simple admin check
    // In production, you'd connect to your database
    if (email === 'admin@admin.com' && password === 'admin') {
      return res.status(200).json({
        id: 1,
        email: 'admin@admin.com',
        role: 'admin'
      });
    }

    // Check for candidate login
    if (email === 'candidate@example.com' && password === 'password') {
      return res.status(200).json({
        id: 2,
        email: 'candidate@example.com',
        role: 'candidate'
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(400).json({ message: 'Invalid request data' });
  }
} 