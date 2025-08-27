import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Return mock interviews data
    return res.status(200).json([]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    // Mock successful deletion
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 