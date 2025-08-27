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
    return handleExtractResumeInfo(req, res);
  }
  
  if (pathname.startsWith('/api/admin/send-interview-invite')) {
    return handleSendInterviewInvite(req, res);
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
    return res.status(200).json({
      id: 1,
      email: email,
      role: 'candidate'
    });

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

function handleExtractResumeInfo(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { resumeText, filename } = req.body;
      
      if (!resumeText) {
        return res.status(400).json({ message: 'Resume text is required' });
      }

      // Extract information using the actual logic from your backend
      const extractedInfo = extractCandidateInfoFromText(resumeText, filename);
      
      return res.status(200).json(extractedInfo);
    } catch (error) {
      console.error('Error extracting resume info:', error);
      return res.status(500).json({ message: 'Failed to extract resume information' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

function handleSendInterviewInvite(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { candidateInfo, inviteEmail, jobRole, skillset } = req.body;
      
      // Generate a unique token
      const token = `${Date.now()}-${inviteEmail}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Mock successful invitation
      return res.status(200).json({
        success: true,
        message: "Interview invitation sent successfully",
        token: token
      });
    } catch (error) {
      console.error('Error sending interview invite:', error);
      return res.status(500).json({ message: 'Failed to send interview invitation' });
    }
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

// Helper function to extract candidate information from resume text
function extractCandidateInfoFromText(resumeText: string, filename: string) {
  // Extract name from filename first (most reliable)
  const nameFromFilename = filename ? filename.replace(/\.(pdf|doc|docx|txt)$/i, '').replace(/[_-]/g, ' ').trim() : '';
  
  // Extract email using regex
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = resumeText.match(emailPattern) || [];
  const email = emails.length > 0 ? emails[0] : 'Not specified';
  
  // Extract phone using regex
  const phonePattern = /(\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/g;
  const phones = resumeText.match(phonePattern) || [];
  const phone = phones.length > 0 ? phones[0] : 'Not specified';
  
  // Extract designation/role
  const designationPatterns = [
    /(?:senior|junior|lead|principal|staff)?\s*(?:software\s+)?(?:engineer|developer|programmer|architect|consultant)/i,
    /(?:qa|quality\s+assurance|test)\s*(?:engineer|analyst|lead)/i,
    /(?:devops|sre|site\s+reliability)\s*(?:engineer|specialist)/i,
    /(?:data|machine\s+learning|ai)\s*(?:scientist|engineer|analyst)/i
  ];
  
  let designation = 'Not specified';
  for (const pattern of designationPatterns) {
    const match = resumeText.match(pattern);
    if (match) {
      designation = match[0];
      break;
    }
  }
  
  // Extract past companies (look for company-like patterns)
  const companyPattern = /(?:at|with|worked\s+at|experience\s+at)\s+([A-Z][a-zA-Z\s&.,]+(?:Inc|LLC|Ltd|Corp|Company|Technologies|Tech|Solutions))/gi;
  const companies: string[] = [];
  let companyMatch: RegExpExecArray | null;
  while ((companyMatch = companyPattern.exec(resumeText)) !== null) {
    if (companyMatch[1] && !companies.includes(companyMatch[1].trim())) {
      companies.push(companyMatch[1].trim());
    }
  }
  
  // Extract skillset
  const skills = [
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'C#',
    'Angular', 'Vue.js', 'Express.js', 'Django', 'Flask', 'Spring', 'ASP.NET',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'AWS', 'Azure', 'GCP', 'Docker',
    'Kubernetes', 'Jenkins', 'Git', 'GitHub', 'GitLab', 'CI/CD', 'Agile', 'Scrum'
  ];
  
  const foundSkills = skills.filter(skill => 
    resumeText.toLowerCase().includes(skill.toLowerCase())
  );
  
  // Use name from filename if available, otherwise try to extract from text
  let name = nameFromFilename;
  if (!name || name.length < 2) {
    // Try to extract name from the beginning of the resume
    const nameMatch = resumeText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/);
    if (nameMatch) {
      name = nameMatch[1];
    } else {
      name = 'Not specified';
    }
  }
  
  return {
    name: name,
    email: email,
    phone: phone,
    designation: designation,
    pastCompanies: companies.length > 0 ? companies : ['Not specified'],
    skillset: foundSkills.length > 0 ? foundSkills : ['Not specified']
  };
} 