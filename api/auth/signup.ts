import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  token: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, token } = signupSchema.parse(req.body);
    
    // Check if user already exists (mock check)
    if (email === 'admin@admin.com') {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Mock successful signup
    return res.status(200).json({
      id: Math.floor(Math.random() * 1000) + 1,
      email: email,
      role: 'candidate'
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(400).json({ message: 'Invalid request data' });
  }
} 