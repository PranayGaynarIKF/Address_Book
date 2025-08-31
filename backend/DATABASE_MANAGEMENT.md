# Database Management Guide

This application is designed to work with multiple databases:

1. **Main Database** - Your application's primary database (contacts, owners, templates, etc.)
2. **Invoice Database** - External database for invoice-related data ingestion

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Main App      │    │   Invoice        │    │   External      │
│   Database      │◄───┤   Adapter        │◄───┤   Invoice DB    │
│   (Prisma)      │    │                  │    │   (SQL Server)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Database Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Main Database
DATABASE_URL="sqlserver://localhost:1433;database=main_db;integratedSecurity=true;trustServerCertificate=true"

# Invoice Database (External)
INVOICE_DATABASE_URL="sqlserver://localhost:1433;database=invoice;integratedSecurity=true;trustServerCertificate=true"

# Alternative: Individual parameters
INVOICE_DB_SERVER=localhost
INVOICE_DB_PORT=1433
INVOICE_DB_NAME=invoice
INVOICE_DB_USE_WINDOWS_AUTH=true
INVOICE_DB_USER=sa
INVOICE_DB_PASSWORD=
```

### Connection String Format

**Windows Authentication:**
```
sqlserver://server:port;database=dbname;integratedSecurity=true;trustServerCertificate=true
```

**SQL Authentication:**
```
sqlserver://username:password@server:port;database=dbname;trustServerCertificate=true
```

## Database Services

### 1. PrismaService
- Manages main database connection
- Handles your application's core data (contacts, owners, templates, messages)

### 2. InvoicePrismaService
- Manages external invoice database connection
- Used by InvoiceAdapter to fetch customer contact data

### 3. DatabaseConfigService
- Centralized configuration management
- Parses connection strings and environment variables
- Provides configuration validation

### 4. DatabaseManagerService
- Comprehensive database management utilities
- Connection testing and monitoring
- Query execution on both databases
- Statistics and health checks

## API Endpoints

### Health Checks
```bash
# Overall health
GET /health

# Database-specific health
GET /health/database
```

### Database Management
```bash
# Get database status
GET /database/status

# Get configurations
GET /database/config

# Test connections
POST /database/test-connections

# Execute queries
POST /database/query/main
POST /database/query/invoice

# Close connections
POST /database/close-connections

# Quick health check
GET /database/health
```

## Ingestion Flow

When you call `POST /ingestion/invoice/run`:

1. **InvoiceAdapter** connects to external invoice database
2. **Fetches** customer contact data from `[dbo_user_new].[customer_contacts]`
3. **Transforms** data to internal format
4. **Stages** data in main database staging tables
5. **Processes** and **cleans** the data
6. **Writes** final data to main database

## Database Monitoring

### Health Check Response
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "mainDatabase": {
    "status": "up",
    "details": "Main database is responding",
    "config": {
      "server": "localhost",
      "port": "1433",
      "database": "main_db",
      "useWindowsAuth": true
    }
  },
  "invoiceDatabase": {
    "status": "up",
    "details": "Invoice database is responding",
    "config": {
      "server": "localhost",
      "port": "1433",
      "database": "invoice",
      "useWindowsAuth": true
    }
  }
}
```

### Status Response
```json
{
  "main": {
    "connected": true,
    "tables": ["contacts", "owners", "templates", "messages"],
    "recordCounts": {
      "contacts": 150,
      "owners": 5,
      "templates": 12,
      "messages": 89
    }
  },
  "invoice": {
    "connected": true,
    "tables": ["customer_contacts", "customers"],
    "recordCounts": {
      "customer_contacts": 1000
    }
  }
}
```

## Troubleshooting

### Connection Issues

1. **Check environment variables** are set correctly
2. **Verify SQL Server** is running and accessible
3. **Test Windows Authentication** if using integrated security
4. **Check firewall** settings for remote connections
5. **Verify database names** exist on the server

### Common Errors

**Login failed for user:**
- Check username/password
- Verify SQL authentication is enabled
- Check user permissions

**Cannot connect to server:**
- Verify server name/IP
- Check port number (default: 1433)
- Test network connectivity

**Database does not exist:**
- Verify database name
- Check if database is online
- Verify user has access

### Testing Connections

```bash
# Test both databases
curl -X POST http://localhost:4002/database/test-connections \
  -H "X-API-Key: your-api-key"

# Get detailed status
curl http://localhost:4002/database/status \
  -H "X-API-Key: your-api-key"
```

## Security Considerations

1. **API Key Protection** - All database endpoints require API key
2. **Connection Pooling** - Limited concurrent connections
3. **Query Validation** - Raw queries are logged and monitored
4. **Environment Isolation** - Different configs for dev/staging/prod

## Performance Optimization

1. **Connection Pooling** - Reuse database connections
2. **Query Optimization** - Use indexed columns for filtering
3. **Batch Processing** - Process data in chunks during ingestion
4. **Monitoring** - Track query performance and connection health

## Development Workflow

1. **Local Development** - Use local SQL Server instances
2. **Staging** - Use staging database servers
3. **Production** - Use production database servers
4. **Environment Switching** - Use different .env files

## Backup and Recovery

1. **Main Database** - Regular backups of your application data
2. **Invoice Database** - Coordinate with external system owners
3. **Configuration** - Backup .env files and connection strings
4. **Monitoring** - Set up alerts for connection failures
