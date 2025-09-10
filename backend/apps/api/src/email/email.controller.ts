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
import { TokenRefreshService } from './token-refresh.service';
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
    private readonly tokenRefreshService: TokenRefreshService,
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

  // Manual token refresh endpoint
  @Post('auth/:serviceType/refresh-manual')
  async refreshTokenManually(
    @Param('serviceType') serviceType: EmailServiceType,
    @Body() body: { userId: string }
  ) {
    try {
      const result = await this.tokenRefreshService.refreshTokenManually(body.userId, serviceType);
      return {
        success: true,
        message: result.message,
        serviceType,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Manual token refresh failed for ${serviceType}:`, error.message);
      return {
        success: false,
        message: `Failed to refresh token: ${error.message}`,
        serviceType,
        timestamp: new Date()
      };
    }
  }

  // Token status monitoring endpoint
  @Get('auth/token-status')
  async getTokenStatus() {
    try {
      const status = await this.tokenRefreshService.getTokenStatus();
      return {
        success: true,
        data: status,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get token status:', error.message);
      return {
        success: false,
        message: `Failed to get token status: ${error.message}`,
        timestamp: new Date()
      };
    }
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

  @Get('list-all-tokens')
  @ApiOperation({ 
    summary: 'List all OAuth tokens',
    description: 'Lists all OAuth tokens available in the database'
  })
  async listAllTokens() {
    try {
      // Get all Gmail tokens from the database using the public method
      const tokens = await this.emailDatabaseService.getAllGmailTokens();

      return {
        message: `Found ${tokens.length} Gmail tokens`,
        count: tokens.length,
        tokens: tokens.map(token => ({
          id: token.id,
          userId: token.userId,
          serviceType: token.serviceType,
          email: token.email,
          isValid: token.isValid,
          expiresAt: token.expiresAt,
          createdAt: token.createdAt
        }))
      };
    } catch (error) {
      this.logger.error('Failed to list tokens:', error);
      throw error;
    }
  }

  @Get('test-gmail-token')
  @ApiOperation({ 
    summary: 'Test Gmail token retrieval',
    description: 'Tests if we can find any valid Gmail token'
  })
  async testGmailToken() {
    try {
      // Try to get any valid Gmail token
      const token = await this.emailDatabaseService.getAnyValidGmailToken();
      
      if (token) {
        return {
          message: 'Valid Gmail token found',
          hasToken: true,
          token: {
            id: token.id,
            userId: token.userId,
            serviceType: token.serviceType,
            email: token.email,
            isValid: token.isValid,
            expiresAt: token.expiresAt,
            hasAccessToken: !!token.accessToken,
            hasRefreshToken: !!token.refreshToken
          }
        };
      } else {
        return {
          message: 'No valid Gmail token found',
          hasToken: false
        };
      }
    } catch (error) {
      this.logger.error('Failed to test Gmail token:', error);
      return {
        message: 'Error testing Gmail token',
        error: error.message,
        hasToken: false
      };
    }
  }

  @Get('debug-database')
  @ApiOperation({ 
    summary: 'Debug database tokens',
    description: 'Directly queries the database to see what tokens exist'
  })
  async debugDatabase() {
    try {
      // Get all tokens from the database
      const allTokens = await this.emailDatabaseService.getAllGmailTokens();
      
      // Get raw results using the public method
      const rawResults = allTokens.slice(0, 5);

      return {
        message: 'Database debug completed',
        allTokensCount: allTokens.length,
        allTokens: allTokens.map(token => ({
          id: token.id,
          userId: token.userId,
          serviceType: token.serviceType,
          email: token.email,
          isValid: token.isValid,
          expiresAt: token.expiresAt,
          hasAccessToken: !!token.accessToken,
          hasRefreshToken: !!token.refreshToken
        })),
        rawResults: rawResults
      };
    } catch (error) {
      this.logger.error('Failed to debug database:', error);
      return {
        message: 'Error debugging database',
        error: error.message
      };
    }
  }

  @Post('test-gmail-send')
  @ApiOperation({ 
    summary: 'Test Gmail sending with existing tokens',
    description: 'Tests Gmail sending using any available tokens from the database'
  })
  async testGmailSend() {
    try {
      // Get all Gmail tokens from the database
      const allTokens = await this.emailDatabaseService.getAllGmailTokens();
      
      if (allTokens.length === 0) {
        return {
          message: 'No Gmail tokens found in database',
          success: false
        };
      }

      // Find the first valid token
      const validToken = allTokens.find(token => 
        token.isValid && 
        token.accessToken && 
        token.refreshToken &&
        new Date(token.expiresAt) > new Date()
      );

      if (!validToken) {
        return {
          message: 'No valid Gmail tokens found',
          success: false,
          availableTokens: allTokens.length
        };
      }

      // Initialize Gmail service with the token
      const gmailService = this.emailManagerService.getEmailService('GMAIL') as any;
      if (gmailService && typeof gmailService.initializeOAuthClient === 'function') {
        // Use environment variables for OAuth config
        const config = {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4002/api/mail-accounts/oauth-callback'
        };

        gmailService.initializeOAuthClient(config.clientId, config.clientSecret, config.redirectUri);
        
        // Set the access token
        if (gmailService.oauth2Client) {
          gmailService.oauth2Client.setCredentials({
            access_token: validToken.accessToken,
            refresh_token: validToken.refreshToken
          });

          // Test sending an email
          const testMessage = {
            to: ['test@example.com'],
            subject: 'Test Email from Address Book',
            body: 'This is a test email sent from your Address Book application.',
            from: 'pranay.gaynar@ikf.co.in'
          };

          const messageId = await gmailService.sendMessage(testMessage);

          return {
            message: 'Gmail test email sent successfully!',
            success: true,
            messageId: messageId,
            tokenUsed: {
              userId: validToken.userId,
              email: validToken.email,
              isValid: validToken.isValid
            }
          };
        } else {
          return {
            message: 'Failed to initialize OAuth client',
            success: false
          };
        }
      } else {
        return {
          message: 'Gmail service not available',
          success: false
        };
      }
    } catch (error) {
      this.logger.error('Failed to test Gmail send:', error);
      return {
        message: 'Error testing Gmail send',
        error: error.message,
        success: false
      };
    }
  }

  @Get('gmail-oauth-url')
  @ApiOperation({ 
    summary: 'Get Gmail OAuth URL with correct scopes',
    description: 'Generates a Gmail OAuth URL with all required scopes for sending emails'
  })
  async getGmailOAuthUrl() {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4002/api/mail-accounts/oauth-callback';
      
      if (!clientId) {
        return {
          message: 'Google Client ID not configured',
          error: 'Please set GOOGLE_CLIENT_ID in environment variables'
        };
      }

      // Required scopes for Gmail sending
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/gmail.compose'
      ];

      const scopeString = scopes.join(' ');
      const state = 'gmail-bulk-send-' + Date.now();
      
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopeString)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${state}`;

      return {
        message: 'Gmail OAuth URL generated successfully',
        oauthUrl: oauthUrl,
        instructions: [
          '1. Click the oauthUrl below to open Gmail OAuth',
          '2. Sign in with your Google account (pranay.gaynar@ikf.co.in)',
          '3. Grant ALL permissions when prompted',
          '4. You will be redirected back to the application',
          '5. The new tokens will have the correct scopes for sending emails'
        ],
        scopes: scopes
      };
    } catch (error) {
      this.logger.error('Failed to generate Gmail OAuth URL:', error);
      return {
        message: 'Error generating OAuth URL',
        error: error.message
      };
    }
  }

  @Post('test-html-email')
  @ApiOperation({
    summary: 'Test HTML email sending',
    description: 'Tests sending an HTML email to verify proper formatting'
  })
  async testHtmlEmail() {
    try {
      const gmailService = this.emailManagerService.getEmailService('GMAIL') as any;
      if (gmailService && typeof gmailService.initializeOAuthClient === 'function') {
        // Get a valid token
        const allTokens = await this.emailDatabaseService.getAllGmailTokens();
        const validToken = allTokens.find(token => 
          token.isValid && 
          token.accessToken && 
          token.refreshToken &&
          new Date(token.expiresAt) > new Date()
        );

        if (!validToken) {
          return {
            message: 'No valid Gmail tokens found',
            success: false
          };
        }

        // Initialize Gmail service
        const config = {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4002/api/mail-accounts/oauth-callback'
        };

        gmailService.initializeOAuthClient(config.clientId, config.clientSecret, config.redirectUri);
        
        if (gmailService.oauth2Client) {
          gmailService.oauth2Client.setCredentials({
            access_token: validToken.accessToken,
            refresh_token: validToken.refreshToken
          });

          // Test HTML email
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
              <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #dc2626; margin-bottom: 20px; font-size: 24px;">Test HTML Email</h2>
                <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">Hello Pran Test,</p>
                <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">This is a test HTML email to verify proper formatting.</p>
                <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">Contact us: <strong>9876543210</strong></p>
                <p style="color: #374151; line-height: 1.6;">Thanks,<br><strong>IKF Team</strong></p>
              </div>
            </div>
          `;

          const testMessage = {
            to: ['pranay.gaynar@ikf.co.in'],
            subject: 'Test HTML Email - Direct Test',
            body: htmlContent
          };

          const messageId = await gmailService.sendMessage(testMessage);

          return {
            message: 'HTML test email sent successfully!',
            success: true,
            messageId: messageId,
            htmlContent: htmlContent.substring(0, 200) + '...'
          };
        } else {
          return {
            message: 'OAuth client not initialized',
            success: false
          };
        }
      } else {
        return {
          message: 'Gmail service not available',
          success: false
        };
      }
    } catch (error) {
      this.logger.error('Failed to send HTML test email:', error);
      return {
        message: 'Error sending HTML test email',
        error: error.message,
        success: false
      };
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

  // Gmail Authentication Status Endpoint
  @Get('auth/GMAIL/status')
  @ApiOperation({
    summary: 'Check Gmail authentication status',
    description: 'Returns the current Gmail authentication status including token validity and expiration'
  })
  @ApiResponse({ status: 200, description: 'Gmail authentication status retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Failed to check Gmail authentication status' })
  async getGmailAuthStatus() {
    try {
      const userId = 'current-user-id'; // In a real app, this would come from JWT token
      
      // Get the most recent valid Gmail token
      const authToken = await this.emailDatabaseService.getValidEmailAuthToken(userId, 'GMAIL');
      
      if (!authToken) {
        return {
          isAuthenticated: false,
          message: 'No Gmail authentication found'
        };
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = authToken.expiresAt ? new Date(authToken.expiresAt) : null;
      const isExpired = expiresAt && expiresAt <= now;
      
      // Check if token needs refresh (expires within 5 minutes)
      const needsRefresh = expiresAt && 
        (expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000;
      
      // Log token status for debugging
      console.log('🔍 Token validation:', {
        tokenId: authToken.id,
        email: authToken.email,
        expiresAt: expiresAt?.toISOString(),
        currentTime: now.toISOString(),
        isExpired,
        needsRefresh,
        timeUntilExpiry: expiresAt ? Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60) : 'N/A'
      });

      return {
        isAuthenticated: !isExpired,
        email: authToken.email,
        expiresAt: authToken.expiresAt?.toISOString(),
        needsRefresh: needsRefresh,
        message: isExpired ? 'Gmail token has expired' : 'Gmail is authenticated'
      };

    } catch (error) {
      this.logger.error('Failed to check Gmail auth status:', error);
      return {
        isAuthenticated: false,
        error: error.message,
        message: 'Failed to check Gmail authentication status'
      };
    }
  }

  // Gmail Token Refresh Endpoint
  @Post('auth/GMAIL/refresh')
  @ApiOperation({
    summary: 'Refresh Gmail tokens',
    description: 'Refreshes expired or soon-to-expire Gmail tokens'
  })
  @ApiResponse({ status: 200, description: 'Gmail tokens refreshed successfully' })
  @ApiResponse({ status: 400, description: 'Failed to refresh Gmail tokens' })
  async refreshGmailTokens() {
    try {
      const userId = 'current-user-id'; // In a real app, this would come from JWT token
      
      // Get the current Gmail token
      const authToken = await this.emailDatabaseService.getValidEmailAuthToken(userId, 'GMAIL');
      
      if (!authToken) {
        throw new Error('No Gmail authentication found');
      }

      // Get Gmail service configuration
      const config = await this.emailDatabaseService.getEmailServiceConfig(userId, 'GMAIL');
      if (!config) {
        throw new Error('No Gmail configuration found');
      }

      // Initialize Gmail service
      const gmailService = this.emailManagerService.getEmailService('GMAIL') as any;
      if (gmailService && typeof gmailService.initializeOAuthClient === 'function') {
        gmailService.initializeOAuthClient(config.clientId, config.clientSecret, config.redirectUri);
        
        // Try to refresh the token
        const refreshResult = await gmailService.refreshToken(authToken.refreshToken);
        
        if (refreshResult) {
          // Update the token in database
          await this.emailDatabaseService.updateEmailAuthToken(authToken.id, {
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken || authToken.refreshToken,
            expiresAt: refreshResult.expiresAt,
            isValid: true
          });

          return {
            success: true,
            message: 'Gmail tokens refreshed successfully',
            expiresAt: refreshResult.expiresAt
          };
        } else {
          throw new Error('Failed to refresh tokens');
        }
      } else {
        throw new Error('Gmail service not available');
      }

    } catch (error) {
      this.logger.error('Failed to refresh Gmail tokens:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to refresh Gmail tokens'
      };
    }
  }
}
