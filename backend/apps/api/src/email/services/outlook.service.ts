import { Injectable, Logger } from '@nestjs/common';
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
export class OutlookService implements IEmailService {
  readonly serviceType: EmailServiceType = 'OUTLOOK';
  private readonly logger = new Logger(OutlookService.name);
  
  private readonly SCOPES = [
    'Mail.Read',
    'Mail.Send',
    'Mail.ReadWrite',
    'User.Read'
  ];

  private readonly GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
  private accessToken: string | null = null;

  getAuthUrl(): string {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI;
    const scopes = this.SCOPES.join(' ');
    
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
           `client_id=${clientId}&` +
           `response_type=code&` +
           `redirect_uri=${encodeURIComponent(redirectUri)}&` +
           `scope=${encodeURIComponent(scopes)}&` +
           `response_mode=query`;
  }

  async authenticate(code: string): Promise<EmailAuthResult> {
    try {
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.OUTLOOK_CLIENT_ID,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET,
          code,
          redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to get access and refresh tokens');
      }

      this.accessToken = tokens.access_token;

      // Get user info
      const userInfo = await this.getUserInfo();

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: JSON.stringify(this.SCOPES), // Convert array to JSON string
        userId: userInfo.id,
        email: userInfo.mail || userInfo.userPrincipalName
      };
    } catch (error) {
      this.logger.error('Outlook authentication failed:', error);
      throw new Error(`Outlook authentication failed: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<EmailAuthResult> {
    try {
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.OUTLOOK_CLIENT_ID,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('Failed to refresh access token');
      }

      this.accessToken = tokens.access_token;

      return {
        accessToken: tokens.access_token,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: JSON.stringify(this.SCOPES) // Convert array to JSON string
      };
    } catch (error) {
      this.logger.error('Outlook token refresh failed:', error);
      throw new Error(`Outlook token refresh failed: ${error.message}`);
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    try {
      await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      this.accessToken = null;
      this.logger.log('Outlook token revoked successfully');
    } catch (error) {
      this.logger.error('Outlook token revocation failed:', error);
      throw new Error(`Outlook token revocation failed: ${error.message}`);
    }
  }

  async getMessages(options?: EmailFetchOptions): Promise<EmailMessage[]> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      let url = `${this.GRAPH_API_BASE}/me/messages?$top=${options?.maxResults || 100}`;
      
      if (options?.query) {
        url += `&$search="${encodeURIComponent(options.query)}"`;
      }

      if (options?.startDate) {
        url += `&$filter=receivedDateTime ge ${options.startDate.toISOString()}`;
      }

      if (options?.endDate) {
        url += `&$filter=receivedDateTime le ${options.endDate.toISOString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.value || []).map((msg: any) => this.mapGraphMessageToEmailMessage(msg));
    } catch (error) {
      this.logger.error('Failed to fetch Outlook messages:', error);
      throw new Error(`Failed to fetch Outlook messages: ${error.message}`);
    }
  }

  async getMessage(messageId: string): Promise<EmailMessage> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${this.GRAPH_API_BASE}/me/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const message = await response.json();
      return this.mapGraphMessageToEmailMessage(message);
    } catch (error) {
      this.logger.error(`Failed to fetch Outlook message ${messageId}:`, error);
      throw new Error(`Failed to fetch Outlook message: ${error.message}`);
    }
  }

  async sendMessage(message: EmailSendRequest): Promise<string> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const graphMessage = {
        subject: message.subject,
        body: {
          contentType: 'Text',
          content: message.body
        },
        toRecipients: message.to.map(email => ({ emailAddress: { address: email } })),
        ccRecipients: message.cc?.map(email => ({ emailAddress: { address: email } })) || [],
        bccRecipients: message.bcc?.map(email => ({ emailAddress: { address: email } })) || [],
      };

      if (message.replyTo) {
        graphMessage['replyTo'] = [{ emailAddress: { address: message.replyTo } }];
      }

      const response = await fetch(`${this.GRAPH_API_BASE}/me/sendMail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: graphMessage,
          saveToSentItems: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.log('Outlook message sent successfully');
      return 'sent'; // Outlook doesn't return message ID for sendMail
    } catch (error) {
      this.logger.error('Failed to send Outlook message:', error);
      throw new Error(`Failed to send Outlook message: ${error.message}`);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${this.GRAPH_API_BASE}/me/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.log(`Outlook message deleted: ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to delete Outlook message ${messageId}:`, error);
      throw new Error(`Failed to delete Outlook message: ${error.message}`);
    }
  }

  async markAsRead(messageId: string, read: boolean): Promise<void> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${this.GRAPH_API_BASE}/me/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRead: read
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.log(`Outlook message ${messageId} marked as ${read ? 'read' : 'unread'}`);
    } catch (error) {
      this.logger.error(`Failed to modify Outlook message ${messageId}:`, error);
      throw new Error(`Failed to modify Outlook message: ${error.message}`);
    }
  }

  async addLabel(messageId: string, label: string): Promise<void> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${this.GRAPH_API_BASE}/me/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: [label]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.log(`Label ${label} added to Outlook message ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to add label to Outlook message ${messageId}:`, error);
      throw new Error(`Failed to add label to Outlook message: ${error.message}`);
    }
  }

  async removeLabel(messageId: string, label: string): Promise<void> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      // Get current categories and remove the specified one
      const message = await this.getMessage(messageId);
      const currentCategories = message.labels || [];
      const updatedCategories = currentCategories.filter(cat => cat !== label);

      const response = await fetch(`${this.GRAPH_API_BASE}/me/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: updatedCategories
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.log(`Label ${label} removed from Outlook message ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to remove label from Outlook message ${messageId}:`, error);
      throw new Error(`Failed to remove label from Outlook message: ${error.message}`);
    }
  }

  async getFolders(): Promise<EmailFolder[]> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${this.GRAPH_API_BASE}/me/mailFolders`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.value || []).map((folder: any) => ({
        id: folder.id,
        name: folder.displayName,
        type: this.mapGraphFolderToEmailFolderType(folder.displayName),
        messageCount: folder.totalItemCount || 0,
        unreadCount: folder.unreadItemCount || 0
      }));
    } catch (error) {
      this.logger.error('Failed to fetch Outlook folders:', error);
      throw new Error(`Failed to fetch Outlook folders: ${error.message}`);
    }
  }

  async getLabels(): Promise<EmailLabel[]> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${this.GRAPH_API_BASE}/me/outlook/masterCategories`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.value || []).map((category: any) => ({
        id: category.id,
        name: category.displayName,
        color: category.color,
        messageCount: 0, // Outlook doesn't provide this info
        unreadCount: 0
      }));
    } catch (error) {
      this.logger.error('Failed to fetch Outlook labels:', error);
      throw new Error(`Failed to fetch Outlook labels: ${error.message}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.accessToken) {
        return false;
      }

      const response = await fetch(`${this.GRAPH_API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.error('Outlook health check failed:', error);
      return false;
    }
  }

  // Private helper methods
  private async getUserInfo(): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${this.GRAPH_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private mapGraphMessageToEmailMessage(graphMessage: any): EmailMessage {
    return {
      id: graphMessage.id,
      subject: graphMessage.subject || '(No Subject)',
      sender: graphMessage.from?.emailAddress?.address || '',
      recipients: graphMessage.toRecipients?.map((r: any) => r.emailAddress.address) || [],
      body: graphMessage.body?.content || '',
      htmlBody: graphMessage.body?.contentType === 'HTML' ? graphMessage.body.content : undefined,
      attachments: [], // Would need separate API call to get attachments
      receivedAt: new Date(graphMessage.receivedDateTime),
      threadId: graphMessage.conversationId,
      labels: graphMessage.categories || [],
      isRead: graphMessage.isRead || false,
      isStarred: graphMessage.flag?.flagStatus === 'flagged'
    };
  }

  private mapGraphFolderToEmailFolderType(displayName: string): EmailFolder['type'] {
    const systemFolders: Record<string, EmailFolder['type']> = {
      'Inbox': 'INBOX',
      'Sent Items': 'SENT',
      'Drafts': 'DRAFT',
      'Deleted Items': 'TRASH',
      'Junk Email': 'SPAM'
    };

    return systemFolders[displayName] || 'CUSTOM';
  }
}
