import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TemplatesService } from '../templates/templates.service';
import { SendMessageDto, PreviewMessageDto, WhatsAppWebhookDto, MessageResponseDto, PreviewResponseDto } from './dto/message.dto';
import { MessageStatus, castToMessageChannel, castToMessageStatus } from '../common/types/enums';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private templatesService: TemplatesService,
  ) {}

  async previewMessage(previewDto: PreviewMessageDto): Promise<PreviewResponseDto> {
    const renderedBody = await this.templatesService.renderTemplate(
      previewDto.templateId,
      previewDto.variables,
    );

    return {
      renderedBody,
      templateId: previewDto.templateId,
    };
  }

  async sendMessage(sendDto: SendMessageDto): Promise<MessageResponseDto> {
    // Validate contact exists
    const contact = await this.prisma.contact.findUnique({
      where: { id: sendDto.contactId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Validate owner exists
    const owner = await this.prisma.owner.findUnique({
      where: { id: sendDto.ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    let messageBody = sendDto.body;

    // If using template, render it
    if (sendDto.templateId) {
      if (!sendDto.variables) {
        throw new BadRequestException('Variables are required when using a template');
      }

      messageBody = await this.templatesService.renderTemplate(
        sendDto.templateId,
        sendDto.variables,
      );
    } else if (!sendDto.body) {
      throw new BadRequestException('Either templateId or body must be provided');
    }

    // Create message record
    const message = await this.prisma.outboundMessage.create({
      data: {
        contactId: sendDto.contactId,
        ownerId: sendDto.ownerId,
        channel: sendDto.channel,
        templateId: sendDto.templateId,
        body: messageBody,
        content: messageBody, // Add missing content field
        status: MessageStatus.PENDING,
      },
    });

    // Simulate sending (in production, this would call the actual provider)
    if (sendDto.channel === 'WHATSAPP') {
      // Simulate UltraMsg API call
      const providerMsgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.prisma.outboundMessage.update({
        where: { id: message.id },
        data: {
          providerMsgId,
          status: MessageStatus.SENT,
          meta: JSON.stringify({ sentAt: new Date().toISOString() }),
        },
      });
    }

    return {
      ...message,
      channel: castToMessageChannel(message.channel),
      status: castToMessageStatus(message.status),
    } as MessageResponseDto;
  }

  async handleWhatsAppWebhook(webhookDto: WhatsAppWebhookDto): Promise<void> {
    // In production, verify webhook signature
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    // Find message by provider message ID
    const message = await this.prisma.outboundMessage.findFirst({
      where: { providerMsgId: webhookDto.messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Map webhook status to internal status
    let status: MessageStatus;
    switch (webhookDto.status.toLowerCase()) {
      case 'delivered':
        status = MessageStatus.DELIVERED;
        break;
      case 'read':
        status = MessageStatus.READ;
        break;
      case 'failed':
        status = MessageStatus.FAILED;
        break;
      default:
        status = MessageStatus.SENT;
    }

    // Update message status
    await this.prisma.outboundMessage.update({
      where: { id: message.id },
      data: {
        status,
        meta: JSON.stringify({
          ...webhookDto.meta,
          webhookReceivedAt: new Date().toISOString(),
        }),
      },
    });
  }

  async getMessageHistory(contactId: string): Promise<MessageResponseDto[]> {
    const messages = await this.prisma.outboundMessage.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: true,
      },
    });
    
    return messages.map(message => ({
      ...message,
      channel: castToMessageChannel(message.channel),
      status: castToMessageStatus(message.status),
    })) as MessageResponseDto[];
  }
}
