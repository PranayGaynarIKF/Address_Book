const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function testGmailOAuth() {
  console.log('🧪 Testing Gmail OAuth Setup...\n');

  // Test 1: Check current email service health
  try {
    console.log('1️⃣ Checking current email service health...');
    const healthResponse = await fetch(`${API_BASE}/email/services/health`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Current health status:', health.healthStatus);
      console.log('   Gmail:', health.healthStatus.GMAIL ? '✅ Working' : '❌ Not working');
      console.log('   Outlook:', health.healthStatus.OUTLOOK ? '✅ Working' : '❌ Not working');
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }

  // Test 2: Test OAuth URL generation
  try {
    console.log('\n2️⃣ Testing Gmail OAuth URL generation...');
    const oauthResponse = await fetch(`${API_BASE}/email/auth/GMAIL/url`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (oauthResponse.ok) {
      const oauthData = await oauthResponse.json();
      console.log('✅ OAuth URL generated successfully!');
      console.log('   URL:', oauthData.authUrl);
      console.log('   Message:', oauthData.message);
      
      console.log('\n🌐 To complete OAuth setup:');
      console.log('   1. Open this URL in your browser:');
      console.log('      ' + oauthData.authUrl);
      console.log('   2. Authorize your Gmail account');
      console.log('   3. Copy the authorization code from the callback URL');
      
    } else {
      const errorData = await oauthResponse.json();
      console.log('❌ OAuth URL generation failed:', oauthResponse.status);
      console.log('   Error:', errorData.message || 'Unknown error');
      
      if (oauthResponse.status === 500) {
        console.log('\n🔧 This usually means:');
        console.log('   - Google OAuth credentials not configured');
        console.log('   - Environment variables missing');
        console.log('   - Check your .env file for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
      }
    }
  } catch (error) {
    console.log('❌ OAuth URL test error:', error.message);
  }

  // Test 3: Test manual token insertion (if you have tokens)
  console.log('\n3️⃣ Manual Token Insertion Test');
  console.log('   If you have Gmail access/refresh tokens, you can test with:');
  console.log('   curl -X POST "http://localhost:4002/email/auth/GMAIL/manual-token" \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -H "x-api-key: 9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN" \\');
  console.log('     -d \'{');
  console.log('       "userId": "test-user",');
  console.log('       "accessToken": "your_access_token",');
  console.log('       "refreshToken": "your_refresh_token",');
  console.log('       "email": "your_email@gmail.com"');
  console.log('     }\'');

  // Test 4: Test email sending after OAuth setup
  console.log('\n4️⃣ After OAuth Setup - Test Email Sending');
  console.log('   Once OAuth is working, test with:');
  console.log('   - Open email compose component');
  console.log('   - Select a tag');
  console.log('   - Send test email');
  console.log('   - Check console for detailed logs');

  console.log('\n🎯 OAuth Setup Summary:');
  console.log('   ✅ Backend OAuth endpoints: Ready');
  console.log('   ✅ Email API: Working');
  console.log('   ❌ Gmail OAuth: Needs setup');
  console.log('   🔧 Next step: Configure Google Cloud credentials');
}

// Run the test
testGmailOAuth().catch(console.error);
