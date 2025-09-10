const http = require('http');

console.log('🧪 Testing OAuth URL with correct redirect URI...');

const postData = JSON.stringify({
  provider: 'gmail',
  redirectUri: 'http://localhost:3000/oauth-callback.html'
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
        
        console.log('\n📝 This should match your Google Cloud Console:');
        console.log('   ', redirectUriFromUrl);
        
        if (redirectUriFromUrl === 'http://localhost:4002/api/mail-accounts/oauth-callback') {
          console.log('✅ Redirect URI matches! OAuth should work now.');
        } else {
          console.log('❌ Redirect URI mismatch!');
        }
        
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
});

req.write(postData);
req.end();
