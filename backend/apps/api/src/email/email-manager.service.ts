import { Injectable, Logger } from '@nestjs/common';
import { GmailService } from './services/gmail.service';
import { OutlookService } from './services/outlook.service';
import { TagsService } from '../tags/tags.service';
import { EmailDatabaseService } from './email-database.service';
import { 
  IEmailService, 
  EmailMessage, 
  EmailAuthResult, 
  EmailFetchOptions, 
  EmailSendRequest,
  EmailFolder,
  EmailLabel,
  EmailServiceType
} from './interfaces/email-service.interface';

@Injectable()
export class EmailManagerService {
  private readonly logger = new Logger(EmailManagerService.name);
  
  private readonly emailServices: Map<EmailServiceType, IEmailService> = new Map();

  constructor(
    private readonly gmailService: GmailService,
    private readonly outlookService: OutlookService,
    private readonly tagsService: TagsService,
    private readonly emailDatabaseService: EmailDatabaseService,
  ) {
    // Register email services
    this.emailServices.set('GMAIL', gmailService);
    this.emailServices.set('OUTLOOK', outlookService);
    // Add more services as they're implemented
  }

  // Service Management
  getEmailService(serviceType: EmailServiceType): IEmailService | null {
    return this.emailServices.get(serviceType) || null;
  }

  getAvailableServices(): EmailServiceType[] {
    return Array.from(this.emailServices.keys());
  }

  isServiceAvailable(serviceType: EmailServiceType): boolean {
    return this.emailServices.has(serviceType);
  }

  // Authentication Management
  async authenticateService(serviceType: EmailServiceType, code: string): Promise<EmailAuthResult> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      const result = await service.authenticate(code);
      this.logger.log(`Successfully authenticated ${serviceType} service`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to authenticate ${serviceType} service:`, error);
      throw error;
    }
  }

  async refreshServiceToken(serviceType: EmailServiceType, refreshToken: string): Promise<EmailAuthResult> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      const result = await service.refreshToken(refreshToken);
      this.logger.log(`Successfully refreshed token for ${serviceType} service`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to refresh token for ${serviceType} service:`, error);
      throw error;
    }
  }

  async revokeServiceToken(serviceType: EmailServiceType, accessToken: string): Promise<void> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      await service.revokeToken(accessToken);
      this.logger.log(`Successfully revoked token for ${serviceType} service`);
    } catch (error) {
      this.logger.error(`Failed to revoke token for ${serviceType} service:`, error);
      throw error;
    }
  }

  // Unified Email Operations
  async getMessagesFromAllServices(options?: EmailFetchOptions): Promise<Record<EmailServiceType, EmailMessage[]>> {
    const results: Record<EmailServiceType, EmailMessage[]> = {} as Record<EmailServiceType, EmailMessage[]>;
    
    for (const [serviceType, service] of this.emailServices) {
      try {
        const messages = await service.getMessages(options);
        results[serviceType] = messages;
        this.logger.log(`Retrieved ${messages.length} messages from ${serviceType}`);
      } catch (error) {
        this.logger.error(`Failed to get messages from ${serviceType}:`, error);
        results[serviceType] = [];
      }
    }

    return results;
  }

  async getMessagesFromService(serviceType: EmailServiceType, options?: EmailFetchOptions): Promise<EmailMessage[]> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      const messages = await service.getMessages(options);
      this.logger.log(`Retrieved ${messages.length} messages from ${serviceType}`);
      return messages;
    } catch (error) {
      this.logger.error(`Failed to get messages from ${serviceType}:`, error);
      throw error;
    }
  }

  async getMessageFromService(serviceType: EmailServiceType, messageId: string): Promise<EmailMessage> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      const message = await service.getMessage(messageId);
      this.logger.log(`Retrieved message ${messageId} from ${serviceType}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to get message ${messageId} from ${serviceType}:`, error);
      throw error;
    }
  }

  async sendMessageFromService(serviceType: EmailServiceType, message: EmailSendRequest): Promise<string> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      const messageId = await service.sendMessage(message);
      this.logger.log(`Successfully sent message via ${serviceType}: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(`Failed to send message via ${serviceType}:`, error);
      throw error;
    }
  }

  async deleteMessageFromService(serviceType: EmailServiceType, messageId: string): Promise<void> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      await service.deleteMessage(messageId);
      this.logger.log(`Successfully deleted message ${messageId} from ${serviceType}`);
    } catch (error) {
      this.logger.error(`Failed to delete message ${messageId} from ${serviceType}:`, error);
      throw error;
    }
  }

  async markMessageAsRead(serviceType: EmailServiceType, messageId: string, read: boolean): Promise<void> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      await service.markAsRead(messageId, read);
      this.logger.log(`Successfully marked message ${messageId} as ${read ? 'read' : 'unread'} in ${serviceType}`);
    } catch (error) {
      this.logger.error(`Failed to mark message ${messageId} as ${read ? 'read' : 'unread'} in ${serviceType}:`, error);
      throw error;
    }
  }

  async addLabelToMessage(serviceType: EmailServiceType, messageId: string, label: string): Promise<void> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      await service.addLabel(messageId, label);
      this.logger.log(`Successfully added label ${label} to message ${messageId} in ${serviceType}`);
    } catch (error) {
      this.logger.error(`Failed to add label ${label} to message ${messageId} in ${serviceType}:`, error);
      throw error;
    }
  }

  async removeLabelFromMessage(serviceType: EmailServiceType, messageId: string, label: string): Promise<void> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      await service.removeLabel(messageId, label);
      this.logger.log(`Successfully removed label ${label} from message ${messageId} in ${serviceType}`);
    } catch (error) {
      this.logger.error(`Failed to remove label ${label} from message ${messageId} in ${serviceType}:`, error);
      throw error;
    }
  }

  // Folder and Label Management
  async getFoldersFromAllServices(): Promise<Record<EmailServiceType, EmailFolder[]>> {
    const results: Record<EmailServiceType, EmailFolder[]> = {} as Record<EmailServiceType, EmailFolder[]>;
    
    for (const [serviceType, service] of this.emailServices) {
      try {
        const folders = await service.getFolders();
        results[serviceType] = folders;
        this.logger.log(`Retrieved ${folders.length} folders from ${serviceType}`);
      } catch (error) {
        this.logger.error(`Failed to get folders from ${serviceType}:`, error);
        results[serviceType] = [];
      }
    }

    return results;
  }

  async getLabelsFromAllServices(): Promise<Record<EmailServiceType, EmailLabel[]>> {
    const results: Record<EmailServiceType, EmailLabel[]> = {} as Record<EmailServiceType, EmailLabel[]>;
    
    for (const [serviceType, service] of this.emailServices) {
      try {
        const labels = await service.getLabels();
        results[serviceType] = labels;
        this.logger.log(`Retrieved ${labels.length} labels from ${serviceType}`);
      } catch (error) {
        this.logger.error(`Failed to get labels from ${serviceType}:`, error);
        results[serviceType] = [];
      }
    }

    return results;
  }

  // Health Monitoring
  async getServiceHealthStatus(): Promise<Record<EmailServiceType, boolean>> {
    const healthStatus: Record<EmailServiceType, boolean> = {} as Record<EmailServiceType, boolean>;
    
    for (const [serviceType, service] of this.emailServices) {
      try {
        const isHealthy = await service.isHealthy();
        healthStatus[serviceType] = isHealthy;
        this.logger.log(`Health check for ${serviceType}: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      } catch (error) {
        this.logger.error(`Health check failed for ${serviceType}:`, error);
        healthStatus[serviceType] = false;
      }
    }

    return healthStatus;
  }

  async getServiceHealthStatusForService(serviceType: EmailServiceType): Promise<boolean> {
    const service = this.getEmailService(serviceType);
    if (!service) {
      throw new Error(`Email service ${serviceType} is not available`);
    }

    try {
      const isHealthy = await service.isHealthy();
      this.logger.log(`Health check for ${serviceType}: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      return isHealthy;
    } catch (error) {
      this.logger.error(`Health check failed for ${serviceType}:`, error);
      return false;
    }
  }

  // Bulk Operations
  async sendBulkMessage(message: EmailSendRequest, serviceTypes: EmailServiceType[]): Promise<Record<EmailServiceType, string>> {
    const results: Record<EmailServiceType, string> = {} as Record<EmailServiceType, string>;
    
    for (const serviceType of serviceTypes) {
      try {
        const messageId = await this.sendMessageFromService(serviceType, message);
        results[serviceType] = messageId;
      } catch (error) {
        this.logger.error(`Failed to send bulk message via ${serviceType}:`, error);
        results[serviceType] = 'failed';
      }
    }

    return results;
  }

  async deleteBulkMessages(messageIds: string[], serviceType: EmailServiceType): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const messageId of messageIds) {
      try {
        await this.deleteMessageFromService(serviceType, messageId);
        results[messageId] = true;
      } catch (error) {
        this.logger.error(`Failed to delete message ${messageId} from ${serviceType}:`, error);
        results[messageId] = false;
      }
    }

    return results;
  }

  // Search and Filter Operations
  async searchMessagesAcrossAllServices(query: string, options?: EmailFetchOptions): Promise<Record<EmailServiceType, EmailMessage[]>> {
    const searchOptions: EmailFetchOptions = {
      ...options,
      query
    };

    return this.getMessagesFromAllServices(searchOptions);
  }

  async getMessagesByDateRange(startDate: Date, endDate: Date, serviceTypes?: EmailServiceType[]): Promise<Record<EmailServiceType, EmailMessage[]>> {
    const dateOptions: EmailFetchOptions = {
      startDate,
      endDate
    };

    if (serviceTypes) {
      const results: Record<EmailServiceType, EmailMessage[]> = {} as Record<EmailServiceType, EmailMessage[]>;
      
      for (const serviceType of serviceTypes) {
        try {
          const messages = await this.getMessagesFromService(serviceType, dateOptions);
          results[serviceType] = messages;
        } catch (error) {
          this.logger.error(`Failed to get messages by date range from ${serviceType}:`, error);
          results[serviceType] = [];
        }
      }

      return results;
    }

    return this.getMessagesFromAllServices(dateOptions);
  }

  // Statistics and Analytics
  async getEmailServiceStatistics(): Promise<Record<EmailServiceType, any>> {
    const statistics: Record<EmailServiceType, any> = {} as Record<EmailServiceType, any>;
    
    for (const [serviceType, service] of this.emailServices) {
      try {
        const [folders, labels, healthStatus] = await Promise.all([
          service.getFolders(),
          service.getLabels(),
          service.isHealthy()
        ]);

        statistics[serviceType] = {
          folders: folders.length,
          labels: labels.length,
          isHealthy: healthStatus,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        this.logger.error(`Failed to get statistics for ${serviceType}:`, error);
        statistics[serviceType] = {
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    }

    return statistics;
  }

  // =============================================================================
  // TAG-BASED EMAIL OPERATIONS
  // =============================================================================

  async getContactsByTagForEmail(tagId: string): Promise<any[]> {
    try {
      this.logger.log(`Getting contacts with email addresses for tag: ${tagId}`);
      
      // Use the tags service to get contacts with email addresses
      const contacts = await this.tagsService.getContactsWithEmailByTag(tagId);
      
      this.logger.log(`Found ${(contacts as any[]).length} contacts with email addresses for tag: ${tagId}`);
      return contacts as any[];
    } catch (error) {
      this.logger.error(`Failed to get contacts by tag for email: ${tagId}`, error);
      throw error;
    }
  }

  async sendBulkEmailToTag(
    userId: string,
    tagId: string, 
    message: EmailSendRequest, 
    serviceType: EmailServiceType
  ): Promise<{
    successCount: number;
    failureCount: number;
    failures: Array<{ contactId: string; error: string }>;
  }> {
    try {
      this.logger.log(`Starting bulk email to tag: ${tagId} via ${serviceType}`);
      this.logger.log(`Message data received:`, JSON.stringify(message, null, 2));
      
      // Validate message data
      if (!message || !message.subject || !message.body) {
        this.logger.error('Invalid message data received:', message);
        throw new Error('Invalid message data: subject and body are required');
      }
      
      // Initialize the email service with OAuth credentials if it's Gmail
      if (serviceType === 'GMAIL') {
        try {
          // Get the Gmail service and initialize it with credentials
          const gmailService = this.getEmailService('GMAIL') as any;
          if (gmailService && typeof gmailService.initializeOAuthClient === 'function') {
            // Get the most recent active Gmail configuration
            const config = await this.emailDatabaseService.getEmailServiceConfig(userId, 'GMAIL');
            if (config) {
              gmailService.initializeOAuthClient(config.clientId, config.clientSecret, config.redirectUri);
              
              // Also get and set the OAuth tokens
              const authToken = await this.emailDatabaseService.getValidEmailAuthToken(userId, 'GMAIL');
              if (authToken && authToken.accessToken) {
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
                throw new Error('No valid OAuth tokens found for Gmail');
              }
            } else {
              throw new Error('No Gmail configuration found');
            }
          }
        } catch (error) {
          this.logger.error('Failed to initialize Gmail service:', error);
          throw new Error(`Gmail service initialization failed: ${error.message}`);
        }
      }
      
      // Get contacts for the tag
      const contacts = await this.getContactsByTagForEmail(tagId);
      
      if (contacts.length === 0) {
        this.logger.warn(`No contacts found for tag: ${tagId}`);
        return {
          successCount: 0,
          failureCount: 0,
          failures: []
        };
      }

      this.logger.log(`Found ${contacts.length} contacts for tag: ${tagId}`);

      const results = {
        successCount: 0,
        failureCount: 0,
        failures: [] as Array<{ contactId: string; error: string }>
      };

      // Send email to each contact
      for (const contact of contacts) {
        try {
          if (!contact.email) {
            results.failures.push({
              contactId: contact.id,
              error: 'No email address available'
            });
            results.failureCount++;
            continue;
          }

          // Create personalized message for each contact
          const personalizedMessage: EmailSendRequest = {
            ...message,
            to: [contact.email],
            subject: message.subject.replace('{name}', contact.name || 'there'),
            body: message.body.replace('{name}', contact.name || 'there')
          };

          this.logger.log(`Sending email to ${contact.email} with subject: ${personalizedMessage.subject}`);

          await this.sendMessageFromService(serviceType, personalizedMessage);
          results.successCount++;
          
          this.logger.log(`Email sent successfully to ${contact.email} for tag ${tagId}`);
        } catch (error) {
          this.logger.error(`Failed to send email to contact ${contact.id} for tag ${tagId}:`, error);
          results.failures.push({
            contactId: contact.id,
            error: error.message
          });
          results.failureCount++;
        }
      }

      this.logger.log(`Bulk email to tag ${tagId} completed. Success: ${results.successCount}, Failures: ${results.failureCount}`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to send bulk email to tag: ${tagId}`, error);
      throw error;
    }
  }

  async getTagsForEmail(): Promise<any[]> {
    try {
      this.logger.log('Getting tags for email operations');
      
      // Use the tags service to get all tags with contact counts
      const tags = await this.tagsService.getAllTags();
      
      // Filter tags that have contacts with email addresses
      const tagsWithEmailContacts = await Promise.all(
        tags.map(async (tag) => {
          try {
            const contactsWithEmail = await this.tagsService.getContactsWithEmailByTag(tag.id);
            return {
              ...tag,
              emailContactCount: (contactsWithEmail as any[]).length
            };
          } catch (error) {
            this.logger.error(`Failed to get email contact count for tag: ${tag.id}`, error);
            return {
              ...tag,
              emailContactCount: 0
            };
          }
        })
      );
      
      // Only return tags that have contacts with email addresses
      return tagsWithEmailContacts.filter(tag => tag.emailContactCount > 0);
    } catch (error) {
      this.logger.error('Failed to get tags for email operations', error);
      throw error;
    }
  }
}
