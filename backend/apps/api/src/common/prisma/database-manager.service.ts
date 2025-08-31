import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { InvoicePrismaService } from './invoice-prisma.service';
import { DatabaseConfigService } from './database-config.service';

export interface DatabaseStats {
  main: {
    connected: boolean;
    tables: string[];
    recordCounts: Record<string, number>;
  };
  invoice: {
    connected: boolean;
    tables: string[];
    recordCounts: Record<string, number>;
  };
}

@Injectable()
export class DatabaseManagerService {
  private readonly logger = new Logger(DatabaseManagerService.name);

  constructor(
    private prismaService: PrismaService,
    private invoicePrismaService: InvoicePrismaService,
    private databaseConfigService: DatabaseConfigService,
  ) {}

  /**
   * Get comprehensive status of both databases
   */
  async getDatabaseStatus(): Promise<DatabaseStats> {
    const [mainStats, invoiceStats] = await Promise.all([
      this.getMainDatabaseStats(),
      this.getInvoiceDatabaseStats(),
    ]);

    return {
      main: mainStats,
      invoice: invoiceStats,
    };
  }

  /**
   * Get main database statistics
   */
  private async getMainDatabaseStats() {
    try {
      // Test connection
      await this.prismaService.$queryRaw`SELECT 1`;
      
      // Get table list (SQL Server specific)
      const tables = await this.prismaService.$queryRaw`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `;

      // Get record counts for main tables
      const recordCounts: Record<string, number> = {};
      const mainTables = ['contacts', 'owners', 'templates', 'messages'];
      
      for (const table of mainTables) {
        try {
          const result = await this.prismaService.$queryRaw`SELECT COUNT(*) as count FROM ${table}`;
          recordCounts[table] = Number(result[0]?.count || 0);
        } catch (error) {
          recordCounts[table] = -1; // Table doesn't exist or error
        }
      }

      return {
        connected: true,
        tables: (tables as any[]).map(t => t.TABLE_NAME),
        recordCounts,
      };
    } catch (error) {
      this.logger.error('Failed to get main database stats:', error);
      return {
        connected: false,
        tables: [],
        recordCounts: {},
      };
    }
  }

  /**
   * Get invoice database statistics
   */
  private async getInvoiceDatabaseStats() {
    try {
      // Test connection
      await this.invoicePrismaService.$queryRaw`SELECT 1`;
      
      // Get table list (SQL Server specific)
      const tables = await this.invoicePrismaService.$queryRaw`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `;

      // Get record count for customer_contacts table
      const recordCounts: Record<string, number> = {};
      try {
        const result = await this.invoicePrismaService.$queryRaw`
          SELECT COUNT(*) as count FROM [dbo_user_new].[customer_contacts]
          WHERE [del_sts] = 0 AND [status] = 1
        `;
        recordCounts['customer_contacts'] = Number(result[0]?.count || 0);
      } catch (error) {
        recordCounts['customer_contacts'] = -1;
      }

      return {
        connected: true,
        tables: (tables as any[]).map(t => t.TABLE_NAME),
        recordCounts,
      };
    } catch (error) {
      this.logger.error('Failed to get invoice database stats:', error);
      return {
        connected: false,
        tables: [],
        recordCounts: {},
      };
    }
  }

  /**
   * Test both database connections
   */
  async testConnections(): Promise<{ main: boolean; invoice: boolean }> {
    const [mainConnected, invoiceConnected] = await Promise.all([
      this.testMainConnection(),
      this.testInvoiceConnection(),
    ]);

    return {
      main: mainConnected,
      invoice: invoiceConnected,
    };
  }

  private async testMainConnection(): Promise<boolean> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Main database connection test failed:', error);
      return false;
    }
  }

  private async testInvoiceConnection(): Promise<boolean> {
    try {
      await this.invoicePrismaService.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Invoice database connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database configuration information
   */
  getDatabaseConfigs() {
    return {
      main: this.databaseConfigService.getMainDatabaseConfig(),
      invoice: this.databaseConfigService.getInvoiceDatabaseConfig(),
    };
  }

  /**
   * Execute a query on the main database
   */
  async executeMainQuery(query: string, params: any[] = []) {
    try {
      const result = await this.prismaService.$queryRawUnsafe(query, ...params);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Main database query failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a query on the invoice database
   */
  async executeInvoiceQuery(query: string, params: any[] = []) {
    try {
      const result = await this.invoicePrismaService.$queryRawUnsafe(query, ...params);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Invoice database query failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Close all database connections
   */
  async closeConnections() {
    try {
      await Promise.all([
        this.prismaService.$disconnect(),
        this.invoicePrismaService.$disconnect(),
      ]);
      this.logger.log('All database connections closed');
    } catch (error) {
      this.logger.error('Error closing database connections:', error);
    }
  }
}
