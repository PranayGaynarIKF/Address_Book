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
        SELECT TOP 1 [id], [user_id], [service_type], [client_id], [client_secret], [redirect_uri], [scopes], [is_active], [created_at], [updated_at]
        FROM [app].[EmailServiceConfigs]
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
      
      // Generate a unique ID for the config
      const configId = require('crypto').randomUUID();
      
      // Use correct snake_case column names that match the database schema
      if (config.accountName) {
        // Insert with accountName (if column exists)
        await this.prisma.$executeRaw`
          INSERT INTO [app].[EmailServiceConfigs] 
          ([id], [user_id], [service_type], [client_id], [client_secret], [redirect_uri], [scopes], [is_active], [created_at], [updated_at])
          VALUES (${configId}, ${config.userId}, ${config.serviceType}, ${config.clientId}, ${config.clientSecret}, ${config.redirectUri}, ${JSON.stringify(config.scopes)}, ${config.isActive}, GETUTCDATE(), GETUTCDATE())
        `;
      } else {
        // Insert without accountName
        await this.prisma.$executeRaw`
          INSERT INTO [app].[EmailServiceConfigs] 
          ([id], [user_id], [service_type], [client_id], [client_secret], [redirect_uri], [scopes], [is_active], [created_at], [updated_at])
          VALUES (${configId}, ${config.userId}, ${config.serviceType}, ${config.clientId}, ${config.clientSecret}, ${config.redirectUri}, ${JSON.stringify(config.scopes)}, ${config.isActive}, GETUTCDATE(), GETUTCDATE())
        `;
      }
      
      this.logger.log(`Insert completed successfully`);
      
      // Then, get the inserted configuration using correct column names
      const result = await this.prisma.$queryRaw`
        SELECT TOP 1 [id], [user_id], [service_type], [client_id], [client_secret], [redirect_uri], [scopes], [is_active], [created_at], [updated_at]
        FROM [app].[EmailServiceConfigs]
        WHERE [user_id] = ${config.userId} AND [service_type] = ${config.serviceType}
        ORDER BY [created_at] DESC
      `;

      this.logger.log(`Query result:`, JSON.stringify(result, null, 2));

      const newConfig = Array.isArray(result) ? result[0] : result;
      this.logger.log(`Successfully created email service config with ID: ${newConfig.id}`);

      return {
        id: newConfig.id,
        userId: newConfig.user_id,
        serviceType: newConfig.service_type,
        clientId: newConfig.client_id,
        clientSecret: newConfig.client_secret,
        redirectUri: newConfig.redirect_uri,
        scopes: JSON.parse(newConfig.scopes),
        isActive: newConfig.is_active,
        createdAt: newConfig.created_at,
        updatedAt: newConfig.updated_at
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
        SELECT [id], [user_id], [service_type], [client_id], [client_secret], [redirect_uri], [scopes], [is_active], [created_at], [updated_at]
        FROM [app].[EmailServiceConfigs]
        WHERE [user_id] = ${userId} AND [service_type] = ${serviceType}
        ORDER BY [created_at] DESC
      `;
      
      this.logger.log(`All configs found:`, JSON.stringify(allConfigs, null, 2));
      
      if (!allConfigs || (Array.isArray(allConfigs) && allConfigs.length === 0)) {
        this.logger.log(`No email service config found for userId: ${userId}, serviceType: ${serviceType}`);
        return null;
      }
      
      // Get the most recent active config
      const configs = Array.isArray(allConfigs) ? allConfigs : [allConfigs];
      const activeConfig = configs.find(config => 
        config.is_active === true || 
        config.is_active === 1 || 
        config.is_active === 'true' ||
        config.is_active === '1'
      );
      
      if (!activeConfig) {
        this.logger.log(`No active email service config found for userId: ${userId}, serviceType: ${serviceType}`);
        return null;
      }
      
      this.logger.log(`Found active config:`, JSON.stringify(activeConfig, null, 2));

      return {
        id: activeConfig.id,
        userId: activeConfig.user_id,
        serviceType: activeConfig.service_type,
        clientId: activeConfig.client_id,
        clientSecret: activeConfig.client_secret,
        redirectUri: activeConfig.redirect_uri,
        scopes: JSON.parse(activeConfig.scopes),
        isActive: activeConfig.is_active,
        createdAt: activeConfig.created_at,
        updatedAt: activeConfig.updated_at
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

      // Build dynamic UPDATE query with correct column names
      const columnMapping = {
        userId: 'user_id',
        serviceType: 'service_type',
        clientId: 'client_id',
        clientSecret: 'client_secret',
        redirectUri: 'redirect_uri',
        isActive: 'is_active'
      };

      const setClauses = Object.keys(updateData)
        .filter(key => key !== 'id')
        .map(key => {
          const dbColumn = columnMapping[key] || key;
          return `[${dbColumn}] = ${typeof updateData[key] === 'string' ? `'${updateData[key]}'` : updateData[key]}`;
        })
        .join(', ');

      const updateQuery = `
        UPDATE [app].[EmailServiceConfigs]
        SET ${setClauses}, [updated_at] = GETUTCDATE()
        WHERE [id] = '${id}'
      `;

      await this.prisma.$executeRawUnsafe(updateQuery);
      
      // Get the updated config
      const result = await this.prisma.$queryRaw`
        SELECT [id], [user_id], [service_type], [client_id], [client_secret], [redirect_uri], [scopes], [is_active], [created_at], [updated_at]
        FROM [app].[EmailServiceConfigs]
        WHERE [id] = ${id}
      `;

      const updatedConfig = Array.isArray(result) ? result[0] : result;

      return {
        id: updatedConfig.id,
        userId: updatedConfig.user_id,
        serviceType: updatedConfig.service_type,
        clientId: updatedConfig.client_id,
        clientSecret: updatedConfig.client_secret,
        redirectUri: updatedConfig.redirect_uri,
        scopes: JSON.parse(updatedConfig.scopes),
        isActive: updatedConfig.is_active,
        createdAt: updatedConfig.created_at,
        updatedAt: updatedConfig.updated_at
      };
    } catch (error) {
      this.logger.error('Failed to update email service config:', error);
      throw new Error(`Failed to update email service config: ${error.message}`);
    }
  }

  async deactivateEmailServiceConfig(id: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE [app].[EmailServiceConfigs]
        SET [is_active] = 0, [updated_at] = GETUTCDATE()
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
      // Generate a unique ID for the token
      const tokenId = require('crypto').randomUUID();
      
      // Invalidate existing tokens for this user and service - FIXED: Use UTC time
      await this.prisma.$executeRaw`
        UPDATE [app].[EmailAuthTokens]
        SET [is_valid] = 0, [updated_at] = GETUTCDATE()
        WHERE [user_id] = ${token.userId} AND [service_type] = ${token.serviceType}
      `;

      // Create new token - FIXED: Use raw SQL with explicit UTC conversion
      await this.prisma.$executeRaw`
        INSERT INTO [app].[EmailAuthTokens]
        ([id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at])
        VALUES (${tokenId}, ${token.userId}, ${token.serviceType}, ${token.accessToken}, ${token.refreshToken}, DATEADD(second, ${Math.floor(token.expiresAt.getTime() / 1000)}, '1970-01-01 00:00:00'), ${JSON.stringify(token.scope)}, ${token.email}, 1, GETUTCDATE(), GETUTCDATE())
      `;
      
      // Get the created token
      const result = await this.prisma.$queryRaw`
        SELECT [id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at]
        FROM [app].[EmailAuthTokens]
        WHERE [id] = ${tokenId}
      `;

      const newToken = Array.isArray(result) ? result[0] : result;

      return {
        id: newToken.id,
        userId: newToken.user_id,
        serviceType: newToken.service_type,
        accessToken: newToken.access_token,
        refreshToken: newToken.refresh_token,
        expiresAt: newToken.expires_at,
        scope: JSON.parse(newToken.scope),
        email: newToken.email,
        isValid: newToken.is_valid,
        createdAt: newToken.created_at,
        updatedAt: newToken.updated_at
      };
    } catch (error) {
      this.logger.error('Failed to save email auth token:', error);
      throw new Error(`Failed to save email auth token: ${error.message}`);
    }
  }

  async getValidEmailAuthToken(userId: string, serviceType: EmailServiceType): Promise<EmailAuthToken | null> {
    try {
      // FIXED: Use UTC time for proper comparison
      const result = await this.prisma.$queryRaw`
        SELECT [id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at]
        FROM [app].[EmailAuthTokens]
        WHERE [user_id] = ${userId} AND [service_type] = ${serviceType} AND [is_valid] = 1 AND [expires_at] > GETUTCDATE()
        ORDER BY [created_at] DESC
      `;

      if (!result || (Array.isArray(result) && result.length === 0)) return null;

      const token = Array.isArray(result) ? result[0] : result;

      return {
        id: token.id,
        userId: token.user_id,
        serviceType: token.service_type,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        scope: JSON.parse(token.scope),
        email: token.email,
        isValid: token.is_valid,
        createdAt: token.created_at,
        updatedAt: token.updated_at
      };
    } catch (error) {
      this.logger.error('Failed to get valid email auth token:', error);
      throw new Error(`Failed to get valid email auth token: ${error.message}`);
    }
  }

  async invalidateEmailAuthToken(id: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE [app].[EmailAuthTokens]
        SET [is_valid] = 0, [updated_at] = GETUTCDATE()
        WHERE [id] = ${id}
      `;
    } catch (error) {
      this.logger.error('Failed to invalidate email auth token:', error);
      throw new Error(`Failed to invalidate email auth token: ${error.message}`);
    }
  }

  // NEW: Invalidate all expired tokens - FIXED: Use UTC time
  async invalidateExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.$executeRaw`
        UPDATE [app].[EmailAuthTokens]
        SET [is_valid] = 0, [updated_at] = GETUTCDATE()
        WHERE [is_valid] = 1 AND [expires_at] <= GETUTCDATE()
      `;
      this.logger.log(`Invalidated ${result} expired email auth tokens`);
    } catch (error) {
      this.logger.error('Failed to invalidate expired tokens:', error);
      throw new Error(`Failed to invalidate expired tokens: ${error.message}`);
    }
  }

  async refreshEmailAuthToken(id: string, newToken: Partial<EmailAuthToken>): Promise<EmailAuthToken> {
    try {
      const updateData: any = { ...newToken };
      
      if (newToken.scope) {
        updateData.scope = JSON.stringify(newToken.scope);
      }

      // Build dynamic UPDATE query with correct column names
      const columnMapping = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: 'expires_at',
        scope: 'scope',
        email: 'email',
        isValid: 'is_valid'
      };

      const setClauses = Object.keys(updateData)
        .filter(key => key !== 'id')
        .map(key => {
          const dbColumn = columnMapping[key] || key;
          return `[${dbColumn}] = ${typeof updateData[key] === 'string' ? `'${updateData[key]}'` : updateData[key]}`;
        })
        .join(', ');

      const updateQuery = `
        UPDATE [app].[EmailAuthTokens]
        SET ${setClauses}, [updated_at] = GETUTCDATE()
        WHERE [id] = '${id}'
      `;

      await this.prisma.$executeRawUnsafe(updateQuery);
      
      // Get the updated token
      const result = await this.prisma.$queryRaw`
        SELECT [id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at]
        FROM [app].[EmailAuthTokens]
        WHERE [id] = ${id}
      `;

      const updatedToken = Array.isArray(result) ? result[0] : result;

      return {
        id: updatedToken.id,
        userId: updatedToken.user_id,
        serviceType: updatedToken.service_type,
        accessToken: updatedToken.access_token,
        refreshToken: updatedToken.refresh_token,
        expiresAt: updatedToken.expires_at,
        scope: JSON.parse(updatedToken.scope),
        email: updatedToken.email,
        isValid: updatedToken.is_valid,
        createdAt: updatedToken.created_at,
        updatedAt: updatedToken.updated_at
      };
    } catch (error) {
      this.logger.error('Failed to refresh email auth token:', error);
      throw new Error(`Failed to refresh email auth token: ${error.message}`);
    }
  }

  // Update email auth token (simpler version for token refresh service)
  async updateEmailAuthToken(id: string, updateData: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string;
    isValid?: boolean;
  }): Promise<void> {
    try {
      const setParts = [];
      const values = [];

      if (updateData.accessToken !== undefined) {
        setParts.push(`access_token = @P${values.length + 1}`);
        values.push(updateData.accessToken);
      }
      if (updateData.refreshToken !== undefined) {
        setParts.push(`refresh_token = @P${values.length + 1}`);
        values.push(updateData.refreshToken);
      }
      if (updateData.expiresAt !== undefined) {
        setParts.push(`expires_at = @P${values.length + 1}`);
        values.push(updateData.expiresAt);
      }
      if (updateData.scope !== undefined) {
        setParts.push(`scope = @P${values.length + 1}`);
        values.push(updateData.scope);
      }
      if (updateData.isValid !== undefined) {
        setParts.push(`is_valid = @P${values.length + 1}`);
        values.push(updateData.isValid);
      }

      if (setParts.length === 0) return;

      setParts.push(`updated_at = @P${values.length + 1}`);
      values.push(new Date());

      const query = `
        UPDATE [app].[EmailAuthTokens] 
        SET ${setParts.join(', ')} 
        WHERE id = @P${values.length + 1}
      `;
      values.push(id);

      await this.prisma.$executeRawUnsafe(query, ...values);
    } catch (error) {
      this.logger.error('Failed to update email auth token:', error);
      throw new Error(`Failed to update email auth token: ${error.message}`);
    }
  }

  // Utility Methods
  async getUserEmailServices(userId: string): Promise<EmailServiceConfig[]> {
    try {
      const results = await this.prisma.$queryRaw`
        SELECT [id], [user_id], [service_type], [client_id], [client_secret], [redirect_uri], [scopes], [is_active], [created_at], [updated_at]
        FROM [db_address_book].[app].[EmailServiceConfigs]
        WHERE [user_id] = ${userId} AND [is_active] = 1
      `;

      return (Array.isArray(results) ? results : [results]).map((result: any) => ({
        id: result.id,
        userId: result.user_id,
        serviceType: result.service_type,
        clientId: result.client_id,
        clientSecret: result.client_secret,
        redirectUri: result.redirect_uri,
        scopes: JSON.parse(result.scopes),
        isActive: result.is_active,
        createdAt: result.created_at,
        updatedAt: result.updated_at
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
        SELECT [id], [user_id], [service_type], [client_id], [client_secret], [redirect_uri], [scopes], [is_active], [account_name], [created_at], [updated_at]
        FROM [db_address_book].[app].[EmailServiceConfigs]
        WHERE [user_id] = ${userId} AND [service_type] = ${serviceType} AND [is_active] = 1
        ORDER BY [created_at] DESC
      `;

      return (Array.isArray(results) ? results : [results]).map((result: any) => ({
        id: result.id,
        userId: result.user_id,
        serviceType: result.service_type,
        clientId: result.client_id,
        clientSecret: result.client_secret,
        redirectUri: result.redirect_uri,
        scopes: JSON.parse(result.scopes),
        isActive: result.is_active,
        accountName: result.account_name,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      }));
    } catch (error) {
      this.logger.error('Failed to get email service configs:', error);
      throw new Error(`Failed to get email service configs: ${error.message}`);
    }
  }

  // NEW: Get all Gmail tokens from the database
  async getAllGmailTokens(): Promise<any[]> {
    try {
      const results = await this.prisma.$queryRaw`
        SELECT [id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at]
        FROM [db_address_book].[app].[EmailAuthTokens]
        WHERE [service_type] = 'GMAIL'
        ORDER BY [created_at] DESC
      `;

      return (Array.isArray(results) ? results : [results]).map((token: any) => ({
        id: token.id,
        userId: token.user_id,
        serviceType: token.service_type,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        scope: token.scope,
        email: token.email,
        isValid: token.is_valid,
        createdAt: token.created_at,
        updatedAt: token.updated_at
      }));
    } catch (error) {
      this.logger.error('Failed to get all Gmail tokens:', error);
      throw new Error(`Failed to get all Gmail tokens: ${error.message}`);
    }
  }

  // NEW: Get any valid Gmail token (regardless of user ID)
  async getAnyValidGmailToken(): Promise<EmailAuthToken | null> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT [id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at]
        FROM [db_address_book].[app].[EmailAuthTokens]
        WHERE [service_type] = 'GMAIL' AND [is_valid] = 1 AND [expires_at] > GETUTCDATE()
        ORDER BY [created_at] DESC
      `;

      if (!result || (Array.isArray(result) && result.length === 0)) return null;

      const token = Array.isArray(result) ? result[0] : result;

      return {
        id: token.id,
        userId: token.user_id,
        serviceType: token.service_type,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        scope: JSON.parse(token.scope),
        email: token.email,
        isValid: token.is_valid,
        createdAt: token.created_at,
        updatedAt: token.updated_at
      };
    } catch (error) {
      this.logger.error('Failed to get any valid Gmail token:', error);
      throw new Error(`Failed to get any valid Gmail token: ${error.message}`);
    }
  }

  // NEW: Invalidate all Gmail tokens for a specific user and account
  async invalidateUserGmailTokens(userId: string, accountName: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE [db_address_book].[app].[EmailAuthTokens]
        SET [isValid] = 0, [updatedAt] = GETUTCDATE()
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
          SET [isActive] = 0, [updatedAt] = GETUTCDATE()
          WHERE [userId] = ${userId} AND [serviceType] = ${serviceType}
        `;
      } else {
        // Remove all configurations for this service type
        await this.prisma.$executeRaw`
          UPDATE [db_address_book].[app].[EmailServiceConfigs]
          SET [isActive] = 0, [updatedAt] = GETUTCDATE()
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
        SET [isValid] = 0, [updatedAt] = GETUTCDATE()
        WHERE [expiresAt] < GETUTCDATE() AND [isValid] = 1
      `;

      // Get the count of affected rows
      const countResult = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM [db_address_book].[app].[EmailAuthTokens]
        WHERE [expiresAt] < GETUTCDATE() AND [isValid] = 0
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
        this.prisma.$queryRaw`SELECT COUNT(*) as count FROM [db_address_book].[app].[EmailAuthTokens] WHERE [expiresAt] < GETUTCDATE()`
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

  // Token Refresh Service Methods
  async getTokensNearExpiry(minutesThreshold: number): Promise<EmailAuthToken[]> {
    try {
      const thresholdDate = new Date(Date.now() + minutesThreshold * 60 * 1000);
      
      const result = await this.prisma.$queryRaw`
        SELECT [id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at]
        FROM [app].[EmailAuthTokens]
        WHERE [is_valid] = 1 AND [expires_at] <= ${thresholdDate} AND [expires_at] > GETUTCDATE()
        ORDER BY [expires_at] ASC
      `;

      const tokens = Array.isArray(result) ? result : [result];
      return tokens.map((token: any) => ({
        id: token.id,
        userId: token.user_id,
        serviceType: token.service_type,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        scope: JSON.parse(token.scope),
        email: token.email,
        isValid: token.is_valid,
        createdAt: token.created_at,
        updatedAt: token.updated_at
      }));
    } catch (error) {
      this.logger.error('Failed to get tokens near expiry:', error);
      throw new Error(`Failed to get tokens near expiry: ${error.message}`);
    }
  }

  async getAllEmailAuthTokens(): Promise<EmailAuthToken[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT [id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at]
        FROM [app].[EmailAuthTokens]
        ORDER BY [created_at] DESC
      `;

      const tokens = Array.isArray(result) ? result : [result];
      return tokens.map((token: any) => ({
        id: token.id,
        userId: token.user_id,
        serviceType: token.service_type,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        scope: JSON.parse(token.scope),
        email: token.email,
        isValid: token.is_valid,
        createdAt: token.created_at,
        updatedAt: token.updated_at
      }));
    } catch (error) {
      this.logger.error('Failed to get all email auth tokens:', error);
      throw new Error(`Failed to get all email auth tokens: ${error.message}`);
    }
  }

  async getTokensByService(serviceType: EmailServiceType): Promise<EmailAuthToken[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT [id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at]
        FROM [app].[EmailAuthTokens]
        WHERE [service_type] = ${serviceType} AND [is_valid] = 1
        ORDER BY [created_at] DESC
      `;

      const tokens = Array.isArray(result) ? result : [result];
      return tokens.map((token: any) => ({
        id: token.id,
        userId: token.user_id,
        serviceType: token.service_type,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        scope: JSON.parse(token.scope),
        email: token.email,
        isValid: token.is_valid,
        createdAt: token.created_at,
        updatedAt: token.updated_at
      }));
    } catch (error) {
      this.logger.error('Failed to get tokens by service:', error);
      throw new Error(`Failed to get tokens by service: ${error.message}`);
    }
  }
}
