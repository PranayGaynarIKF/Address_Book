# 🚀 Gmail OAuth Setup Guide

## 🎯 **What We Need to Fix:**
The email API is working perfectly, but Gmail OAuth tokens are missing, causing the "Internal server error" when sending emails.

## 🔧 **Step 1: Google Cloud Console Setup**

### **1.1 Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### **1.2 Create OAuth 2.0 Credentials**
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set authorized redirect URIs:
   - `http://localhost:4002/auth/google/callback`
   - `http://localhost:3000/oauth-callback`
5. Copy the **Client ID** and **Client Secret**

## 🔑 **Step 2: Environment Configuration**

### **2.1 Update Backend Environment**
In your backend `.env` file, add:

```env
# Gmail OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:4002/auth/google/callback
```

### **2.2 Update Frontend Environment**
In your frontend `.env.local` file, add:

```env
REACT_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth-callback
```

## 🌐 **Step 3: OAuth Flow Setup**

### **3.1 Backend OAuth Endpoints**
The backend already has these endpoints:
- `GET /auth/google/login` - Generate OAuth URL
- `GET /auth/google/callback` - Handle OAuth callback
- `GET /auth/google/status` - Check OAuth status

### **3.2 Frontend OAuth Integration**
The frontend can use:
- `GET /email/auth/GMAIL/url` - Get Gmail OAuth URL
- `POST /email/auth/GMAIL/manual-token` - Insert tokens manually

## 🧪 **Step 4: Testing OAuth Setup**

### **4.1 Test OAuth URL Generation**
```bash
curl -X GET "http://localhost:4002/email/auth/GMAIL/url" \
  -H "x-api-key: 9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN"
```

### **4.2 Test Manual Token Insertion**
```bash
curl -X POST "http://localhost:4002/email/auth/GMAIL/manual-token" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN" \
  -d '{
    "userId": "test-user",
    "accessToken": "your_access_token",
    "refreshToken": "your_refresh_token",
    "email": "your_email@gmail.com"
  }'
```

## 🔄 **Step 5: Complete OAuth Flow**

### **5.1 Get OAuth URL**
1. Call the OAuth URL endpoint
2. Open the URL in browser
3. Authorize your Gmail account
4. Get the authorization code

### **5.2 Exchange Code for Tokens**
1. Use the authorization code to get access/refresh tokens
2. Store tokens in the backend
3. Test email sending

## 🎯 **Alternative: Quick Test with Manual Tokens**

If you want to test immediately without full OAuth flow:

1. **Get your Gmail tokens manually** (using Google OAuth Playground)
2. **Insert them via the manual endpoint**
3. **Test email sending**

## 📱 **Step 6: Test Email Functionality**

After OAuth setup:
1. **Send test email** via the compose component
2. **Check console logs** for detailed information
3. **Verify email delivery**

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Invalid redirect URI"**
- Ensure redirect URIs match exactly in Google Cloud Console
- Check both frontend and backend redirect URIs

### **Issue 2: "OAuth consent screen not configured"**
- Configure OAuth consent screen in Google Cloud Console
- Add test users if in testing mode

### **Issue 3: "Scopes not authorized"**
- Ensure Gmail API is enabled
- Check required scopes are included

## ✅ **Success Indicators**

When OAuth is working correctly:
- ✅ Email service health shows `GMAIL: true`
- ✅ Bulk email sending works without errors
- ✅ No more "Internal server error" messages
- ✅ Emails are actually sent and delivered

## 🔗 **Useful Links**

- [Google Cloud Console](https://console.cloud.google.com/)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

---

**Need Help?** The backend already has all the OAuth infrastructure. You just need to:
1. Set up Google Cloud credentials
2. Update environment variables
3. Complete the OAuth flow
4. Test email sending
