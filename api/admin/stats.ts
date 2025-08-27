import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Return mock stats data
  return res.status(200).json({
    total: 1,
    recommended: 0,
    maybe: 0,
    rejected: 0
  });
} 