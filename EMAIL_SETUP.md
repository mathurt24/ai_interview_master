# Email Setup for AI Interview Master

## Current Status
The application is currently in "console mode" which means emails are only logged to the console instead of being sent. To enable actual email sending, you need to configure SendGrid.

## Setup Steps

### 1. Get a SendGrid API Key
1. Go to [SendGrid](https://sendgrid.com/) and create a free account
2. Navigate to Settings > API Keys
3. Create a new API Key with "Mail Send" permissions
4. Copy the API key (it starts with `SG.`)

### 2. Update Environment Variables
Edit your `.env` file and replace the placeholder with your actual SendGrid API key:

```bash
# Email Service Configuration
SENDGRID_API_KEY=SG.your-actual-sendgrid-api-key-here
EMAIL_FROM=noreply@firstroundai.com
EMAIL_FROM_NAME=FirstroundAI
```

### 3. Verify Domain (Optional but Recommended)
For production use, verify your domain with SendGrid to improve email deliverability.

### 4. Test Email Functionality
1. Restart your server after updating the `.env` file
2. Try sending an interview invitation
3. Check the server logs - you should see "SendGrid initialized with environment API key"
4. The candidate should receive an actual email instead of just console logs

## Email Features
- **Enhanced Template**: Includes candidate details, skills, and experience
- **Professional Design**: Beautiful HTML email with responsive design
- **Candidate Profile**: Shows extracted information from resume
- **Skills Display**: Visual representation of candidate skills
- **Interview Link**: Direct link to start the interview process

## Troubleshooting
- If you see "Email service using console mode", check your SendGrid API key
- Ensure the API key has "Mail Send" permissions
- Check server logs for any SendGrid errors
- Verify your SendGrid account is active and not suspended

## Fallback Behavior
If SendGrid fails for any reason, the system automatically falls back to console mode to ensure the application continues to work. 