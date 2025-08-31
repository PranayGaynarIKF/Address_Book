import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageChannel, MESSAGE_CHANNELS } from '@/common/types/enums';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: MESSAGE_CHANNELS, description: 'Message channel' })
  @IsEnum(MESSAGE_CHANNELS)
  channel: MessageChannel;

  @ApiProperty({ description: 'Template body with variables like {{name}}, {{company}}' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: MESSAGE_CHANNELS })
  @IsOptional()
  @IsEnum(MESSAGE_CHANNELS)
  channel?: MessageChannel;

  @ApiPropertyOptional({ description: 'Template body' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: MESSAGE_CHANNELS })
  channel: MessageChannel;

  @ApiProperty()
  body: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
