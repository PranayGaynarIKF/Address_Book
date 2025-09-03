import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { EmailDatabaseService } from '../email/email-database.service';
import { EmailServiceType } from '../email/interfaces/email-service.interface';

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
  expires_in: number;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private oauth2Client: any;
  private readonly tokensFilePath = path.join(process.cwd(), 'google-tokens.json');

  constructor(
    private readonly emailDatabaseService: EmailDatabaseService
  ) {
    this.initializeOAuth2Client();
  }

  private initializeOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const port = process.env.PORT || 4002;
    
    if (!clientId || !clientSecret) {
      this.logger.error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.GOOGLE_REDIRECT_URI || `http://localhost:${port}/auth/google/callback`
    );

    // Try to load existing tokens
    this.loadStoredTokens();
  }

  async getAuthUrl(): Promise<string> {
    if (!this.oauth2Client) {
      throw new Error('OAuth 2.0 client not initialized');
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force consent to get refresh token
    });

    this.logger.log(`Generated OAuth 2.0 authorization URL with scopes: ${scopes.join(', ')}`);
    return authUrl;
  }

  async getTokensFromCode(code: string): Promise<GoogleTokens> {
    if (!this.oauth2Client) {
      throw new Error('OAuth 2.0 client not initialized');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.logger.log('Successfully exchanged authorization code for tokens');
      
      // Set tokens on the client
      this.oauth2Client.setCredentials(tokens);
      
      return tokens as GoogleTokens;
    } catch (error) {
      this.logger.error('Failed to exchange authorization code for tokens:', error);
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  async storeTokens(tokens: GoogleTokens): Promise<void> {
    try {
      // Store tokens in a file (in production, use secure database storage)
      const tokenData = {
        ...tokens,
        stored_at: new Date().toISOString()
      };
      
      fs.writeFileSync(this.tokensFilePath, JSON.stringify(tokenData, null, 2));
      this.logger.log('OAuth 2.0 tokens stored successfully');
    } catch (error) {
      this.logger.error('Failed to store tokens:', error);
      throw new Error(`Token storage failed: ${error.message}`);
    }
  }

  // NEW METHOD: Auto-save tokens to database
  async autoSaveTokensToDatabase(tokens: GoogleTokens, userEmail?: string): Promise<void> {
    try {
      this.logger.log('🔄 Attempting to auto-save tokens to database...');
      
      // Prepare token data for database
      const tokenData = {
        userId: 'current-user-id', // You can modify this to get actual user ID
        serviceType: 'GMAIL' as EmailServiceType, // Fix: Use correct type
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
        scope: tokens.scope ? JSON.parse(tokens.scope) : [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels'
        ],
        email: userEmail || 'unknown@gmail.com',
        isValid: true
      };

      // Save to database using existing service
      await this.emailDatabaseService.saveEmailAuthToken(tokenData);
      
      this.logger.log('✅ Tokens saved to database automatically!');
      this.logger.log(`   User: ${tokenData.userId}`);
      this.logger.log(`   Service: ${tokenData.serviceType}`);
      this.logger.log(`   Email: ${tokenData.email}`);
      this.logger.log(`   Expires: ${tokenData.expiresAt}`);
      
    } catch (error) {
      this.logger.error('❌ Auto-save to database failed:', error.message);
      this.logger.error('   But OAuth flow continues working...');
      // Don't throw error - let OAuth flow continue
    }
  }

  private loadStoredTokens(): void {
    try {
      if (fs.existsSync(this.tokensFilePath)) {
        const tokenData = JSON.parse(fs.readFileSync(this.tokensFilePath, 'utf8'));
        
        // Check if tokens are still valid
        if (tokenData.expiry_date && tokenData.expiry_date > Date.now()) {
          this.oauth2Client.setCredentials(tokenData);
          this.logger.log('Loaded valid stored OAuth 2.0 tokens');
        } else {
          this.logger.log('Stored tokens are expired, need re-authentication');
        }
      }
    } catch (error) {
      this.logger.warn('Failed to load stored tokens:', error.message);
    }
  }

  async hasValidTokens(): Promise<boolean> {
    try {
      if (!this.oauth2Client) return false;
      
      const credentials = this.oauth2Client.credentials;
      if (!credentials || !credentials.access_token) return false;
      
      // Check if token is expired
      if (credentials.expiry_date && credentials.expiry_date <= Date.now()) {
        // Try to refresh token
        if (credentials.refresh_token) {
          try {
            await this.refreshAccessToken();
            return true;
          } catch (error) {
            this.logger.warn('Failed to refresh access token:', error.message);
            return false;
          }
        }
        return false;
      }
      
      return true;
    } catch (error) {
      this.logger.error('Error checking token validity:', error.message);
      return false;
    }
  }

  async refreshAccessToken(): Promise<void> {
    try {
      if (!this.oauth2Client) {
        throw new Error('OAuth 2.0 client not initialized');
      }

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      
      // Update stored tokens
      await this.storeTokens(credentials as GoogleTokens);
      
      // Also update database tokens
      await this.autoSaveTokensToDatabase(credentials as GoogleTokens);
      
      this.logger.log('Access token refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error.message);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  getOAuth2Client(): any {
    if (!this.oauth2Client) {
      throw new Error('OAuth 2.0 client not initialized');
    }
    return this.oauth2Client;
  }

  async revokeTokens(): Promise<void> {
    try {
      if (this.oauth2Client) {
        await this.oauth2Client.revokeCredentials();
      }
      
      // Remove stored tokens
      if (fs.existsSync(this.tokensFilePath)) {
        fs.unlinkSync(this.tokensFilePath);
      }
      
      this.logger.log('OAuth 2.0 tokens revoked and removed');
    } catch (error) {
      this.logger.error('Failed to revoke tokens:', error.message);
      throw new Error(`Token revocation failed: ${error.message}`);
    }
  }
}
