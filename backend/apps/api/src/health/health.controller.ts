import { Controller, Get } from '@nestjs/common';
import { DatabaseConfigService } from '../common/prisma/database-config.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { InvoicePrismaService } from '../common/prisma/invoice-prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private databaseConfigService: DatabaseConfigService,
    private prismaService: PrismaService,
    private invoicePrismaService: InvoicePrismaService,
  ) {}

  @Get()
  async check() {
    try {
      // Test main database
      await this.prismaService.$queryRaw`SELECT 1`;
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mainDatabase: 'connected',
        invoiceDatabase: 'checking...',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('database')
  async checkDatabaseConnections() {
    const mainDbStatus = await this.checkMainDatabase();
    const invoiceDbStatus = await this.checkInvoiceDatabase();
    const config = this.databaseConfigService.getDatabaseStatus();

    return {
      timestamp: new Date().toISOString(),
      mainDatabase: {
        status: mainDbStatus.status,
        details: mainDbStatus.details,
        config: {
          server: config.main.server,
          port: config.main.port,
          database: config.main.database,
          useWindowsAuth: config.main.useWindowsAuth,
        },
      },
      invoiceDatabase: {
        status: invoiceDbStatus.status,
        details: invoiceDbStatus.details,
        config: {
          server: config.invoice.server,
          port: config.invoice.port,
          database: config.invoice.database,
          useWindowsAuth: config.invoice.useWindowsAuth,
        },
      },
    };
  }

  private async checkMainDatabase() {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        details: 'Main database is responding',
      };
    } catch (error) {
      return {
        status: 'down',
        details: `Main database connection failed: ${error.message}`,
      };
    }
  }

  private async checkInvoiceDatabase() {
    try {
      await this.invoicePrismaService.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        details: 'Invoice database is responding',
      };
    } catch (error) {
      return {
        status: 'down',
        details: `Invoice database connection failed: ${error.message}`,
      };
    }
  }
}
