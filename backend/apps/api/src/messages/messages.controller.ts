import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto, PreviewMessageDto, WhatsAppWebhookDto, MessageResponseDto, PreviewResponseDto } from './dto/message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview a message template with variables' })
  @ApiResponse({ status: 200, description: 'Message preview generated', type: PreviewResponseDto })
  @ApiResponse({ status: 404, description: 'Template not found' })
  previewMessage(@Body() previewDto: PreviewMessageDto) {
    return this.messagesService.previewMessage(previewDto);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send a message to a contact' })
  @ApiResponse({ status: 201, description: 'Message sent successfully', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Contact or owner not found' })
  sendMessage(@Body() sendDto: SendMessageDto) {
    return this.messagesService.sendMessage(sendDto);
  }

  @Post('webhooks/whatsapp')
  @ApiOperation({ summary: 'WhatsApp webhook for message status updates' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  handleWhatsAppWebhook(@Body() webhookDto: WhatsAppWebhookDto) {
    return this.messagesService.handleWhatsAppWebhook(webhookDto);
  }

  @Get('history/:contactId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get message history for a contact' })
  @ApiResponse({ status: 200, description: 'Message history retrieved', type: [MessageResponseDto] })
  getMessageHistory(@Param('contactId') contactId: string) {
    return this.messagesService.getMessageHistory(contactId);
  }
}
