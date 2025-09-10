import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { EmailDatabaseService } from '../email/email-database.service';
import { EmailServiceType } from '../email/interfaces/email-service.interface';

// Import the database service interfaces
import type { EmailServiceConfig, EmailAuthToken } from '../email/email-database.service';

export interface GmailOAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string; // Changed from string[] to string (JSON string) to match database
  email?: string;
}

export interface GmailAccountInfo {
  accountName: string;
  email: string;
  isConnected: boolean;
  scopes: string[];
  lastConnected: Date;
  isValid: boolean;
}

@Injectable()
export class DynamicOAuthService {
  private readonly logger = new Logger(DynamicOAuthService.name);

  constructor(private readonly emailDatabaseService: EmailDatabaseService) {}

  // Generate Gmail OAuth URL with user-specific credentials
  async generateGmailAuthUrl(
    userId: string,
    accountName: string,
    clientId: string,
    clientSecret: string
  ): Promise<string> {
    try {
      this.logger.log(`🔄 Generating Gmail OAuth URL for user ${userId}, account: ${accountName}`);

      // Create OAuth2 client with user's credentials
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        `http://localhost:4002/auth/${userId}/gmail/callback`
      );

      // Define Gmail scopes
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];

      // Generate authorization URL
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent', // Force consent to get refresh token
        state: accountName // Pass accountName in state parameter
      });

      // Save user's OAuth credentials to database
      await this.saveUserOAuthCredentials(userId, accountName, clientId, clientSecret, scopes);

      this.logger.log(`✅ Gmail OAuth URL generated for user ${userId}, account: ${accountName}`);
      return authUrl;

    } catch (error) {
      this.logger.error(`❌ Failed to generate Gmail OAuth URL for user ${userId}:`, error.message);
      throw new Error(`Failed to generate OAuth URL: ${error.message}`);
    }
  }

  // Complete Gmail OAuth flow and save tokens
  async completeGmailOAuth(
    userId: string,
    accountName: string,
    code: string
  ): Promise<GmailOAuthResult> {
    try {
      this.logger.log(`🔄 Completing Gmail OAuth for user ${userId}, account: ${accountName}`);

      // Get user's OAuth credentials from database
      const userConfig = await this.getUserOAuthCredentials(userId, accountName);
      if (!userConfig) {
        throw new Error(`No OAuth configuration found for user ${userId}, account: ${accountName}`);
      }

      // Create OAuth2 client with user's credentials
      const oauth2Client = new google.auth.OAuth2(
        userConfig.clientId,
        userConfig.clientSecret,
        `http://localhost:4002/auth/${userId}/gmail/callback`
      );

      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      // Get user's email from Google
      oauth2Client.setCredentials(tokens);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const userEmail = profile.data.emailAddress;

      // Prepare token data for database - FIXED: Use Google's expiry_date, but handle timezone issues
      const now = new Date();
      let expiresAt;
      if ((tokens as any).expiry_date) {
        // Google's expiry_date might be in a different timezone, so let's be safe
        const googleExpiry = new Date((tokens as any).expiry_date);
        const calculatedExpiry = new Date(now.getTime() + (((tokens as any).expires_in || 3600) * 1000));
        
        // Use the one that makes more sense (not in the past)
        if (googleExpiry > now) {
          expiresAt = googleExpiry;
        } else {
          expiresAt = calculatedExpiry;
        }
      } else {
        expiresAt = new Date(now.getTime() + (((tokens as any).expires_in || 3600) * 1000));
      }
      
      // Log timing for debugging
      console.log('🕐 Token timing debug:');
      console.log('   Current time (UTC):', now.toISOString());
      console.log('   Google expiry_date:', (tokens as any).expiry_date);
      console.log('   Google expires_in:', (tokens as any).expires_in);
      console.log('   expiry_date (UTC):', (tokens as any).expiry_date ? new Date((tokens as any).expiry_date).toISOString() : 'NOT PROVIDED');
      console.log('   Using expiry_date:', !!(tokens as any).expiry_date);
      console.log('   Final expiry (UTC):', expiresAt.toISOString());
      console.log('   Time until expiry (minutes):', Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60));
      
      const tokenData: Omit<EmailAuthToken, 'createdAt' | 'updatedAt' | 'id'> = {
        userId,
        serviceType: 'GMAIL' as EmailServiceType,
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiresAt: expiresAt, // Fixed timezone calculation
        scope: JSON.stringify([
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels'
        ]), // Store as JSON string
        email: userEmail || 'unknown@gmail.com',
        isValid: true
      };

      // Save tokens to database
      await this.emailDatabaseService.saveEmailAuthToken(tokenData);

      this.logger.log(`✅ Gmail OAuth completed for user ${userId}, account: ${accountName}`);
      this.logger.log(`   Email: ${userEmail}`);
      this.logger.log(`   Tokens saved to database automatically!`);

      return {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiresIn: (tokens as any).expires_in || 3600, // Cast to access expires_in
        scope: tokenData.scope, // Return as JSON string (no need to parse back)
        email: userEmail || 'unknown@gmail.com'
      };

    } catch (error) {
      this.logger.error(`❌ Failed to complete Gmail OAuth for user ${userId}:`, error.message);
      throw new Error(`OAuth completion failed: ${error.message}`);
    }
  }

  // Alternative: Direct token saving method (simpler approach)
  async completeGmailOAuthDirect(
    userId: string,
    accountName: string,
    clientId: string,
    clientSecret: string,
    code: string
  ): Promise<GmailOAuthResult> {
    try {
      this.logger.log(`🔄 Completing Gmail OAuth DIRECT for user ${userId}, account: ${accountName}`);

      // Create OAuth2 client directly with provided credentials
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        `http://localhost:4002/auth/${userId}/gmail/callback`
      );

      // Exchange authorization code for tokens
      this.logger.log(`🔄 Exchanging authorization code for tokens...`);
      const { tokens } = await oauth2Client.getToken(code);
      
      this.logger.log(`✅ Tokens received from Google API`);
      this.logger.log(`   Access Token: ${tokens.access_token ? 'Present' : 'Missing'}`);
      this.logger.log(`   Refresh Token: ${tokens.refresh_token ? 'Present' : 'Missing'}`);

      // Get user's email from Google
      oauth2Client.setCredentials(tokens);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const userEmail = profile.data.emailAddress;

      this.logger.log(`✅ User email retrieved: ${userEmail}`);

      // Prepare token data for database
      const tokenData: Omit<EmailAuthToken, 'createdAt' | 'updatedAt' | 'id'> = {
        userId,
        serviceType: 'GMAIL' as EmailServiceType,
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiresAt: (() => {
          const now = new Date();
          if ((tokens as any).expiry_date) {
            const googleExpiry = new Date((tokens as any).expiry_date);
            const calculatedExpiry = new Date(now.getTime() + (((tokens as any).expires_in || 3600) * 1000));
            return googleExpiry > now ? googleExpiry : calculatedExpiry;
          } else {
            return new Date(now.getTime() + (((tokens as any).expires_in || 3600) * 1000));
          }
        })(),
        scope: JSON.stringify([
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels'
        ]),
        email: userEmail || 'unknown@gmail.com',
        isValid: true
      };

      this.logger.log(`🔄 Saving tokens to database...`);
      
      // Save tokens to database
      const savedToken = await this.emailDatabaseService.saveEmailAuthToken(tokenData);
      
      this.logger.log(`✅ Tokens saved to database successfully!`);
      this.logger.log(`   Database ID: ${savedToken.id}`);
      this.logger.log(`   User Email: ${userEmail}`);
      this.logger.log(`   Token Valid: ${savedToken.isValid}`);

      // Also save the OAuth credentials if they don't exist
      try {
        await this.saveUserOAuthCredentials(userId, accountName, clientId, clientSecret, [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels'
        ]);
        this.logger.log(`✅ OAuth credentials also saved to database`);
      } catch (credError) {
        this.logger.warn(`⚠️ OAuth credentials already exist or failed to save: ${credError.message}`);
      }

      return {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiresIn: (tokens as any).expires_in || 3600,
        scope: tokenData.scope,
        email: userEmail || 'unknown@gmail.com'
      };

    } catch (error) {
      this.logger.error(`❌ Failed to complete Gmail OAuth DIRECT for user ${userId}:`, error.message);
      this.logger.error(`   Error details:`, error);
      throw new Error(`OAuth completion failed: ${error.message}`);
    }
  }

  // Get user's Gmail accounts
  async getUserGmailAccounts(userId: string): Promise<GmailAccountInfo[]> {
    try {
      this.logger.log(`🔄 Getting Gmail accounts for user ${userId}`);

      // Get all Gmail configurations for this user
      const configs = await this.emailDatabaseService.getEmailServiceConfigs(userId, 'GMAIL');
      
      const accounts: GmailAccountInfo[] = [];

      for (const config of configs) {
        // Get the latest valid token for this account
        const token = await this.emailDatabaseService.getValidEmailAuthToken(userId, 'GMAIL');
        
        // Parse scopes from JSON string
        let scopes: string[] = [];
        try {
          if (token?.scope) {
            scopes = JSON.parse(token.scope);
          }
        } catch (e) {
          this.logger.warn(`Failed to parse scopes for token: ${e.message}`);
        }
        
        accounts.push({
          accountName: (config as any).accountName || 'Unknown Account', // Cast to access accountName
          email: token?.email || 'Unknown Email',
          isConnected: !!token && token.isValid,
          scopes: scopes,
          lastConnected: token?.updatedAt || config.updatedAt || new Date(),
          isValid: token?.isValid || false
        });
      }

      this.logger.log(`✅ Found ${accounts.length} Gmail accounts for user ${userId}`);
      return accounts;

    } catch (error) {
      this.logger.error(`❌ Failed to get Gmail accounts for user ${userId}:`, error.message);
      throw new Error(`Failed to get Gmail accounts: ${error.message}`);
    }
  }

  // Disconnect Gmail account
  async disconnectGmailAccount(userId: string, accountName: string): Promise<void> {
    try {
      this.logger.log(`🔄 Disconnecting Gmail account for user ${userId}, account: ${accountName}`);

      // Invalidate all tokens for this user and account
      await this.emailDatabaseService.invalidateUserGmailTokens(userId, accountName);

      // Optionally remove the service configuration
      // await this.emailDatabaseService.removeEmailServiceConfig(userId, 'GMAIL', accountName);

      this.logger.log(`✅ Gmail account disconnected for user ${userId}, account: ${accountName}`);

    } catch (error) {
      this.logger.error(`❌ Failed to disconnect Gmail account for user ${userId}:`, error.message);
      throw new Error(`Failed to disconnect account: ${error.message}`);
    }
  }

  // Test Gmail account connection
  async testGmailAccount(userId: string, accountName: string): Promise<{
    isConnected: boolean;
    email: string;
    scopes: string[];
  }> {
    try {
      this.logger.log(`🔄 Testing Gmail account for user ${userId}, account: ${accountName}`);

      // Get valid token for this account
      const token = await this.emailDatabaseService.getValidEmailAuthToken(userId, 'GMAIL');
      
      if (!token) {
        return {
          isConnected: false,
          email: 'No token found',
          scopes: []
        };
      }

      // Test the token by making a simple Gmail API call
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      await gmail.users.getProfile({ userId: 'me' });

      this.logger.log(`✅ Gmail account test successful for user ${userId}, account: ${accountName}`);

      // Parse scopes from JSON string
      let scopes: string[] = [];
      try {
        if (token.scope) {
          scopes = JSON.parse(token.scope);
        }
      } catch (e) {
        this.logger.warn(`Failed to parse scopes for token: ${e.message}`);
      }

      return {
        isConnected: true,
        email: token.email || 'Unknown',
        scopes: scopes
      };

    } catch (error) {
      this.logger.error(`❌ Gmail account test failed for user ${userId}:`, error.message);
      return {
        isConnected: false,
        email: 'Test failed',
        scopes: []
      };
    }
  }

  // Get user's OAuth status
  async getUserOAuthStatus(userId: string): Promise<{
    gmail: { connected: number; total: number; accounts: string[] };
    outlook: { connected: number; total: number; accounts: string[] };
  }> {
    try {
      const gmailAccounts = await this.getUserGmailAccounts(userId);
      const connectedGmail = gmailAccounts.filter(acc => acc.isConnected);
      
      // TODO: Implement Outlook accounts when needed
      const outlookAccounts: GmailAccountInfo[] = [];

      return {
        gmail: {
          connected: connectedGmail.length,
          total: gmailAccounts.length,
          accounts: gmailAccounts.map(acc => acc.accountName)
        },
        outlook: {
          connected: 0,
          total: 0,
          accounts: []
        }
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get OAuth status for user ${userId}:`, error.message);
      throw new Error(`Failed to get OAuth status: ${error.message}`);
    }
  }

  // Private helper methods
  private async saveUserOAuthCredentials(
    userId: string,
    accountName: string,
    clientId: string,
    clientSecret: string,
    scopes: string[]
  ): Promise<void> {
    try {
      // Save or update user's OAuth credentials
      await this.emailDatabaseService.createEmailServiceConfig({
        userId,
        serviceType: 'GMAIL',
        clientId,
        clientSecret,
        redirectUri: `http://localhost:4002/auth/${userId}/gmail/callback`,
        scopes,
        isActive: true,
        accountName // Add account name for multiple accounts
      });

      this.logger.log(`✅ OAuth credentials saved for user ${userId}, account: ${accountName}`);

    } catch (error) {
      this.logger.error(`❌ Failed to save OAuth credentials for user ${userId}:`, error.message);
      throw error;
    }
  }

  private async getUserOAuthCredentials(
    userId: string,
    accountName: string
  ): Promise<{
    clientId: string;
    clientSecret: string;
    scopes: string[];
  } | null> {
    try {
      const configs = await this.emailDatabaseService.getEmailServiceConfigs(userId, 'GMAIL');
      const config = configs.find(c => (c as any).accountName === accountName); // Cast to access accountName
      
      if (!config) return null;

      // Parse scopes from JSON string
      let scopes: string[] = [];
      try {
        if (config.scopes) {
          scopes = JSON.parse(config.scopes);
        }
      } catch (e) {
        this.logger.warn(`Failed to parse scopes for config: ${e.message}`);
        scopes = [];
      }

      return {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        scopes: scopes
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get OAuth credentials for user ${userId}:`, error.message);
      return null;
    }
  }
}
