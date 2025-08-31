# 🏷️ Tag System Setup Guide

## 🚨 **Why Tags Aren't Showing in UI**

The tags aren't visible because:
1. **Missing Environment Configuration** - No `.env` file
2. **No Tags in Database** - Database is empty
3. **API Connection Issues** - Backend not properly configured
4. **Authentication Issues** - Missing JWT token

## 🛠️ **Step-by-Step Fix**

### **1. Create Environment File**
Create a `.env` file in the root directory with:

```bash
# Copy from env.example and modify as needed
cp env.example .env
```

**Required Environment Variables:**
```env
NODE_ENV=development
PORT=4002
DATABASE_URL="sqlserver://localhost:1433;database=main_db;integratedSecurity=true;trustServerCertificate=true"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### **2. Run Database Migrations**
```bash
npm run prisma:migrate
```

### **3. Generate Prisma Client**
```bash
npm run prisma:generate
```

### **4. Seed Database with Tags**
```bash
# Run the new seed file that includes tags
npx ts-node apps/api/src/seed-with-tags.ts
```

### **5. Start Backend API**
```bash
npm run start:dev
```

### **6. Test API Endpoints**
```bash
# Test if tags endpoint works
curl http://localhost:4002/tags
```

### **7. Set JWT Token in Frontend**
In your browser console or localStorage:
```javascript
localStorage.setItem('jwt_token', 'your-jwt-token-here');
```

## 🔍 **Troubleshooting**

### **Check Database Connection**
```bash
# Test database connection
npm run start:dev
# Look for database connection logs
```

### **Check API Response**
```bash
# Test tags endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:4002/tags
```

### **Check Browser Console**
- Open Developer Tools (F12)
- Look for network errors
- Check for authentication errors

### **Common Issues:**
1. **Database not running** - Start SQL Server
2. **Wrong connection string** - Check DATABASE_URL in .env
3. **Missing JWT token** - Set localStorage.jwt_token
4. **CORS issues** - Check backend CORS configuration

## 📱 **Frontend Testing**

1. Open `frontend-components/TagManagement.tsx` in a React app
2. Ensure API_BASE points to `http://localhost:4002`
3. Set JWT token in localStorage
4. Refresh the page

## ✅ **Expected Result**

After setup, you should see:
- 6 sample tags with different colors
- Tag management interface working
- Ability to create, edit, delete tags
- Contact-tag relationships working

## 🆘 **Still Not Working?**

1. Check backend logs for errors
2. Verify database has tags: `SELECT * FROM [app].[Tags]`
3. Test API directly with Postman/curl
4. Check browser network tab for failed requests
