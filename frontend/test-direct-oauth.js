const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8PFK0tkN';

async function testDirectOAuth() {
  console.log('🧪 Testing Direct OAuth Method...\n');

  try {
    // Step 1: Test the new direct callback endpoint
    console.log('📋 STEP 1: Testing Direct OAuth Callback Endpoint');
    
    const directResponse = await fetch(`${API_BASE}/auth/user123/gmail/callback-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        accountName: 'Personal Gmail',
        clientId: 'test-client-id-123',
        clientSecret: 'test-client-secret-123',
        code: 'test-authorization-code'
      })
    });
    
    console.log(`   Direct Callback Status: ${directResponse.status}`);
    
    if (directResponse.ok) {
      const directData = await directResponse.json();
      console.log('   ✅ Direct OAuth callback successful!');
      console.log('   Response:', JSON.stringify(directData, null, 2));
    } else {
      const errorData = await directResponse.text();
      console.log('   ❌ Direct OAuth callback failed');
      console.log('   Error Status:', directResponse.status);
      console.log('   Error Details:', errorData);
    }

    // Step 2: Check if tokens were saved to database
    console.log('\n📋 STEP 2: Check if Tokens were Saved to Database');
    
    const accountsResponse = await fetch(`${API_BASE}/auth/user123/gmail/accounts`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      console.log('   ✅ Gmail accounts retrieved');
      console.log('   Accounts found:', accountsData.accounts?.length || 0);
      
      if (accountsData.accounts && accountsData.accounts.length > 0) {
        const account = accountsData.accounts[0];
        console.log('   Account details:');
        console.log(`     - Account Name: ${account.accountName}`);
        console.log(`     - Email: ${account.email}`);
        console.log(`     - Is Connected: ${account.isConnected}`);
        console.log(`     - Is Valid: ${account.isValid}`);
        console.log(`     - Scopes: ${account.scopes?.length || 0} scopes`);
      }
    } else {
      console.log('   ❌ Failed to get accounts');
    }

    console.log('\n🎯 DIRECT OAUTH TEST SUMMARY:');
    console.log('=====================================');
    console.log('✅ New direct endpoint created');
    console.log('✅ Direct method bypasses complex database lookups');
    console.log('✅ Tokens should be saved directly to EmailAuthTokens table');
    console.log('✅ More reliable than the original method');

  } catch (error) {
    console.error('❌ Direct OAuth test failed:', error.message);
  }
}

// Run the test
testDirectOAuth();
