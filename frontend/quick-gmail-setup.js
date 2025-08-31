const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function quickGmailSetup() {
  console.log('🚀 Quick Gmail OAuth Setup (OAuth Playground Method)\n');
  
  console.log('📋 STEP 1: Get Gmail Tokens from OAuth Playground');
  console.log('==================================================');
  console.log('1. Go to: https://developers.google.com/oauthplayground/');
  console.log('2. Click the settings icon (⚙️) in the top right');
  console.log('3. Check "Use your own OAuth credentials"');
  console.log('4. Enter your Google Cloud OAuth credentials:');
  console.log('   - OAuth Client ID: (from Google Cloud Console)');
  console.log('   - OAuth Client Secret: (from Google Cloud Console)');
  console.log('5. Close settings');
  console.log('');
  
  console.log('6. In the left panel, scroll to "Gmail API v1"');
  console.log('7. Select these scopes:');
  console.log('   ✅ https://www.googleapis.com/auth/gmail.readonly');
  console.log('   ✅ https://www.googleapis.com/auth/gmail.send');
  console.log('   ✅ https://www.googleapis.com/auth/gmail.modify');
  console.log('   ✅ https://www.googleapis.com/auth/gmail.labels');
  console.log('');
  
  console.log('8. Click "Authorize APIs"');
  console.log('9. Sign in with your Gmail account');
  console.log('10. Grant permissions');
  console.log('11. Click "Exchange authorization code for tokens"');
  console.log('12. Copy the "Access token" and "Refresh token"');
  console.log('');
  
  console.log('📋 STEP 2: Insert Tokens into Backend');
  console.log('=====================================');
  console.log('Once you have the tokens, run this command:');
  console.log('');
  console.log('curl -X POST "http://localhost:4002/email/auth/GMAIL/manual-token" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "x-api-key: 9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN" \\');
  console.log('  -d \'{');
  console.log('    "userId": "test-user",');
  console.log('    "accessToken": "YOUR_ACCESS_TOKEN_HERE",');
  console.log('    "refreshToken": "YOUR_REFRESH_TOKEN_HERE",');
  console.log('    "email": "your_email@gmail.com"');
  console.log('  }\'');
  console.log('');
  
  console.log('📋 STEP 3: Test Email Sending');
  console.log('==============================');
  console.log('After inserting tokens, test with:');
  console.log('node test-email-sending.js');
  console.log('');
  
  console.log('📋 ALTERNATIVE: Full Google Cloud Setup');
  console.log('======================================');
  console.log('If you prefer the full setup:');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Create project and enable Gmail API');
  console.log('3. Create OAuth 2.0 credentials');
  console.log('4. Update backend .env file');
  console.log('5. Restart backend server');
  console.log('');
  
  console.log('🎯 Which method would you like to use?');
  console.log('   A) Quick OAuth Playground (recommended for testing)');
  console.log('   B) Full Google Cloud Console setup');
  console.log('   C) I already have tokens, just help me insert them');
  
  // Test current status
  console.log('\n📊 CURRENT STATUS CHECK:');
  console.log('========================');
  
  try {
    const healthResponse = await fetch(`${API_BASE}/email/services/health`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('📧 Email Service Health:', health.healthStatus);
      console.log('   Gmail:', health.healthStatus.GMAIL ? '✅ Working' : '❌ Not working');
      console.log('   Outlook:', health.healthStatus.OUTLOOK ? '✅ Working' : '❌ Not working');
    }
  } catch (error) {
    console.log('❌ Could not check service health:', error.message);
  }
  
  console.log('\n🚀 Ready to proceed with Gmail OAuth setup!');
}

// Run the quick setup guide
quickGmailSetup().catch(console.error);
