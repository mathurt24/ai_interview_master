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
    try {
      // Mock file upload handling for Vercel
      // In production, you'd use multer or similar for file handling
      const { file, candidateInfo } = req.body;
      
      if (!file && !candidateInfo) {
        return res.status(400).json({ message: 'File or candidate info is required' });
      }

      let extractedInfo: any = null;
      
      if (file) {
        // Mock file processing
        const mockResumeText = `Sample Resume Content
${candidateInfo?.name || 'Candidate Name'}
${candidateInfo?.email || 'candidate@example.com'}
${candidateInfo?.phone || '+1-555-123-4567'}

SKILLS
React, Node.js, TypeScript, Python, AWS, Docker

EXPERIENCE
Software Engineer at Tech Company Inc.`;
        
        extractedInfo = extractCandidateInfoFromText(mockResumeText, file.name || 'resume.pdf');
      }

      return res.status(200).json({
        success: true,
        message: "Resume uploaded successfully",
        extractedInfo: extractedInfo
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      return res.status(500).json({ message: 'Failed to upload resume' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

function handleExtractResumeInfo(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      // Handle both file upload and text-based requests
      let resumeText = '';
      let filename = '';
      
      if (req.body.resumeText) {
        // Direct text input
        resumeText = req.body.resumeText;
        filename = req.body.filename || 'resume.txt';
      } else if (req.body.file) {
        // File upload (mock handling for Vercel)
        resumeText = req.body.file.content || 'Resume content extracted from file';
        filename = req.body.file.name || 'resume.pdf';
      } else {
        // Mock resume data for testing
        resumeText = `John Doe
Software Engineer
john.doe@example.com
+1-555-123-4567

EXPERIENCE
Worked at Tech Company Inc. for 3 years
Skills: React, Node.js, TypeScript, Python, AWS, Docker`;
        filename = 'sample-resume.txt';
      }

      if (!resumeText) {
        return res.status(400).json({ message: 'Resume content is required' });
      }

      // Extract information using the actual logic
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
      
      if (!inviteEmail || !jobRole) {
        return res.status(400).json({ message: 'Email and job role are required' });
      }

      // Generate a unique token
      const token = `${Date.now()}-${inviteEmail}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Mock email sending (in production, this would use SendGrid or similar)
      const emailContent = generateInterviewInviteEmail(candidateInfo, inviteEmail, jobRole, skillset, token);
      
      console.log('=== EMAIL SENT (MOCK MODE) ===');
      console.log(`To: ${inviteEmail}`);
      console.log(`Subject: 🎯 Interview Invitation for ${jobRole} Position`);
      console.log('Body:', emailContent);
      console.log('=====================================');
      
      // Mock successful invitation
      return res.status(200).json({
        success: true,
        message: "Interview invitation sent successfully",
        token: token,
        emailSent: true
      });
    } catch (error) {
      console.error('Error sending interview invite:', error);
      return res.status(500).json({ message: 'Failed to send interview invitation' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Helper function to generate interview invitation email
function generateInterviewInviteEmail(candidateInfo: any, inviteEmail: string, jobRole: string, skillset: string, token: string) {
  const candidateName = candidateInfo?.name || 'Candidate';
  const frontendUrl = 'https://ai-interview-master-nd5jbgvq3-mathurt24-gmailcoms-projects.vercel.app';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Interview Invitation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Interview Invitation</h1>
      <p>You've been selected for an AI-powered interview!</p>
    </div>
    <div class="content">
      <h2>Dear ${candidateName},</h2>
      <p>Congratulations! You have been invited to interview for the <strong>${jobRole}</strong> position.</p>
      
      <h3>📋 Position Details:</h3>
      <ul>
        <li><strong>Role:</strong> ${jobRole}</li>
        <li><strong>Required Skills:</strong> ${skillset || 'As per your resume'}</li>
      </ul>
      
      <h3>🚀 What to Expect:</h3>
      <ul>
        <li>AI-powered video interview</li>
        <li>Real-time question generation based on your resume</li>
        <li>Immediate feedback and scoring</li>
        <li>Professional evaluation process</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${frontendUrl}/signup?token=${token}" class="button">Start Your Interview</a>
      </div>
      
      <p><strong>Important:</strong> Please click the button above to create your account and begin the interview process. The link is unique to you and should not be shared.</p>
      
      <p>If you have any questions, please don't hesitate to reach out to our team.</p>
      
      <p>Best regards,<br>
      <strong>AI Interview Team</strong><br>
      FirstroundAI</p>
    </div>
    <div class="footer">
      <p>This is an automated invitation. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
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