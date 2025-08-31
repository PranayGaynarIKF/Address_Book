import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DatabaseManagerService } from './database-manager.service';
import { DatabaseConfigService } from './database-config.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiKeyGuard } from '../guards/api-key.guard';

@ApiTags('Database Management')
@Controller('database')
@UseGuards(ApiKeyGuard)
export class DatabaseController {
  constructor(
    private databaseManagerService: DatabaseManagerService,
    private databaseConfigService: DatabaseConfigService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get comprehensive database status' })
  @ApiResponse({ status: 200, description: 'Database status retrieved successfully' })
  async getDatabaseStatus() {
    return await this.databaseManagerService.getDatabaseStatus();
  }

  @Get('config')
  @ApiOperation({ summary: 'Get database configurations' })
  @ApiResponse({ status: 200, description: 'Database configurations retrieved successfully' })
  getDatabaseConfigs() {
    return this.databaseManagerService.getDatabaseConfigs();
  }

  @Post('test-connections')
  @ApiOperation({ summary: 'Test both database connections' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  async testConnections() {
    return await this.databaseManagerService.testConnections();
  }

  @Post('query/main')
  @ApiOperation({ summary: 'Execute a query on the main database' })
  @ApiResponse({ status: 200, description: 'Query executed successfully' })
  async executeMainQuery(@Body() body: { query: string; params?: any[] }) {
    return await this.databaseManagerService.executeMainQuery(body.query, body.params || []);
  }

  @Post('query/invoice')
  @ApiOperation({ summary: 'Execute a query on the invoice database' })
  @ApiResponse({ status: 200, description: 'Query executed successfully' })
  async executeInvoiceQuery(@Body() body: { query: string; params?: any[] }) {
    return await this.databaseManagerService.executeInvoiceQuery(body.query, body.params || []);
  }

  @Post('close-connections')
  @ApiOperation({ summary: 'Close all database connections' })
  @ApiResponse({ status: 200, description: 'Connections closed successfully' })
  async closeConnections() {
    await this.databaseManagerService.closeConnections();
    return { message: 'All database connections closed successfully' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Quick database health check' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  async healthCheck() {
    const connections = await this.databaseManagerService.testConnections();
    const configs = this.databaseManagerService.getDatabaseConfigs();
    
    return {
      timestamp: new Date().toISOString(),
      connections,
      configs: {
        main: {
          server: configs.main.server,
          port: configs.main.port,
          database: configs.main.database,
          useWindowsAuth: configs.main.useWindowsAuth,
        },
        invoice: {
          server: configs.invoice.server,
          port: configs.invoice.port,
          database: configs.invoice.database,
          useWindowsAuth: configs.invoice.useWindowsAuth,
        },
      },
    };
  }
}
