import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { StagingService } from './staging.service';
import { CleanerService } from './cleaner/cleaner.service';
import { WriterService } from './writer.service';
import { ZohoAdapter } from './adapters/zoho.adapter';
import { GmailAdapter } from './adapters/gmail.adapter';
import { OutlookAdapter } from './adapters/outlook.adapter';
import { InvoiceAdapter } from './adapters/invoice.adapter';
import { MobileAdapter } from './adapters/mobile.adapter';
import { GoogleAuthModule } from '../auth/google-auth.module';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [GoogleAuthModule, ContactsModule, PrismaModule],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    StagingService,
    CleanerService,
    WriterService,
    ZohoAdapter,
    GmailAdapter,
    OutlookAdapter,
    InvoiceAdapter,
    MobileAdapter,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
