import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiBody 
} from '@nestjs/swagger';
import { MailAccountsService } from './mail-accounts.service';
import { CreateMailAccountDto, UpdateMailAccountDto } from './dto/mail-account.dto';
// import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Mail Accounts')
// @ApiBearerAuth('JWT-auth')
@Controller('api/mail-accounts')
// @UseGuards(JwtAuthGuard)
export class MailAccountsController {
  constructor(private readonly mailAccountsService: MailAccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mail account' })
  @ApiBody({ type: CreateMailAccountDto })
  @ApiResponse({ status: 201, description: 'Mail account created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async createMailAccount(@Body() createMailAccountDto: CreateMailAccountDto) {
    try {
      const result = await this.mailAccountsService.create(createMailAccountDto);
      return {
        success: true,
        message: 'Mail account created successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all mail accounts' })
  @ApiResponse({ status: 200, description: 'List of mail accounts retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAllMailAccounts() {
    try {
      const accounts = await this.mailAccountsService.findAll();
      return {
        success: true,
        message: 'Mail accounts retrieved successfully',
        data: accounts,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // OAuth callback route - MUST come before @Get(':id') to avoid route conflict
  @Get('oauth-callback')
  @ApiOperation({ summary: 'Handle OAuth callback from Google (GET)' })
  @ApiResponse({ status: 200, description: 'OAuth callback handled successfully' })
  @ApiResponse({ status: 400, description: 'OAuth callback failed' })
  async handleOAuthCallbackGet(@Query('code') code: string, @Query('state') state?: string) {
    try {
      if (!code) {
        throw new Error('Authorization code not provided');
      }

      const tokens = await this.mailAccountsService.exchangeCodeForTokens(code);
      return {
        success: true,
        message: 'OAuth authentication successful',
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('oauth-callback')
  @ApiOperation({ summary: 'Handle OAuth callback from email provider (POST)' })
  @ApiBody({ 
    type: Object, 
    description: 'OAuth callback data',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        state: { type: 'string' },
        provider: { type: 'string' }
      },
      required: ['code', 'provider']
    }
  })
  @ApiResponse({ status: 200, description: 'OAuth callback handled successfully' })
  @ApiResponse({ status: 400, description: 'OAuth callback failed' })
  async handleOAuthCallbackPost(@Body() body: { code: string; state?: string; provider: string }) {
    try {
      const { code, state, provider } = body;
      
      if (!code) {
        throw new Error('Authorization code not provided');
      }

      const tokens = await this.mailAccountsService.exchangeCodeForTokens(code);
      return {
        success: true,
        message: `${provider} OAuth authentication successful`,
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
          scope: tokens.scope,
          tokenType: tokens.token_type,
          expiryDate: tokens.expiry_date
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a mail account by ID' })
  @ApiParam({ name: 'id', description: 'Mail account ID' })
  @ApiResponse({ status: 200, description: 'Mail account retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Mail account not found' })
  async getMailAccountById(@Param('id') id: string) {
    try {
      const account = await this.mailAccountsService.findById(id);
      return {
        success: true,
        message: 'Mail account retrieved successfully',
        data: account,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('oauth-url')
  @ApiOperation({ summary: 'Generate OAuth URL for email provider' })
  @ApiBody({ 
    type: Object, 
    description: 'OAuth URL generation request',
    schema: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['gmail', 'outlook', 'yahoo', 'zoho'] },
        redirectUri: { type: 'string' }
      },
      required: ['provider']
    }
  })
  @ApiResponse({ status: 200, description: 'OAuth URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Failed to generate OAuth URL' })
  async generateOAuthUrl(@Body() body: { provider: string; redirectUri?: string }) {
    try {
      const { provider, redirectUri } = body;
      
      let oauthUrl: string;
      let state: string;
      
      switch (provider.toLowerCase()) {
        case 'gmail':
          const gmailResult = await this.mailAccountsService.generateGoogleOAuthUrl(redirectUri);
          oauthUrl = gmailResult.oauthUrl;
          state = gmailResult.state;
          break;
        case 'outlook':
          oauthUrl = await this.mailAccountsService.generateOutlookOAuthUrl();
          state = `outlook_oauth_${Date.now()}`;
          break;
        case 'yahoo':
          oauthUrl = await this.mailAccountsService.generateYahooOAuthUrl();
          state = `yahoo_oauth_${Date.now()}`;
          break;
        case 'zoho':
          oauthUrl = await this.mailAccountsService.generateZohoOAuthUrl();
          state = `zoho_oauth_${Date.now()}`;
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      return {
        success: true,
        message: `${provider} OAuth URL generated successfully`,
        authUrl: oauthUrl,
        state,
        redirectUri: redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('google-oauth')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiBody({ type: Object, description: 'Google OAuth initiation' })
  @ApiResponse({ status: 200, description: 'OAuth URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Failed to generate OAuth URL' })
  async initiateGoogleOAuth() {
    try {
      const result = await this.mailAccountsService.generateGoogleOAuthUrl();
      return {
        success: true,
        message: 'Google OAuth URL generated successfully',
        data: {
          oauthUrl: result.oauthUrl,
          state: result.state,
          redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4002/api/mail-accounts/oauth-callback'
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('outlook-oauth')
  @ApiOperation({ summary: 'Initiate Outlook OAuth flow' })
  @ApiBody({ type: Object, description: 'Outlook OAuth initiation' })
  @ApiResponse({ status: 200, description: 'OAuth URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Failed to generate OAuth URL' })
  async initiateOutlookOAuth() {
    try {
      const oauthUrl = await this.mailAccountsService.generateOutlookOAuthUrl();
      return {
        success: true,
        message: 'Outlook OAuth URL generated successfully',
        data: {
          oauthUrl,
          redirectUri: process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3000/oauth-callback'
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('yahoo-oauth')
  @ApiOperation({ summary: 'Initiate Yahoo OAuth flow' })
  @ApiBody({ type: Object, description: 'Yahoo OAuth initiation' })
  @ApiResponse({ status: 200, description: 'OAuth URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Failed to generate OAuth URL' })
  async initiateYahooOAuth() {
    try {
      const oauthUrl = await this.mailAccountsService.generateYahooOAuthUrl();
      return {
        success: true,
        message: 'Yahoo OAuth URL generated successfully',
        data: {
          oauthUrl,
          redirectUri: process.env.YAHOO_REDIRECT_URI || 'http://localhost:3000/oauth-callback'
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('zoho-oauth')
  @ApiOperation({ summary: 'Initiate Zoho OAuth flow' })
  @ApiBody({ type: Object, description: 'Zoho OAuth initiation' })
  @ApiResponse({ status: 200, description: 'OAuth URL generated successfully' })
  @ApiResponse({ status: 400, description: 'Failed to generate OAuth URL' })
  async initiateZohoOAuth() {
    try {
      const oauthUrl = await this.mailAccountsService.generateZohoOAuthUrl();
      return {
        success: true,
        message: 'Zoho OAuth URL generated successfully',
        data: {
          oauthUrl,
          redirectUri: process.env.ZOHO_REDIRECT_URI || 'http://localhost:3000/oauth-callback'
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a mail account' })
  @ApiParam({ name: 'id', description: 'Mail account ID' })
  @ApiBody({ type: UpdateMailAccountDto })
  @ApiResponse({ status: 200, description: 'Mail account updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Mail account not found' })
  async updateMailAccount(
    @Param('id') id: string,
    @Body() updateMailAccountDto: UpdateMailAccountDto,
  ) {
    try {
      const result = await this.mailAccountsService.update(id, updateMailAccountDto);
      return {
        success: true,
        message: 'Mail account updated successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a mail account' })
  @ApiParam({ name: 'id', description: 'Mail account ID' })
  @ApiResponse({ status: 200, description: 'Mail account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Mail account not found' })
  async deleteMailAccount(@Param('id') id: string) {
    try {
      await this.mailAccountsService.delete(id);
      return {
        success: true,
        message: 'Mail account deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle mail account active status' })
  @ApiParam({ name: 'id', description: 'Mail account ID' })
  @ApiResponse({ status: 200, description: 'Mail account status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Mail account not found' })
  async toggleActiveStatus(@Param('id') id: string) {
    try {
      const result = await this.mailAccountsService.toggleActiveStatus(id);
      return {
        success: true,
        message: 'Mail account status toggled successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post(':id/test-connection')
  @ApiOperation({ summary: 'Test mail account connection' })
  @ApiParam({ name: 'id', description: 'Mail account ID' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  @ApiResponse({ status: 404, description: 'Mail account not found' })
  async testConnection(@Param('id') id: string) {
    try {
      const result = await this.mailAccountsService.testConnection(id);
      return {
        success: true,
        message: 'Connection test completed',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('debug-oauth')
  @ApiOperation({ summary: 'Debug OAuth configuration' })
  @ApiResponse({ status: 200, description: 'OAuth configuration debug info' })
  async debugOAuthConfig() {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI;
      const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
      
      return {
        success: true,
        message: 'OAuth configuration debug info',
        data: {
          GOOGLE_CLIENT_ID: clientId ? '✅ Set' : '❌ Missing',
          GOOGLE_CLIENT_SECRET: hasClientSecret ? '✅ Set' : '❌ Missing',
          GOOGLE_REDIRECT_URI: redirectUri || '❌ Not set',
          currentTime: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
