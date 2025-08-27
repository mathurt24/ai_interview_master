import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ provider: "elevenlabs" });
  }

  if (req.method === 'POST') {
    const { provider } = req.body;
    return res.status(200).json({ success: true, message: "Voice provider updated" });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 