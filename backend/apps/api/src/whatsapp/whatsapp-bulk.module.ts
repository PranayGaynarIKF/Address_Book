import { Module } from '@nestjs/common';
import { WhatsAppBulkController } from './whatsapp-bulk.controller';
import { WhatsAppBulkService } from './whatsapp-bulk.service';

@Module({
  controllers: [WhatsAppBulkController],
  providers: [WhatsAppBulkService],
  exports: [WhatsAppBulkService],
})
export class WhatsAppBulkModule {}
