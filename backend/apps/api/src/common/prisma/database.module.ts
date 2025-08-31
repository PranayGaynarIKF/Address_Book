import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { InvoicePrismaService } from './invoice-prisma.service';
import { DatabaseConfigService } from './database-config.service';
import { DatabaseManagerService } from './database-manager.service';
import { DatabaseController } from './database.controller';

@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    InvoicePrismaService,
    DatabaseConfigService,
    DatabaseManagerService,
  ],
  controllers: [DatabaseController],
  exports: [
    PrismaService,
    InvoicePrismaService,
    DatabaseConfigService,
    DatabaseManagerService,
  ],
})
export class DatabaseModule {}
