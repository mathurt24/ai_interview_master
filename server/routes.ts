import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { generateInterviewQuestions, evaluateAnswer, generateFinalSummary } from "./services/openai";
import { insertCandidateSchema, insertAnswerSchema, insertUserSchema } from "@shared/schema";
import { emailService } from "./services/email-service";
import { z } from "zod";
import { RtcTokenBuilder } from 'agora-access-token';
import { generateTTS } from "./services/tts";
import crypto from "crypto";

interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Helper function to extract text from file buffer
async function extractTextFromFile(buffer: Buffer, mimetype: string, filename: string): Promise<string> {
  try {
    console.log(`Processing file: ${filename} with mimetype: ${mimetype}`);
    
    // Handle text-based files
    if (mimetype === 'text/plain' || 
        mimetype === 'text/javascript' || 
        mimetype === 'text/typescript' ||
        mimetype === 'application/javascript' ||
        mimetype === 'application/typescript' ||
        filename.endsWith('.txt') ||
        filename.endsWith('.js') ||
        filename.endsWith('.ts') ||
        filename.endsWith('.tsx') ||
        filename.endsWith('.jsx')) {
      const text = buffer.toString('utf-8');
      console.log(`Text file processed, length: ${text.length}`);
      return text;
    }
    
    if (mimetype === 'application/pdf') {
      try {
        console.log('PDF file detected, using improved unpdf extraction');
        
        // Import unpdf dynamically
        const { getDocumentProxy } = await import('unpdf');
        
        // Convert Buffer to Uint8Array for unpdf
        const uint8Array = new Uint8Array(buffer);
        const pdf = await getDocumentProxy(uint8Array);
        let fullText = "";

        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }

        if (fullText.trim().length > 0) {
          console.log(`PDF extracted successfully with unpdf, text length: ${fullText.length}`);
          return fullText;
        } else {
          console.warn("unpdf returned empty text; using filename-based extraction");
          // Try to extract meaningful information from filename
          const nameFromFilename = extractNameFromFilename(filename);
          return `Name: ${nameFromFilename}\nResume extracted from ${filename}\nPlease review and update candidate information manually.`;
        }
      } catch (pdfError) {
        console.error("PDF parsing failed with unpdf:", pdfError);
        // Enhanced fallback with filename analysis
        const nameFromFilename = extractNameFromFilename(filename);
        return `Name: ${nameFromFilename}\nResume extracted from ${filename}\nPDF parsing failed. Please review and update candidate information manually.`;
      }
    }
    
    // For other file types (DOCX, etc.), try to extract as text first
    try {
      const text = buffer.toString('utf-8');
      if (text.trim().length > 0) {
        console.log(`Generic file processed as text, length: ${text.length}`);
        return text;
      }
    } catch (textError) {
      console.log("Could not extract as text, using filename-based extraction");
    }
    
    // Final fallback with filename analysis
    const nameFromFilename = extractNameFromFilename(filename);
    return `Name: ${nameFromFilename}\nResume extracted from ${filename}\nPlease review and update candidate information manually.`;
  } catch (error) {
    console.error("Error extracting text from file:", error);
    const nameFromFilename = extractNameFromFilename(filename);
    return `Name: ${nameFromFilename}\nResume extracted from ${filename}\nError processing file. Please review and update candidate information manually.`;
  }
}

// Helper function to extract name from filename
function extractNameFromFilename(filename: string): string {
  try {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // Handle common filename patterns
    if (nameWithoutExt.includes('_')) {
      // Pattern: "First_Last.pdf" -> "First Last"
      return nameWithoutExt.replace(/_/g, ' ');
    } else if (nameWithoutExt.includes('-')) {
      // Pattern: "First-Last.pdf" -> "First Last"
      return nameWithoutExt.replace(/-/g, ' ');
    } else if (nameWithoutExt.includes(' ')) {
      // Pattern: "First Last.pdf" -> "First Last"
      return nameWithoutExt;
    } else {
      // Single word or unknown pattern
      return nameWithoutExt;
    }
  } catch (error) {
    console.error("Error extracting name from filename:", error);
    return "Candidate";
  }
}

// Utility: extract information using compromise NLP
async function extractWithCompromise(text: string, filename?: string) {
  try {
    const nlp = await import('compromise');
    const doc = nlp.default(text);
    
    // Extract name using NLP
    const people = doc.people().out('array');
    const name = people.length > 0 ? people[0] : null;
    
    // Extract email using regex
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : null;
    
    // Extract phone using regex
    const phoneMatch = text.match(/(\+91[\d\s]{10,}|[0-9]{10,15})/);
    const phone = phoneMatch ? phoneMatch[0] : null;
    
    // Extract skills from technical skills section
    const skillsSection = text.match(/TECHNICAL SKILLS([\s\S]*?)(?:EDUCATION|EXPERIENCE|PROFESSIONAL SUMMARY)/i);
    let skills: string[] = [];
    if (skillsSection) {
      skills = skillsSection[1]
        .split(/\n|,|•/)
        .map(s => s.trim())
        .filter(s => s.length > 1 && !/^[•\-\s]*$/.test(s))
        .slice(0, 15); // Limit to 15 skills
    }
    
    // Extract designation/role
    const designationMatch = text.match(/(?:SENIOR|JUNIOR|LEAD|PRINCIPAL|STAFF)?\s*(?:SOFTWARE|QA|DEVELOPER|ENGINEER|ANALYST|MANAGER|LEAD|ARCHITECT)/i);
    const designation = designationMatch ? designationMatch[0] : null;
    
    // Extract companies (look for common company patterns)
    const companyMatches = text.match(/(?:at|with|worked at|experience at)\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Ltd|Corp|Company|Technologies|Tech|Solutions|Systems))/gi);
    const companies = companyMatches ? companyMatches.map(m => m.replace(/(?:at|with|worked at|experience at)\s+/i, '').trim()) : [];
    
    return {
      name: name || (filename ? filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() : null),
      email,
      phone,
      designation,
      skills,
      companies: companies.slice(0, 5) // Limit to 5 companies
    };
  } catch (error) {
    console.error('Error in compromise extraction:', error);
    return null;
  }
}

// Utility: refine contact details from raw text/filename
function refineContactFromText(rawText: string, filename?: string, current?: { name?: string; email?: string; phone?: string; }) {
  const result: { name?: string; email?: string; phone?: string } = { ...current };

  // Email regex (global)
  const emailMatches = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
  const validEmails = emailMatches.filter(e => !/example\.com|test\.com|dummy\./i.test(e));
  if (!result.email || result.email === 'Not specified' || /example\.com|test\.com|dummy\./i.test(result.email)) {
    if (validEmails.length > 0) {
      // Prefer emails that appear near the top of the document
      const firstValid = validEmails[0];
      result.email = firstValid;
      console.log('Refined email from text:', result.email);
    }
  }

  // Phone regex: capture +country codes and common separators, 10-15 digits total
  const phoneMatches = rawText.match(/(?:(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{0,4})/g) || [];
  const normalized = (s: string) => (s || '').replace(/[^\d+]/g, '');
  const plausiblePhones = phoneMatches
    .map(p => p.trim())
    .map(p => normalized(p))
    .filter(p => /\d{10,15}/.test(p))
    .filter(p => !/(?:555|123456|000000)/.test(p));
  if (!result.phone || result.phone === 'Not specified') {
    if (plausiblePhones.length > 0) {
      // Prefer the first plausible
      result.phone = plausiblePhones[0];
      console.log('Refined phone from text:', result.phone);
    }
  }

  // Name: if missing, try filename
  if ((!result.name || result.name === 'Not specified') && filename) {
    const base = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    // Heuristic: pick up to first two capitalized words
    const tokens = base.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      const guess = tokens.slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
      result.name = guess;
      console.log('Refined name from filename:', result.name);
    }
  }

  return result;
}

// Helper function to extract candidate information from resume text
async function extractCandidateInfo(resumeText: string, filename?: string): Promise<{ 
  name: string; 
  email: string; 
  phone: string; 
  designation: string; 
  pastCompanies: string[]; 
  skillset: string[] 
}> {
  try {
    console.log("Extracting info from resume text (first 500 chars):", resumeText.substring(0, 500));
    console.log("Filename:", filename);
    
    // Check if this is a minimal fallback text (from PDF parsing failure)
    if (resumeText.includes('Resume extracted from') && resumeText.length < 200) {
      console.log("Detected minimal fallback text, using filename-based extraction");
      const nameFromFilename = extractNameFromFilename(filename || 'resume.pdf');
      return {
        name: nameFromFilename,
        email: 'Not specified',
        phone: 'Not specified',
        designation: 'Not specified',
        pastCompanies: [],
        skillset: []
      };
    }
    
    // Use OpenAI to extract information intelligently
    const openaiKey = process.env.OPENAI_API_KEY;
    console.log("OpenAI API key status:", openaiKey ? `Found (${openaiKey.substring(0, 10)}...)` : "Not found");
    
    if (openaiKey) {
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
            'Authorization': `Bearer ${openaiKey}`
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

        const extractedInfo = JSON.parse(jsonMatch[0]);
        console.log('OpenAI extracted info:', extractedInfo);

        // Validate and clean the extracted data
        const base = {
          name: extractedInfo.name || 'Not specified',
          email: extractedInfo.email || 'Not specified',
          phone: extractedInfo.phone || 'Not specified',
          designation: extractedInfo.designation || 'Not specified',
          pastCompanies: Array.isArray(extractedInfo.pastCompanies) ? extractedInfo.pastCompanies : [],
          skillset: Array.isArray(extractedInfo.skillset) ? extractedInfo.skillset : []
        };

        // If OpenAI couldn't provide email/phone/name, refine from raw text/filename
        const refined = refineContactFromText(resumeText, filename, base);

        return {
          name: refined.name || base.name,
          email: refined.email || base.email,
          phone: refined.phone || base.phone,
          designation: base.designation,
          pastCompanies: base.pastCompanies,
          skillset: base.skillset,
        };
      } catch (openaiError) {
        console.error("OpenAI extraction failed:", openaiError);
        console.log("Falling back to Gemini...");
      }
    }
    
    // Try Gemini as fallback
    const geminiKey = process.env.GEMINI_API_KEY;
    console.log("Gemini API key status:", geminiKey ? `Found (${geminiKey.substring(0, 10)}...)` : "Not found");
    
    if (geminiKey) {
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

        console.log('Sending resume to Gemini for extraction...');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Gemini extraction response:', data);

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          throw new Error('No response text from Gemini');
        }

        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in Gemini response');
        }

        const extractedInfo = JSON.parse(jsonMatch[0]);
        console.log('Gemini extracted info:', extractedInfo);

        // Validate and clean the extracted data
        const base = {
          name: extractedInfo.name || 'Not specified',
          email: extractedInfo.email || 'Not specified',
          phone: extractedInfo.phone || 'Not specified',
          designation: extractedInfo.designation || 'Not specified',
          pastCompanies: Array.isArray(extractedInfo.pastCompanies) ? extractedInfo.pastCompanies : [],
          skillset: Array.isArray(extractedInfo.skillset) ? extractedInfo.skillset : []
        };

        // If Gemini couldn't provide email/phone/name, refine from raw text/filename
        const refined = refineContactFromText(resumeText, filename, base);

        return {
          name: refined.name || base.name,
          email: refined.email || base.email,
          phone: refined.phone || base.phone,
          designation: base.designation,
          pastCompanies: base.pastCompanies,
          skillset: base.skillset,
        };
      } catch (geminiError) {
        console.error("Gemini extraction failed:", geminiError);
        console.log("Falling back to compromise extraction...");
      }
    }
    
    // Final fallback to compromise extraction
    console.log("All AI extraction failed, using compromise extraction...");
    
    // Try compromise extraction first
    const compromiseResult = await extractWithCompromise(resumeText, filename);
    if (compromiseResult && compromiseResult.name) {
      console.log("Compromise extraction successful:", compromiseResult);
      return {
        name: compromiseResult.name,
        email: compromiseResult.email || "Not specified",
        phone: compromiseResult.phone || "Not specified",
        designation: compromiseResult.designation || "Not specified",
        pastCompanies: compromiseResult.companies || [],
        skillset: compromiseResult.skills || [],
      };
    }
    
    // Fallback to regex extraction if compromise fails
    console.log("Compromise extraction failed, using regex fallback...");
    const base = await fallbackExtraction(resumeText, filename);
    const refined = refineContactFromText(resumeText, filename, base);
    return {
      name: refined.name || base.name,
      email: refined.email || base.email,
      phone: refined.phone || base.phone,
      designation: base.designation,
      pastCompanies: base.pastCompanies,
      skillset: base.skillset,
    };
  } catch (error) {
    console.error("Error extracting candidate info:", error);
    console.log("Using filename-based extraction as last resort...");
    
    // Last resort: filename-based extraction
    const nameFromFilename = extractNameFromFilename(filename || 'resume.pdf');
    return {
      name: nameFromFilename,
      email: 'Not specified',
      phone: 'Not specified',
      designation: 'Not specified',
      pastCompanies: [],
      skillset: []
    };
  }
}

// Fallback extraction using regex (simplified version)
async function fallbackExtraction(resumeText: string, filename?: string): Promise<{ 
  name: string; 
  email: string; 
  phone: string; 
  designation: string; 
  pastCompanies: string[]; 
  skillset: string[] 
}> {
  try {
    console.log("Running fallback extraction on text length:", resumeText.length);
    
    // Check if this is a minimal fallback text (from PDF parsing failure)
    if (resumeText.includes('Resume extracted from') && resumeText.length < 200) {
      console.log("Detected minimal fallback text, using filename-based extraction");
      const nameFromFilename = extractNameFromFilename(filename || 'resume.pdf');
      return {
        name: nameFromFilename,
        email: 'Not specified',
        phone: 'Not specified',
        designation: 'Not specified',
        pastCompanies: [],
        skillset: []
      };
    }
    
    // Basic regex patterns for fallback
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    
    // Extract email
    const emailMatch = resumeText.match(emailPattern);
    let email = 'Not specified';
    if (emailMatch && emailMatch[0]) {
      const foundEmail = emailMatch[0];
      // Filter out obvious fake emails but allow legitimate test data
      if (!foundEmail.includes('fake.com') && !foundEmail.includes('dummy.com') && !foundEmail.includes('test.com')) {
        email = foundEmail;
        console.log('Fallback extracted email:', email);
      }
    }
    
    // Extract phone
    const phoneMatch = resumeText.match(phonePattern);
    let phone = 'Not specified';
    if (phoneMatch && phoneMatch[0]) {
      const foundPhone = phoneMatch[0];
      // Filter out obvious fake phones but allow legitimate test data
      if (!foundPhone.includes('000000') && !foundPhone.includes('123456')) {
        phone = foundPhone;
        console.log('Fallback extracted phone:', phone);
      }
    }
    
    // Extract name from resume text (look for patterns like "JOHN DOE" or "John Doe")
    let name = 'Not specified';
    const namePatterns = [
      /^([A-Z][A-Z\s]+[A-Z])\s*$/m,  // ALL CAPS names like "JOHN DOE"
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)\s*$/m,  // Title case names like "John Doe"
      /^([A-Z][a-z]+)\s*$/m  // Single capitalized word
    ];
    
    for (const pattern of namePatterns) {
      const nameMatch = resumeText.match(pattern);
      if (nameMatch && nameMatch[1]) {
        const candidateName = nameMatch[1].trim();
        if (candidateName.length > 2 && candidateName.length < 50) {
          name = candidateName;
          console.log('Fallback extracted name:', name);
          break;
        }
      }
    }
    
    // If no name found in text, try filename
    if (name === 'Not specified' && filename) {
      const nameFromFilename = extractNameFromFilename(filename);
      if (nameFromFilename && nameFromFilename !== 'Candidate') {
        name = nameFromFilename;
        console.log('Name extracted from filename (prioritized):', name);
      }
    }
    
    // Extract designation (look for job titles)
    let designation = 'Not specified';
    const designationPatterns = [
      /(?:Software Engineer|Developer|Programmer|QA Engineer|DevOps Engineer|Frontend Developer|Backend Developer|Full Stack Developer|Team Lead|Manager|Senior|Junior|Associate|Lead)/i
    ];
    
    for (const pattern of designationPatterns) {
      const designationMatch = resumeText.match(pattern);
      if (designationMatch && designationMatch[0]) {
        designation = designationMatch[0];
        console.log('Fallback extracted designation:', designation);
        break;
      }
    }
    
    // Extract past companies (look for company-like patterns)
    const companies: string[] = [];
    const companyPattern = /(?:at|with|worked\s+at|experience\s+at)\s+([A-Z][a-zA-Z\s&.,]+(?:Inc|LLC|Ltd|Corp|Company|Technologies|Tech|Solutions))/gi;
    let companyMatch;
    while ((companyMatch = companyPattern.exec(resumeText)) !== null) {
      if (companyMatch[1] && !companies.includes(companyMatch[1].trim())) {
        companies.push(companyMatch[1].trim());
      }
    }
    console.log('Fallback extracted companies:', companies);
    
    // Extract skillset (look for technical skills)
    const skills: string[] = [];
    const skillPatterns = [
      /(?:React|Node\.js|TypeScript|JavaScript|Python|Java|AWS|Docker|Kubernetes|PostgreSQL|MongoDB|Redis|Express\.js|GraphQL|HTML|CSS|Selenium|Pytest|Robot Framework|Azure|Jenkins|GitLab|GitHub Actions)/gi
    ];
    
    for (const pattern of skillPatterns) {
      const skillMatches = resumeText.match(pattern);
      if (skillMatches) {
        for (const skill of skillMatches) {
          if (!skills.includes(skill) && skill.length > 2) {
            skills.push(skill);
          }
        }
      }
    }
    console.log('Fallback extracted skills:', skills);
    
    return {
      name,
      email,
      phone,
      designation,
      pastCompanies: companies,
      skillset: skills
    };
  } catch (error) {
    console.error("Error in fallback extraction:", error);
    // Return filename-based extraction as last resort
    const nameFromFilename = extractNameFromFilename(filename || 'resume.pdf');
    return {
      name: nameFromFilename,
      email: 'Not specified',
      phone: 'Not specified',
      designation: 'Not specified',
      pastCompanies: [],
      skillset: []
    };
  }
}

// Helper function to generate invitation token
function generateInvitationToken(candidateId: number, email: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${candidateId}-${email}-${timestamp}-${randomString}`;
}

// Helper function to send interview invitation email
async function sendInterviewInvitation(email: string, name: string, jobRole: string, skillset: string, token: string, candidateDetails?: any): Promise<void> {
  try {
          const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?token=${token}`;
    
    // Enhanced email template with more candidate details
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Interview Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .candidate-details { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .skills-section { background: #f0f8ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .skill-tag { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 15px; margin: 2px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Interview Invitation</h1>
            <p>You've been selected for an AI-powered interview!</p>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Congratulations! You have been invited to interview for the <strong>${jobRole}</strong> position.</p>
            
            ${candidateDetails ? `
            <div class="candidate-details">
              <h3>📋 Your Profile Summary:</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${candidateDetails.name || name}</span>
              </div>
              ${candidateDetails.email ? `
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${candidateDetails.email}</span>
              </div>
              ` : ''}
              ${candidateDetails.phone ? `
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${candidateDetails.phone}</span>
              </div>
              ` : ''}
              ${candidateDetails.designation ? `
              <div class="detail-row">
                <span class="detail-label">Current Role:</span>
                <span class="detail-value">${candidateDetails.designation}</span>
              </div>
              ` : ''}
              ${candidateDetails.pastCompanies && candidateDetails.pastCompanies.length > 0 ? `
              <div class="detail-row">
                <span class="detail-label">Experience:</span>
                <span class="detail-value">${candidateDetails.pastCompanies.join(', ')}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            <h3>🎯 Position Details:</h3>
            <ul>
              <li><strong>Role:</strong> ${jobRole}</li>
              <li><strong>Required Skills:</strong> ${skillset}</li>
            </ul>
            
            ${candidateDetails && candidateDetails.skillset && candidateDetails.skillset.length > 0 ? `
            <div class="skills-section">
              <h4>💼 Your Skills (from resume):</h4>
              <div>
                ${candidateDetails.skillset.map((skill: string) => `<span class="skill-tag">${skill}</span>`).join('')}
              </div>
            </div>
            ` : ''}
            
            <h3>🚀 What to Expect:</h3>
            <ul>
              <li>AI-powered video interview</li>
              <li>Real-time question generation based on your resume</li>
              <li>Immediate feedback and scoring</li>
              <li>Professional evaluation process</li>
              <li>Questions tailored to your skills and experience</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${invitationLink}" class="button">🚀 Start Your Interview</a>
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
      </html>
    `;

    const emailData = {
      to: email,
      subject: `🎯 Interview Invitation for ${jobRole} Position`,
      html: emailHtml
    };

    await emailService.sendEmail(emailData);
  } catch (error) {
    console.error("Error sending invitation email:", error);
    throw error;
  }
}

const startInterviewSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  jobRole: z.string().min(1)
});

const submitAnswerSchema = z.object({
  interviewId: z.number(),
  questionIndex: z.number(),
  answerText: z.string().min(1)
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize email service
  await emailService.initialize();
  
  // Seed default admin user if not present
  (async () => {
    const adminEmail = "admin@admin.com";
    const adminPassword = "admin";
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (!existingAdmin) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      await storage.createUser({
        email: adminEmail,
        password: hashed,
        role: "admin"
      });
      console.log("Seeded default admin user");
    }
  })();

  // Signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password, invitationToken } = req.body;
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ message: "You already have an account. Please log in instead." });
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashed, role: "candidate" });
      if (invitationToken) {
        const invitation = await storage.getInvitationByToken(invitationToken);
        if (invitation && invitation.email === email) {
          // Use the name from the form if available, otherwise fall back to invitation data
          const candidateName = name || (invitation.candidateInfo?.name || 'Unknown');
          const candidatePhone = invitation.candidateInfo?.phone || 'Not specified';
          
          await storage.createCandidate({
            name: candidateName,
            email: email,
            phone: candidatePhone,
            jobRole: invitation.jobRole,
            resumeText: invitation.candidateInfo?.resumeText || `Job Role: ${invitation.jobRole}\nRequired Skills: ${invitation.skillset}\nCandidate: ${candidateName} (${email})`,
            invited: true
          });
          await storage.updateInvitationStatus(invitationToken, 'accepted');
        }
      }
      res.json({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ message: "Invalid signup data" });
    }
  });

  // Update login endpoint to block disqualified candidates
  app.post("/api/auth/login", async (req, res) => {
    // Check for disqualified candidate before try/catch
    const candidatesWithEmail = await storage.findCandidatesByEmail(req.body.email);
    if (candidatesWithEmail && candidatesWithEmail[0]?.disqualified) {
      return res.status(403).json({ message: "Interview cancelled due to disciplinary action." });
    }
    try {
      const { email, password } = insertUserSchema.pick({ email: true, password: true }).parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ message: "Invalid email or password" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid email or password" });
      res.json({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token in database
      await storage.storePasswordResetToken(email, resetToken, resetTokenExpiry);

      // Send reset email
      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      
      try {
        const emailSent = await emailService.sendEmail({
          to: email,
          subject: "🔐 Password Reset Request - FirstroundAI",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Password Reset</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Password Reset</h1>
                  <p>You requested a password reset</p>
                </div>
                <div class="content">
                  <h2>Hello,</h2>
                  <p>We received a request to reset your password for your FirstroundAI account.</p>
                  
                  <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset Password</a>
                  </div>
                  
                  <div class="warning">
                    <strong>⚠️ Important:</strong>
                    <ul>
                      <li>This link will expire in 1 hour</li>
                      <li>If you didn't request this reset, please ignore this email</li>
                      <li>Your password will remain unchanged until you click the link above</li>
                    </ul>
                  </div>
                  
                  <p>If the button above doesn't work, copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace;">${resetLink}</p>
                  
                  <p>Best regards,<br>
                  <strong>AI Interview Team</strong><br>
                  FirstroundAI</p>
                </div>
                <div class="footer">
                  <p>This is an automated email. Please do not reply to this message.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        
        if (emailSent) {
          // Check if we're in console mode and provide additional info
          if (!emailService.isSendGridAvailable()) {
            console.log('🔐 PASSWORD RESET: Email sent to console mode');
            console.log('🔗 Reset link for user:', email);
            console.log('🔗 Reset link:', resetLink);
            console.log('⚠️  User should check console output for the reset link');
          }
          
          res.json({ 
            message: "Password reset email sent successfully",
            consoleMode: !emailService.isSendGridAvailable(),
            note: !emailService.isSendGridAvailable() ? "Check server console for reset link" : undefined
          });
        } else {
          throw new Error('Email service failed to send email');
        }
      } catch (emailError: any) {
        console.error("Failed to send password reset email:", emailError);
        
        // If it's a SendGrid error, provide specific guidance
        if (emailError.code === 403) {
          console.error("❌ SendGrid API key issue detected. Password reset email failed.");
          console.error("🔗 Reset link for user:", email);
          console.error("🔗 Reset link:", resetLink);
          console.error("⚠️  User should check server console for the reset link");
          
          res.json({ 
            message: "Password reset link generated but email delivery failed. Check server console for the reset link.",
            consoleMode: true,
            note: "Email service unavailable - check server console for reset link"
          });
        } else {
          // Still return success to avoid revealing if user exists
          res.json({ 
            message: "If an account with that email exists, a password reset link has been sent.",
            consoleMode: true,
            note: "Email service error - check server console for reset link"
          });
        }
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Validate reset token endpoint
  app.get("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const isValid = await storage.validatePasswordResetToken(token as string);
      if (isValid) {
        res.json({ valid: true });
      } else {
        res.status(400).json({ message: "Invalid or expired token" });
      }
    } catch (error) {
      console.error("Token validation error:", error);
      res.status(500).json({ message: "Failed to validate token" });
    }
  });

  // Reset password endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Validate token and get user email
      const userEmail = await storage.validatePasswordResetToken(token);
      if (!userEmail) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user password
      await storage.updateUserPassword(userEmail, hashedPassword);

      // Invalidate used token
      await storage.invalidatePasswordResetToken(token);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  
  // Start interview for invited candidates (no resume required)
  app.post("/api/interviews/start-invited", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if candidate exists and is invited
      const candidatesWithEmail = await storage.findCandidatesByEmail(email);
      if (!candidatesWithEmail || candidatesWithEmail.length === 0) {
        return res.status(404).json({ message: "Candidate not found. Please contact your administrator." });
      }

      const candidate = candidatesWithEmail[0];
      if (candidate.disqualified) {
        return res.status(403).json({ message: "Interview cancelled due to disciplinary action." });
      }

      // Check if candidate already has a completed interview
      const interviews = await storage.getInterviewsByCandidate(candidate.id);
      if (interviews.some(i => i.status === 'completed')) {
        return res.status(403).json({ message: "You have already completed your interview. Only one interview is allowed per user." });
      }

      // Check if there's an active interview
      const activeInterview = interviews.find(i => i.status === 'in-progress');
      if (activeInterview) {
        // Return existing active interview
        const questionSet = activeInterview.questions as { questions: string[] };
        return res.json({
          interviewId: activeInterview.id,
          candidateId: candidate.id,
          questions: questionSet.questions,
          currentQuestion: questionSet.questions[0],
          candidateName: candidate.name,
          candidateRole: candidate.jobRole,
          candidatePhone: candidate.phone
        });
      }

      // Get global AI provider
      const rawProvider = await storage.getSetting("ai_provider");
      console.log('DB value for ai_provider (invited):', rawProvider);
      
      // Force use Gemini for interview questions while keeping OpenAI for resume extraction
      const provider = "gemini" as 'openai' | 'gemini';
      console.log('Forced provider for invited interview questions:', provider);

      // Generate interview questions using candidate's existing resume text
      const questionSet = await generateInterviewQuestions(candidate.name, candidate.jobRole, candidate.resumeText, provider);

      // Create new interview
      const interview = await storage.createInterview({
        candidateId: candidate.id,
        questions: questionSet,
        currentQuestionIndex: 0,
        status: "in-progress"
      });

      res.json({
        interviewId: interview.id,
        candidateId: candidate.id,
        questions: questionSet.questions,
        currentQuestion: questionSet.questions[0],
        candidateName: candidate.name,
        candidateRole: candidate.jobRole,
        candidatePhone: candidate.phone
      });
    } catch (error) {
      console.error("Error starting invited interview:", error);
      res.status(500).json({ message: "Failed to start interview" });
    }
  });

  // Start interview with resume upload
  app.post("/api/interviews/start", upload.single('resume'), async (req: RequestWithFile, res) => {
    try {
      const { name, email, phone, jobRole } = startInterviewSchema.parse(req.body);
      // Check for existing candidate by email
      const candidatesWithEmail = await storage.findCandidatesByEmail(email);
      console.log('[DEBUG] Interview start for email:', email);
      let candidate;
      if (candidatesWithEmail && candidatesWithEmail.length > 0) {
        candidate = candidatesWithEmail[0];
        console.log('[DEBUG] Found candidate ID:', candidate.id);
        if (candidate.disqualified) {
          console.log('[DEBUG] Candidate is disqualified');
          return res.status(403).json({ message: "Interview cancelled due to disciplinary action." });
        }
        const interviews = await storage.getInterviewsByCandidate(candidate.id);
        console.log('[DEBUG] Candidate interviews:', interviews.map(i => ({ id: i.id, status: i.status })));
        if (interviews.some(i => i.status === 'completed')) {
          console.log('[DEBUG] Candidate already completed interview, blocking.');
          return res.status(403).json({ message: "You have already completed your interview. Only one interview is allowed per user." });
        }
        // Update candidate info with latest values
        candidate = await storage.updateCandidate(candidate.id, {
          name,
          phone,
          jobRole
        });
      } else {
        if (!req.file) {
          return res.status(400).json({ message: "Resume file is required" });
        }
        // Extract text from uploaded resume
        const resumeText = await extractTextFromFile(req.file.buffer, req.file.mimetype, req.file.originalname);
        // Create candidate
        candidate = await storage.createCandidate({
          name,
          email,
          phone,
          jobRole,
          resumeText
        });
        console.log('[DEBUG] Created new candidate ID:', candidate.id);
      }
      // Get global AI provider
      const rawProvider = await storage.getSetting("ai_provider");
      console.log('DB value for ai_provider:', rawProvider);
      console.log('Storage instance:', storage.constructor.name);
      console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
      
      // Force use Gemini for interview questions while keeping OpenAI for resume extraction
      const provider = "gemini" as 'openai' | 'gemini';
      console.log('Forced provider for interview questions:', provider);
      // Generate interview questions
      const questionSet = await generateInterviewQuestions(name, jobRole, candidate.resumeText, provider);
      // Create interview
      const interview = await storage.createInterview({
        candidateId: candidate.id,
        questions: questionSet,
        currentQuestionIndex: 0,
        status: "in-progress"
      });
      res.json({
        interviewId: interview.id,
        candidateId: candidate.id,
        questions: questionSet.questions,
        currentQuestion: questionSet.questions[0],
        candidateName: candidate.name,
        candidateRole: candidate.jobRole,
        candidatePhone: candidate.phone
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to start interview" });
    }
  });

  // Submit answer and get evaluation
  app.post("/api/interviews/answer", async (req, res) => {
    try {
      const { interviewId, questionIndex, answerText } = submitAnswerSchema.parse(req.body);

      const interview = await storage.getInterviewById(interviewId);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      const candidate = await storage.getCandidateById(interview.candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      const questions = interview.questions as { questions: string[] };
      const questionText = questions.questions[questionIndex];

      if (!questionText) {
        return res.status(400).json({ message: "Invalid question index" });
      }

      // Get global AI provider for evaluation
      const rawProvider = await storage.getSetting("ai_provider");
      const provider = (rawProvider || "openai") as 'openai' | 'gemini';

      // Evaluate the answer
      const evaluation = await evaluateAnswer(questionText, answerText, candidate.jobRole, provider);

      // Save the answer
      await storage.createAnswer({
        interviewId,
        questionIndex,
        questionText,
        answerText,
        score: evaluation.score,
        feedback: evaluation.feedback
      });

      // Update interview progress
      const nextQuestionIndex = questionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= questions.questions.length;

      if (isLastQuestion) {
        // Complete interview and generate final summary
        await storage.completeInterview(interviewId);

        // Get all answers for summary
        const allAnswers = await storage.getAnswersByInterview(interviewId);
        const answerData = allAnswers.map(a => ({
          question: a.questionText,
          answer: a.answerText, 
          score: a.score,
          feedback: a.feedback
        }));

        // Generate final summary
        const summary = await generateFinalSummary(candidate.name, candidate.jobRole, answerData);

        // Calculate scores
        const avgScore = answerData.reduce((sum, a) => sum + a.score, 0) / answerData.length;
        const technicalAnswers = answerData.slice(0, 4); // First 4 are technical
        const behavioralAnswers = answerData.slice(4); // Last 1 is behavioral
        
        const technicalScore = technicalAnswers.reduce((sum, a) => sum + a.score, 0) / technicalAnswers.length;
        const behavioralScore = behavioralAnswers.reduce((sum, a) => sum + a.score, 0) / behavioralAnswers.length;

        // Save evaluation
        await storage.createEvaluation({
          interviewId,
          overallScore: Math.round(avgScore * 10), // Store as 0-100
          technicalScore: Math.round(technicalScore * 10),
          behavioralScore: Math.round(behavioralScore * 10),
          strengths: summary.strengths,
          improvementAreas: summary.improvementAreas,
          recommendation: summary.recommendation
        });

        res.json({
          score: evaluation.score,
          feedback: evaluation.feedback,
          completed: true,
          summary
        });
      } else {
        // Continue to next question
        await storage.updateInterviewStatus(interviewId, "in-progress", nextQuestionIndex);
        
        res.json({
          score: evaluation.score,
          feedback: evaluation.feedback,
          completed: false,
          nextQuestion: questions.questions[nextQuestionIndex],
          questionIndex: nextQuestionIndex
        });
      }

    } catch (error) {
      console.error("Error submitting answer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  // Get interview status
  app.get("/api/interviews/:id", async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);
      const interview = await storage.getInterviewById(interviewId);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      const candidate = await storage.getCandidateById(interview.candidateId);
      const answers = await storage.getAnswersByInterview(interviewId);
      const evaluation = await storage.getEvaluationByInterview(interviewId);

      res.json({
        interview,
        candidate,
        answers,
        evaluation
      });

    } catch (error) {
      console.error("Error getting interview:", error);
      res.status(500).json({ message: "Failed to get interview" });
    }
  });

  // Get candidate dashboard data
  app.get("/api/candidates/:id/results", async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      const interviews = await storage.getInterviewsByCandidate(candidateId);
      
      const results = await Promise.all(interviews.map(async (interview) => {
        const answers = await storage.getAnswersByInterview(interview.id);
        const evaluation = await storage.getEvaluationByInterview(interview.id);
        return { interview, answers, evaluation };
      }));

      res.json(results);

    } catch (error) {
      console.error("Error getting candidate results:", error);
      res.status(500).json({ message: "Failed to get candidate results" });
    }
  });

  // Admin: Get all interviews
  app.get("/api/admin/interviews", async (req, res) => {
    try {
      const interviews = await storage.getAllInterviews();
      res.json(interviews);
    } catch (error) {
      console.error("Error getting admin interviews:", error);
      res.status(500).json({ message: "Failed to get interviews" });
    }
  });

  // Admin: Delete interview
  app.delete("/api/admin/interviews/:id", async (req, res) => {
    const interviewId = parseInt(req.params.id);
    try {
      // Delete answers
      await storage.deleteAnswersByInterview(interviewId);
      // Delete evaluation
      await storage.deleteEvaluationByInterview(interviewId);
      // Delete interview
      await storage.deleteInterview(interviewId);
      // Log action
      await storage.createAuditLog({
        action: 'Delete Interview',
        target: `Interview ID ${interviewId}`,
        performedBy: req.headers['x-user-email'] || 'unknown',
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting interview:", error);
      res.status(500).json({ message: "Failed to delete interview" });
    }
  });

  // Admin: Delete candidate (and all their interviews, answers, evaluations)
  app.delete("/api/admin/candidates/:id", async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id, 10);
      const candidate = await storage.getCandidateById(candidateId);
      if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
      // Delete candidate
      await storage.deleteCandidate(candidateId);
      // Also delete user with the same email
      if (candidate.email) {
        await storage.deleteUserByEmail(candidate.email);
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting candidate and user:", err);
      res.status(500).json({ success: false, message: "Failed to delete candidate and user" });
    }
  });

  // Admin: Get stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getInterviewStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Admin: Get AI provider
  app.get("/api/admin/ai-provider", async (_req, res) => {
    const provider = await storage.getSetting("ai_provider");
    res.json({ provider: provider || "openai" });
  });

  // Admin: Set AI provider
  app.post("/api/admin/ai-provider", async (req, res) => {
    // Simple backend protection: check for admin role in a custom header (for demo; replace with real auth in production)
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      console.log('[Admin] Unauthorized attempt to set AI provider by role:', userRole);
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    const { provider } = req.body;
    console.log('[Admin] Set AI provider called with:', provider);
    if (!provider || !["openai", "gemini"].includes(provider)) {
      console.log('[Admin] Invalid provider:', provider);
      return res.status(400).json({ message: "Invalid provider" });
    }
    try {
      await storage.setSetting("ai_provider", provider);
      console.log('[Admin] Saved ai_provider to settings:', provider);
      res.json({ provider });
    } catch (err) {
      console.error('[Admin] Error saving ai_provider:', err);
      res.status(500).json({ message: "Failed to save provider" });
    }
  });

  // Admin: Get voice provider
  app.get("/api/admin/voice-provider", async (_req, res) => {
    const provider = await storage.getSetting("voice_provider");
    res.json({ provider: provider || "pyttsx3" });
  });

  // Admin: Set voice provider
  app.post("/api/admin/voice-provider", async (req, res) => {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    const { provider } = req.body;
    if (!provider || !["elevenlabs", "pyttsx3"].includes(provider)) {
      return res.status(400).json({ message: "Invalid provider" });
    }
    try {
      await storage.setSetting("voice_provider", provider);
      res.json({ provider });
    } catch (err) {
      res.status(500).json({ message: "Failed to save provider" });
    }
  });

  // Agora token endpoint
  app.post('/api/agora/token', (req, res) => {
    const { channel, uid } = req.body;
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    if (!appID || !appCertificate) {
      return res.status(500).json({ message: 'Agora credentials not set' });
    }
    const role = 1; // 1 = PUBLISHER
    const expireTime = 3600; // 1 hour
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channel,
      Number(uid) || 0,
      role,
      Math.floor(Date.now() / 1000) + expireTime
    );
    res.json({ token });
  });

  // TTS endpoint: returns audio for a question using the selected provider
  app.post("/api/tts", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required" });
    try {
      // Get global voice provider
      const rawProvider = await storage.getSetting("voice_provider");
      const provider = (rawProvider || "pyttsx3") as 'elevenlabs' | 'pyttsx3';
      const audioBuffer = await generateTTS(text, provider);
      res.set({ 'Content-Type': 'audio/mpeg' });
      res.send(audioBuffer);
    } catch (err) {
      console.error("TTS error:", err);
      res.status(500).json({ message: "Failed to generate audio" });
    }
  });

  // Admin: Get all users
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Admin: Get all candidates
  app.get("/api/admin/candidates", async (req, res) => {
    try {
      const candidates = await storage.getAllCandidates();
      // For each candidate, try to find their latest invitation (by createdAt)
      let invitations = [];
      if (typeof storage.getAllInvitations === 'function') {
        invitations = await storage.getAllInvitations();
      } else if (storage.invitations) {
        invitations = Array.from(storage.invitations.values());
      }
      const candidatesWithInvites = candidates.map((c) => {
        // Find latest invitation for this candidate
        const candidateInvites = invitations.filter((inv: any) => inv.candidateId === c.id);
        let latestInvite = null;
        if (candidateInvites.length > 0) {
          latestInvite = candidateInvites.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
        }
        return {
          ...c,
          invitationToken: latestInvite ? latestInvite.token : null
        };
      });
      res.json(candidatesWithInvites);
    } catch (error) {
      console.error("Error getting candidates:", error);
      res.status(500).json({ message: "Failed to get candidates" });
    }
  });

  // Admin: Get all questions in the question bank
  app.get("/api/admin/questions", async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      let questions;
      if (role) {
        questions = await storage.getQuestionsByRole(role);
      } else {
        questions = await storage.getAllQuestions();
      }
      res.json(questions);
    } catch (error) {
      console.error("Error getting questions:", error);
      res.status(500).json({ message: "Failed to get questions" });
    }
  });

  // Disqualify candidate (disciplinary action)
  app.post("/api/candidates/:id/disqualify", async (req, res) => {
    const candidateId = parseInt(req.params.id);
    try {
      await storage.disqualifyCandidate(candidateId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to disqualify candidate" });
    }
  });

  // Admin: Get audit logs
  app.get("/api/admin/audit-logs", async (req, res) => {
    try {
      const { action, performedBy, date } = req.query;
      const logs = await storage.getAuditLogs({
        action: action as string,
        performedBy: performedBy as string,
        date: date as string,
      });
      res.json(logs);
    } catch (error) {
      console.error("Error getting audit logs:", error);
      res.status(500).json({ message: "Failed to get audit logs" });
    }
  });

  // Admin: Get all admins
  app.get("/api/admin/admins", async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ message: "Failed to get admins" });
    }
  });
  // Admin: Add admin
  app.post("/api/admin/admins", async (req, res) => {
    try {
      const { email, password, adminRole } = req.body;
      const user = await storage.addAdmin(email, password, adminRole);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to add admin" });
    }
  });
  // Admin: Update admin role
  app.patch("/api/admin/admins/:email", async (req, res) => {
    try {
      const { adminRole } = req.body;
      await storage.updateAdminRole(req.params.email, adminRole);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update admin role" });
    }
  });
  // Admin: Remove admin
  app.delete("/api/admin/admins/:email", async (req, res) => {
    try {
      await storage.removeAdmin(req.params.email);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove admin" });
    }
  });

  // Admin: Get token usage stats
  app.get("/api/admin/token-usage", async (req, res) => {
    try {
      const stats = await storage.getTokenUsageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get token usage stats" });
    }
  });

  // Admin: Get environment and config info
  app.get("/api/admin/env-config", async (req, res) => {
    try {
      // Only return non-secret keys
      const envKeys = Object.keys(process.env).filter(k => !k.toLowerCase().includes('key') && !k.toLowerCase().includes('secret') && !k.toLowerCase().includes('password'));
      // Example active features
      const features = [
        process.env.WHISPER_ENABLED ? 'Whisper' : null,
        process.env.SUMMARY_ENABLED ? 'Summary' : null,
        'Prompt Playground',
      ].filter(Boolean);
      res.json({ envKeys, features });
    } catch (error) {
      res.status(500).json({ message: "Failed to get env/config info" });
    }
  });
  // Admin: Download .env.example
  app.get("/api/admin/env-example", (_req, res) => {
    res.sendFile(require('path').resolve(process.cwd(), '.env.example'));
  });

  // Admin: Download all interview data as JSON
  app.get("/api/admin/export-interviews", async (_req, res) => {
    try {
      const interviews = await storage.getAllInterviews();
      res.setHeader('Content-Disposition', 'attachment; filename="interviews.json"');
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to export interviews" });
    }
  });
  // Admin: Download all candidates as JSON
  app.get("/api/admin/backup-candidates", async (_req, res) => {
    try {
      const candidates = await storage.getAllCandidates();
      res.setHeader('Content-Disposition', 'attachment; filename="candidates.json"');
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: "Failed to backup candidates" });
    }
  });
  // Admin: Clear test data (delete candidates/interviews with email containing 'test')
  app.post("/api/admin/clear-test-data", async (_req, res) => {
    try {
      const candidates = await storage.getAllCandidates();
      for (const c of candidates) {
        if (c.email && c.email.includes('test')) {
          const interviews = await storage.getInterviewsByCandidate(c.id);
          for (const i of interviews) {
            await storage.deleteAnswersByInterview(i.id);
            await storage.deleteEvaluationByInterview(i.id);
            await storage.deleteInterview(i.id);
          }
          await storage.deleteCandidate(c.id);
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear test data" });
    }
  });

  // Admin: Bulk resume upload and best match selection
  app.post("/api/admin/bulk-resume-upload", multer({ storage: multer.memoryStorage() }).array('resumes'), async (req, res) => {
    try {
      const jobRole = req.body.jobRole;
      const files = req.files as Express.Multer.File[];
      if (!files || !jobRole) return res.status(400).json({ message: 'Missing files or job role' });
      // Extract text and score each resume
      const results = await Promise.all(files.map(async (file) => {
        let text = '';
        try {
          text = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);
        } catch (error) {
          console.error('Error extracting text from file:', error);
          text = `Error processing ${file.originalname}`;
        }
        // Use Gemini to score
        let score = 0;
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) throw new Error('Missing Gemini API key');
          const prompt = `Score this resume for the job role '${jobRole}' on a scale of 0-100. Only return the score as a number.\n\nResume:\n${text}`;

          // Log the prompt sent to Gemini
          console.log('Gemini prompt:', prompt);
          const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          const rawBody = await response.text();
          // Log the raw response from Gemini
          console.log('Gemini response:', rawBody);
          let data = {};
          try { data = JSON.parse(rawBody); } catch {}
          let textOut = '';
          const candidates = (data as any).candidates;
          if (candidates && candidates[0]) {
            if (candidates[0].content && candidates[0].content.parts && candidates[0].content.parts[0] && candidates[0].content.parts[0].text) {
              textOut = candidates[0].content.parts[0].text;
            } else if (candidates[0].content && candidates[0].content.text) {
              textOut = candidates[0].content.text;
            } else if (candidates[0].content) {
              textOut = JSON.stringify(candidates[0].content);
            }
          }
          score = parseInt((textOut || '').match(/\d+/)?.[0] || '0', 10);
        } catch (err) {
          score = Math.floor(Math.random() * 100); // fallback
        }
        return { filename: file.originalname, score, text };
      }));
      // Find best
      const sorted = results.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, best: i === 0 }));
      res.json(sorted);
    } catch (error) {
      res.status(500).json({ message: "Failed to process resumes" });
    }
  });

  // Test endpoint to check environment variables
  app.get("/api/test-env", (req, res) => {
    res.json({
      message: "Environment variables test",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `Found (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : "Not found",
      OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      OPENAI_API_KEY_STARTS_WITH_SK: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.startsWith('sk-') : false,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `Found (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : "Not found",
      NODE_ENV: process.env.NODE_ENV,
      CURRENT_WORKING_DIR: process.cwd()
    });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
  });

  // Admin: Get system health status
  app.get("/api/admin/health", async (_req, res) => {
    try {
      // OpenAI health: check if API key is set
      const openaiStatus = process.env.OPENAI_API_KEY ? 'OK' : 'Missing API Key';
      // Gemini health: check if API key is set
      const geminiStatus = process.env.GEMINI_API_KEY ? 'OK' : 'Missing API Key';
      // Postgres health: try a simple query
      let postgresStatus = 'OK';
      try {
        await storage.getAllCandidates();
      } catch {
        postgresStatus = 'Error';
      }
      // Server health: always OK if this endpoint responds
      const serverStatus = 'OK';
      res.json([
        { name: 'OpenAI', status: openaiStatus, uptime: '99.99%', lastError: '' },
        { name: 'Gemini', status: geminiStatus, uptime: '99.95%', lastError: '' },
        { name: 'Postgres', status: postgresStatus, uptime: '100%', lastError: postgresStatus === 'OK' ? '' : 'DB error' },
        { name: 'Server', status: serverStatus, uptime: '99.98%', lastError: '' },
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to get system health" });
    }
  });

  // Admin: Get feature toggles
  app.get("/api/admin/feature-toggles", async (_req, res) => {
    try {
      const toggles = [
        'ai_feedback',
        'whisper_mic',
        'summary_generation',
        'login_required',
      ];
      const result: any = {};
      for (const t of toggles) {
        result[t] = (await storage.getSetting(t)) === 'true';
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to get feature toggles" });
    }
  });
  // Admin: Set feature toggle
  app.post("/api/admin/feature-toggles", async (req, res) => {
    try {
      const { key, value } = req.body;
      await storage.setSetting(key, value);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to set feature toggle" });
    }
  });

  // Admin: Extract resume information
  app.post("/api/admin/extract-resume-info", upload.single('resume'), async (req: RequestWithFile, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Resume file is required" });
      }

      // Extract text from resume
      const resumeText = await extractTextFromFile(req.file.buffer, req.file.mimetype, req.file.originalname);
      
      // Use AI to extract candidate information
      const extractedInfo = await extractCandidateInfo(resumeText, req.file.originalname);
      
      res.json(extractedInfo);
    } catch (error) {
      console.error("Error extracting resume info:", error);
      res.status(500).json({ message: "Failed to extract resume information" });
    }
  });

  // Admin: Send interview invitation
  app.post("/api/admin/send-interview-invite", async (req, res) => {
    try {
      const { candidateInfo, jobRole, skillset } = req.body;
      
      // Debug: Log the exact request data received
      console.log('=== INVITATION REQUEST DEBUG ===');
      console.log('Request body received:', JSON.stringify(req.body, null, 2));
      console.log('Candidate info:', candidateInfo);
      console.log('Job role:', jobRole);
      console.log('Skillset:', skillset);
      console.log('================================');
      
      // Validate required fields
      if (!candidateInfo || !candidateInfo.email || !jobRole) {
        return res.status(400).json({ 
          message: "Email and job role are required",
          details: {
            hasCandidateInfo: !!candidateInfo,
            hasEmail: !!(candidateInfo && candidateInfo.email),
            hasJobRole: !!jobRole
          }
        });
      }
      
      // Find the existing candidate by email
      const candidatesWithEmail = await storage.findCandidatesByEmail(candidateInfo.email);
      let candidateId = null;
      let resumeText = candidateInfo.resumeText || `Job Role: ${jobRole}\nRequired Skills: ${skillset || 'Not specified'}\nCandidate: ${candidateInfo.name || 'Not specified'} (${candidateInfo.email})`;
      
      if (candidatesWithEmail && candidatesWithEmail.length > 0) {
        // Update existing candidate with new information
        candidateId = candidatesWithEmail[0].id;
        const updatedResumeText = candidateInfo.resumeText || candidatesWithEmail[0].resumeText;
        
        await storage.updateCandidate(candidateId, {
          name: candidateInfo.name || candidatesWithEmail[0].name,
          phone: candidateInfo.phone || candidatesWithEmail[0].phone,
          jobRole: jobRole,
          resumeText: updatedResumeText,
          invited: true
        });
      } else {
        // Create new candidate record immediately
        const newCandidate = await storage.createCandidate({
          name: candidateInfo.name || 'Not specified',
          email: candidateInfo.email,
          phone: candidateInfo.phone || 'Not specified',
          jobRole: jobRole,
          resumeText: resumeText,
          invited: true
        });
        candidateId = newCandidate.id;
        console.log(`✅ Created new candidate with ID: ${candidateId}`);
      }
      
      // Generate invitation token using candidate ID
      const invitationToken = generateInvitationToken(candidateId, candidateInfo.email);
      
      // Store invitation with candidate info
      const invitation = await storage.createInvitation({
        candidateId,
        email: candidateInfo.email,
        token: invitationToken,
        jobRole: jobRole, // Use 'jobRole' as defined in the schema
        skillset: skillset || 'Not specified',
        status: 'pending',
        candidateInfo: {
          name: candidateInfo.name || 'Not specified',
          email: candidateInfo.email,
          phone: candidateInfo.phone || 'Not specified',
          resumeText: resumeText
        }
      });
      
      console.log(`✅ Created invitation for candidate ${candidateId}: ${invitationToken}`);
      
      await sendInterviewInvitation(candidateInfo.email, candidateInfo.name || 'Not specified', jobRole, skillset || 'Not specified', invitationToken, candidateInfo);
      res.json({ 
        success: true, 
        message: `Invitation sent to ${candidateInfo.email}`, 
        invitationId: invitation.id, 
        token: invitationToken,
        candidateId: candidateId
      });
    } catch (error) {
      console.error("Error sending interview invite:", error);
      res.status(500).json({ message: "Failed to send interview invitation" });
    }
  });

  // Get invitation data by token
  app.get("/api/invitations/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found or expired" });
      }
      
      res.json(invitation);
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  // Email configuration endpoints
  app.get("/api/admin/email-config", async (req, res) => {
    try {
      const config = emailService.getConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching email config:", error);
      res.status(500).json({ message: "Failed to fetch email configuration" });
    }
  });

  app.post("/api/admin/email-config", async (req, res) => {
    try {
      const { provider, apiKey, fromEmail, fromName } = req.body;
      await emailService.updateConfig({ provider, apiKey, fromEmail, fromName });
      res.json({ success: true, message: "Email configuration updated" });
    } catch (error) {
      console.error("Error updating email config:", error);
      res.status(500).json({ message: "Failed to update email configuration" });
    }
  });

  app.post("/api/admin/test-email", async (req, res) => {
    try {
      const result = await emailService.testConnection();
      res.json(result);
    } catch (error) {
      console.error("Error testing email connection:", error);
      res.status(500).json({ success: false, message: "Failed to test email connection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
