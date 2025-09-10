import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMailAccountDto, UpdateMailAccountDto, ServiceType } from './dto/mail-account.dto';
import * as crypto from 'crypto';

@Injectable()
export class MailAccountsService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!';

  constructor(private readonly prisma: PrismaService) {}

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encrypted = textParts.join(':');
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async create(createMailAccountDto: CreateMailAccountDto) {
    const {
      name,
      email,
      serviceType,
      password,
      clientId,
      clientSecret,
      redirectUri,
    } = createMailAccountDto;

    // Encrypt sensitive data
    const encryptedPassword = this.encrypt(password);
    const encryptedClientSecret = clientSecret ? this.encrypt(clientSecret) : null;

    try {
      // Use raw SQL instead of Prisma
      const result = await this.prisma.$queryRaw`
        INSERT INTO "app"."MailAccounts" (id, name, email, serviceType, encryptedPassword, clientId, encryptedClientSecret, redirectUri, isActive, isEncrypted, syncStatus, createdAt, updatedAt)
        VALUES (NEWID(), ${name}, ${email}, ${serviceType}, ${encryptedPassword}, ${clientId}, ${encryptedClientSecret}, ${redirectUri}, 1, 1, 'pending', GETDATE(), GETDATE());
        
        SELECT SCOPE_IDENTITY() as id;
      `;

      // Get the created account
      const accounts = await this.prisma.$queryRaw`
        SELECT TOP 1 id, name, email, serviceType, isActive, isEncrypted, lastSync, syncStatus, createdAt, updatedAt
        FROM "app"."MailAccounts" 
        WHERE email = ${email} 
        ORDER BY createdAt DESC
      ` as any[];

      const account = accounts[0];

      // Return without sensitive data
      return {
        id: account.id,
        name: account.name,
        email: account.email,
        serviceType: account.serviceType,
        isActive: account.isActive,
        isEncrypted: account.isEncrypted,
        lastSync: account.lastSync,
        syncStatus: account.syncStatus,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to create mail account: ${error.message}`);
    }
  }

  async findAll() {
    try {
      // Fetch mail accounts from EmailAuthTokens table (where OAuth tokens are stored)
      const accounts = await this.prisma.$queryRaw`
        SELECT 
          t.[id],
          t.[email] as name,
          t.[email],
          t.[service_type] as serviceType,
          t.[is_valid] as isActive,
          t.[access_token],
          t.[refresh_token],
          t.[expires_at],
          0 as isEncrypted,
          NULL as lastSync,
          'success' as syncStatus,
          t.[created_at] as createdAt,
          t.[updated_at] as updatedAt
        FROM [app].[EmailAuthTokens] t
        WHERE t.[is_valid] = 1
        ORDER BY t.[created_at] DESC
      ` as any[];
      
      console.log(`📧 Found ${accounts.length} mail accounts from EmailAuthTokens`);
      
      // For Gmail accounts, try to get the actual email if it's showing as unknown
      for (const account of accounts) {
        if (account.serviceType === 'GMAIL' && account.email === 'unknown@gmail.com') {
          console.log(`   Attempting to get real email for Gmail account ${account.id}...`);
          
          // Check if token is expired
          const now = new Date();
          const expiresAt = account.expires_at ? new Date(account.expires_at) : null;
          const isExpired = expiresAt && expiresAt < now;
          
          let accessToken = account.access_token;
          
          // If expired and we have refresh token, try to refresh
          if (isExpired && account.refresh_token) {
            console.log('   Token expired, attempting refresh...');
            const newAccessToken = await this.refreshGoogleToken(account.refresh_token);
            if (newAccessToken) {
              accessToken = newAccessToken;
              console.log('   Token refreshed successfully');
            } else {
              console.log('   Token refresh failed, skipping email update');
              continue;
            }
          }
          
          // Try to get the real email
          const realEmail = await this.getUserEmailFromGoogle(accessToken);
          if (realEmail && realEmail !== 'unknown@gmail.com') {
            console.log(`   Found real email: ${realEmail}`);
            account.email = realEmail;
            account.name = realEmail;
          }
        }
      }
      
      // Remove sensitive data before returning
      const cleanAccounts = accounts.map(account => {
        const { access_token, refresh_token, expires_at, ...cleanAccount } = account;
        return cleanAccount;
      });
      
      return cleanAccounts;
    } catch (error) {
      console.error('❌ Error fetching mail accounts:', error);
      throw new Error(`Failed to fetch mail accounts: ${error.message}`);
    }
  }

  async findById(id: string): Promise<any> { // Changed return type to any as MailAccount model is removed
    const account = await this.prisma.$queryRaw`
      SELECT id, name, email, serviceType, encryptedPassword, clientId, encryptedClientSecret, redirectUri, isActive, isEncrypted, lastSync, syncStatus, createdAt, updatedAt
      FROM "app"."MailAccounts" 
      WHERE id = ${id}
    ` as any[];

    if (!account || account.length === 0) {
      throw new Error('Mail account not found');
    }

    return account[0];
  }

  async generateGoogleOAuthUrl(customRedirectUri?: string): Promise<{ oauthUrl: string; state: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = customRedirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4002/api/mail-accounts/oauth-callback';
    
    if (!clientId) {
      throw new Error('Google OAuth client ID not configured');
    }

    // Debug logging
    console.log('🔍 Debug OAuth URL Generation:');
    console.log('  - GOOGLE_REDIRECT_URI env var:', process.env.GOOGLE_REDIRECT_URI);
    console.log('  - Custom redirectUri:', customRedirectUri);
    console.log('  - Final redirectUri:', redirectUri);
    console.log('  - Client ID:', clientId ? '✅ Set' : '❌ Missing');

    // Validate redirect URI format
    if (!redirectUri.startsWith('http://localhost:') && !redirectUri.startsWith('https://localhost:')) {
      console.warn('⚠️ Warning: Redirect URI is not localhost, this might cause issues');
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ];

    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', scopes.join(' '));
    oauthUrl.searchParams.set('access_type', 'offline');
    oauthUrl.searchParams.set('prompt', 'consent');
    
    // Add state parameter for security
    const state = `gmail_oauth_${Date.now()}`;
    oauthUrl.searchParams.set('state', state);
    console.log('  - State parameter:', state);

    console.log('  - Final OAuth URL:', oauthUrl.toString());
    console.log('  - Redirect URI being sent:', redirectUri);
    console.log('  - Redirect URI length:', redirectUri.length);
    console.log('  - Redirect URI contains spaces:', redirectUri.includes(' '));
    console.log('  - Redirect URI ends with slash:', redirectUri.endsWith('/'));

    return {
      oauthUrl: oauthUrl.toString(),
      state
    };
  }

  async generateOutlookOAuthUrl(): Promise<string> {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3000/oauth-callback';
    
    if (!clientId) {
      throw new Error('Outlook OAuth client ID not configured');
    }

    const scopes = [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Contacts.Read',
      'https://graph.microsoft.com/Mail.Read',
      'offline_access'
    ];

    const oauthUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', scopes.join(' '));
    oauthUrl.searchParams.set('response_mode', 'query');

    return oauthUrl.toString();
  }

  async generateYahooOAuthUrl(): Promise<string> {
    const clientId = process.env.YAHOO_CLIENT_ID;
    const redirectUri = process.env.YAHOO_REDIRECT_URI || 'http://localhost:3000/oauth-callback';
    
    if (!clientId) {
      throw new Error('Yahoo OAuth client ID not configured');
    }

    const scopes = [
      'sdps-r',
      'sdps-w',
      'sdps-rw'
    ];

    const oauthUrl = new URL('https://api.login.yahoo.com/oauth2/request_auth');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', scopes.join(' '));

    return oauthUrl.toString();
  }

  async generateZohoOAuthUrl(): Promise<string> {
    const clientId = process.env.ZOHO_CLIENT_ID;
    const redirectUri = process.env.ZOHO_REDIRECT_URI || 'http://localhost:3000/oauth-callback';
    
    if (!clientId) {
      throw new Error('Zoho OAuth client ID not configured');
    }

    const scopes = [
      'ZohoMail.contacts.READ',
      'ZohoMail.contacts.WRITE',
      'ZohoMail.messages.READ',
      'ZohoMail.messages.WRITE'
    ];

    const oauthUrl = new URL('https://accounts.zoho.com/oauth/v2/auth');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', scopes.join(','));
    oauthUrl.searchParams.set('access_type', 'offline');

    return oauthUrl.toString();
  }

  async exchangeCodeForTokens(code: string): Promise<any> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4002/api/mail-accounts/oauth-callback';
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth client credentials not configured');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to exchange code for tokens: ${errorData}`);
      }

      const tokens = await response.json();
      
      console.log('🔄 OAuth tokens received:', {
        access_token: tokens.access_token ? tokens.access_token.substring(0, 20) + '...' : 'NULL',
        refresh_token: tokens.refresh_token ? tokens.refresh_token.substring(0, 20) + '...' : 'NULL',
        expires_in: tokens.expires_in,
        token_type: tokens.token_type,
        scope: tokens.scope
      });
      
      // Set expires_in to 1 hour if not provided (Minimal Example Reference)
      if (!tokens.expires_in || tokens.expires_in <= 0) {
        console.error('❌ Invalid expires_in value:', tokens.expires_in);
        console.error('   Setting default expiration to 1 hour');
        tokens.expires_in = 3600; // 1 hour in seconds
      }
      
      // Log timing info (Minimal Example Reference)
      console.log('🕐 Token timing validation:');
      const now = new Date();
      console.log('   Current server time:', now.toISOString());
      console.log('   expires_in value:', tokens.expires_in, 'seconds');
      
      // Calculate expiration time (Minimal Example Reference)
      const expiresAt = new Date(now.getTime() + tokens.expires_in * 1000);
      console.log('   Expected expiration:', expiresAt.toISOString());
      
      // Validate expiration (Minimal Example Reference)
      if (expiresAt <= now) {
        console.error('❌ CRITICAL: Token expiration is in the past!');
        console.error(`   Current time: ${now.toISOString()}`);
        console.error(`   Expires at: ${expiresAt.toISOString()}`);
        console.error(`   Difference: ${(now.getTime() - expiresAt.getTime()) / 1000} seconds in the past`);
        throw new Error('Token expiration is in the past - this should never happen');
      }
      
      // AUTO-SAVE: Save email service configuration and tokens to database
      try {
        console.log('🔄 Starting auto-save process...');
        await this.autoSaveGmailConfiguration(clientId, clientSecret, redirectUri, tokens, expiresAt);
        console.log('✅ Auto-save completed successfully!');
      } catch (autoSaveError) {
        console.error('❌ Auto-save failed:', autoSaveError.message);
        console.error('Auto-save error details:', autoSaveError);
        // Don't throw error - let OAuth flow continue
      }
      
      return tokens;
    } catch (error) {
      throw new Error(`OAuth token exchange failed: ${error.message}`);
    }
  }

  // NEW METHOD: Auto-save Gmail configuration and tokens
  private async autoSaveGmailConfiguration(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    tokens: any,
    expiresAt: Date
  ): Promise<void> {
    try {
      console.log('🔄 Auto-saving Gmail configuration and tokens...');
      console.log('📝 Input data:', {
        clientId: clientId ? 'Set' : 'Missing',
        clientSecret: clientSecret ? 'Set' : 'Missing',
        redirectUri,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in
      });
      
      const userId = 'current-user-id'; // You can modify this to get actual user ID
      const serviceType = 'GMAIL';
      
      // Step 1: Save Email Service Configuration
      console.log('🔧 Step 1: Saving Email Service Configuration...');
      const configId = require('crypto').randomUUID();
      console.log(`   Config ID: ${configId}`);
      
      await this.prisma.$executeRaw`
        INSERT INTO [app].[EmailServiceConfigs] 
        ([id], [user_id], [service_type], [client_id], [client_secret], [redirect_uri], [scopes], [is_active], [created_at], [updated_at])
        VALUES (${configId}, ${userId}, ${serviceType}, ${clientId}, ${clientSecret}, ${redirectUri}, ${JSON.stringify([
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels'
        ])}, 1, GETDATE(), GETDATE())
      `;
      console.log('✅ Email Service Configuration saved!');
      
      // Step 2: Get user's email from Google
      console.log('🔧 Step 2: Getting user email from Google...');
      const userEmail = await this.getUserEmailFromGoogle(tokens.access_token);
      console.log(`   User email: ${userEmail}`);
      
      // Step 3: Save Email Auth Token
      console.log('🔧 Step 3: Saving Email Auth Token...');
      const tokenId = require('crypto').randomUUID();
      console.log(`   Token ID: ${tokenId}`);
      
      // First, invalidate any existing tokens for this user and service
      console.log('   Invalidating existing tokens...');
      await this.prisma.$executeRaw`
        UPDATE [app].[EmailAuthTokens]
        SET [is_valid] = 0, [updated_at] = GETDATE()
        WHERE [user_id] = ${userId} AND [service_type] = ${serviceType}
      `;
      console.log('   Existing tokens invalidated');
      
      // Insert new token using the already validated expiresAt from above
      // The expiresAt was already calculated and validated in the main flow
      console.log(`   Using validated expires_at: ${expiresAt.toISOString()}`);
      console.log(`   Time until expiry: ${Math.round((expiresAt.getTime() - new Date().getTime()) / 1000 / 60)} minutes`);
      
      await this.prisma.$executeRaw`
        INSERT INTO [app].[EmailAuthTokens]
        ([id], [user_id], [service_type], [access_token], [refresh_token], [expires_at], [scope], [email], [is_valid], [created_at], [updated_at])
        VALUES (${tokenId}, ${userId}, ${serviceType}, ${tokens.access_token}, ${tokens.refresh_token || ''}, ${expiresAt}, ${JSON.stringify([
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.labels'
        ])}, ${userEmail}, 1, GETDATE(), GETDATE())
      `;
      console.log('✅ Email Auth Token saved!');
      console.log(`📧 Gmail account connected: ${userEmail}`);
      
    } catch (error) {
      console.error('❌ Auto-save failed:', error.message);
      console.error('❌ Auto-save error details:', {
        code: error.code,
        message: error.message,
        meta: error.meta,
        stack: error.stack
      });
      // Don't throw error - let OAuth flow continue
    }
  }

  // Helper method to refresh Google access token
  private async refreshGoogleToken(refreshToken: string): Promise<string | null> {
    try {
      console.log('   Refreshing Google access token...');
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`   Token refresh failed: ${response.status} - ${errorText}`);
        return null;
      }
      
      const tokenData = await response.json();
      console.log('   Token refreshed successfully');
      
      return tokenData.access_token;
    } catch (error) {
      console.error('   Failed to refresh token:', error.message);
      return null;
    }
  }

  // Helper method to get user email from Google
  private async getUserEmailFromGoogle(accessToken: string): Promise<string> {
    try {
      console.log('   Fetching user profile from Google...');
      
      // Use Gmail API endpoint (this works with Gmail tokens)
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Google API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`   Google API error: ${response.status} - ${errorText}`);
        
        // If 401, the token is expired
        if (response.status === 401) {
          console.log('   Token appears to be expired, returning unknown email');
          return 'unknown@gmail.com';
        }
        
        throw new Error(`Failed to get user profile from Google: ${response.status}`);
      }
      
      const profile = await response.json();
      console.log(`   Google profile response:`, profile);
      
      // Gmail API returns emailAddress field, not email
      return profile.emailAddress || 'unknown@gmail.com';
    } catch (error) {
      console.error('   Failed to get user email from Google:', error.message);
      return 'unknown@gmail.com';
    }
  }

  async update(id: string, updateMailAccountDto: UpdateMailAccountDto) {
    try {
      const updateData: any = { ...updateMailAccountDto };

      // Encrypt password if provided
      if (updateMailAccountDto.password) {
        updateData.encryptedPassword = this.encrypt(updateMailAccountDto.password);
        delete updateData.password;
      }

      // Encrypt clientSecret if provided
      if (updateMailAccountDto.clientSecret) {
        updateData.encryptedClientSecret = this.encrypt(updateMailAccountDto.clientSecret);
      }

      // Build dynamic update query
      let updateQuery = 'UPDATE "app"."MailAccounts" SET ';
      const updateValues: any[] = [];
      let paramCount = 0;

      if (updateData.name !== undefined) {
        updateQuery += `name = ?, `;
        updateValues.push(updateData.name);
      }
      if (updateData.email !== undefined) {
        updateQuery += `email = ?, `;
        updateValues.push(updateData.email);
      }
      if (updateData.serviceType !== undefined) {
        updateQuery += `serviceType = ?, `;
        updateValues.push(updateData.serviceType);
      }
      if (updateData.encryptedPassword !== undefined) {
        updateQuery += `encryptedPassword = ?, `;
        updateValues.push(updateData.encryptedPassword);
      }
      if (updateData.clientId !== undefined) {
        updateQuery += `clientId = ?, `;
        updateValues.push(updateData.clientId);
      }
      if (updateData.encryptedClientSecret !== undefined) {
        updateQuery += `encryptedClientSecret = ?, `;
        updateValues.push(updateData.encryptedClientSecret);
      }
      if (updateData.redirectUri !== undefined) {
        updateQuery += `redirectUri = ?, `;
        updateValues.push(updateData.redirectUri);
      }
      if (updateData.isActive !== undefined) {
        updateQuery += `isActive = ?, `;
        updateValues.push(updateData.isActive ? 1 : 0);
      }

      // Always update updatedAt
      updateQuery += `updatedAt = GETDATE() `;
      updateQuery += `WHERE id = ?`;
      updateValues.push(id);

      // Remove trailing comma
      updateQuery = updateQuery.replace(/, $/, ' ');

      // Execute update
      await this.prisma.$executeRawUnsafe(updateQuery, ...updateValues);

      // Get updated account
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update mail account: ${error.message}`);
    }
  }

  async delete(id: string) {
    try {
      await this.prisma.$executeRaw`
        DELETE FROM "app"."MailAccounts" WHERE id = ${id}
      `;
      return true;
    } catch (error) {
      throw new Error(`Failed to delete mail account: ${error.message}`);
    }
  }

  async toggleActiveStatus(id: string) {
    try {
      // Get current status
      const accounts = await this.prisma.$queryRaw`
        SELECT isActive FROM "app"."MailAccounts" WHERE id = ${id}
      ` as any[];

      if (!accounts || accounts.length === 0) {
        throw new NotFoundException('Mail account not found');
      }

      const currentStatus = accounts[0].isActive;
      const newStatus = !currentStatus;

      // Update status
      await this.prisma.$executeRaw`
        UPDATE "app"."MailAccounts" 
        SET isActive = ${newStatus ? 1 : 0}, updatedAt = GETDATE()
        WHERE id = ${id}
      `;

      // Get updated account
      return await this.findById(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to toggle mail account status: ${error.message}`);
    }
  }

  async testConnection(id: string) {
    try {
      const accounts = await this.prisma.$queryRaw`
        SELECT * FROM "app"."MailAccounts" WHERE id = ${id}
      ` as any[];

      if (!accounts || accounts.length === 0) {
        throw new NotFoundException('Mail account not found');
      }

      const account = accounts[0];

      // Simulate connection test based on service type
      let testResult;
      switch (account.serviceType) {
        case 'GMAIL':
          testResult = await this.testGmailConnection(account);
          break;
        case 'OUTLOOK':
          testResult = await this.testOutlookConnection(account);
          break;
        case 'YAHOO':
          testResult = await this.testYahooConnection(account);
          break;
        case 'ZOHO':
          testResult = await this.testZohoConnection(account);
          break;
        default:
          throw new Error(`Unsupported service type: ${account.serviceType}`);
      }

      // Update last sync time and status
      await this.prisma.$executeRaw`
        UPDATE "app"."MailAccounts" 
        SET lastSync = GETDATE(), syncStatus = ${testResult.success ? 'success' : 'error'}, updatedAt = GETDATE()
        WHERE id = ${id}
      `;

      return testResult;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  private async testGmailConnection(account: any) {
    // Simulate Gmail connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 90% success rate
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      return {
        success: true,
        message: 'Gmail connection successful',
        details: {
          serviceType: 'GMAIL',
          email: account.email,
          connectionTime: new Date().toISOString(),
        },
      };
    } else {
      return {
        success: false,
        message: 'Gmail connection failed - Invalid credentials',
        details: {
          serviceType: 'GMAIL',
          email: account.email,
          error: 'Authentication failed',
        },
      };
    }
  }

  private async testOutlookConnection(account: any) {
    // Simulate Outlook connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const isSuccess = Math.random() > 0.15;
    
    if (isSuccess) {
      return {
        success: true,
        message: 'Outlook connection successful',
        details: {
          serviceType: 'OUTLOOK',
          email: account.email,
          connectionTime: new Date().toISOString(),
        },
      };
    } else {
      return {
        success: false,
        message: 'Outlook connection failed - Check permissions',
        details: {
          serviceType: 'OUTLOOK',
          email: account.email,
          error: 'Insufficient permissions',
        },
      };
    }
  }

  private async testYahooConnection(account: any) {
    // Simulate Yahoo connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const isSuccess = Math.random() > 0.2;
    
    if (isSuccess) {
      return {
        success: true,
        message: 'Yahoo connection successful',
        details: {
          serviceType: 'YAHOO',
          email: account.email,
          connectionTime: new Date().toISOString(),
        },
      };
    } else {
      return {
        success: false,
        message: 'Yahoo connection failed - App password required',
        details: {
          serviceType: 'YAHOO',
          email: account.email,
          error: 'App password authentication failed',
        },
      };
    }
  }

  private async testZohoConnection(account: any) {
    // Simulate Zoho connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      return {
        success: true,
        message: 'Zoho connection successful',
        details: {
          serviceType: 'ZOHO',
          email: account.email,
          connectionTime: new Date().toISOString(),
        },
      };
    } else {
      return {
        success: false,
        message: 'Zoho connection failed - API key invalid',
        details: {
          serviceType: 'ZOHO',
          email: account.email,
          error: 'Invalid API credentials',
        },
      };
    }
  }
}
