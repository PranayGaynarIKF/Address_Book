import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailDatabaseService } from './email-database.service';
import { EmailManagerService } from './email-manager.service';
import { EmailServiceType } from './interfaces/email-service.interface';

@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    private readonly emailDatabaseService: EmailDatabaseService,
    private readonly emailManagerService: EmailManagerService,
  ) {}

  /**
   * Automatically refresh tokens every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async refreshAllTokens() {
    this.logger.log('Starting automatic token refresh...');
    
    try {
      // Get all valid tokens that are close to expiry (within 30 minutes)
      const tokensToRefresh = await this.emailDatabaseService.getTokensNearExpiry(30);
      
      let refreshedCount = 0;
      let failedCount = 0;

      for (const token of tokensToRefresh) {
        try {
          await this.refreshTokenForUser(token.userId, token.serviceType as EmailServiceType);
          refreshedCount++;
        } catch (error) {
          this.logger.error(`Failed to refresh token for user ${token.userId}, service ${token.serviceType}:`, error.message);
          failedCount++;
        }
      }

      this.logger.log(`Token refresh completed. Refreshed: ${refreshedCount}, Failed: ${failedCount}`);
    } catch (error) {
      this.logger.error('Error during automatic token refresh:', error);
    }
  }

  /**
   * Manually refresh a token for a specific user and service
   */
  async refreshTokenManually(userId: string, serviceType: EmailServiceType): Promise<{ success: boolean; message: string }> {
    try {
      await this.refreshTokenForUser(userId, serviceType);
      return {
        success: true,
        message: `Token refreshed successfully for ${serviceType}`
      };
    } catch (error) {
      this.logger.error(`Manual token refresh failed for user ${userId}, service ${serviceType}:`, error);
      return {
        success: false,
        message: `Failed to refresh token: ${error.message}`
      };
    }
  }

  /**
   * Refresh token for a specific user and service
   */
  private async refreshTokenForUser(userId: string, serviceType: EmailServiceType): Promise<void> {
    // Get the current valid token
    const existingToken = await this.emailDatabaseService.getValidEmailAuthToken(userId, serviceType);
    
    if (!existingToken) {
      throw new Error(`No valid token found for user ${userId} and service ${serviceType}`);
    }

    if (!existingToken.refreshToken) {
      throw new Error(`No refresh token available for user ${userId} and service ${serviceType}`);
    }

    // Refresh the token using the email manager service
    const result = await this.emailManagerService.refreshServiceToken(serviceType, existingToken.refreshToken);
    
    // Update the token in the database
    await this.emailDatabaseService.refreshEmailAuthToken(existingToken.id, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      scope: JSON.stringify(result.scope)
    });

    this.logger.log(`Token refreshed successfully for user ${userId}, service ${serviceType}`);
  }

  /**
   * Get status of all tokens
   */
  async getTokenStatus(): Promise<{
    totalTokens: number;
    validTokens: number;
    expiredTokens: number;
    tokensNearExpiry: number;
    tokensByService: Record<string, number>;
  }> {
    try {
      const allTokens = await this.emailDatabaseService.getAllEmailAuthTokens();
      const now = new Date();
      const nearExpiryThreshold = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

      let validTokens = 0;
      let expiredTokens = 0;
      let tokensNearExpiry = 0;
      const tokensByService: Record<string, number> = {};

      for (const token of allTokens) {
        // Count by service
        tokensByService[token.serviceType] = (tokensByService[token.serviceType] || 0) + 1;

        if (token.isValid) {
          if (token.expiresAt > now) {
            validTokens++;
            if (token.expiresAt <= nearExpiryThreshold) {
              tokensNearExpiry++;
            }
          } else {
            expiredTokens++;
          }
        } else {
          expiredTokens++;
        }
      }

      return {
        totalTokens: allTokens.length,
        validTokens,
        expiredTokens,
        tokensNearExpiry,
        tokensByService
      };
    } catch (error) {
      this.logger.error('Failed to get token status:', error);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    this.logger.log('Starting cleanup of expired tokens...');
    
    try {
      const cleanedCount = await this.emailDatabaseService.cleanupExpiredTokens();
      this.logger.log(`Cleaned up ${cleanedCount} expired tokens`);
    } catch (error) {
      this.logger.error('Error during token cleanup:', error);
    }
  }

  /**
   * Force refresh all tokens for a specific service
   */
  async refreshAllTokensForService(serviceType: EmailServiceType): Promise<{
    success: boolean;
    refreshedCount: number;
    failedCount: number;
    message: string;
  }> {
    try {
      const tokens = await this.emailDatabaseService.getTokensByService(serviceType);
      let refreshedCount = 0;
      let failedCount = 0;

      for (const token of tokens) {
        if (token.isValid && token.refreshToken) {
          try {
            await this.refreshTokenForUser(token.userId, serviceType);
            refreshedCount++;
          } catch (error) {
            this.logger.error(`Failed to refresh token for user ${token.userId}:`, error.message);
            failedCount++;
          }
        } else {
          failedCount++;
        }
      }

      return {
        success: true,
        refreshedCount,
        failedCount,
        message: `Refreshed ${refreshedCount} tokens for ${serviceType}, ${failedCount} failed`
      };
    } catch (error) {
      this.logger.error(`Failed to refresh all tokens for service ${serviceType}:`, error);
      return {
        success: false,
        refreshedCount: 0,
        failedCount: 0,
        message: `Failed to refresh tokens for ${serviceType}: ${error.message}`
      };
    }
  }
}
