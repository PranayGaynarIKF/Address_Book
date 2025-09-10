const http = require('http');

function testOAuthEndpoint() {
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

  console.log('🧪 Testing OAuth endpoint...');
  console.log('📡 Request:', options.method, 'http://' + options.hostname + ':' + options.port + options.path);
  console.log('📦 Body:', postData);

  const req = http.request(options, (res) => {
    console.log('📡 Response Status:', res.statusCode);
    console.log('📡 Response Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📦 Response Body:', data);
      
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log('✅ OAuth URL generated successfully!');
          console.log('   Auth URL:', response.authUrl);
          console.log('   State:', response.state);
          console.log('   Redirect URI:', response.redirectUri);
        } catch (e) {
          console.log('❌ Failed to parse JSON response');
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
}

// Test debug endpoint first
function testDebugEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 4002,
    path: '/api/mail-accounts/debug-oauth',
    method: 'GET'
  };

  console.log('🔍 Testing debug endpoint...');
  console.log('📡 Request:', options.method, 'http://' + options.hostname + ':' + options.port + options.path);

  const req = http.request(options, (res) => {
    console.log('📡 Debug Response Status:', res.statusCode);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📦 Debug Response:', data);
      console.log('\n' + '='.repeat(50));
      testOAuthEndpoint();
    });
  });

  req.on('error', (e) => {
    console.log('❌ Debug request error:', e.message);
    console.log('   Make sure the backend server is running on port 4002');
  });

  req.end();
}

console.log('🚀 Starting OAuth endpoint tests...\n');
testDebugEndpoint();
