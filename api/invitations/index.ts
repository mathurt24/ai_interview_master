import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Return mock invitations data
    return res.status(200).json([]);
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 