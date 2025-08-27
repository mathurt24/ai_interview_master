import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Return mock candidates data
    return res.status(200).json([
      {
        id: 1,
        name: "Devansha Mathur",
        email: "devansha@example.com",
        phone: "+1-555-123-4567",
        job_role: "Software Engineer",
        created_at: new Date().toISOString()
      }
    ]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    // Mock successful deletion
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 