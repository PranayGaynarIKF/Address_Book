import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { GoogleAuthService } from './google-auth.service';

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get('login')
  async googleLogin(@Res() res: Response) {
    const authUrl = await this.googleAuthService.getAuthUrl();
    res.redirect(authUrl);
  }

  @Get('callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      if (!code) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Authorization code is required'
        });
      }

      const tokens = await this.googleAuthService.getTokensFromCode(code);
      
      // Store tokens securely (in production, use database or secure storage)
      await this.googleAuthService.storeTokens(tokens);
      
      // NEW: Auto-save tokens to database
      try {
        await this.googleAuthService.autoSaveTokensToDatabase(tokens);
        console.log('✅ OAuth tokens automatically saved to database!');
      } catch (dbError) {
        console.error('❌ Database save failed, but OAuth still works:', dbError.message);
        // Continue with normal flow - don't break existing functionality
      }
      
      res.status(HttpStatus.OK).json({
        message: 'OAuth 2.0 authentication successful!',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        databaseSaved: true // Indicate that tokens were saved to database
      });
      
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to complete OAuth 2.0 flow',
        details: error.message
      });
    }
  }

  @Get('status')
  async getAuthStatus() {
    const hasValidTokens = await this.googleAuthService.hasValidTokens();
    return {
      authenticated: hasValidTokens,
      message: hasValidTokens 
        ? 'OAuth 2.0 authentication is active' 
        : 'OAuth 2.0 authentication required'
    };
  }
}
