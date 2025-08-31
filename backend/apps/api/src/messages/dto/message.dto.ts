import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageChannel, MessageStatus, MESSAGE_CHANNELS, MESSAGE_STATUSES } from '@/common/types/enums';

export class PreviewMessageDto {
  @ApiProperty({ description: 'Template ID' })
  @IsString()
  templateId: string;

  @ApiProperty({ description: 'Variables for template rendering', type: 'object' })
  @IsObject()
  variables: Record<string, string>;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Contact ID' })
  @IsString()
  contactId: string;

  @ApiProperty({ description: 'Owner ID' })
  @IsString()
  ownerId: string;

  @ApiProperty({ enum: MESSAGE_CHANNELS })
  @IsEnum(MESSAGE_CHANNELS)
  channel: MessageChannel;

  @ApiPropertyOptional({ description: 'Template ID (if using template)' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Custom message body (if not using template)' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Variables for template rendering', type: 'object' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class WhatsAppWebhookDto {
  @ApiProperty({ description: 'Message ID from provider' })
  @IsString()
  messageId: string;

  @ApiProperty({ description: 'Message status' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  contactId: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty({ enum: MESSAGE_CHANNELS })
  channel: MessageChannel;

  @ApiPropertyOptional()
  templateId?: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ enum: MESSAGE_STATUSES })
  status: MessageStatus;

  @ApiPropertyOptional()
  providerMsgId?: string;

  @ApiPropertyOptional()
  meta?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PreviewResponseDto {
  @ApiProperty()
  renderedBody: string;

  @ApiProperty()
  templateId: string;
}
