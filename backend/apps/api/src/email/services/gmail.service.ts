import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { 
  IEmailService, 
  EmailMessage, 
  EmailAuthResult, 
  EmailFetchOptions, 
  EmailSendRequest,
  EmailFolder,
  EmailLabel,
  EmailServiceType
} from '../interfaces/email-service.interface';

@Injectable()
export class GmailService implements IEmailService {
  readonly serviceType: EmailServiceType = 'GMAIL';
  private readonly logger = new Logger(GmailService.name);
  
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels'
  ];

  private oauth2Client: any;
  private gmail: any;

  // Initialize OAuth client with credentials
  public initializeOAuthClient(clientId: string, clientSecret: string, redirectUri: string) {
    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  getAuthUrl(clientId: string, clientSecret: string, redirectUri: string): string {
    this.initializeOAuthClient(clientId, clientSecret, redirectUri);
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent'
    });
  }

  async authenticate(code: string): Promise<EmailAuthResult> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to get access and refresh tokens');
      }

      // Get user info
      this.oauth2Client.setCredentials(tokens);
      const userInfo = await this.gmail.users.getProfile({ userId: 'me' });

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000),
        scope: JSON.stringify(this.SCOPES), // Convert array to JSON string
        userId: userInfo.data.emailAddress || undefined,
        email: userInfo.data.emailAddress || undefined
      };
    } catch (error) {
      this.logger.error('Gmail authentication failed:', error);
      throw new Error(`Gmail authentication failed: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<EmailAuthResult> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      return {
        accessToken: credentials.access_token,
        refreshToken: refreshToken,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600000),
        scope: JSON.stringify(this.SCOPES) // Convert array to JSON string
      };
    } catch (error) {
      this.logger.error('Gmail token refresh failed:', error);
      throw new Error(`Gmail token refresh failed: ${error.message}`);
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken);
      this.logger.log('Gmail token revoked successfully');
    } catch (error) {
      this.logger.error('Gmail token revocation failed:', error);
      throw new Error(`Gmail token revocation failed: ${error.message}`);
    }
  }

  async getMessages(options?: EmailFetchOptions): Promise<EmailMessage[]> {
    try {
      const query = this.buildGmailQuery(options);
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: options?.maxResults || 100,
        includeSpamTrash: options?.includeSpamTrash || false
      });

      if (!response.data.messages) {
        return [];
      }

      // Get full message details
      const messages = await Promise.all(
        response.data.messages.map(msg => this.getMessage(msg.id))
      );

      return messages.filter(Boolean) as EmailMessage[];
    } catch (error) {
      this.logger.error('Failed to fetch Gmail messages:', error);
      throw new Error(`Failed to fetch Gmail messages: ${error.message}`);
    }
  }

  async getMessage(messageId: string): Promise<EmailMessage> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      const headers = message.payload?.headers || [];
      
      const getHeader = (name: string) => 
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      const body = this.extractMessageBody(message.payload);
      
      return {
        id: message.id,
        subject: getHeader('Subject') || '(No Subject)',
        sender: getHeader('From') || '',
        recipients: getHeader('To')?.split(',').map(e => e.trim()) || [],
        body: body.text || '',
        htmlBody: body.html,
        attachments: await this.extractAttachments(message.payload),
        receivedAt: new Date(parseInt(message.internalDate)),
        threadId: message.threadId,
        labels: message.labelIds || [],
        isRead: !message.labelIds?.includes('UNREAD'),
        isStarred: message.labelIds?.includes('STARRED') || false
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Gmail message ${messageId}:`, error);
      throw new Error(`Failed to fetch Gmail message: ${error.message}`);
    }
  }

  async sendMessage(message: EmailSendRequest): Promise<string> {
    try {
      // Check if the body contains HTML tags
      const isHtml = /<[a-z][\s\S]*>/i.test(message.body) || 
                     message.body.includes('<div') || 
                     message.body.includes('<p>') || 
                     message.body.includes('<h1>') || 
                     message.body.includes('<h2>') || 
                     message.body.includes('<h3>') ||
                     message.body.includes('<strong>') ||
                     message.body.includes('<b>') ||
                     message.body.includes('<i>') ||
                     message.body.includes('<br>');

      if (isHtml) {
        // Use Gmail API's proper format for HTML emails with multipart structure
        const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const plainTextBody = message.body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        
        const emailContent = 
          `From: ${process.env.GMAIL_FROM_EMAIL || 'noreply@example.com'}\r\n` +
          `To: ${message.to.join(', ')}\r\n` +
          `Subject: ${message.subject}\r\n` +
          `MIME-Version: 1.0\r\n` +
          `Content-Type: multipart/alternative; boundary="${boundary}"\r\n` +
          `Date: ${new Date().toUTCString()}\r\n` +
          `\r\n` +
          `--${boundary}\r\n` +
          `Content-Type: text/plain; charset=utf-8\r\n` +
          `\r\n` +
          `${plainTextBody}\r\n` +
          `\r\n` +
          `--${boundary}\r\n` +
          `Content-Type: text/html; charset=utf-8\r\n` +
          `\r\n` +
          `${message.body}\r\n` +
          `\r\n` +
          `--${boundary}--`;

        const response = await this.gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
          }
        });

        this.logger.log(`Gmail HTML message sent successfully: ${response.data.id}`);
        return response.data.id;
      } else {
        // Use the original method for plain text
        const email = this.buildEmailMessage(message);
        const encodedMessage = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

        const response = await this.gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage
          }
        });

        this.logger.log(`Gmail message sent successfully: ${response.data.id}`);
        return response.data.id;
      }
    } catch (error) {
      this.logger.error('Failed to send Gmail message:', error);
      throw new Error(`Failed to send Gmail message: ${error.message}`);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.delete({
        userId: 'me',
        id: messageId
      });
      this.logger.log(`Gmail message deleted: ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to delete Gmail message ${messageId}:`, error);
      throw new Error(`Failed to delete Gmail message: ${error.message}`);
    }
  }

  async markAsRead(messageId: string, read: boolean): Promise<void> {
    try {
      const labelIds = read ? ['UNREAD'] : [];
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: labelIds
        }
      });
      this.logger.log(`Gmail message ${messageId} marked as ${read ? 'read' : 'unread'}`);
    } catch (error) {
      this.logger.error(`Failed to modify Gmail message ${messageId}:`, error);
      throw new Error(`Failed to modify Gmail message: ${error.message}`);
    }
  }

  async addLabel(messageId: string, label: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [label]
        }
      });
      this.logger.log(`Label ${label} added to Gmail message ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to add label to Gmail message ${messageId}:`, error);
      throw new Error(`Failed to add label to Gmail message: ${error.message}`);
    }
  }

  async removeLabel(messageId: string, label: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: [label]
        }
      });
      this.logger.log(`Label ${label} removed from Gmail message ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to remove label from Gmail message ${messageId}:`, error);
      throw new Error(`Failed to remove label from Gmail message: ${error.message}`);
    }
  }

  async getFolders(): Promise<EmailFolder[]> {
    try {
      const response = await this.gmail.users.labels.list({ userId: 'me' });
      
      return (response.data.labels || []).map(label => ({
        id: label.id,
        name: label.name,
        type: this.mapGmailLabelToFolderType(label.id),
        messageCount: parseInt(String(label.messagesTotal || '0')),
        unreadCount: parseInt(String(label.messagesUnread || '0'))
      }));
    } catch (error) {
      this.logger.error('Failed to fetch Gmail folders:', error);
      throw new Error(`Failed to fetch Gmail folders: ${error.message}`);
    }
  }

  async getLabels(): Promise<EmailLabel[]> {
    try {
      const response = await this.gmail.users.labels.list({ userId: 'me' });
      
      return (response.data.labels || []).map(label => ({
        id: label.id,
        name: label.name,
        color: label.color?.backgroundColor,
        messageCount: parseInt(String(label.messagesTotal || '0')),
        unreadCount: parseInt(String(label.messagesUnread || '0'))
      }));
    } catch (error) {
      this.logger.error('Failed to fetch Gmail labels:', error);
      throw new Error(`Failed to fetch Gmail labels: ${error.message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch (error) {
      this.logger.error('Gmail health check failed:', error);
      return false;
    }
  }

  // Private helper methods
  private buildGmailQuery(options?: EmailFetchOptions): string {
    const queryParts: string[] = [];

    if (options?.query) {
      queryParts.push(options.query);
    }

    if (options?.startDate) {
      queryParts.push(`after:${options.startDate.getTime() / 1000}`);
    }

    if (options?.endDate) {
      queryParts.push(`before:${options.endDate.getTime() / 1000}`);
    }

    if (options?.labelIds?.length) {
      queryParts.push(`label:${options.labelIds.join(' label:')}`);
    }

    return queryParts.join(' ');
  }

  private extractMessageBody(payload: any): { text?: string; html?: string } {
    if (payload.body?.data) {
      const data = payload.body.data;
      const decoded = Buffer.from(data, 'base64').toString();
      
      if (payload.mimeType === 'text/plain') {
        return { text: decoded };
      } else if (payload.mimeType === 'text/html') {
        return { html: decoded };
      }
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          const text = Buffer.from(part.body.data, 'base64').toString();
          return { text };
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = Buffer.from(part.body.data, 'base64').toString();
          return { html };
        }
      }
    }

    return {};
  }

  private async extractAttachments(payload: any): Promise<any[]> {
    // Implementation for extracting attachments
    // This would involve downloading attachment data
    return [];
  }

  private buildEmailMessage(message: EmailSendRequest): string {
    // Check if the body contains HTML tags (more robust detection)
    const isHtml = /<[a-z][\s\S]*>/i.test(message.body) || 
                   message.body.includes('<div') || 
                   message.body.includes('<p>') || 
                   message.body.includes('<h1>') || 
                   message.body.includes('<h2>') || 
                   message.body.includes('<h3>') ||
                   message.body.includes('<strong>') ||
                   message.body.includes('<b>') ||
                   message.body.includes('<i>') ||
                   message.body.includes('<br>');
    
    // Debug logging
    this.logger.log(`Email body preview: ${message.body.substring(0, 100)}...`);
    this.logger.log(`Is HTML detected: ${isHtml}`);
    
    const headers = [
      `From: ${process.env.GMAIL_FROM_EMAIL || 'noreply@example.com'}`,
      `To: ${message.to.join(', ')}`,
      `Subject: ${message.subject}`,
      `MIME-Version: 1.0`,
      `Date: ${new Date().toUTCString()}`
    ];

    if (message.cc?.length) {
      headers.push(`Cc: ${message.cc.join(', ')}`);
    }

    if (message.bcc?.length) {
      headers.push(`Bcc: ${message.bcc.join(', ')}`);
    }

    if (message.replyTo) {
      headers.push(`Reply-To: ${message.replyTo}`);
    }

    if (isHtml) {
      // For HTML emails, use simple HTML content type
      headers.push(`Content-Type: text/html; charset=utf-8`);
      
      this.logger.log(`Sending HTML email with content: ${message.body.substring(0, 200)}...`);
      return `${headers.join('\r\n')}\r\n\r\n${message.body}`;
    } else {
      // For plain text emails
      headers.push(`Content-Type: text/plain; charset=utf-8`);
      return `${headers.join('\r\n')}\r\n\r\n${message.body}`;
    }
  }

  private mapGmailLabelToFolderType(labelId: string): EmailFolder['type'] {
    const systemLabels: Record<string, EmailFolder['type']> = {
      'INBOX': 'INBOX',
      'SENT': 'SENT',
      'DRAFT': 'DRAFT',
      'TRASH': 'TRASH',
      'SPAM': 'SPAM'
    };

    return systemLabels[labelId] || 'CUSTOM';
  }
}
