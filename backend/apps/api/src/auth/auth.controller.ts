import { Controller, Post, Body, UnauthorizedException, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ForgotPasswordService } from '../users/forgot-password.service';
import { LoginDto, LoginResponseDto, ForgotPasswordDto, ResetPasswordDto, ForgotPasswordResponseDto, ResetPasswordResponseDto } from '../users/dto/user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private forgotPasswordService: ForgotPasswordService
  ) {}

  @Post('test')
  @ApiOperation({ summary: 'Test endpoint without validation' })
  async test(@Body() body: any) {
    return {
      message: 'Test endpoint working',
      receivedBody: body,
      timestamp: new Date().toISOString()
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'User login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    try {
      // Validate user credentials using UsersService
      const user = await this.usersService.validateUser(email, password);
      
      // Generate JWT token
      const payload = { 
        email: user.email, 
        sub: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      const access_token = await this.jwtService.signAsync(payload);
      
      return {
        access_token,
        token_type: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: LoginDto & { firstName: string; lastName: string }) {
    const { email, password, firstName, lastName } = registerDto;
    
    try {
      const user = await this.usersService.createUser({
        email,
        password,
        firstName,
        lastName
      });
      
      return {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      // Re-throw the original error to preserve the correct status code
      throw error;
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent', type: ForgotPasswordResponseDto })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.forgotPasswordService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using reset token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successful', type: ResetPasswordResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.forgotPasswordService.resetPassword(resetPasswordDto);
  }

  @Get('validate-reset-token')
  @ApiOperation({ summary: 'Validate password reset token' })
  @ApiQuery({ name: 'token', description: 'Reset token to validate' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validateResetToken(@Query('token') token: string) {
    return this.forgotPasswordService.validateResetToken(token);
  }
}
