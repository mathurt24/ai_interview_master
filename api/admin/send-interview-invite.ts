import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Mock interview invitation response
    return res.status(200).json({
      success: true,
      message: "Interview invitation sent successfully",
      token: "mock-token-" + Date.now()
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 