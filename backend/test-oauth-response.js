const http = require('http');

console.log('🧪 Testing OAuth URL endpoint response...');

const postData = JSON.stringify({
  provider: 'gmail',
  redirectUri: 'http://localhost:3000'
});

const options = {
  hostname: 'localhost',
  port: 4002,
  path: '/api/mail-accounts/oauth-url',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log('📡 Status Code:', res.statusCode);
  console.log('📡 Status Message:', res.statusMessage);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📦 Response Body:');
    console.log(data);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      try {
        const response = JSON.parse(data);
        console.log('\n✅ OAuth URL generated successfully!');
        console.log('   Auth URL:', response.authUrl);
        console.log('   State:', response.state);
        console.log('   Redirect URI:', response.redirectUri);
        
        // Extract redirect_uri from the OAuth URL
        const oauthUrl = new URL(response.authUrl);
        const redirectUriFromUrl = oauthUrl.searchParams.get('redirect_uri');
        console.log('\n🔍 Redirect URI in OAuth URL:', redirectUriFromUrl);
        
        console.log('\n📝 Make sure this EXACT redirect URI is in your Google Cloud Console:');
        console.log('   ', redirectUriFromUrl);
        
      } catch (e) {
        console.log('❌ Failed to parse JSON response:', e.message);
      }
    } else {
      console.log('❌ OAuth endpoint failed with status:', res.statusCode);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Request error:', e.message);
  console.log('   Make sure the backend server is running on port 4002');
});

req.write(postData);
req.end();
