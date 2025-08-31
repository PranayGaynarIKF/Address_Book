import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';

export class LoginDto {
  email: string;
  password: string;
}

export class LoginResponseDto {
  access_token: string;
  token_type: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    // Check if email is in admin emails
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(email)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // For demo purposes, accept any password for admin emails
    // In production, implement proper password validation
    if (!password) {
      throw new UnauthorizedException('Password is required');
    }
    
    const payload = { email, sub: email };
    const access_token = await this.jwtService.signAsync(payload);
    
    return {
      access_token,
      token_type: 'Bearer',
    };
  }
}
