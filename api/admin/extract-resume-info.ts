import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Mock resume extraction response
    return res.status(200).json({
      name: "Test Candidate",
      email: "candidate@example.com",
      phone: "+1-555-123-4567",
      designation: "Software Engineer",
      pastCompanies: ["Tech Company Inc."],
      skillset: ["React", "Node.js", "TypeScript"]
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 