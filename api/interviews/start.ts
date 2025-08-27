import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Mock interview start
    return res.status(200).json({
      id: Math.floor(Math.random() * 1000) + 1,
      candidateId: 1,
      questions: [
        {
          id: 1,
          questionText: "Tell me about your experience with React.",
          category: "Technical"
        }
      ],
      status: "in_progress",
      createdAt: new Date().toISOString()
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 