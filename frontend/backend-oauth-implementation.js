const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function backendOAuthImplementation() {
  console.log('🔧 Backend OAuth Callback Auto-Save Implementation (Option A)\n');
  
  console.log('📋 STEP 1: Find Your OAuth Callback Endpoint');
  console.log('==============================================');
  console.log('Look for this in your backend code:');
  console.log('- /auth/google/callback');
  console.log('- /oauth/google/callback');
  console.log('- /email/auth/google/callback');
  console.log('');
  
  console.log('📋 STEP 2: Add Auto-Save Logic');
  console.log('================================');
  console.log('In your OAuth callback, after getting tokens from Google:');
  console.log('');
  console.log('// After Google OAuth success, add this:');
  console.log('const tokenData = {');
  console.log('  userId: req.user?.id || "current-user-id",');
  console.log('  serviceType: "GMAIL",');
  console.log('  accessToken: tokens.access_token,');
  console.log('  refreshToken: tokens.refresh_token,');
  console.log('  expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),');
  console.log('  scope: JSON.stringify(tokens.scope || defaultGmailScopes),');
  console.log('  email: userEmail,');
  console.log('  isValid: true,');
  console.log('  createdAt: new Date(),');
  console.log('  updatedAt: new Date()');
  console.log('};');
  console.log('');
  console.log('// Auto-save to database');
  console.log('try {');
  console.log('  await saveEmailAuthToken(tokenData);');
  console.log('  console.log("✅ Tokens saved automatically!");');
  console.log('} catch (error) {');
  console.log('  console.error("❌ Failed to save tokens:", error);');
  console.log('}');
  console.log('');
  
  console.log('📋 STEP 3: Create saveEmailAuthToken Function');
  console.log('============================================');
  console.log('Add this function to your backend:');
  console.log('');
  console.log('async function saveEmailAuthToken(tokenData) {');
  console.log('  // Check if token already exists');
  console.log('  const existingToken = await db.query(');
  console.log('    "SELECT id FROM [db_address_book].[app].[EmailAuthTokens] WHERE userId = ? AND serviceType = ?",');
  console.log('    [tokenData.userId, tokenData.serviceType]');
  console.log('  );');
  console.log('');
  console.log('  if (existingToken.length > 0) {');
  console.log('    // Update existing token');
  console.log('    await db.query(');
  console.log('      "UPDATE [db_address_book].[app].[EmailAuthTokens] SET accessToken = ?, refreshToken = ?, expiresAt = ?, updatedAt = ? WHERE id = ?",');
  console.log('      [tokenData.accessToken, tokenData.refreshToken, tokenData.expiresAt, tokenData.updatedAt, existingToken[0].id]');
  console.log('    );');
  console.log('  } else {');
  console.log('    // Insert new token');
  console.log('    await db.query(');
  console.log('      "INSERT INTO [db_address_book].[app].[EmailAuthTokens] (userId, serviceType, accessToken, refreshToken, expiresAt, scope, email, isValid, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",');
  console.log('      [tokenData.userId, tokenData.serviceType, tokenData.accessToken, tokenData.refreshToken, tokenData.expiresAt, tokenData.scope, tokenData.email, tokenData.isValid, tokenData.createdAt, tokenData.updatedAt]');
  console.log('    );');
  console.log('  }');
  console.log('}');
  console.log('');
  
  console.log('📋 STEP 4: Define Default Gmail Scopes');
  console.log('========================================');
  console.log('Add this constant to your backend:');
  console.log('');
  console.log('const defaultGmailScopes = [');
  console.log('  "https://www.googleapis.com/auth/gmail.readonly",');
  console.log('  "https://www.googleapis.com/auth/gmail.send",');
  console.log('  "https://www.googleapis.com/auth/gmail.modify",');
  console.log('  "https://www.googleapis.com/auth/gmail.labels"');
  console.log('];');
  console.log('');
  
  console.log('📋 STEP 5: Test the Implementation');
  console.log('====================================');
  console.log('1. Restart your backend server');
  console.log('2. Try connecting Gmail from frontend');
  console.log('3. Check database - tokens should be saved automatically');
  console.log('4. Test email sending - should work immediately');
  console.log('');
  
  console.log('🎯 EXPECTED RESULT:');
  console.log('====================');
  console.log('✅ User connects Gmail');
  console.log('✅ Backend generates tokens');
  console.log('✅ Tokens automatically saved to database');
  console.log('✅ Email sending works immediately');
  console.log('✅ No manual database insertion needed');
  console.log('');
  
  console.log('🚀 Ready to implement backend OAuth auto-save!');
  console.log('   Follow the steps above to automate your token saving process.');
}

// Run the implementation guide
backendOAuthImplementation().catch(console.error);
