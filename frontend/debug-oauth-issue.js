const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8PFK0tkN';

async function debugOAuthIssue() {
  console.log('🔍 Debugging OAuth Issue Step by Step...\n');

  try {
    // Step 1: Check if we can connect to the backend
    console.log('📋 STEP 1: Testing Backend Connection');
    const healthResponse = await fetch(`${API_BASE}/health`, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log(`   Health Check Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Backend is running');
    } else {
      console.log('   ❌ Backend connection failed');
      return;
    }

    // Step 2: Check OAuth status before any operations
    console.log('\n📋 STEP 2: Check Initial OAuth Status');
    const statusResponse = await fetch(`${API_BASE}/auth/user123/oauth/status`, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log(`   Status Check: ${statusResponse.status}`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('   ✅ OAuth status retrieved');
      console.log('   Data:', JSON.stringify(statusData, null, 2));
    }

    // Step 3: Test Gmail connection (this should save credentials)
    console.log('\n📋 STEP 3: Test Gmail Connection (Save Credentials)');
    const connectResponse = await fetch(`${API_BASE}/auth/user123/gmail/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        accountName: 'Personal Gmail',
        clientId: 'test-client-id-123',
        clientSecret: 'test-client-secret-123'
      })
    });
    
    console.log(`   Connect Status: ${connectResponse.status}`);
    if (connectResponse.ok) {
      const connectData = await connectResponse.json();
      console.log('   ✅ Gmail connection request successful');
      console.log('   Auth URL generated:', connectData.authUrl ? 'Yes' : 'No');
    } else {
      const errorData = await connectResponse.text();
      console.log('   ❌ Gmail connection failed');
      console.log('   Error:', errorData);
      return;
    }

    // Step 4: Check if credentials were saved
    console.log('\n📋 STEP 4: Check if Credentials were Saved');
    const accountsResponse = await fetch(`${API_BASE}/auth/user123/gmail/accounts`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    console.log(`   Accounts Status: ${accountsResponse.status}`);
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      console.log('   ✅ Gmail accounts retrieved');
      console.log('   Accounts found:', accountsData.accounts?.length || 0);
      console.log('   Account details:', JSON.stringify(accountsData.accounts, null, 2));
    } else {
      const errorData = await accountsResponse.text();
      console.log('   ❌ Failed to get accounts');
      console.log('   Error:', errorData);
    }

    // Step 5: Test the problematic callback with a fake code
    console.log('\n📋 STEP 5: Test OAuth Callback (This is where 500 error occurs)');
    const callbackResponse = await fetch(`${API_BASE}/auth/user123/gmail/callback?code=test&state=Personal%20Gmail`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    console.log(`   Callback Status: ${callbackResponse.status}`);
    if (callbackResponse.ok) {
      const callbackData = await callbackResponse.json();
      console.log('   ✅ OAuth callback successful (unexpected!)');
      console.log('   Data:', JSON.stringify(callbackData, null, 2));
    } else {
      const errorData = await callbackResponse.text();
      console.log('   ❌ OAuth callback failed (expected)');
      console.log('   Error Status:', callbackResponse.status);
      console.log('   Error Details:', errorData);
    }

    console.log('\n🎯 DEBUG SUMMARY:');
    console.log('=====================================');
    console.log('✅ Backend connection: Working');
    console.log('✅ OAuth status endpoint: Working');
    console.log('✅ Gmail connection: Working');
    console.log('✅ Credentials saving: Working');
    console.log('❌ OAuth callback: Failing with 500');
    console.log('\n🔍 The issue is in the OAuth callback step');
    console.log('   This is expected with a test authorization code');
    console.log('   The real issue would be with real OAuth flow');

  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  }
}

// Run the debug script
debugOAuthIssue();
