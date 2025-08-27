import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
  
  // Handle different API routes
  if (pathname.startsWith('/api/auth/login')) {
    return handleLogin(req, res);
  }
  
  if (pathname.startsWith('/api/auth/signup')) {
    return handleSignup(req, res);
  }
  
  if (pathname.startsWith('/api/admin/candidates')) {
    return handleAdminCandidates(req, res);
  }
  
  if (pathname.startsWith('/api/admin/interviews')) {
    return handleAdminInterviews(req, res);
  }
  
  if (pathname.startsWith('/api/admin/stats')) {
    return handleAdminStats(req, res);
  }
  
  if (pathname.startsWith('/api/admin/ai-provider')) {
    return handleAdminAIProvider(req, res);
  }
  
  if (pathname.startsWith('/api/admin/voice-provider')) {
    return handleAdminVoiceProvider(req, res);
  }
  
  if (pathname.startsWith('/api/admin/resume-upload')) {
    return handleAdminResumeUpload(req, res);
  }
  
  if (pathname.startsWith('/api/admin/extract-resume-info')) {
    return handleAdminExtractResumeInfo(req, res);
  }
  
  if (pathname.startsWith('/api/admin/send-interview-invite')) {
    return handleAdminSendInterviewInvite(req, res);
  }
  
  if (pathname.startsWith('/api/invitations')) {
    return handleInvitations(req, res);
  }
  
  if (pathname.startsWith('/api/interviews')) {
    return handleInterviews(req, res);
  }
  
  // Default response
  return res.status(404).json({ message: 'API endpoint not found' });
}

function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    // Admin authentication
    if (email === 'admin@admin.com' && password === 'admin') {
      return res.status(200).json({
        id: 2,
        email: 'admin@admin.com',
        role: 'admin'
      });
    }

    // For now, return a mock candidate response
    // In production, you'd connect to your database
    if (email === 'candidate@example.com' && password === 'password') {
      return res.status(200).json({
        id: 1,
        email: 'candidate@example.com',
        role: 'candidate'
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid request data' });
  }
}

function handleSignup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, token } = req.body;
    
    // Check if user already exists (mock check)
    if (email === 'admin@admin.com') {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Mock successful signup
    return res.status(200).json({
      id: Math.floor(Math.random() * 1000) + 1,
      email: email,
      role: 'candidate'
    });

  } catch (error) {
    return res.status(400).json({ message: 'Invalid request data' });
  }
}

function handleAdminCandidates(req: VercelRequest, res: VercelResponse) {
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

function handleAdminInterviews(req: VercelRequest, res: VercelResponse) {
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

function handleAdminStats(req: VercelRequest, res: VercelResponse) {
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

function handleAdminAIProvider(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ provider: "gemini" });
  }

  if (req.method === 'POST') {
    const { provider } = req.body;
    return res.status(200).json({ success: true, message: "AI provider updated" });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

function handleAdminVoiceProvider(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ provider: "elevenlabs" });
  }

  if (req.method === 'POST') {
    const { provider } = req.body;
    return res.status(200).json({ success: true, message: "Voice provider updated" });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

function handleAdminResumeUpload(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Mock resume upload response
    return res.status(200).json({
      success: true,
      message: "Resume uploaded successfully"
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

function handleAdminExtractResumeInfo(req: VercelRequest, res: VercelResponse) {
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

function handleAdminSendInterviewInvite(req: VercelRequest, res: VercelResponse) {
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

function handleInvitations(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Return mock invitations data
    return res.status(200).json([]);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

function handleInterviews(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Return mock interviews data
    return res.status(200).json([]);
  }

  if (req.method === 'POST') {
    // Mock interview creation
    return res.status(200).json({
      id: Math.floor(Math.random() * 1000) + 1,
      candidateId: 1,
      questions: [],
      status: "in_progress",
      createdAt: new Date().toISOString()
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 