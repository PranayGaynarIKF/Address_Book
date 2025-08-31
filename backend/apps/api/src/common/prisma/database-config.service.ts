import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  server: string;
  port: string;
  database: string;
  username?: string;
  password?: string;
  useWindowsAuth: boolean;
  connectionString?: string;
}

@Injectable()
export class DatabaseConfigService {
  private readonly logger = new Logger(DatabaseConfigService.name);

  constructor(private configService: ConfigService) {}

  getMainDatabaseConfig(): DatabaseConfig {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    
    if (databaseUrl) {
      return this.parseConnectionString(databaseUrl);
    }

    return {
      server: this.configService.get<string>('DB_SERVER', 'localhost'),
      port: this.configService.get<string>('DB_PORT', '1433'),
      database: this.configService.get<string>('DB_NAME', 'main_db'),
      username: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      useWindowsAuth: this.configService.get<boolean>('DB_USE_WINDOWS_AUTH', true),
    };
  }

  getInvoiceDatabaseConfig(): DatabaseConfig {
    const databaseUrl = this.configService.get<string>('INVOICE_DATABASE_URL');
    
    if (databaseUrl) {
      return this.parseConnectionString(databaseUrl);
    }

    return {
      server: this.configService.get<string>('INVOICE_DB_SERVER', 'localhost'),
      port: this.configService.get<string>('INVOICE_DB_PORT', '1433'),
      database: this.configService.get<string>('INVOICE_DB_NAME', 'invoice'),
      username: this.configService.get<string>('INVOICE_DB_USER'),
      password: this.configService.get<string>('INVOICE_DB_PASSWORD'),
      useWindowsAuth: this.configService.get<boolean>('INVOICE_DB_USE_WINDOWS_AUTH', true),
    };
  }

  private parseConnectionString(connectionString: string): DatabaseConfig {
    try {
      // Handle SQL Server connection strings which are not valid URLs
      if (connectionString.startsWith('sqlserver://')) {
        return this.parseSqlServerConnectionString(connectionString);
      }
      
      // Handle standard URL format
      const url = new URL(connectionString);
      const params = new URLSearchParams(url.search);
      
      return {
        server: url.hostname,
        port: url.port || '1433',
        database: params.get('database') || 'main_db',
        username: url.username || undefined,
        password: url.password || undefined,
        useWindowsAuth: params.get('integratedSecurity') === 'true',
        connectionString,
      };
    } catch (error) {
      this.logger.error('Failed to parse connection string:', error);
      throw new Error(`Invalid connection string: ${connectionString}`);
    }
  }

  private parseSqlServerConnectionString(connectionString: string): DatabaseConfig {
    try {
      // Remove 'sqlserver://' prefix
      const cleanString = connectionString.replace('sqlserver://', '');
      
      // Split by semicolon to get parameters
      const params = cleanString.split(';').reduce((acc, param) => {
        const [key, value] = param.split('=');
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      // Extract server and port
      let server = 'localhost';
      let port = '1433';
      
      if (params.server) {
        const serverParts = params.server.split(':');
        server = serverParts[0];
        if (serverParts[1]) {
          port = serverParts[1];
        }
      }

      // Check if username:password@server format is used
      if (server.includes('@')) {
        const authParts = server.split('@');
        if (authParts.length === 2) {
          const credentials = authParts[0].split(':');
          if (credentials.length === 2) {
            params.username = credentials[0];
            params.password = credentials[1];
          }
          server = authParts[1];
        }
      }

      return {
        server,
        port,
        database: params.database || 'main_db',
        username: params.username,
        password: params.password,
        useWindowsAuth: params.integratedSecurity === 'true',
        connectionString,
      };
    } catch (error) {
      this.logger.error('Failed to parse SQL Server connection string:', error);
      throw new Error(`Invalid SQL Server connection string: ${connectionString}`);
    }
  }

  buildConnectionString(config: DatabaseConfig): string {
    if (config.connectionString) {
      return config.connectionString;
    }

    if (config.useWindowsAuth) {
      return `sqlserver://${config.server}:${config.port};database=${config.database};integratedSecurity=true;trustServerCertificate=true`;
    } else {
      if (!config.username || !config.password) {
        throw new Error('Username and password required when not using Windows Authentication');
      }
      return `sqlserver://${config.username}:${config.password}@${config.server}:${config.port};database=${config.database};trustServerCertificate=true`;
    }
  }

  async testDatabaseConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      const connectionString = this.buildConnectionString(config);
      this.logger.log(`Testing connection to ${config.database} on ${config.server}:${config.port}`);
      
      // You can implement actual connection testing here
      // For now, we'll just validate the configuration
      return true;
    } catch (error) {
      this.logger.error(`Failed to connect to database ${config.database}:`, error);
      return false;
    }
  }

  getDatabaseStatus(): { main: DatabaseConfig; invoice: DatabaseConfig } {
    return {
      main: this.getMainDatabaseConfig(),
      invoice: this.getInvoiceDatabaseConfig(),
    };
  }
}
