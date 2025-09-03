# Automated Contact Collection and WP Messaging

A comprehensive NestJS API for automated contact collection from multiple sources including Gmail, Invoice databases, and more. This project provides a robust backend infrastructure for collecting, processing, and managing contacts from various data sources.

## 🚀 Features

- 🔐 **Multi-Database Architecture** - Main application DB + External Invoice DB
- 📧 **Gmail Integration** - OAuth 2.0 powered contact collection
- 🗄️ **Database Management** - Health monitoring and status endpoints
- 📥 **Data Ingestion** - Automated contact processing and staging
- 📊 **Health Monitoring** - Real-time database and API health checks
- 🔒 **Secure Authentication** - JWT and API key protection
- 🎯 **Contact Management** - CRUD operations for contacts, owners, and templates
- 📱 **WhatsApp Integration** - Message sending and webhook handling
- 🔄 **Data Processing** - Cleaning, deduplication, and merging

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Main App      │    │   External       │    │   Data Sources  │
│   Database      │◄───┤   Adapters       │◄───┤   (Gmail, DB)  │
│   (Prisma)      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

- **Backend Framework**: NestJS (Node.js)
- **Database**: SQL Server with Prisma ORM
- **Authentication**: Google OAuth 2.0, JWT, API Keys
- **External APIs**: Gmail API, People API
- **Monitoring**: Custom health checks and database management
- **Validation**: Class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI
- **Logging**: Pino logger with pretty formatting

## 📋 Prerequisites

- Node.js 18+ 
- SQL Server (local or remote)
- Google Cloud Project with Gmail API enabled
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/PranayGaynarIKF/Automated_Contact_Collection.git
cd Automated_Contact_Collection
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
# Application
NODE_ENV=development
PORT=4002

# Main Database
DATABASE_URL="sqlserver://localhost:1433;database=db_address_book;integratedSecurity=true;trustServerCertificate=true"

# Invoice Database (External)
INVOICE_DATABASE_URL="sqlserver://localhost:1433;database=invoice;integratedSecurity=true;trustServerCertificate=true"

# Google OAuth 2.0 (Required for Gmail)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GMAIL_USER_EMAIL=your_email@gmail.com

# API Keys
API_KEY=my-secret-api-key-123
INGESTION_API_KEY=my-secret-api-key-123

# JWT
JWT_SECRET=change_me
```

### 4. Start the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The API will be available at `http://localhost:4002`

## 📚 API Documentation

Once the application is running, visit:
- **Swagger UI**: `http://localhost:4002/docs`
- **Health Check**: `http://localhost:4002/health`
- **Database Status**: `http://localhost:4002/database/status`

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `GET /auth/google/login` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback

### Contact Management
- `GET /contacts` - List all contacts
- `POST /contacts` - Create new contact
- `GET /contacts/:id` - Get contact by ID
- `PATCH /contacts/:id` - Update contact
- `DELETE /contacts/:id` - Delete contact

### Data Ingestion
- `POST /ingestion/gmail/run` - Collect contacts from Gmail
- `POST /ingestion/invoice/run` - Collect contacts from invoice database
- `POST /ingestion/zoho/run` - Collect contacts from Zoho
- `POST /ingestion/mobile/run` - Collect contacts from mobile
- `POST /ingestion/clean-and-merge` - Process and merge contacts

### Database Management
- `GET /database/status` - Comprehensive database status
- `GET /database/config` - Database configurations
- `POST /database/test-connections` - Test database connections
- `GET /database/health` - Quick database health check

### Health Monitoring
- `GET /health` - Overall application health
- `GET /health/database` - Database-specific health

## 🔐 Authentication

### API Key Authentication
Most endpoints require an API key in the header:
```bash
X-API-Key: my-secret-api-key-123
```

### JWT Authentication
User authentication endpoints use JWT tokens:
```bash
Authorization: Bearer <jwt_token>
```

## 📊 Database Schema

The application uses two databases:

1. **Main Database** (`db_address_book`)
   - Contacts
   - Owners
   - Templates
   - Messages
   - Staging data

2. **Invoice Database** (External)
   - Customer contacts
   - Invoice-related data

## 🔄 Data Flow

1. **Ingestion**: External adapters fetch data from sources
2. **Staging**: Data is stored in staging tables
3. **Processing**: Data is cleaned and normalized
4. **Deduplication**: Duplicate contacts are identified and merged
5. **Storage**: Final data is stored in main database

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Project Structure

```
apps/api/
├── src/
│   ├── auth/           # Authentication modules
│   ├── contacts/       # Contact management
│   ├── ingestion/      # Data ingestion adapters
│   ├── common/         # Shared utilities and guards
│   ├── health/         # Health monitoring
│   └── main.ts         # Application entry point
├── prisma/             # Database schema and migrations
└── package.json        # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Application port | No | 4002 |
| `DATABASE_URL` | Main database connection | Yes | - |
| `INVOICE_DATABASE_URL` | Invoice database connection | Yes | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes | - |
| `API_KEY` | API key for authentication | Yes | - |

### Database Configuration

The application supports both connection strings and individual parameters:

```bash
# Option 1: Connection string
DATABASE_URL="sqlserver://server:port;database=dbname;integratedSecurity=true"

# Option 2: Individual parameters
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=db_address_book
DB_USE_WINDOWS_AUTH=true
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify SQL Server is running
   - Check connection string format
   - Ensure database exists and is accessible

2. **Gmail Authentication Failed**
   - Verify Google OAuth credentials
   - Check if Gmail API is enabled
   - Ensure redirect URIs match exactly

3. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes: `taskkill /f /im node.exe`

### Logs

Check application logs for detailed error information:
```bash
# Application logs
npm run start:dev

# Database logs
curl http://localhost:4002/database/status
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Pranay Gaynar** - [GitHub](https://github.com/PranayGaynarIKF)

## 🙏 Acknowledgments

- NestJS team for the excellent framework
- Prisma team for the database toolkit
- Google APIs for Gmail integration

---

**Note**: This is a development version. For production use, ensure proper security configurations and environment variable management.
