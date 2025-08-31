import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { MergeHistoryService } from './merge-history.service';
import { MergeHistoryController } from './merge-history.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ContactsController, MergeHistoryController],
  providers: [ContactsService, MergeHistoryService],
  exports: [ContactsService, MergeHistoryService],
})
export class ContactsModule {}
