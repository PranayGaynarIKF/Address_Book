import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { EmailManagerService } from './email-manager.service';
import { EmailDatabaseService } from './email-database.service';
import { EmailSendRequest, EmailServiceType } from './interfaces/email-service.interface';

@Injectable()
export class EmailBulkService {
  private readonly logger = new Logger(EmailBulkService.name);

  constructor(
    private readonly emailManagerService: EmailManagerService,
    private readonly emailDatabaseService: EmailDatabaseService
  ) {}

  async sendBulkEmails(
    contacts: any[],
    subject: string,
    content: string,
    fromEmail: string
  ) {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Initialize Gmail service with OAuth credentials
    try {
      const gmailService = this.emailManagerService.getEmailService('GMAIL') as any;
      if (gmailService && typeof gmailService.initializeOAuthClient === 'function') {
        // First try to get any valid Gmail token
        let authToken = await this.emailDatabaseService.getAnyValidGmailToken();
        
        // If no token found, try to get all tokens and use the first valid one
        if (!authToken) {
          const allTokens = await this.emailDatabaseService.getAllGmailTokens();
          const validToken = allTokens.find(token => 
            token.isValid && 
            token.accessToken && 
            token.refreshToken &&
            new Date(token.expiresAt) > new Date()
          );
          
          if (validToken) {
            authToken = {
              id: validToken.id,
              userId: validToken.userId,
              serviceType: validToken.serviceType,
              accessToken: validToken.accessToken,
              refreshToken: validToken.refreshToken,
              expiresAt: validToken.expiresAt,
              scope: validToken.scope,
              email: validToken.email,
              isValid: validToken.isValid,
              createdAt: validToken.createdAt,
              updatedAt: validToken.updatedAt
            };
            this.logger.log(`Found valid Gmail token from all tokens: ${validToken.userId}`);
          }
        }
        
        if (authToken && authToken.accessToken) {
          this.logger.log(`Found valid Gmail token for user: ${authToken.userId}`);
          
          // Try to get the config for this user
          let config = null;
          try {
            config = await this.emailDatabaseService.getEmailServiceConfig(authToken.userId, 'GMAIL');
          } catch (err) {
            this.logger.log(`No config found for user: ${authToken.userId}, trying default config`);
            // Use default Gmail config from environment variables
            config = {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4002/api/mail-accounts/oauth-callback'
            };
          }
          
          if (config && config.clientId && config.clientSecret) {
            gmailService.initializeOAuthClient(config.clientId, config.clientSecret, config.redirectUri);
            
            // Set the access token on the OAuth client
            if (gmailService.oauth2Client) {
              gmailService.oauth2Client.setCredentials({
                access_token: authToken.accessToken,
                refresh_token: authToken.refreshToken
              });
              this.logger.log('Gmail service initialized with OAuth credentials and tokens');
            } else {
              throw new Error('OAuth client not properly initialized');
            }
          } else {
            throw new Error('No Gmail configuration found');
          }
        } else {
          throw new Error('No valid Gmail OAuth tokens found');
        }
      }
    } catch (error) {
      this.logger.error('Failed to initialize Gmail service:', error);
      throw new Error(`Gmail service initialization failed: ${error.message}`);
    }

    for (const contact of contacts) {
      try {
        // Generate dynamic content for the email
        let emailContent = content;
        let emailSubject = subject;
        
        // Replace template variables with contact data
        const contactName = contact.name || 'Customer';
        const contactMobile = contact.mobile || contact.phone || 'Not provided';
        const contactEmail = contact.email || 'Not provided';
        
        emailContent = emailContent.replace(/\{\{name\}\}/g, contactName);
        emailContent = emailContent.replace(/\{\{mobile\}\}/g, contactMobile);
        emailContent = emailContent.replace(/\{\{email\}\}/g, contactEmail);
        emailSubject = emailSubject.replace(/\{\{name\}\}/g, contactName);
        emailSubject = emailSubject.replace(/\{\{mobile\}\}/g, contactMobile);
        emailSubject = emailSubject.replace(/\{\{email\}\}/g, contactEmail);

        // Convert plain text to HTML if it doesn't contain HTML tags
        if (!emailContent.includes('<') && !emailContent.includes('>')) {
          emailContent = this.convertPlainTextToHtml(emailContent);
        }

        // Create the email message
        const message: EmailSendRequest = {
          to: [contact.email],
          subject: emailSubject,
          body: emailContent
        };

        // Send the email using the existing email manager
        const messageId = await this.emailManagerService.sendMessageFromService('GMAIL', message);

        if (messageId) {
          successCount++;
          results.push({
            contactId: contact.id,
            contactName: contact.name,
            contactEmail: contact.email,
            status: 'sent',
            messageId: messageId
          });
        } else {
          failureCount++;
          results.push({
            contactId: contact.id,
            contactName: contact.name,
            contactEmail: contact.email,
            status: 'failed',
            error: 'No message ID returned'
          });
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        failureCount++;
        results.push({
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: contact.email,
          status: 'failed',
          error: error.message || 'Failed to send email'
        });
      }
    }

    return {
      totalContacts: contacts.length,
      successCount,
      failureCount,
      results
    };
  }

  private convertPlainTextToHtml(plainText: string): string {
    // Convert plain text to beautiful HTML email
    const lines = plainText.split('\n');
    let html = '';
    let inParagraph = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '') {
        if (inParagraph) {
          html += '</p>';
          inParagraph = false;
        }
        html += '<br>';
      } else if (line.length > 0 && line.length < 50 && !line.includes(' ') && i < lines.length - 1) {
        // Likely a title/header
        if (inParagraph) {
          html += '</p>';
          inParagraph = false;
        }
        html += `<h2 style="color: #2563eb; margin-bottom: 20px; font-size: 24px; font-weight: bold;">${line}</h2>`;
      } else {
        if (!inParagraph) {
          html += '<p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">';
          inParagraph = true;
        } else {
          html += '<br>';
        }
        html += line;
      }
    }

    if (inParagraph) {
      html += '</p>';
    }

    // Wrap in professional email container
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${html}
        </div>
      </div>
    `;
  }
}