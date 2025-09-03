import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { MergeHistoryService } from './merge-history.service';
import { MergeHistoryController } from './merge-history.controller';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../common/prisma/database.module';
import { PrismaService } from '../common/prisma/prisma.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ContactsController, MergeHistoryController],
  providers: [ContactsService, MergeHistoryService, PrismaService],
  exports: [ContactsService, MergeHistoryService],
})
export class ContactsModule {}
