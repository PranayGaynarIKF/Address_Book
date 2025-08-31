import { Controller, Get, Post, Body, Param, Res, HttpStatus, Query } from '@nestjs/common';
import { Response } from 'express';
import { DynamicOAuthService } from './dynamic-oauth.service';

@Controller('auth')
export class DynamicOAuthController {
  constructor(private readonly dynamicOAuthService: DynamicOAuthService) {}

  // Connect Gmail Account - Step 1: Get OAuth URL
  @Post(':userId/gmail/connect')
  async connectGmailAccount(
    @Param('userId') userId: string,
    @Body() body: { accountName: string; clientId: string; clientSecret: string },
    @Res() res: Response
  ) {
    try {
      console.log(`🔄 User ${userId} requesting Gmail connection for account: ${body.accountName}`);
      
      // Generate OAuth URL with user-specific credentials
      const authUrl = await this.dynamicOAuthService.generateGmailAuthUrl(
        userId,
        body.accountName,
        body.clientId,
        body.clientSecret
      );
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Gmail OAuth URL generated successfully',
        authUrl,
        userId,
        accountName: body.accountName
      });
      
    } catch (error) {
      console.error(`❌ Failed to generate Gmail OAuth URL for user ${userId}:`, error.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to generate OAuth URL',
        details: error.message
      });
    }
  }

  // Gmail OAuth Callback - Step 2: Handle OAuth response
  @Get(':userId/gmail/callback')
  async gmailOAuthCallback(
    @Param('userId') userId: string,
    @Query('code') code: string,
    @Query('state') state: string, // Contains accountName
    @Res() res: Response
  ) {
    try {
      if (!code) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Authorization code is required'
        });
      }

      if (!state) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'State parameter is required'
        });
      }

      console.log(`🔄 User ${userId} completing Gmail OAuth for account: ${state}`);
      
      // Complete OAuth flow and save tokens
      const result = await this.dynamicOAuthService.completeGmailOAuth(
        userId,
        state, // accountName
        code
      );
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Gmail OAuth completed successfully!',
        userId,
        accountName: state,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        databaseSaved: true
      });
      
    } catch (error) {
      console.error(`❌ Gmail OAuth callback failed for user ${userId}:`, error.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to complete OAuth flow',
        details: error.message
      });
    }
  }

  // Alternative: Direct Gmail OAuth Callback (simpler approach)
  @Post(':userId/gmail/callback-direct')
  async gmailOAuthCallbackDirect(
    @Param('userId') userId: string,
    @Body() body: { 
      accountName: string; 
      clientId: string; 
      clientSecret: string; 
      code: string 
    },
    @Res() res: Response
  ) {
    try {
      if (!body.code || !body.clientId || !body.clientSecret || !body.accountName) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Missing required parameters: code, clientId, clientSecret, accountName'
        });
      }

      console.log(`🔄 User ${userId} completing Gmail OAuth DIRECT for account: ${body.accountName}`);
      
      // Complete OAuth flow directly with provided credentials
      const result = await this.dynamicOAuthService.completeGmailOAuthDirect(
        userId,
        body.accountName,
        body.clientId,
        body.clientSecret,
        body.code
      );
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Gmail OAuth completed successfully with direct method!',
        userId,
        accountName: body.accountName,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        email: result.email,
        databaseSaved: true,
        method: 'direct'
      });
      
    } catch (error) {
      console.error(`❌ Gmail OAuth DIRECT callback failed for user ${userId}:`, error.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to complete OAuth flow with direct method',
        details: error.message
      });
    }
  }

  // Get User's Gmail Accounts
  @Get(':userId/gmail/accounts')
  async getUserGmailAccounts(@Param('userId') userId: string) {
    try {
      const accounts = await this.dynamicOAuthService.getUserGmailAccounts(userId);
      return {
        success: true,
        userId,
        accounts
      };
    } catch (error) {
      console.error(`❌ Failed to get Gmail accounts for user ${userId}:`, error.message);
      throw error;
    }
  }

  // Disconnect Gmail Account
  @Post(':userId/gmail/:accountName/disconnect')
  async disconnectGmailAccount(
    @Param('userId') userId: string,
    @Param('accountName') accountName: string
  ) {
    try {
      await this.dynamicOAuthService.disconnectGmailAccount(userId, accountName);
      return {
        success: true,
        message: `Gmail account '${accountName}' disconnected successfully`,
        userId,
        accountName
      };
    } catch (error) {
      console.error(`❌ Failed to disconnect Gmail account for user ${userId}:`, error.message);
      throw error;
    }
  }

  // Test Gmail Account Connection
  @Post(':userId/gmail/:accountName/test')
  async testGmailAccount(
    @Param('userId') userId: string,
    @Param('accountName') accountName: string
  ) {
    try {
      const result = await this.dynamicOAuthService.testGmailAccount(userId, accountName);
      return {
        success: true,
        message: 'Gmail account test completed',
        userId,
        accountName,
        isConnected: result.isConnected,
        email: result.email,
        scopes: result.scopes
      };
    } catch (error) {
      console.error(`❌ Failed to test Gmail account for user ${userId}:`, error.message);
      throw error;
    }
  }

  // Get OAuth Status for User
  @Get(':userId/oauth/status')
  async getOAuthStatus(@Param('userId') userId: string) {
    try {
      const status = await this.dynamicOAuthService.getUserOAuthStatus(userId);
      return {
        success: true,
        userId,
        status
      };
    } catch (error) {
      console.error(`❌ Failed to get OAuth status for user ${userId}:`, error.message);
      throw error;
    }
  }
}
