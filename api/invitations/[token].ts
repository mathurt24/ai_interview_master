import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { token } = req.query;
    
    // Mock invitation validation
    if (token && typeof token === 'string') {
      return res.status(200).json({
        id: 1,
        candidateId: 1,
        email: "candidate@example.com",
        token: token,
        jobRole: "Software Engineer",
        skillset: "React, Node.js",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return res.status(404).json({ message: 'Invitation not found' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 