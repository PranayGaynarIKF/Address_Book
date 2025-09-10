console.log('🔍 Debugging OAuth Redirect URI...');

// Check environment variables
console.log('Environment Variables:');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
console.log('  GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'Not set');

// Simulate the OAuth URL generation
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4002/api/mail-accounts/oauth-callback';
console.log('\nUsing redirect URI:', redirectUri);

// Generate OAuth URL
const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
oauthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || 'test-client-id');
oauthUrl.searchParams.set('redirect_uri', redirectUri);
oauthUrl.searchParams.set('response_type', 'code');
oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send');
oauthUrl.searchParams.set('access_type', 'offline');
oauthUrl.searchParams.set('prompt', 'consent');

console.log('\nGenerated OAuth URL:');
console.log(oauthUrl.toString());

console.log('\nExtracted redirect_uri from URL:');
console.log(oauthUrl.searchParams.get('redirect_uri'));

console.log('\n📝 Make sure this EXACT redirect URI is in your Google Cloud Console:');
console.log('   ', oauthUrl.searchParams.get('redirect_uri'));
