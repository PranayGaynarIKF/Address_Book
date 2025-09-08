import { Module } from '@nestjs/common';
import { EmailBulkController } from './email-bulk.controller';
import { EmailBulkService } from './email-bulk.service';
import { EmailModule } from './email.module';

@Module({
  imports: [EmailModule],
  controllers: [EmailBulkController],
  providers: [EmailBulkService],
  exports: [EmailBulkService],
})
export class EmailBulkModule {}
