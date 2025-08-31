import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum ServiceType {
  GMAIL = 'GMAIL',
  OUTLOOK = 'OUTLOOK',
  YAHOO = 'YAHOO',
  ZOHO = 'ZOHO',
}

export class CreateMailAccountDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class UpdateMailAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MailAccountResponseDto {
  id: string;
  name: string;
  email: string;
  serviceType: ServiceType;
  isActive: boolean;
  isEncrypted: boolean;
  lastSync?: Date;
  syncStatus: 'success' | 'error' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}
