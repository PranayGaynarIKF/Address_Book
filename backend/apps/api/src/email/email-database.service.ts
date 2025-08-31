import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { 
  EmailServiceType, 
  EmailAuthResult 
} from './interfaces/email-service.interface';

export interface EmailServiceConfig {
  id: string;
  userId: string;
  serviceType: EmailServiceType;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string; // JSON string
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAuthToken {
  id: string;
  userId: string;
  serviceType: EmailServiceType;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string; // JSON string
  email?: string;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class EmailDatabaseService {
  private readonly logger = new Logger(EmailDatabaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Test database connection
  async testDatabaseConnection() {
    try {
      // Test if we can access the EmailServiceConfigs table
      const result = await this.prisma.$queryRaw`
        SELECT TOP 1 [id], [userId], [serviceType], [clientId], [clientSecret], [redirectUri], [scopes], [isActive], [createdAt], [updatedAt]
        FROM [db_address_book].[app].[EmailServiceConfigs]
      `;
      
      this.logger.log('Database test successful, table accessible');
      return {
        status: 'success',
        tableExists: true,
        sampleData: result
      };
    } catch (error) {
      this.logger.error('Database test failed:', error);
      return {
        status: 'error',
        tableExists: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Email Service Configuration Management
  async createEmailServiceConfig(config: {
    userId: string;
    serviceType: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
    isActive: boolean;
    accountName?: string; // Add optional accountName parameter
  }): Promise<any> {
    try {
      this.logger.log(`Creating email service config for user ${config.userId}, service ${config.serviceType}, account: ${config.accountName || 'default'}`);
      this.logger.log(`Config data:`, JSON.stringify(config, null, 2));
      
      // Use Prisma's parameterized query instead of raw SQL with placeholders
      if (config.accountName) {
        // Insert with accountName
        await this.prisma.$executeRaw`
          INSERT INTO [db_address_book].[app].[EmailServiceConfigs] 
          ([userId], [serviceType], [clientId], [clientSecret], [redirectUri], [scopes], [isActive], [accountName], [createdAt], [updatedAt])
          VALUES (${config.userId}, ${config.serviceType}, ${config.clientId}, ${config.clientSecret}, ${config.redirectUri}, ${JSON.stringify(config.scopes)}, ${config.isActive}, ${config.accountName}, GETDATE(), GETDATE())
        `;
      } else {
        // Insert without accountName (fallback for existing schema)
        await this.prisma.$executeRaw`
          INSERT INTO [db_address_book].[app].[EmailServiceConfigs] 
          ([userId], [serviceType], [clientId], [clientSecret], [redirectUri], [scopes], [isActive], [createdAt], [updatedAt])
          VALUES (${config.userId}, ${config.serviceType}, ${config.clientId}, ${config.clientSecret}, ${config.redirectUri}, ${JSON.stringify(config.scopes)}, ${config.isActive}, GETDATE(), GETDATE())
        `;
      }
      
      this.logger.log(`Insert completed successfully`);
      
      // Then, get the inserted configuration
      const result = await this.prisma.$queryRaw`
        SELECT TOP 1 [id], [userId], [serviceType], [clientId], [clientSecret], [redirectUri], [scopes], [isActive], [createdAt], [updatedAt]
        FROM [db_address_book].[app].[EmailServiceConfigs]
        WHERE [userId] = ${config.userId} AND [serviceType] = ${config.serviceType}
        ORDER BY [createdAt] DESC
      `;

      this.logger.log(`Query result:`, JSON.stringify(result, null, 2));

      const newConfig = Array.isArray(result) ? result[0] : result;
      this.logger.log(`Successfully created email service config with ID: ${newConfig.id}`);

      return {
        ...newConfig,
        scopes: JSON.parse(newConfig.scopes),
        createdAt: newConfig.createdAt,
        updatedAt: newConfig.updatedAt
      };
    } catch (error) {
      this.logger.error('Failed to create email service config:', error);
      this.logger.error('Error details:', {
        code: error.code,
        message: error.message,
        meta: error.meta,
        stack: error.stack
      });
      
      // Re-throw the error with more details for debugging
      throw new Error(`Database error: ${error.message} (Code: ${error.code || 'unknown'})`);
    }
  }

  async getEmailServiceConfig(userId: string, serviceType: EmailServiceType): Promise<EmailServiceConfig | null> {
    try {
      this.logger.log(`Getting email service config for userId: ${userId}, serviceType: ${serviceType}`);
      
      // First, let's see what's in the database for this user and service
      const allConfigs = await this.prisma.$queryRaw`
        SELECT [id], [userId], [serviceType], [clientId], [clientSecret], [redirectUri], [scopes], [isActive], [createdAt], [updatedAt]
        FROM [db_address_book].[app].[EmailServiceConfigs]
        WHERE [userId] = ${userId} AND [serviceType] = ${serviceType}
        ORDER BY [createdAt] DESC
      `;
      
      this.logger.log(`All configs found:`, JSON.stringify(allConfigs, null, 2));
      
      if (!allConfigs || (Array.isArray(allConfigs) && allConfigs.length === 0)) {
        this.logger.log(`No email service config found for userId: ${userId}, serviceType: ${serviceType}`);
        return null;
      }
      
      // Get the most recent active config
      const configs = Array.isArray(allConfigs) ? allConfigs : [allConfigs];
      const activeConfig = configs.find(config => 
        config.isActive === true || 
        config.isActive === 1 || 
        config.isActive === 'true' ||
        config.isActive === '1'
      );
      
      if (!activeConfig) {
        this.logger.log(`No active email service config found for userId: ${userId}, serviceType: ${serviceType}`);
        return null;
      }
      
      this.logger.log(`Found active config:`, JSON.stringify(activeConfig, null, 2));

      return {
        ...activeConfig,
        scopes: JSON.parse(activeConfig.scopes),
        createdAt: activeConfig.createdAt,
        updatedAt: activeConfig.updatedAt
      };
    } catch (error) {
      this.logger.error('Failed to get email service config:', error);
      throw new Error(`Failed to get email service config: ${error.message}`);
    }
  }

  async updateEmailServiceConfig(id: string, updates: Partial<EmailServiceConfig>): Promise<EmailServiceConfig> {
    try {
      const updateData: any = { ...updates };
      
      if (updates.scopes) {
        updateData.scopes = JSON.stringify(updates.scopes);
      }

      // Build dynamic UPDATE query
      const setClauses = Object.keys(updateData)
        .filter(key => key !== 'id')
        .map(key => `[${key}] = ${typeof updateData[key] === 'string' ? `'${updateData[key]}'` : updateData[key]}`)
        .join(', ');

      const updateQuery = `
        UPDATE [db_address_book].[app].[EmailServiceConfigs]
        SET ${setClauses}, [updatedAt] = GETDATE()
        WHERE [id] = '${id}'
      `;

      await this.prisma.$executeRawUnsafe(updateQuery);
      
      // Get the updated config
      const result = await this.prisma.$queryRaw`
        SELECT [id], [userId], [serviceType], [clientId], [clientSecret], [redirectUri], [scopes], [isActive], [createdAt], [updatedAt]
        FROM [db_address_book].[app].[EmailServiceConfigs]
        WHERE [id] = ${id}
      `;

      const updatedConfig = Array.isArray(result) ? result[0] : result;

      return {
        ...updatedConfig,
        scopes: JSON.parse(updatedConfig.scopes),
        createdAt: updatedConfig.createdAt,
        updatedAt: updatedConfig.updatedAt
      };
    } catch (error) {
      this.logger.error('Failed to update email service config:', error);
      throw new Error(`Failed to update email service config: ${error.message}`);
    }
  }

  async deactivateEmailServiceConfig(id: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE [db_address_book].[app].[EmailServiceConfigs]
        SET [isActive] = 0, [updatedAt] = GETDATE()
        WHERE [id] = ${id}
      `;
    } catch (error) {
      this.logger.error('Failed to deactivate email service config:', error);
      throw new Error(`Failed to deactivate email service config: ${error.message}`);
    }
  }

  // Email Authentication Token Management
  async saveEmailAuthToken(token: Omit<EmailAuthToken, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailAuthToken> {
    try {
      // Invalidate existing tokens for this user and service
      await this.prisma.$executeRaw`
        UPDATE [db_address_book].[app].[EmailAuthTokens]
        SET [isValid] = 0, [updatedAt] = GETDATE()
        WHERE [userId] = ${token.userId} AND [serviceType] = ${token.serviceType}
      `;

      // Create new token
      const result = await this.prisma.$queryRaw`
        INSERT INTO [db_address_book].[app].[EmailAuthTokens]
        ([userId], [serviceType], [accessToken], [refreshToken], [expiresAt], [scope], [email], [isValid], [createdAt], [updatedAt])
        VALUES (${token.userId}, ${token.serviceType}, ${token.accessToken}, ${token.refreshToken}, ${token.expiresAt}, ${JSON.stringify(token.scope)}, ${token.email}, 1, GETDATE(), GETDATE());
        
        SELECT SCOPE_IDENTITY() as id, ${token.userId} as userId, ${token.serviceType} as serviceType,
               ${token.accessToken} as accessToken, ${token.refreshToken} as refreshToken,
               ${token.expiresAt} as expiresAt, ${JSON.stringify(token.scope)} as scope,
               ${token.email} as email, 1 as isValid, GETDATE() as createdAt, GETDATE() as updatedAt;
      `;

      const newToken = Array.isArray(result) ? result[1] : result;

      return {
        ...newToken,
        scope: JSON.parse(newToken.scope),
        createdAt: newToken.createdAt,
        updatedAt: newToken.updatedAt
      };
    } catch (error) {
      this.logger.error('Failed to save email auth token:', error);
      throw new Error(`Failed to save email auth token: ${error.message}`);
    }
  }

  async getValidEmailAuthToken(userId: string, serviceType: EmailServiceType): Promise<EmailAuthToken | null> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT [id], [userId], [serviceType], [accessToken], [refreshToken], [expiresAt], [scope], [email], [isValid], [createdAt], [updatedAt]
        FROM [db_address_book].[app].[EmailAuthTokens]
        WHERE [userId] = ${userId} AND [serviceType] = ${serviceType} AND [isValid] = 1 AND [expiresAt] > GETDATE()
        ORDER BY [createdAt] DESC
      `;

      if (!result || (Array.isArray(result) && result.length === 0)) return null;

      const token = Array.isArray(result) ? result[0] : result;

      return {
        ...token,
        scope: JSON.parse(token.scope),
        createdAt: token.createdAt,
        updatedAt: token.updatedAt
      };
    } catch (error) {
      this.logger.error('Failed to get valid email auth token:', error);
      throw new Error(`Failed to get valid email auth token: ${error.message}`);
    }
  }

  async invalidateEmailAuthToken(id: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE [db_address_book].[app].[EmailAuthTokens]
        SET [isValid] = 0, [updatedAt] = GETDATE()
        WHERE [id] = ${id}
      `;
    } catch (error) {
      this.logger.error('Failed to invalidate email auth token:', error);
      throw new Error(`Failed to invalidate email auth token: ${error.message}`);
    }
  }

  async refreshEmailAuthToken(id: string, newToken: Partial<EmailAuthToken>): Promise<EmailAuthToken> {
    try {
      const updateData: any = { ...newToken };
      
      if (newToken.scope) {
        updateData.scope = JSON.stringify(newToken.scope);
      }

      // Build dynamic UPDATE query
      const setClauses = Object.keys(updateData)
        .filter(key => key !== 'id')
        .map(key => `[${key}] = ${typeof updateData[key] === 'string' ? `'${updateData[key]}'` : updateData[key]}`)
        .join(', ');

      const updateQuery = `
        UPDATE [db_address_book].[app].[EmailAuthTokens]
        SET ${setClauses}, [updatedAt] = GETDATE()
        WHERE [id] = '${id}'
      `;

      await this.prisma.$executeRawUnsafe(updateQuery);
      
      // Get the updated token
      const result = await this.prisma.$queryRaw`
        SELECT [id], [userId], [serviceType], [accessToken], [refreshToken], [expiresAt], [scope], [email], [isValid], [createdAt], [updatedAt]
        FROM [db_address_book].[app].[EmailAuthTokens]
        WHERE [id] = ${id}
      `;

      const updatedToken = Array.isArray(result) ? result[0] : result;

      return {
        ...updatedToken,
        scope: JSON.parse(updatedToken.scope),
        createdAt: updatedToken.createdAt,
        updatedAt: updatedToken.updatedAt
      };
    } catch (error) {
      this.logger.error('Failed to refresh email auth token:', error);
      throw new Error(`Failed to refresh email auth token: ${error.message}`);
    }
  }

  // Utility Methods
  async getUserEmailServices(userId: string): Promise<EmailServiceConfig[]> {
    try {
      const results = await this.prisma.$queryRaw`
        SELECT [id], [userId], [serviceType], [clientId], [clientSecret], [redirectUri], [scopes], [isActive], [createdAt], [updatedAt]
        FROM [db_address_book].[app].[EmailServiceConfigs]
        WHERE [userId] = ${userId} AND [isActive] = 1
      `;

      return (Array.isArray(results) ? results : [results]).map((result: any) => ({
        ...result,
        scopes: JSON.parse(result.scopes),
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }));
    } catch (error) {
      this.logger.error('Failed to get user email services:', error);
      throw new Error(`Failed to get user email services: ${error.message}`);
    }
  }

  // NEW: Get email service configs for a specific user and service type
  async getEmailServiceConfigs(userId: string, serviceType: EmailServiceType): Promise<EmailServiceConfig[]> {
    try {
      const results = await this.prisma.$queryRaw`
        SELECT [id], [userId], [serviceType], [clientId], [clientSecret], [redirectUri], [scopes], [isActive], [accountName], [createdAt], [updatedAt]
        FROM [db_address_book].[app].[EmailServiceConfigs]
        WHERE [userId] = ${userId} AND [serviceType] = ${serviceType} AND [isActive] = 1
        ORDER BY [createdAt] DESC
      `;

      return (Array.isArray(results) ? results : [results]).map((result: any) => ({
        ...result,
        scopes: JSON.parse(result.scopes),
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }));
    } catch (error) {
      this.logger.error('Failed to get email service configs:', error);
      throw new Error(`Failed to get email service configs: ${error.message}`);
    }
  }

  // NEW: Invalidate all Gmail tokens for a specific user and account
  async invalidateUserGmailTokens(userId: string, accountName: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE [db_address_book].[app].[EmailAuthTokens]
        SET [isValid] = 0, [updatedAt] = GETDATE()
        WHERE [userId] = ${userId} AND [serviceType] = 'GMAIL'
      `;
      
      this.logger.log(`Invalidated all Gmail tokens for user ${userId}, account: ${accountName}`);
    } catch (error) {
      this.logger.error('Failed to invalidate user Gmail tokens:', error);
      throw new Error(`Failed to invalidate user Gmail tokens: ${error.message}`);
    }
  }

  // NEW: Remove email service configuration
  async removeEmailServiceConfig(userId: string, serviceType: EmailServiceType, accountName?: string): Promise<void> {
    try {
      if (accountName) {
        // Remove specific account configuration
        await this.prisma.$executeRaw`
          UPDATE [db_address_book].[app].[EmailServiceConfigs]
          SET [isActive] = 0, [updatedAt] = GETDATE()
          WHERE [userId] = ${userId} AND [serviceType] = ${serviceType}
        `;
      } else {
        // Remove all configurations for this service type
        await this.prisma.$executeRaw`
          UPDATE [db_address_book].[app].[EmailServiceConfigs]
          SET [isActive] = 0, [updatedAt] = GETDATE()
          WHERE [userId] = ${userId} AND [serviceType] = ${serviceType}
        `;
      }
      
      this.logger.log(`Removed email service config for user ${userId}, service: ${serviceType}`);
    } catch (error) {
      this.logger.error('Failed to remove email service config:', error);
      throw new Error(`Failed to remove email service config: ${error.message}`);
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.prisma.$executeRaw`
        UPDATE [db_address_book].[app].[EmailAuthTokens]
        SET [isValid] = 0, [updatedAt] = GETDATE()
        WHERE [expiresAt] < GETDATE() AND [isValid] = 1
      `;

      // Get the count of affected rows
      const countResult = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM [db_address_book].[app].[EmailAuthTokens]
        WHERE [expiresAt] < GETDATE() AND [isValid] = 0
      `;

      const count = Array.isArray(countResult) ? (countResult[0] as any).count : (countResult as any).count;
      this.logger.log(`Cleaned up ${count} expired tokens`);
      return count;
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
      throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
    }
  }

  async getEmailServiceStats(): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    totalTokens: number;
    validTokens: number;
    expiredTokens: number;
  }> {
    try {
      const [totalConfigsResult, activeConfigsResult, totalTokensResult, validTokensResult, expiredTokensResult] = await Promise.all([
        this.prisma.$queryRaw`SELECT COUNT(*) as count FROM [db_address_book].[app].[EmailServiceConfigs]`,
        this.prisma.$queryRaw`SELECT COUNT(*) as count FROM [db_address_book].[app].[EmailServiceConfigs] WHERE [isActive] = 1`,
        this.prisma.$queryRaw`SELECT COUNT(*) as count FROM [db_address_book].[app].[EmailAuthTokens]`,
        this.prisma.$queryRaw`SELECT COUNT(*) as count FROM [db_address_book].[app].[EmailAuthTokens] WHERE [isValid] = 1`,
        this.prisma.$queryRaw`SELECT COUNT(*) as count FROM [db_address_book].[app].[EmailAuthTokens] WHERE [expiresAt] < GETDATE()`
      ]);

      const totalConfigs = (totalConfigsResult as any)[0].count;
      const activeConfigs = (activeConfigsResult as any)[0].count;
      const totalTokens = (totalTokensResult as any)[0].count;
      const validTokens = (validTokensResult as any)[0].count;
      const expiredTokens = (expiredTokensResult as any)[0].count;

      return {
        totalConfigs,
        activeConfigs,
        totalTokens,
        validTokens,
        expiredTokens
      };
    } catch (error) {
      this.logger.error('Failed to get email service stats:', error);
      throw new Error(`Failed to get email service stats: ${error.message}`);
    }
  }
}
