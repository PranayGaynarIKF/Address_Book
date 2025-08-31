import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { InvoicePrismaService } from './invoice-prisma.service';
import { DatabaseConfigService } from './database-config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, InvoicePrismaService, DatabaseConfigService],
  exports: [PrismaService, InvoicePrismaService, DatabaseConfigService],
})
export class PrismaModule {}
