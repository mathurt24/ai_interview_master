import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Mock resume upload response
    return res.status(200).json({
      success: true,
      message: "Resume uploaded successfully"
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 