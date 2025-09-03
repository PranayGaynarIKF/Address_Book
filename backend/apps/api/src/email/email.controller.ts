import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  Logger
} from '@nestjs/common';
import { EmailManagerService } from './email-manager.service';
import { EmailDatabaseService } from './email-database.service';
import { 
  EmailServiceType, 
  EmailFetchOptions, 
  EmailSendRequest 
} from './interfaces/email-service.interface';
import { ApiOperation, ApiParam, ApiBody, ApiResponse, ApiTags, ApiSecurity, ApiProperty } from '@nestjs/swagger';
import { FlexibleAuthGuard } from '../common/guards/flexible-auth.guard';

// DTO for bulk email request
export class BulkEmailRequestDto {
  @ApiProperty({ 
    description: 'Email addresses to send to (optional when using tag-based sending)', 
    type: [String], 
    required: false,
    example: ['user1@example.com', 'user2@example.com']
  })
  to?: string[];

  @ApiProperty({ 
    description: 'Email subject', 
    example: 'Important Announcement' 
  })
  subject: string;

  @ApiProperty({ 
    description: 'Email body content', 
    example: 'This is an important message for all recipients.' 
  })
  body: string;

  @ApiProperty({ 
    description: 'Email service type', 
    enum: ['GMAIL', 'OUTLOOK', 'YAHOO', 'ZOHO'],
    default: 'GMAIL',
    required: false
  })
  serviceType?: EmailServiceType;
}

@ApiTags('Email')
@ApiSecurity('api-key')
@Controller('email')
@UseGuards(FlexibleAuthGuard)
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailManagerService: EmailManagerService,
    private readonly emailDatabaseService: EmailDatabaseService,
  ) {}

  // Helper method to get user ID from request
  private getUserIdFromRequest(req: any): string {
    // If user is authenticated via JWT, use the user ID from the token
    if (req.user && req.user.sub) {
      return req.user.sub;
    }
    
    // If using API key authentication, use a default user ID
    // In a real application, you might want to map API keys to specific users
    return 'api-user';
  }

  // Service Management
  @Get('services')
  getAvailableServices() {
    return {
      services: this.emailManagerService.getAvailableServices(),
      message: 'Available email services retrieved successfully'
    };
  }

  @Get('services/:serviceType/health')
  async getServiceHealth(@Param('serviceType') serviceType: EmailServiceType) {
    const isHealthy = await this.emailManagerService.getServiceHealthStatusForService(serviceType);
    return {
      serviceType,
      isHealthy,
      message: `Health check for ${serviceType} completed`
    };
  }

  @Get('services/health')
  async getAllServicesHealth(@Query('userId') userId?: string) {
    const healthStatus = await this.emailManagerService.getServiceHealthStatus();
    
    let connectedServices = [];
    if (userId) {
      try {
        const services = await this.emailDatabaseService.getUserEmailServices(userId);
        connectedServices = services.map(config => ({
          serviceType: config.serviceType,
          isHealthy: config.isActive,
          email: 'Connected', // Default value since we don't have email in config
          lastSync: config.updatedAt,
          configId: config.id,
          isActive: config.isActive
        }));
      } catch (error) {
        this.logger.error('Failed to get connected services:', error);
      }
    }
    
    return {
      healthStatus,
      connectedServices,
      count: connectedServices.length,
      message: 'Health check for all services completed'
    };
  }

  @Get('services/connected')
  async getConnectedServices(@Query('userId') userId: string) {
    try {
      const connectedServices = await this.emailDatabaseService.getUserEmailServices(userId);
      
      // Transform the data to match frontend expectations
      const services = connectedServices.map(config => ({
        serviceType: config.serviceType,
        isHealthy: config.isActive,
        email: 'Connected', // Default value since we don't have email in config
        lastSync: config.updatedAt,
        configId: config.id,
        isActive: config.isActive
      }));

      return {
        services,
        count: services.length,
        message: `Retrieved ${services.length} connected email services`
      };
    } catch (error) {
      this.logger.error('Failed to get connected services:', error);
      throw error;
    }
  }

  // Authentication
  @Get('auth/:serviceType/url')
  async getAuthUrl(
    @Param('serviceType') serviceType: EmailServiceType,
    @Query('userId') userId: string
  ) {
    try {
      // Get the saved email service configuration from database
      const config = await this.emailDatabaseService.getEmailServiceConfig(userId, serviceType);
      if (!config) {
        throw new Error(`No email service configuration found for ${serviceType}. Please save your credentials first.`);
      }

      const service = this.emailManagerService.getEmailService(serviceType);
      if (!service) {
        throw new Error(`Email service ${serviceType} is not available`);
      }

      // Generate OAuth URL using the saved credentials
      const authUrl = service.getAuthUrl(
        config.clientId,
        config.clientSecret,
        config.redirectUri || 'http://localhost:4002/auth/google/callback'
      );

      return {
        authUrl,
        serviceType,
        message: `Authentication URL generated for ${serviceType}`,
        config: {
          clientId: config.clientId,
          redirectUri: config.redirectUri || 'http://localhost:4002/auth/google/callback'
        }
      };
    } catch (error) {
      this.logger.error(`Failed to generate auth URL for ${serviceType}:`, error);
      throw error;
    }
  }

  @Post('auth/:serviceType/callback')
  async authenticateService(
    @Param('serviceType') serviceType: EmailServiceType,
    @Body() body: { code: string; userId: string }
  ) {
    const result = await this.emailManagerService.authenticateService(serviceType, body.code);
    
    // Save token to database
    await this.emailDatabaseService.saveEmailAuthToken({
      userId: body.userId,
      serviceType,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: JSON.stringify(result.scope),
      email: result.email,
      isValid: true
    });

    return {
      message: `Successfully authenticated ${serviceType} service`,
      serviceType,
      email: result.email,
      expiresAt: result.expiresAt
    };
  }

  @Post('auth/:serviceType/refresh')
  async refreshServiceToken(
    @Param('serviceType') serviceType: EmailServiceType,
    @Body() body: { userId: string }
  ) {
    // Get existing token from database
    const existingToken = await this.emailDatabaseService.getValidEmailAuthToken(body.userId, serviceType);
    if (!existingToken) {
      throw new Error('No valid token found for this service');
    }

    const result = await this.emailManagerService.refreshServiceToken(serviceType, existingToken.refreshToken);
    
    // Update token in database
    await this.emailDatabaseService.refreshEmailAuthToken(existingToken.id, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: JSON.stringify(result.scope)
    });

    return {
      message: `Successfully refreshed token for ${serviceType} service`,
      serviceType,
      expiresAt: result.expiresAt
    };
  }

  @Delete('auth/:serviceType/revoke')
  async revokeServiceToken(
    @Param('serviceType') serviceType: EmailServiceType,
    @Body() body: { userId: string }
  ) {
    const existingToken = await this.emailDatabaseService.getValidEmailAuthToken(body.userId, serviceType);
    if (!existingToken) {
      throw new Error('No valid token found for this service');
    }

    await this.emailManagerService.revokeServiceToken(serviceType, existingToken.accessToken);
    await this.emailDatabaseService.invalidateEmailAuthToken(existingToken.id);

    return {
      message: `Successfully revoked token for ${serviceType} service`,
      serviceType
    };
  }

  // Manual token insertion for testing (temporary)
  @Post('auth/:serviceType/manual-token')
  async insertManualToken(
    @Param('serviceType') serviceType: EmailServiceType,
    @Body() body: { 
      userId: string;
      accessToken: string;
      refreshToken: string;
      email?: string;
    }
  ) {
    try {
      // Set expiry to 1 hour from now
      const expiresAt = new Date(Date.now() + 3600000);
      
      const token = await this.emailDatabaseService.saveEmailAuthToken({
        userId: body.userId,
        serviceType,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        expiresAt,
        scope: JSON.stringify([
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels'
        ]),
        email: body.email || 'manual@example.com',
        isValid: true
      });

      return {
        message: `Successfully inserted manual token for ${serviceType}`,
        token: {
          id: token.id,
          serviceType: token.serviceType,
          email: token.email,
          expiresAt: token.expiresAt
        }
      };
    } catch (error) {
      this.logger.error(`Failed to insert manual token for ${serviceType}:`, error);
      throw error;
    }
  }

  // Email Operations
  @Get('messages')
  async getMessages(
    @Query('serviceType') serviceType: EmailServiceType,
    @Query('maxResults') maxResults?: number,
    @Query('query') query?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const options: EmailFetchOptions = {
      maxResults: maxResults ? parseInt(String(maxResults)) : undefined,
      query,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    if (serviceType) {
      const messages = await this.emailManagerService.getMessagesFromService(serviceType, options);
      return {
        messages,
        serviceType,
        count: messages.length,
        message: `Retrieved ${messages.length} messages from ${serviceType}`
      };
    } else {
      const allMessages = await this.emailManagerService.getMessagesFromAllServices(options);
      return {
        messages: allMessages,
        count: Object.values(allMessages).reduce((sum, msgs) => sum + msgs.length, 0),
        message: 'Retrieved messages from all services'
      };
    }
  }

  @Get('messages/:messageId')
  async getMessage(
    @Param('messageId') messageId: string,
    @Query('serviceType') serviceType: EmailServiceType
  ) {
    const message = await this.emailManagerService.getMessageFromService(serviceType, messageId);
    return {
      message,
      serviceType,
      messageId,
      messageText: `Retrieved message ${messageId} from ${serviceType}`
    };
  }

  @Post('messages/send')
  @ApiOperation({ 
    summary: 'Send a single email message',
    description: 'Sends an email message to specified recipients using the configured email service'
  })
  @ApiBody({ 
    description: 'Email message details',
    schema: {
      type: 'object',
      properties: {
        to: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Recipient email addresses',
          example: ['user@example.com']
        },
        cc: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'CC recipient email addresses'
        },
        bcc: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'BCC recipient email addresses'
        },
        subject: { 
          type: 'string',
          description: 'Email subject',
          example: 'Important Message'
        },
        body: { 
          type: 'string',
          description: 'Email body content',
          example: 'This is the email content.'
        },
        htmlBody: { 
          type: 'string',
          description: 'HTML email body content'
        },
        serviceType: { 
          type: 'string',
          enum: ['GMAIL', 'OUTLOOK', 'YAHOO', 'ZOHO'],
          description: 'Email service to use',
          example: 'GMAIL'
        }
      },
      required: ['to', 'subject', 'body', 'serviceType']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Email sent successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string', description: 'Unique identifier for the sent message' },
        serviceType: { type: 'string', description: 'Email service used' },
        message: { type: 'string', description: 'Success message' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid email data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid API key or authentication' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error - Email service configuration issues' 
  })
  async sendMessage(
    @Body() sendRequest: EmailSendRequest & { serviceType: EmailServiceType }
  ) {
    const { serviceType, ...messageData } = sendRequest;
    const messageId = await this.emailManagerService.sendMessageFromService(serviceType, messageData);
    
    return {
      messageId,
      serviceType,
      message: `Message sent successfully via ${serviceType}`
    };
  }

  @Post('messages/bulk-send')
  async sendBulkMessage(
    @Body() body: { 
      message: EmailSendRequest; 
      serviceTypes: EmailServiceType[] 
    }
  ) {
    const results = await this.emailManagerService.sendBulkMessage(body.message, body.serviceTypes);
    
    return {
      results,
      message: `Bulk message sent to ${body.serviceTypes.length} services`
    };
  }

  @Delete('messages/:messageId')
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Query('serviceType') serviceType: EmailServiceType
  ) {
    await this.emailManagerService.deleteMessageFromService(serviceType, messageId);
    
    return {
      messageId,
      serviceType,
      message: `Message ${messageId} deleted successfully from ${serviceType}`
    };
  }

  @Put('messages/:messageId/read')
  async markMessageAsRead(
    @Param('messageId') messageId: string,
    @Query('serviceType') serviceType: EmailServiceType,
    @Body() body: { read: boolean }
  ) {
    await this.emailManagerService.markMessageAsRead(serviceType, messageId, body.read);
    
    return {
      messageId,
      serviceType,
      read: body.read,
      message: `Message ${messageId} marked as ${body.read ? 'read' : 'unread'} in ${serviceType}`
    };
  }

  // Folders and Labels
  @Get('folders')
  async getFolders(@Query('serviceType') serviceType?: EmailServiceType) {
    if (serviceType) {
      const service = this.emailManagerService.getEmailService(serviceType);
      if (!service) {
        throw new Error(`Email service ${serviceType} is not available`);
      }
      const folders = await service.getFolders();
      return {
        folders,
        serviceType,
        count: folders.length,
        message: `Retrieved ${folders.length} folders from ${serviceType}`
      };
    } else {
      const allFolders = await this.emailManagerService.getFoldersFromAllServices();
      return {
        folders: allFolders,
        message: 'Retrieved folders from all services'
      };
    }
  }

  @Get('labels')
  async getLabels(@Query('serviceType') serviceType?: EmailServiceType) {
    if (serviceType) {
      const service = this.emailManagerService.getEmailService(serviceType);
      if (!service) {
        throw new Error(`Email service ${serviceType} is not available`);
      }
      const labels = await service.getLabels();
      return {
        labels,
        serviceType,
        count: labels.length,
        message: `Retrieved ${labels.length} labels from ${serviceType}`
      };
    } else {
      const allLabels = await this.emailManagerService.getLabelsFromAllServices();
      return {
        labels: allLabels,
        message: 'Retrieved labels from all services'
      };
    }
  }

  // Search Operations
  @Get('search')
  async searchMessages(
    @Query('query') query: string,
    @Query('serviceType') serviceType?: EmailServiceType,
    @Query('maxResults') maxResults?: number
  ) {
    const options: EmailFetchOptions = {
      maxResults: maxResults ? parseInt(String(maxResults)) : undefined
    };

    if (serviceType) {
      const messages = await this.emailManagerService.getMessagesFromService(serviceType, { ...options, query });
      return {
        messages,
        serviceType,
        query,
        count: messages.length,
        message: `Found ${messages.length} messages matching "${query}" in ${serviceType}`
      };
    } else {
      const allMessages = await this.emailManagerService.searchMessagesAcrossAllServices(query, options);
      const totalCount = Object.values(allMessages).reduce((sum, msgs) => sum + msgs.length, 0);
      return {
        messages: allMessages,
        query,
        count: totalCount,
        message: `Found messages matching "${query}" across all services`
      };
    }
  }

  // Statistics
  @Get('stats')
  async getEmailStats() {
    const [serviceStats, databaseStats] = await Promise.all([
      this.emailManagerService.getEmailServiceStatistics(),
      this.emailDatabaseService.getEmailServiceStats()
    ]);

    return {
      serviceStats,
      databaseStats,
      message: 'Email service statistics retrieved successfully'
    };
  }

  // Database Operations
  @Get('configs')
  async getUserEmailConfigs(@Query('userId') userId: string) {
    const configs = await this.emailDatabaseService.getUserEmailServices(userId);
    return {
      configs,
      userId,
      count: configs.length,
      message: `Retrieved ${configs.length} email service configurations for user ${userId}`
    };
  }

  @Post('configs')
  async createEmailConfig(@Body() config: any) {
    try {
      this.logger.log('Received config:', JSON.stringify(config, null, 2));
      const newConfig = await this.emailDatabaseService.createEmailServiceConfig(config);
      return {
        config: newConfig,
        message: 'Email service configuration created successfully'
      };
    } catch (error) {
      this.logger.error('Error in createEmailConfig:', error);
      throw error;
    }
  }

  @Get('test-db')
  async testDatabaseConnection() {
    try {
      const result = await this.emailDatabaseService.testDatabaseConnection();
      return {
        message: 'Database connection test successful',
        result
      };
    } catch (error) {
      this.logger.error('Database connection test failed:', error);
      throw error;
    }
  }

  @Get('test-tokens')
  @ApiOperation({ 
    summary: 'Check OAuth token status',
    description: 'Checks if valid OAuth tokens are available for email services'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        hasToken: { type: 'boolean' },
        token: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            serviceType: { type: 'string' },
            email: { type: 'string' },
            isValid: { type: 'boolean' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async testTokens(@Request() req) {
    try {
      // Check if we have valid OAuth tokens
      const userId = this.getUserIdFromRequest(req);
      const token = await this.emailDatabaseService.getValidEmailAuthToken(userId, 'GMAIL');
      
      if (token) {
        return {
          message: 'Valid OAuth token found',
          hasToken: true,
          token: {
            id: token.id,
            serviceType: token.serviceType,
            email: token.email,
            isValid: token.isValid,
            expiresAt: token.expiresAt
          }
        };
      } else {
        return {
          message: 'No valid OAuth token found',
          hasToken: false
        };
      }
    } catch (error) {
      this.logger.error('Failed to check tokens:', error);
      throw error;
    }
  }

  @Post('test-insert-token')
  async testInsertToken(@Request() req) {
    try {
      // Manually insert a test token
      const userId = this.getUserIdFromRequest(req);
      const token = await this.emailDatabaseService.saveEmailAuthToken({
        userId: userId,
        serviceType: 'GMAIL',
        accessToken: 'YOUR_ACCESS_TOKEN_HERE',
        refreshToken: 'YOUR_REFRESH_TOKEN_HERE',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        scope: JSON.stringify([
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels'
        ]),
        email: 'pranay.gaynar@ikf.co.in',
        isValid: true
      });

      return {
        message: 'Test token inserted successfully',
        token: {
          id: token.id,
          serviceType: token.serviceType,
          email: token.email,
          expiresAt: token.expiresAt
        }
      };
    } catch (error) {
      this.logger.error('Failed to insert test token:', error);
      throw error;
    }
  }

  @Put('configs/:id')
  async updateEmailConfig(
    @Param('id') id: string,
    @Body() updates: any
  ) {
    const updatedConfig = await this.emailDatabaseService.updateEmailServiceConfig(id, updates);
    return {
      config: updatedConfig,
      message: 'Email service configuration updated successfully'
    };
  }

  @Delete('configs/:id')
  async deactivateEmailConfig(@Param('id') id: string) {
    await this.emailDatabaseService.deactivateEmailServiceConfig(id);
    return {
      message: 'Email service configuration deactivated successfully'
    };
  }

  // Maintenance
  @Post('maintenance/cleanup-tokens')
  async cleanupExpiredTokens() {
    const count = await this.emailDatabaseService.cleanupExpiredTokens();
    return {
      cleanedTokens: count,
      message: `Cleaned up ${count} expired tokens`
    };
  }

  // =============================================================================
  // TAG-BASED EMAIL OPERATIONS
  // =============================================================================

  @Get('tags/:tagId/contacts')
  @ApiOperation({ summary: 'Get contacts with a specific tag for email operations' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  @ApiResponse({ status: 200, description: 'Contacts retrieved successfully' })
  async getContactsByTagForEmail(@Param('tagId') tagId: string) {
    // This will be implemented to get contacts with email addresses for a specific tag
    const contacts = await this.emailManagerService.getContactsByTagForEmail(tagId);
    return {
      contacts,
      tagId,
      count: contacts.length,
      message: `Retrieved ${contacts.length} contacts with email addresses for tag ${tagId}`
    };
  }

  @Post('tags/:tagId/send-bulk')
  @ApiOperation({ 
    summary: 'Send bulk email to all contacts with a specific tag',
    description: 'Sends the same email to all contacts that have the specified tag. The email will be personalized with each contact\'s name if placeholders are used.'
  })
  @ApiParam({ 
    name: 'tagId', 
    description: 'The ID of the tag containing contacts to send emails to',
    example: 'tag_123456789'
  })
  @ApiBody({ 
    type: BulkEmailRequestDto,
    description: 'Email content and configuration',
    examples: {
      basic: {
        summary: 'Basic bulk email',
        value: {
          subject: 'Important Announcement',
          body: 'Hello {name}, this is an important message for all our valued contacts.',
          serviceType: 'GMAIL'
        }
      },
      withRecipients: {
        summary: 'Bulk email with specific recipients',
        value: {
          to: ['user1@example.com', 'user2@example.com'],
          subject: 'Special Offer',
          body: 'Hello {name}, we have a special offer just for you!',
          serviceType: 'GMAIL'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk email sent successfully',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'object',
          properties: {
            successCount: { type: 'number', description: 'Number of emails sent successfully' },
            failureCount: { type: 'number', description: 'Number of emails that failed to send' },
            failures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  contactId: { type: 'string' },
                  error: { type: 'string' }
                }
              }
            }
          }
        },
        tagId: { type: 'string', description: 'The tag ID that was used' },
        message: { type: 'string', description: 'Success message' },
        successCount: { type: 'number', description: 'Number of successful sends' },
        failureCount: { type: 'number', description: 'Number of failed sends' },
        failures: {
          type: 'array',
          description: 'List of failed sends with error details'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid data or missing required fields' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid API key or authentication' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error - Email service configuration or OAuth issues' 
  })
  async sendBulkEmailToTag(
    @Request() req,
    @Param('tagId') tagId: string,
    @Body() body: BulkEmailRequestDto
  ) {
    // Create EmailSendRequest from the body
    const message: EmailSendRequest = {
      to: body.to || [],
      subject: body.subject,
      body: body.body
    };
    
    // Default to GMAIL if not specified
    const serviceType = body.serviceType || 'GMAIL';
    
    const userId = this.getUserIdFromRequest(req);
    const results = await this.emailManagerService.sendBulkEmailToTag(
      userId,
      tagId, 
      message, 
      serviceType
    );
    
    return {
      results,
      tagId,
      message: `Bulk email sent to ${results.successCount} contacts in tag ${tagId}`,
      successCount: results.successCount,
      failureCount: results.failureCount,
      failures: results.failures
    };
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags with contact counts for email operations' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  async getTagsForEmail() {
    const tags = await this.emailManagerService.getTagsForEmail();
    return {
      tags,
      message: 'Tags retrieved successfully for email operations'
    };
  }
}
