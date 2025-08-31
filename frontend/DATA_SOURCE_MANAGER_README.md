# Data Source Manager - Frontend Component

## Overview

The Data Source Manager is a comprehensive frontend component that allows users to manage all their contact data sources directly from the web interface, eliminating the need to manually configure backend files.

## Features

### 🧭 **Gmail Account Management**
- **Add Gmail Accounts**: Configure new Gmail accounts with OAuth 2.0 credentials
- **View Account Status**: See active/inactive accounts and last sync times
- **Sync Contacts**: Manually trigger contact synchronization from Gmail
- **Account Monitoring**: Track contact counts and connection status

### 📁 **VCF File Management**
- **Upload VCF Files**: Drag & drop or browse for .vcf/.vcard files
- **File Processing**: Process uploaded files to extract contacts
- **Status Tracking**: Monitor processing status (pending, processing, completed, failed)
- **Contact Extraction**: View how many contacts were extracted from each file

### 🗄️ **Invoice Database Management**
- **Database Connections**: Add SQL Server database connections
- **Authentication Options**: Support for both SQL and Windows authentication
- **Connection Testing**: Verify database connectivity before saving
- **Contact Synchronization**: Sync contacts from invoice databases

## How to Use

### 1. **Accessing the Data Source Manager**
Navigate to `/data-sources` in your application or click on "Data Sources" in the sidebar navigation.

### 2. **Adding a Gmail Account**
1. Click the "Add Gmail Account" button
2. Enter your Gmail address
3. Provide Google OAuth Client ID and Secret
4. Follow the setup instructions in the modal
5. Click "Add Account" to save

**Setup Requirements:**
- Google Cloud Project with Gmail API enabled
- OAuth 2.0 credentials created
- Proper redirect URIs configured

### 3. **Uploading VCF Files**
1. Click the "Upload VCF" button
2. Select your .vcf or .vcard file
3. File will be uploaded and queued for processing
4. Click "Process Now" to extract contacts
5. Monitor status and contact count

### 4. **Adding Invoice Database**
1. Click "Add Database" button
2. Provide connection details:
   - Connection name
   - Server address
   - Database name
   - Authentication method (SQL or Windows)
3. Test connection before saving
4. Click "Add Database" to save

### 5. **Synchronizing Data**
- **Gmail**: Click "Sync Now" on any account card
- **VCF**: Click "Process Now" on pending files
- **Invoice**: Click "Sync Now" on database cards

## API Endpoints Used

### Gmail Management
- `GET /gmail/accounts` - List all Gmail accounts
- `POST /gmail/accounts` - Add new Gmail account
- `POST /gmail/accounts/:id/sync` - Sync contacts from Gmail
- `POST /gmail/accounts/:id/test` - Test Gmail connection

### VCF File Management
- `GET /vcf/files` - List all VCF files
- `POST /vcf/upload` - Upload new VCF file
- `POST /vcf/files/:id/process` - Process VCF file
- `GET /vcf/files/:id/status` - Get file processing status

### Invoice Database Management
- `GET /invoice/databases` - List all invoice databases
- `POST /invoice/databases` - Add new invoice database
- `POST /invoice/databases/:id/sync` - Sync contacts from database
- `POST /invoice/databases/:id/test` - Test database connection

## Environment Configuration

Create a `.env.local` file in your frontend directory:

```bash
REACT_APP_API_URL=http://localhost:4000
REACT_APP_API_KEY=my-secret-api-key-123
```

## Benefits of Frontend Management

### ✅ **User-Friendly Interface**
- No need to edit backend configuration files
- Visual feedback for all operations
- Real-time status updates

### ✅ **Centralized Control**
- Manage all data sources from one place
- Consistent interface across different source types
- Easy monitoring and troubleshooting

### ✅ **Real-Time Operations**
- Immediate feedback on operations
- Live status updates
- Progress tracking for long-running tasks

### ✅ **Error Handling**
- Clear error messages
- Validation before submission
- Connection testing capabilities

## Security Features

- **API Key Authentication**: All requests use secure API keys
- **Input Validation**: Client-side validation for all forms
- **Secure File Uploads**: File type validation and size limits
- **Credential Protection**: Passwords are masked and encrypted

## Troubleshooting

### Common Issues

1. **Gmail Authentication Failed**
   - Verify OAuth credentials are correct
   - Check if Gmail API is enabled
   - Ensure redirect URIs match exactly

2. **VCF Upload Failed**
   - Verify file is valid .vcf/.vcard format
   - Check file size limits
   - Ensure backend file upload endpoint is working

3. **Database Connection Failed**
   - Verify server address and database name
   - Check authentication credentials
   - Ensure SQL Server is accessible from backend

### Debug Information

The component includes comprehensive logging:
- API request/response details
- Error messages and stack traces
- Loading states and progress indicators
- Real-time status updates

## Future Enhancements

- **Bulk Operations**: Process multiple sources simultaneously
- **Scheduled Sync**: Set up automatic synchronization schedules
- **Advanced Filtering**: Filter and search through data sources
- **Export/Import**: Backup and restore data source configurations
- **Analytics Dashboard**: Detailed metrics and performance data

## Integration with Backend

The frontend component integrates seamlessly with your existing NestJS backend:

- Uses existing API endpoints
- Maintains data consistency
- Leverages existing authentication
- Follows established data models

This creates a complete, user-friendly system for managing contact data sources without requiring technical backend knowledge.
