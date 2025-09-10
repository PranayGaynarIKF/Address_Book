console.log('🔍 Testing redirect URI generation...');

// Test the OAuth URL generation
const http = require('http');

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
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      try {
        const response = JSON.parse(data);
        const oauthUrl = new URL(response.authUrl);
        const redirectUri = oauthUrl.searchParams.get('redirect_uri');
        
        console.log('✅ OAuth URL generated successfully!');
        console.log('📋 Redirect URI in OAuth URL:', redirectUri);
        console.log('📋 Expected in Google Console:', 'http://localhost:3000/oauth-callback.html');
        
        if (redirectUri === 'http://localhost:3000/oauth-callback.html') {
          console.log('✅ Redirect URI matches! Add this to Google Cloud Console.');
        } else {
          console.log('❌ Redirect URI mismatch!');
        }
        
      } catch (e) {
        console.log('❌ Failed to parse response:', e.message);
      }
    } else {
      console.log('❌ Request failed with status:', res.statusCode);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Request error:', e.message);
});

req.write(postData);
req.end();
