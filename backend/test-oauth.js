const fetch = require('node-fetch');

async function testOAuthEndpoint() {
  try {
    console.log('🧪 Testing OAuth URL endpoint...');
    
    const response = await fetch('http://localhost:4002/api/mail-accounts/oauth-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'gmail',
        redirectUri: 'http://localhost:3000'
      })
    });

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! OAuth URL generated:');
      console.log('   Auth URL:', data.authUrl);
      console.log('   State:', data.state);
      console.log('   Redirect URI:', data.redirectUri);
      console.log('   Message:', data.message);
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log('   Status:', response.status);
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    console.log('   Make sure the backend server is running on port 4002');
  }
}

// Test debug endpoint too
async function testDebugEndpoint() {
  try {
    console.log('\n🔍 Testing debug OAuth endpoint...');
    
    const response = await fetch('http://localhost:4002/api/mail-accounts/debug-oauth');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Debug info:');
      console.log('   GOOGLE_CLIENT_ID:', data.data.GOOGLE_CLIENT_ID);
      console.log('   GOOGLE_CLIENT_SECRET:', data.data.GOOGLE_CLIENT_SECRET);
      console.log('   GOOGLE_REDIRECT_URI:', data.data.GOOGLE_REDIRECT_URI);
    } else {
      console.log('❌ Debug endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Debug endpoint error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting OAuth endpoint tests...\n');
  
  await testDebugEndpoint();
  await testOAuthEndpoint();
  
  console.log('\n✨ Tests completed!');
}

runTests();
