# 🔐 Authentication Setup Guide

## 🚨 **Current Issue: 401 Unauthorized**

You're getting a 401 Unauthorized error because:
1. **No users exist in the database**
2. **Missing environment configuration**
3. **Database not properly set up**

## 🛠️ **Quick Fix (Choose One)**

### **Option 1: Run Setup Script (Recommended)**

#### **Windows (PowerShell)**
```powershell
cd backend
.\setup-admin.ps1
```

#### **Windows (Command Prompt)**
```cmd
cd backend
setup-admin.bat
```

#### **Linux/Mac**
```bash
cd backend
chmod +x setup-admin.ps1
pwsh setup-admin.ps1
```

### **Option 2: Manual Setup**

#### **Step 1: Create Environment File**
Create a `.env` file in the `backend` directory:

```env
NODE_ENV=development
PORT=4002
DATABASE_URL="sqlserver://localhost:1433;database=main_db;integratedSecurity=true;trustServerCertificate=true"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_EMAILS=admin@example.com
INGESTION_API_KEY=dev_api_key_change_in_production
API_KEY=my-secret-api-key-123
DEFAULT_COUNTRY_CODE=IN
TRUSTED_SOURCES=ZOHO,INVOICE
LOG_LEVEL=info
ENABLE_DB_LOGGING=false
ENABLE_QUERY_LOGGING=false
```

#### **Step 2: Setup Database**
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

#### **Step 3: Create Admin User**
```bash
node create-admin-user.js
```

## 🎯 **What This Creates**

- **Admin User**: `admin@example.com` / `test123`
- **Database Schema**: All required tables
- **Environment**: Proper configuration

## 🚀 **After Setup**

1. **Start the backend**:
   ```bash
   npm run start:dev
   ```

2. **Test login** with the credentials:
   - Email: `admin@example.com`
   - Password: `test123`

3. **API endpoint**: `POST http://localhost:4002/auth/login`

## 🔍 **Troubleshooting**

### **Database Connection Issues**
- Ensure SQL Server is running on port 1433
- Check if `main_db` database exists
- Verify Windows Authentication is enabled

### **Port Already in Use**
- Change `PORT=4002` to another port in `.env`
- Update frontend API base URL accordingly

### **Permission Issues**
- Run PowerShell/Command Prompt as Administrator
- Ensure you have access to the database

## 📋 **Verification**

After setup, you should see:
```
✅ .env file created
✅ Prisma client generated
✅ Database migrated
✅ Admin user created
📧 Admin email: admin@example.com
🔑 Admin password: test123
```

## 🆘 **Still Having Issues?**

1. Check the database connection logs
2. Verify SQL Server is accessible
3. Ensure all dependencies are installed (`npm install`)
4. Check if the database `main_db` exists

## 🔐 **Security Note**

- Change the `JWT_SECRET` in production
- Use strong passwords in production
- The default credentials are for development only
