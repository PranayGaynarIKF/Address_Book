import { Injectable, Logger } from '@nestjs/common';

export interface OutlookTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class OutlookAuthService {
  private readonly logger = new Logger(OutlookAuthService.name);
  private accessToken: string | null = null;

  constructor() {
    this.logger.log('Outlook OAuth service initialized');
  }

  async setAccessToken(token: string): Promise<void> {
    this.accessToken = token;
    this.logger.log('Outlook access token set successfully');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  hasValidToken(): boolean {
    return !!this.accessToken;
  }

  // Method to get OAuth URL for Microsoft Graph API
  getAuthUrl(): string {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:4002/auth/outlook/callback';
    const scopes = encodeURIComponent('https://graph.microsoft.com/User.Read https://graph.microsoft.com/Contacts.Read');
    
    if (!clientId) {
      throw new Error('OUTLOOK_CLIENT_ID not configured in environment variables');
    }

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
           `client_id=${clientId}&` +
           `response_type=code&` +
           `redirect_uri=${encodeURIComponent(redirectUri)}&` +
           `scope=${scopes}&` +
           `response_mode=query`;
  }

  // Method to exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<OutlookTokens> {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:4002/auth/outlook/callback';

    if (!clientId || !clientSecret) {
      throw new Error('OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET must be configured');
    }

    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const tokens = await response.json();
      this.accessToken = tokens.access_token;
      
      this.logger.log('Successfully exchanged authorization code for Outlook access token');
      return tokens;
    } catch (error) {
      this.logger.error('Failed to exchange authorization code for Outlook access token:', error);
      throw error;
    }
  }

  // Method to refresh access token
  async refreshAccessToken(refreshToken: string): Promise<OutlookTokens> {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET must be configured');
    }

    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const tokens = await response.json();
      this.accessToken = tokens.access_token;
      
      this.logger.log('Successfully refreshed Outlook access token');
      return tokens;
    } catch (error) {
      this.logger.error('Failed to refresh Outlook access token:', error);
      throw error;
    }
  }

  // Method to revoke tokens
  async revokeTokens(): Promise<void> {
    this.accessToken = null;
    this.logger.log('Outlook tokens revoked successfully');
  }
}
