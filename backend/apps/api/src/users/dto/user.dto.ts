import { IsString, IsEmail, IsOptional, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123'
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John'
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe'
  })
  @IsString()
  lastName: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'newpassword123',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    description: 'Whether user is active',
    example: true,
    required: false
  })
  @IsOptional()
  isActive?: boolean;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID'
  })
  id: string;

  @ApiProperty({
    description: 'User email address'
  })
  email: string;

  @ApiProperty({
    description: 'User first name'
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name'
  })
  lastName: string;

  @ApiProperty({
    description: 'Whether user is active'
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether email is verified'
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Last login timestamp'
  })
  lastLoginAt?: Date;

  @ApiProperty({
    description: 'User creation timestamp'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User last update timestamp'
  })
  updatedAt: Date;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ForgotPasswordResponseDto {
  message: string;
  emailSent: boolean;
}

export class ResetPasswordResponseDto {
  message: string;
  success: boolean;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123'
  })
  @IsString()
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token'
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type'
  })
  token_type: string;

  @ApiProperty({
    description: 'User information'
  })
  user: UserResponseDto;
}
