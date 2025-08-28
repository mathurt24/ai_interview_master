import sgMail from '@sendgrid/mail';
import { storage } from '../storage';

export interface EmailConfig {
  provider: 'sendgrid' | 'console';
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private config: EmailConfig = {
    provider: 'sendgrid', // Default to SendGrid instead of console
    fromEmail: 'noreply@firstroundai.com',
    fromName: 'FirstroundAI'
  };

  async initialize() {
    try {
      // First try to load from environment variables
      const envApiKey = process.env.SENDGRID_API_KEY;
      const envFromEmail = process.env.EMAIL_FROM;
      const envFromName = process.env.EMAIL_FROM_NAME;
      
      if (envApiKey && envApiKey !== 'SG.your-sendgrid-api-key-here' && envApiKey.length > 20) {
        // Environment variables are set, use them
        this.config = {
          provider: 'sendgrid',
          apiKey: envApiKey,
          fromEmail: envFromEmail || 'noreply@firstroundai.com',
          fromName: envFromName || 'FirstroundAI'
        };
        
        // Initialize SendGrid
        sgMail.setApiKey(envApiKey);
        console.log('SendGrid initialized with environment API key');
        return;
      }
      
      // Fallback to database configuration
      const provider = await storage.getSetting('email_provider') || 'sendgrid';
      const apiKey = await storage.getSetting('sendgrid_api_key');
      const fromEmail = await storage.getSetting('email_from_address') || 'noreply@firstroundai.com';
      const fromName = await storage.getSetting('email_from_name') || 'FirstroundAI';

      this.config = {
        provider: provider as 'sendgrid' | 'console',
        apiKey,
        fromEmail,
        fromName
      };

      // Initialize SendGrid if configured
      if (this.config.provider === 'sendgrid' && this.config.apiKey && this.config.apiKey !== 'SG.your-sendgrid-api-key-here' && this.config.apiKey.length > 20) {
        sgMail.setApiKey(this.config.apiKey);
        console.log('SendGrid initialized with database API key');
      } else {
        console.log('Email service using console mode - no valid SendGrid API key found');
        this.config.provider = 'console';
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.config.provider = 'console';
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (this.config.provider === 'sendgrid' && this.config.apiKey && this.config.apiKey !== 'SG.your-sendgrid-api-key-here' && this.config.apiKey.length > 20) {
        return await this.sendWithSendGrid(emailData);
      } else {
        console.log('Falling back to console mode - no valid SendGrid configuration');
        return await this.sendToConsole(emailData);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      // Fallback to console
      console.log('Falling back to console mode due to error');
      return await this.sendToConsole(emailData);
    }
  }

  private async sendWithSendGrid(emailData: EmailData): Promise<boolean> {
    try {
      const msg = {
        to: emailData.to,
        from: {
          email: this.config.fromEmail!,
          name: this.config.fromName!
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.htmlToText(emailData.html)
      };

      await sgMail.send(msg);
      console.log(`✅ Email sent successfully via SendGrid to: ${emailData.to}`);
      return true;
    } catch (error: any) {
      console.error('❌ SendGrid error:', error);
      
      // Check if it's a 403 Forbidden (likely API key issue)
      if (error.code === 403) {
        console.error('❌ SendGrid API key appears to be invalid or expired. Please check your SendGrid configuration.');
        console.error('❌ Falling back to console mode for this email.');
      }
      
      throw error;
    }
  }

  private async sendToConsole(emailData: EmailData): Promise<boolean> {
    console.log('\n=== EMAIL SENT (CONSOLE MODE) ===');
    console.log(`To: ${emailData.to}`);
    console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`);
    console.log(`Subject: ${emailData.subject}`);
    console.log('Body:');
    console.log(emailData.html);
    console.log('=====================================\n');
    
    // For password reset emails, provide additional console information
    if (emailData.subject.includes('Password Reset')) {
      console.log('🔐 PASSWORD RESET EMAIL SENT TO CONSOLE');
      console.log('📧 Since SendGrid is not working, the password reset link was logged above.');
      console.log('🔗 You can copy the reset link from the console output above.');
      console.log('⚠️  In production, ensure SendGrid API key is valid for actual email delivery.');
    }
    
    return true;
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  async updateConfig(newConfig: Partial<EmailConfig>): Promise<void> {
    // Update database settings
    if (newConfig.provider) {
      await storage.setSetting('email_provider', newConfig.provider);
    }
    if (newConfig.apiKey) {
      await storage.setSetting('sendgrid_api_key', newConfig.apiKey);
    }
    if (newConfig.fromEmail) {
      await storage.setSetting('email_from_address', newConfig.fromEmail);
    }
    if (newConfig.fromName) {
      await storage.setSetting('email_from_name', newConfig.fromName);
    }

    // Reinitialize with new config
    await this.initialize();
  }

  getConfig(): EmailConfig {
    return { ...this.config };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.config.provider === 'sendgrid' && this.config.apiKey && this.config.apiKey !== 'SG.your-sendgrid-api-key-here' && this.config.apiKey.length > 20) {
        // Test SendGrid connection by sending a test email to a test address
        const testEmail: EmailData = {
          to: 'test@example.com',
          subject: 'SendGrid Connection Test',
          html: '<p>This is a test email to verify SendGrid connection.</p>'
        };
        
        await this.sendWithSendGrid(testEmail);
        return { success: true, message: 'SendGrid connection successful' };
      } else {
        return { success: true, message: 'Console mode active - no external connection needed' };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  }

  // Method to check if SendGrid is properly configured
  isSendGridAvailable(): boolean {
    return this.config.provider === 'sendgrid' && 
           !!this.config.apiKey && 
           this.config.apiKey !== 'SG.your-sendgrid-api-key-here' && 
           this.config.apiKey.length > 20;
  }
}

export const emailService = new EmailService(); 