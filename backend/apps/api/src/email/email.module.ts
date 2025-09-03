import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GmailService } from './services/gmail.service';
import { OutlookService } from './services/outlook.service';
import { EmailManagerService } from './email-manager.service';
import { EmailDatabaseService } from './email-database.service';
import { EmailController } from './email.controller';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [
    TagsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || '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',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [EmailController],
  providers: [
    GmailService,
    OutlookService,
    EmailManagerService,
    EmailDatabaseService,
  ],
  exports: [
    GmailService,
    OutlookService,
    EmailManagerService,
    EmailDatabaseService,
  ],
})
export class EmailModule {}
