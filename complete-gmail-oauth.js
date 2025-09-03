#!/usr/bin/env node

/**
 * Complete Gmail OAuth Flow Script
 * This script helps you complete the Gmail OAuth flow to generate tokens
 */

const API_BASE = 'http://localhost:4002';

async function completeGmailOAuth() {
  console.log('🔐 Gmail OAuth Flow Completion');
  console.log('==============================\n');

  try {
    // Step 1: Get OAuth URL
    console.log('1️⃣ Getting Gmail OAuth URL...');
    const oauthResponse = await fetch(`${API_BASE}/api/mail-accounts/google-oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!oauthResponse.ok) {
      console.log('❌ Failed to get OAuth URL:', oauthResponse.status);
      return;
    }

    const oauthData = await oauthResponse.json();
    const oauthUrl = oauthData.data.oauthUrl;
    
    console.log('✅ OAuth URL generated successfully!');
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Copy and paste this URL into your browser:');
    console.log('');
    console.log(oauthUrl);
    console.log('');
    console.log('2. Complete the Google OAuth authorization in your browser');
    console.log('3. After authorization, you will be redirected to:');
    console.log('   http://localhost:4002/api/mail-accounts/oauth-callback');
    console.log('4. The system will automatically save the OAuth tokens');
    console.log('5. Run the test script again to verify everything works');
    console.log('');
    console.log('💡 Note: Make sure your backend server is running on port 4002');
    console.log('💡 The OAuth callback will only work if the backend is running');
    console.log('');

    // Step 2: Check if we can test the callback endpoint
    console.log('🔍 Testing OAuth callback endpoint...');
    try {
      const callbackResponse = await fetch(`${API_BASE}/api/mail-accounts/oauth-callback?code=test`, {
        method: 'GET'
      });
      
      if (callbackResponse.status === 400) {
        console.log('✅ OAuth callback endpoint is working (400 is expected for test code)');
      } else {
        console.log('⚠️  OAuth callback endpoint response:', callbackResponse.status);
      }
    } catch (error) {
      console.log('❌ OAuth callback endpoint test failed:', error.message);
    }

    console.log('\n🎯 Summary:');
    console.log('===========');
    console.log('1. Visit the OAuth URL above in your browser');
    console.log('2. Complete Google authorization');
    console.log('3. You will be redirected back to your app');
    console.log('4. OAuth tokens will be automatically saved');
    console.log('5. Test email sending functionality');
    console.log('');

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n💡 Make sure your backend server is running:');
    console.log('   cd backend && npm run start:dev');
  }
}

// Run the OAuth completion
completeGmailOAuth();
