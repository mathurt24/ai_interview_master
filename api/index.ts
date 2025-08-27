// Vercel API for AI Interview Master - Updated for better file handling
// This endpoint handles resume information extraction with improved error handling

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';

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
      console.log('Extract resume info called');
      console.log('Environment check in serverless function:');
      console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `Found (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : "Not found");
      console.log('NODE_ENV:', process.env.NODE_ENV);
      
      // Use formidable to parse multipart form data
      const form = formidable({
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
      });
      
      // Parse the form data
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          return res.status(400).json({ 
            message: 'Failed to parse form data',
            error: err.message 
          });
        }
        
        console.log('Fields:', fields);
        console.log('Files:', files);
        
        let resumeText = '';
        let filename = '';
        
        // Check if we have a file
        if (files.resume && files.resume[0]) {
          const file = files.resume[0];
          filename = file.originalFilename || 'resume.pdf';
          
          // Read the file content
          if (file.filepath) {
            try {
              const fs = await import('fs');
              const content = fs.readFileSync(file.filepath, 'utf8');
              resumeText = content;
              console.log('File content read successfully, length:', content.length);
            } catch (readError) {
              console.error('Error reading file:', readError);
              return res.status(400).json({ 
                message: 'Failed to read uploaded file',
                error: readError.message 
              });
            }
          }
        } else if (files.file && files.file[0]) {
          // Alternative field name
          const file = files.file[0];
          filename = file.originalFilename || 'resume.pdf';
          
          if (file.filepath) {
            try {
              const fs = await import('fs');
              const content = fs.readFileSync(file.filepath, 'utf8');
              resumeText = content;
              console.log('File content read successfully, length:', content.length);
            } catch (readError) {
              console.error('Error reading file:', readError);
              return res.status(400).json({ 
                message: 'Failed to read uploaded file',
                error: readError.message 
              });
            }
          }
        }
        
        console.log('Resume text length:', resumeText ? resumeText.length : 0);
        console.log('Filename:', filename);
        
        // If we still don't have content, return an error
        if (!resumeText || resumeText.trim().length === 0) {
          console.log('No resume content found');
          return res.status(400).json({ 
            message: 'No resume content found. Please ensure the file was uploaded correctly.',
            error: 'MISSING_CONTENT',
            fields: Object.keys(fields),
            files: Object.keys(files)
          });
        }
        
        try {
          // Extract information using the actual logic
          const extractedInfo = await extractCandidateInfoFromText(resumeText, filename);
          
          console.log('Successfully extracted info:', extractedInfo);
          
          return res.status(200).json(extractedInfo);
        } catch (extractionError) {
          console.error('Error in extraction:', extractionError);
          return res.status(500).json({ 
            message: 'Failed to extract resume information',
            error: extractionError.message 
          });
        }
      });
      
    } catch (error) {
      console.error('Error extracting resume info:', error);
      return res.status(500).json({ 
        message: 'Failed to extract resume information',
        error: error.message 
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
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
async function extractCandidateInfoFromText(resumeText: string, filename: string) {
  console.log('Extracting info from resume text (first 500 chars):', resumeText.substring(0, 500));
  console.log('Filename:', filename);
  
  // Try OpenAI extraction first
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("OpenAI API key status:", apiKey ? `Found (${apiKey.substring(0, 10)}...)` : "Not found");
  
  if (apiKey) {
    try {
      const prompt = `
You are an expert resume parser. Extract the following information from this resume text and return ONLY a valid JSON object with these exact fields:

{
  "name": "Full Name",
  "email": "Email Address", 
  "phone": "Phone Number",
  "designation": "Current/Recent Job Title",
  "pastCompanies": ["Company 1", "Company 2", "Company 3"],
  "skillset": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"]
}

Rules:
- Extract the person's full name (first and last name) - look for patterns like "NAME" at the top or in headers
- Extract the primary email address (not example/test emails like candidate@example.com)
- Extract the primary phone number (look for +1, country codes, or standard formats)
- Extract their current or most recent job title/designation from the resume
- Extract up to 5 past companies they've worked for (look for company names in experience section)
- Extract up to 10 key technical skills, programming languages, tools, or technologies from skills section
- If any field cannot be found, use "Not specified" for text fields or empty array for arrays
- Return ONLY the JSON object, no other text or explanations
- Be very precise and accurate in extraction

Resume text:
${resumeText}
`;

      console.log('Sending resume to OpenAI for extraction...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume parser. Extract candidate information and return ONLY a valid JSON object.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const rawBody = await response.text();
      console.log('OpenAI extraction response:', rawBody);

      const data = JSON.parse(rawBody);
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('No response text from OpenAI');
      }

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in OpenAI response');
      }

      const extractedData = JSON.parse(jsonMatch[0]);
      console.log('OpenAI extracted info:', extractedData);
      
      return {
        name: extractedData.name || 'Not specified',
        email: extractedData.email || 'Not specified',
        phone: extractedData.phone || 'Not specified',
        designation: extractedData.designation || 'Not specified',
        pastCompanies: extractedData.pastCompanies || [],
        skillset: extractedData.skillset || []
      };
      
    } catch (error) {
      console.error("Error extracting candidate info with OpenAI:", error);
      console.log("Falling back to regex extraction...");
    }
  }
  
  // Fallback to regex-based extraction
  console.log("Using fallback regex extraction");
  
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
  
  // Extract designation/role - look for patterns in the first few lines
  const lines = resumeText.split('\n').slice(0, 10); // Check first 10 lines
  let designation = 'Not specified';
  
  const designationPatterns = [
    /(?:senior|junior|lead|principal|staff)?\s*(?:software\s+)?(?:engineer|developer|programmer|architect|consultant)/i,
    /(?:qa|quality\s+assurance|test)\s*(?:engineer|analyst|lead)/i,
    /(?:devops|sre|site\s+reliability)\s*(?:engineer|specialist)/i,
    /(?:data|machine\s+learning|ai)\s*(?:scientist|engineer|analyst)/i,
    /(?:product|project)\s*(?:manager|lead)/i,
    /(?:business|systems)\s*(?:analyst|consultant)/i
  ];
  
  for (const line of lines) {
    for (const pattern of designationPatterns) {
      const match = line.match(pattern);
      if (match) {
        designation = match[0];
        break;
      }
    }
    if (designation !== 'Not specified') break;
  }
  
  // Extract past companies - look for company patterns throughout the text
  const companyPatterns = [
    /(?:at|with|worked\s+at|experience\s+at|employed\s+at)\s+([A-Z][a-zA-Z\s&.,]+(?:Inc|LLC|Ltd|Corp|Company|Technologies|Tech|Solutions|Systems|Services))/gi,
    /([A-Z][a-zA-Z\s&.,]+(?:Inc|LLC|Ltd|Corp|Company|Technologies|Tech|Solutions|Systems|Services))/g,
    /(?:company|organization):\s*([A-Z][a-zA-Z\s&.,]+)/gi
  ];
  
  const companies: string[] = [];
  for (const pattern of companyPatterns) {
    let companyMatch: RegExpExecArray | null;
    while ((companyMatch = pattern.exec(resumeText)) !== null) {
      const company = companyMatch[1] ? companyMatch[1].trim() : companyMatch[0].trim();
      if (company && company.length > 3 && !companies.includes(company) && 
          !company.toLowerCase().includes('university') && 
          !company.toLowerCase().includes('college')) {
        companies.push(company);
      }
    }
  }
  
  // Extract skillset - look for technical skills throughout the text
  const commonSkills = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
    // Frontend
    'React', 'Angular', 'Vue.js', 'HTML', 'CSS', 'Sass', 'Less', 'Bootstrap', 'Tailwind', 'jQuery',
    // Backend
    'Node.js', 'Express.js', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel', 'Ruby on Rails',
    // Databases
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions',
    // Tools & Others
    'Git', 'GitHub', 'GitLab', 'Jira', 'Confluence', 'Agile', 'Scrum', 'REST API', 'GraphQL'
  ];
  
  const foundSkills = commonSkills.filter(skill => 
    resumeText.toLowerCase().includes(skill.toLowerCase())
  );
  
  // Also look for skills mentioned in specific sections
  const skillsSection = resumeText.match(/(?:skills?|technologies?|competencies?)[:.]?\s*([^•\n]+)/i);
  if (skillsSection && skillsSection[1]) {
    const skillsText = skillsSection[1];
    const additionalSkills = commonSkills.filter(skill => 
      skillsText.toLowerCase().includes(skill.toLowerCase()) && !foundSkills.includes(skill)
    );
    foundSkills.push(...additionalSkills);
  }
  
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
    name: name || 'Not specified',
    email: email || 'Not specified',
    phone: phone || 'Not specified',
    designation: designation || 'Not specified',
    pastCompanies: companies.length > 0 ? companies : ['Not specified'],
    skillset: foundSkills.length > 0 ? foundSkills : ['Not specified']
  };
} 