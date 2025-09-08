import { Controller, Post, Body, Headers, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { WhatsAppBulkService } from './whatsapp-bulk.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('whatsapp-bulk')
export class WhatsAppBulkController {
  constructor(private readonly whatsappBulkService: WhatsAppBulkService) {}

  @Post('send-bulk')
  @UseGuards(ApiKeyGuard)
  async sendBulkMessages(
    @Body() body: {
      contacts: any[];
      template: {
        id: string;
        name: string;
        content: string;
        variables: string[];
      };
      phone_number_id: string;
      company_id: string;
    }
  ) {
    try {

      const result = await this.whatsappBulkService.sendBulkMessages(
        body.contacts,
        body.template,
        body.phone_number_id,
        body.company_id
      );

      return {
        success: true,
        message: 'Bulk messages sent successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send bulk messages',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
