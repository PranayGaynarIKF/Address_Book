// Simple test to check OAuth URL generation
console.log('🧪 Testing OAuth URL generation...');

// Simulate the OAuth URL generation logic
const clientId = process.env.GOOGLE_CLIENT_ID || 'test-client-id';
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4002/auth/google/callback';

console.log('📋 Configuration:');
console.log('   Client ID:', clientId ? '✅ Set' : '❌ Missing');
console.log('   Redirect URI:', redirectUri);

if (!clientId || clientId === 'test-client-id') {
  console.log('❌ GOOGLE_CLIENT_ID not set in environment variables');
  console.log('   Please set GOOGLE_CLIENT_ID in your .env file');
} else {
  // Generate OAuth URL
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
  ];

  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.set('client_id', clientId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('scope', scopes.join(' '));
  oauthUrl.searchParams.set('access_type', 'offline');
  oauthUrl.searchParams.set('prompt', 'consent');
  
  const state = `gmail_oauth_${Date.now()}`;
  oauthUrl.searchParams.set('state', state);

  console.log('✅ Generated OAuth URL:');
  console.log('   URL:', oauthUrl.toString());
  console.log('   State:', state);
  console.log('   Redirect URI:', redirectUri);
  
  console.log('\n📝 Make sure this redirect URI is added to your Google Cloud Console:');
  console.log('   ', redirectUri);
}
