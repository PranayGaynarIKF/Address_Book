import { Controller, Post, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { EmailBulkService } from './email-bulk.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('email-bulk')
export class EmailBulkController {
  constructor(private readonly emailBulkService: EmailBulkService) {}

  @Post('bulk-send')
  @UseGuards(ApiKeyGuard)
  async sendBulkEmails(
    @Body() body: {
      contacts: any[];
      subject: string;
      content: string;
      fromEmail: string;
    }
  ) {
    try {
      const result = await this.emailBulkService.sendBulkEmails(
        body.contacts,
        body.subject,
        body.content,
        body.fromEmail
      );

      return {
        success: true,
        message: 'Bulk emails sent successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send bulk emails',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
