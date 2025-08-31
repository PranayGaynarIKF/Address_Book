import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { GoogleAuthModule } from './auth/google-auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { OwnersModule } from './owners/owners.module';
import { TemplatesModule } from './templates/templates.module';
import { MessagesModule } from './messages/messages.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { EmailModule } from './email/email.module';
import { MailAccountsModule } from './mail-accounts/mail-accounts.module';
import { TagsModule } from './tags/tags.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { DatabaseModule } from './common/prisma/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '../../.env', '.env', '.env.local', '.env.development'],
      cache: false,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    GoogleAuthModule,
    ContactsModule,
    OwnersModule,
    TemplatesModule,
    MessagesModule,
    IngestionModule,
    EmailModule,
    MailAccountsModule,
    TagsModule,
    WhatsAppModule,
  ],
})
export class AppModule {}
