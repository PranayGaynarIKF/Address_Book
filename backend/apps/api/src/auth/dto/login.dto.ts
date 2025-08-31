import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'your_password'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer'
  })
  token_type: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 86400
  })
  expires_in: number;

  @ApiProperty({
    description: 'User information',
    example: {
      email: 'admin@example.com',
      sub: 'admin@example.com'
    }
  })
  user: {
    email: string;
    sub: string;
  };
}
