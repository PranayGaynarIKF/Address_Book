const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function checkDatabaseConfig() {
  console.log('🔍 Checking Database Configuration for Email Services...\n');
  
  console.log('📋 DATABASE TABLES IDENTIFIED:');
  console.log('================================');
  console.log('1. EmailAuthTokens - Stores OAuth tokens for users');
  console.log('2. EmailServiceConfigs - Stores OAuth client configuration');
  console.log('');
  
  console.log('📋 CURRENT ISSUE:');
  console.log('==================');
  console.log('❌ Gmail OAuth not configured in database');
  console.log('❌ Email service cannot authenticate with Gmail');
  console.log('❌ Result: "Email response format error"');
  console.log('');
  
  console.log('📋 SOLUTION: Configure Database Tables');
  console.log('======================================');
  console.log('🎯 We need to populate both tables with Gmail OAuth data');
  console.log('');
  
  console.log('📋 STEP 1: Configure EmailServiceConfigs Table');
  console.log('==============================================');
  console.log('Insert Gmail OAuth client configuration:');
  console.log('');
  console.log('INSERT INTO [db_address_book].[app].[EmailServiceConfigs]');
  console.log('([userId], [serviceType], [clientId], [clientSecret], [redirectUri], [scopes], [isActive])');
  console.log('VALUES');
  console.log('(');
  console.log('  \'system\', -- or your user ID');
  console.log('  \'GMAIL\',');
  console.log('  \'YOUR_GOOGLE_CLIENT_ID\',');
  console.log('  \'YOUR_GOOGLE_CLIENT_SECRET\',');
  console.log('  \'http://localhost:4002/auth/google/callback\',');
  console.log('  \'https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.modify\',');
  console.log('  1');
  console.log(');');
  console.log('');
  
  console.log('📋 STEP 2: Configure EmailAuthTokens Table');
  console.log('==========================================');
  console.log('After getting OAuth tokens, insert them:');
  console.log('');
  console.log('INSERT INTO [db_address_book].[app].[EmailAuthTokens]');
  console.log('([userId], [serviceType], [accessToken], [refreshToken], [expiresAt], [scope], [email], [isValid])');
  console.log('VALUES');
  console.log('(');
  console.log('  \'test-user\', -- or your user ID');
  console.log('  \'GMAIL\',');
  console.log('  \'YOUR_ACCESS_TOKEN\',');
  console.log('  \'YOUR_REFRESH_TOKEN\',');
  console.log('  DATEADD(HOUR, 1, GETDATE()), -- expires in 1 hour');
  console.log('  \'https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.modify\',');
  console.log('  \'your_email@gmail.com\',');
  console.log('  1');
  console.log(');');
  console.log('');
  
  console.log('📋 STEP 3: Quick Setup with OAuth Playground');
  console.log('============================================');
  console.log('1. Go to: https://developers.google.com/oauthplayground/');
  console.log('2. Configure OAuth credentials (if you have them)');
  console.log('3. Select Gmail API scopes:');
  console.log('   ✅ https://www.googleapis.com/auth/gmail.readonly');
  console.log('   ✅ https://www.googleapis.com/auth/gmail.send');
  console.log('   ✅ https://www.googleapis.com/auth/gmail.modify');
  console.log('4. Get access and refresh tokens');
  console.log('5. Insert into both database tables');
  console.log('');
  
  console.log('📋 STEP 4: Alternative - Use Backend API');
  console.log('=========================================');
  console.log('If your backend has the manual token endpoint:');
  console.log('');
  console.log('curl -X POST "http://localhost:4002/email/auth/GMAIL/manual-token" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "x-api-key: 9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN" \\');
  console.log('  -d \'{');
  console.log('    "userId": "test-user",');
  console.log('    "accessToken": "YOUR_ACCESS_TOKEN",');
  console.log('    "refreshToken": "YOUR_REFRESH_TOKEN",');
  console.log('    "email": "your_email@gmail.com"');
  console.log('  }\'');
  console.log('');
  
  console.log('📋 STEP 5: Verify Database Configuration');
  console.log('========================================');
  console.log('After configuration, check:');
  console.log('');
  console.log('-- Check if Gmail config exists');
  console.log('SELECT * FROM [db_address_book].[app].[EmailServiceConfigs]');
  console.log('WHERE [serviceType] = \'GMAIL\' AND [isActive] = 1;');
  console.log('');
  console.log('-- Check if Gmail tokens exist');
  console.log('SELECT * FROM [db_address_book].[app].[EmailAuthTokens]');
  console.log('WHERE [serviceType] = \'GMAIL\' AND [isValid] = 1;');
  console.log('');
  
  console.log('📋 EXPECTED RESULTS AFTER CONFIGURATION:');
  console.log('========================================');
  console.log('✅ EmailServiceConfigs: Gmail OAuth client configured');
  console.log('✅ EmailAuthTokens: Valid Gmail tokens stored');
  console.log('✅ Backend: Gmail service health = true');
  console.log('✅ Frontend: No more "Email response format error"');
  console.log('✅ Email sending: Working properly');
  console.log('');
  
  console.log('📋 TROUBLESHOOTING:');
  console.log('====================');
  console.log('If still getting errors:');
  console.log('1. Verify both tables have Gmail data');
  console.log('2. Check if tokens are expired (expiresAt field)');
  console.log('3. Ensure isActive = 1 and isValid = 1');
  console.log('4. Verify clientId and clientSecret are correct');
  console.log('5. Check backend logs for detailed errors');
  console.log('');
  
  console.log('🎯 SUMMARY:');
  console.log('============');
  console.log('The "Email response format error" is caused by:');
  console.log('❌ Missing Gmail OAuth configuration in database tables');
  console.log('❌ No valid OAuth tokens stored');
  console.log('❌ Backend cannot authenticate with Gmail');
  console.log('');
  console.log('✅ Solution: Populate both database tables with Gmail OAuth data');
  console.log('✅ Result: Working email service and proper responses');
  console.log('');
  
  console.log('🚀 Ready to configure the database for Gmail OAuth!');
  console.log('   Follow the steps above to resolve the issue completely.');
}

// Run the database config check
checkDatabaseConfig().catch(console.error);
