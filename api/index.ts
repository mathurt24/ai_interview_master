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
  
  if (pathname.startsWith('/api/admin/extract-resume-info')) {
    return handleExtractResumeInfo(req, res);
  }
  
  if (pathname.startsWith('/api/admin/send-interview-invite')) {
    return handleSendInterviewInvite(req, res);
  }
  
  if (pathname.startsWith('/api/invitations')) {
    return handleInvitations(req, res);
  }
  
  if (pathname.startsWith('/api/interviews/start')) {
    return handleInterviewsStart(req, res);
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
    
    // Simple admin check
    if (email === 'admin@admin.com' && password === 'admin') {
      return res.status(200).json({
        id: 2,
        email: 'admin@admin.com',
        role: 'admin'
      });
    }

    // Check for candidate login
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
    
    // Mock signup - in production this would create a real user
    if (email && password) {
      return res.status(200).json({
        id: Math.floor(Math.random() * 1000),
        email: email,
        role: 'candidate'
      });
    }

    return res.status(400).json({ message: 'Invalid signup data' });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid request data' });
  }
}

function handleAdminCandidates(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Return mock data for now
    return res.status(200).json([
      {
        id: 1,
        name: "Test Candidate",
        email: "candidate@example.com",
        phone: "+1-555-123-4567",
        job_role: "Software Engineer",
        created_at: new Date().toISOString()
      }
    ]);
  }
  
  if (req.method === 'DELETE') {
    const candidateId = req.url?.split('/').pop();
    return res.status(200).json({ success: true, message: `Candidate ${candidateId} deleted` });
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

function handleAdminInterviews(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json([]);
  }
  
  if (req.method === 'DELETE') {
    const interviewId = req.url?.split('/').pop();
    return res.status(200).json({ success: true, message: `Interview ${interviewId} deleted` });
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

function handleAdminStats(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      total: 0,
      recommended: 0,
      maybe: 0,
      reject: 0
    });
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

function handleExtractResumeInfo(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Mock resume extraction
    return res.status(200).json({
      name: "Test User",
      email: "test@example.com",
      phone: "+1-555-123-4567",
      designation: "Software Engineer",
      pastCompanies: ["Company A", "Company B"],
      skillset: ["JavaScript", "React", "Node.js"]
    });
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

function handleSendInterviewInvite(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Mock interview invitation
    return res.status(200).json({
      success: true,
      message: "Interview invitation sent successfully",
      token: `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

function handleInvitations(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const token = req.url?.split('/').pop();
    if (token) {
      return res.status(200).json({
        id: 1,
        candidateId: 1,
        email: "candidate@example.com",
        token: token,
        jobRole: "Software Engineer",
        skillset: "JavaScript,React,Node.js",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    return res.status(200).json([]);
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

function handleInterviewsStart(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Mock interview start
    return res.status(200).json({
      id: Math.floor(Math.random() * 1000),
      candidateId: 1,
      questions: ["Tell me about yourself", "What are your strengths?"],
      status: "in_progress",
      createdAt: new Date().toISOString()
    });
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 