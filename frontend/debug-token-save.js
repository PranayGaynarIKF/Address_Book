const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function debugTokenSave() {
  console.log('🔍 Debugging Why Tokens Are Not Being Saved Automatically...\n');
  
  console.log('📋 CURRENT ISSUE:');
  console.log('==================');
  console.log('❌ Tokens are NOT being saved automatically to EmailAuthTokens table');
  console.log('❌ You still need to manually insert tokens');
  console.log('❌ The automation is not working');
  console.log('');
  
  console.log('📋 DIAGNOSIS STEPS:');
  console.log('=====================');
  console.log('1️⃣ Check if backend OAuth callback has the auto-save code');
  console.log('2️⃣ Check if saveEmailAuthToken function exists');
  console.log('3️⃣ Check database connection and permissions');
  console.log('4️⃣ Check backend logs for errors');
  console.log('');
  
  console.log('📋 STEP 1: Verify Backend Implementation');
  console.log('==========================================');
  console.log('In your backend OAuth callback, you should have:');
  console.log('');
  console.log('✅ The auto-save logic added');
  console.log('✅ saveEmailAuthToken function created');
  console.log('✅ Database connection working');
  console.log('✅ No errors in backend logs');
  console.log('');
  
  console.log('📋 STEP 2: Check Backend OAuth Callback');
  console.log('========================================');
  console.log('Look for this in your backend:');
  console.log('- /auth/google/callback endpoint');
  console.log('- /oauth/google/callback endpoint');
  console.log('- /email/auth/google/callback endpoint');
  console.log('');
  console.log('The endpoint should contain:');
  console.log('1. Google OAuth token exchange');
  console.log('2. Auto-save logic (the code I provided)');
  console.log('3. saveEmailAuthToken function call');
  console.log('');
  
  console.log('📋 STEP 3: Common Issues & Solutions');
  console.log('=====================================');
  console.log('❌ ISSUE 1: Auto-save code not added');
  console.log('   SOLUTION: Add the auto-save logic to your OAuth callback');
  console.log('');
  console.log('❌ ISSUE 2: saveEmailAuthToken function missing');
  console.log('   SOLUTION: Create the function I provided');
  console.log('');
  console.log('❌ ISSUE 3: Database connection error');
  console.log('   SOLUTION: Check database connection string and permissions');
  console.log('');
  console.log('❌ ISSUE 4: Function not being called');
  console.log('   SOLUTION: Add console.log to verify function execution');
  console.log('');
  
  console.log('📋 STEP 4: Quick Test');
  console.log('======================');
  console.log('Add this to your OAuth callback for testing:');
  console.log('');
  console.log('console.log("🔍 OAuth Callback Executed");');
  console.log('console.log("🔍 Tokens received:", {');
  console.log('  access_token: tokens.access_token ? "YES" : "NO",');
  console.log('  refresh_token: tokens.refresh_token ? "YES" : "NO",');
  console.log('  expires_in: tokens.expires_in');
  console.log('});');
  console.log('');
  console.log('// After auto-save attempt');
  console.log('console.log("🔍 Auto-save attempt completed");');
  console.log('');
  
  console.log('📋 STEP 5: Manual Verification');
  console.log('================================');
  console.log('1. Check your backend console/logs');
  console.log('2. Look for the console.log messages above');
  console.log('3. Check if saveEmailAuthToken function is called');
  console.log('4. Look for any error messages');
  console.log('');
  
  console.log('📋 STEP 6: Database Check');
  console.log('==========================');
  console.log('Run this query to see current tokens:');
  console.log('');
  console.log('SELECT TOP (10) [id], [userId], [serviceType], [email], [isValid], [createdAt]');
  console.log('FROM [db_address_book].[app].[EmailAuthTokens]');
  console.log('ORDER BY [createdAt] DESC;');
  console.log('');
  
  console.log('🎯 NEXT STEPS:');
  console.log('===============');
  console.log('1. Check if you added the auto-save code to your backend');
  console.log('2. Verify the saveEmailAuthToken function exists');
  console.log('3. Check backend logs for errors');
  console.log('4. Test OAuth flow again');
  console.log('5. Let me know what you find');
  console.log('');
  
  console.log('🚀 Ready to debug the token saving issue!');
  console.log('   Follow the steps above to identify why automation is not working.');
}

// Run the debug guide
debugTokenSave().catch(console.error);
