const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function setupGmailOAuth() {
  console.log('🚀 Gmail OAuth Setup Guide\n');
  
  console.log('📋 STEP 1: Google Cloud Console Setup');
  console.log('=====================================');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Create a new project or select existing one');
  console.log('3. Enable Gmail API:');
  console.log('   - Go to "APIs & Services" > "Library"');
  console.log('   - Search for "Gmail API"');
  console.log('   - Click "Enable"');
  console.log('');
  
  console.log('4. Create OAuth 2.0 Credentials:');
  console.log('   - Go to "APIs & Services" > "Credentials"');
  console.log('   - Click "Create Credentials" > "OAuth 2.0 Client IDs"');
  console.log('   - Choose "Web application"');
  console.log('   - Set authorized redirect URIs:');
  console.log('     * http://localhost:4002/auth/google/callback');
  console.log('     * http://localhost:3000/oauth-callback');
  console.log('   - Copy the Client ID and Client Secret');
  console.log('');

  console.log('📋 STEP 2: Test Current OAuth Status');
  console.log('====================================');
  
  try {
    // Test current OAuth status
    console.log('🔍 Testing current OAuth status...');
    const oauthResponse = await fetch(`${API_BASE}/email/auth/GMAIL/url`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (oauthResponse.ok) {
      const oauthData = await oauthResponse.json();
      console.log('✅ OAuth URL generated successfully!');
      console.log('🌐 OAuth URL:', oauthData.authUrl);
      console.log('');
      console.log('📋 STEP 3: Complete OAuth Flow');
      console.log('===============================');
      console.log('1. Open this URL in your browser:');
      console.log('   ' + oauthData.authUrl);
      console.log('');
      console.log('2. Sign in with your Gmail account');
      console.log('3. Grant permissions for Gmail access');
      console.log('4. Copy the authorization code from the callback URL');
      console.log('');
      console.log('📋 STEP 4: Test Email Sending After OAuth');
      console.log('==========================================');
      console.log('Once OAuth is complete, test with:');
      console.log('- Open email compose component');
      console.log('- Select a tag');
      console.log('- Send test email');
      console.log('- Check if emails are actually delivered');
      
    } else {
      const errorData = await oauthResponse.json().catch(() => ({}));
      console.log('❌ OAuth URL generation failed:', oauthResponse.status);
      console.log('❌ Error:', errorData.message || 'Unknown error');
      console.log('');
      
      if (oauthResponse.status === 500) {
        console.log('🔧 This means Google OAuth credentials are not configured yet.');
        console.log('📋 You need to complete Step 1 first (Google Cloud Console setup).');
        console.log('');
        console.log('📋 After setting up Google Cloud credentials:');
        console.log('1. Update your backend .env file with:');
        console.log('   GOOGLE_CLIENT_ID=your_actual_google_client_id_here');
        console.log('   GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here');
        console.log('   GOOGLE_REDIRECT_URI=http://localhost:4002/auth/google/callback');
        console.log('');
        console.log('2. Restart your backend server');
        console.log('3. Run this script again to test OAuth');
      }
    }
  } catch (error) {
    console.log('❌ Error testing OAuth:', error.message);
  }

  console.log('');
  console.log('📋 ALTERNATIVE: Manual Token Insertion');
  console.log('=====================================');
  console.log('If you have Gmail access/refresh tokens, you can insert them manually:');
  console.log('');
  console.log('curl -X POST "http://localhost:4002/email/auth/GMAIL/manual-token" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "x-api-key: 9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN" \\');
  console.log('  -d \'{');
  console.log('    "userId": "test-user",');
  console.log('    "accessToken": "your_access_token",');
  console.log('    "refreshToken": "your_refresh_token",');
  console.log('    "email": "your_email@gmail.com"');
  console.log('  }\'');
  console.log('');
  
  console.log('📋 USEFUL LINKS');
  console.log('===============');
  console.log('• Google Cloud Console: https://console.cloud.google.com/');
  console.log('• Gmail API Documentation: https://developers.google.com/gmail/api');
  console.log('• OAuth 2.0 Playground: https://developers.google.com/oauthplayground/');
  console.log('');
  
  console.log('🎯 Setup completed! Follow the steps above to configure Gmail OAuth.');
}

// Run the setup guide
setupGmailOAuth().catch(console.error);
