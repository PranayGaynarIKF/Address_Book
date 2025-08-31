import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseConfigService } from './database-config.service';

@Injectable()
export class InvoicePrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private databaseConfigService: DatabaseConfigService) {
    const config = databaseConfigService.getInvoiceDatabaseConfig();
    const connectionString = databaseConfigService.buildConnectionString(config);
    
    super({
      datasources: {
        db: {
          url: connectionString,
        },
      },
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Invoice database connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to invoice database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Invoice database connection test failed:', error);
      return false;
    }
  }
}

