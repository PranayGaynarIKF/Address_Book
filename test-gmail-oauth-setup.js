#!/usr/bin/env node

/**
 * Gmail OAuth Test Script
 * This script tests the Gmail OAuth setup and email functionality
 */

const API_BASE = 'http://localhost:4002';
const API_KEY = '0149f6cf158a88461d1fca0d6da773ac'; // Use the correct API key for email

async function testGmailOAuthSetup() {
  console.log('🧪 Gmail OAuth Setup Test');
  console.log('=========================\n');

  try {
    // Test 1: Check if backend is running
    console.log('1️⃣ Testing backend connection...');
    try {
      const healthResponse = await fetch(`${API_BASE}/health`);
      if (healthResponse.ok) {
        console.log('✅ Backend is running');
      } else {
        console.log('❌ Backend is not responding properly');
        return;
      }
    } catch (error) {
      console.log('❌ Backend is not running. Please start it with: cd backend && npm run start:dev');
      return;
    }

    // Test 2: Check OAuth token status
    console.log('\n2️⃣ Checking OAuth token status...');
    try {
      const tokenResponse = await fetch(`${API_BASE}/email/test-tokens`, {
        headers: { 'x-api-key': API_KEY }
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        console.log('✅ Token status check successful');
        console.log('   Has token:', tokenData.hasToken);
        if (tokenData.hasToken) {
          console.log('   Token email:', tokenData.token.email);
          console.log('   Token expires:', tokenData.token.expiresAt);
        } else {
          console.log('   ⚠️  No valid OAuth tokens found');
        }
      } else {
        console.log('❌ Token status check failed:', tokenResponse.status);
      }
    } catch (error) {
      console.log('❌ Error checking token status:', error.message);
    }

    // Test 3: Check Gmail OAuth URL generation
    console.log('\n3️⃣ Testing Gmail OAuth URL generation...');
    try {
      const oauthUrlResponse = await fetch(`${API_BASE}/api/mail-accounts/google-oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (oauthUrlResponse.ok) {
        const oauthData = await oauthUrlResponse.json();
        console.log('✅ Gmail OAuth URL generation works');
        console.log('   OAuth URL:', oauthData.data.oauthUrl);
        console.log('   You can visit this URL to start OAuth flow');
      } else {
        console.log('❌ Gmail OAuth URL generation failed:', oauthUrlResponse.status);
      }
    } catch (error) {
      console.log('❌ Error testing OAuth URL generation:', error.message);
    }

    // Test 4: Check if we have tags for testing
    console.log('\n4️⃣ Checking available tags for email testing...');
    try {
      const tagsResponse = await fetch(`${API_BASE}/email/tags`, {
        headers: { 'x-api-key': API_KEY }
      });
      
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        if (tagsData.tags && tagsData.tags.length > 0) {
          console.log('✅ Found tags for testing:', tagsData.tags.length);
          console.log('   First tag:', tagsData.tags[0].name);
        } else {
          console.log('⚠️  No tags found for testing');
        }
      } else {
        console.log('❌ Failed to get tags:', tagsResponse.status);
      }
    } catch (error) {
      console.log('❌ Error checking tags:', error.message);
    }

    // Test 5: Test email sending (if tokens are available)
    console.log('\n5️⃣ Testing email sending functionality...');
    try {
      const tagsResponse = await fetch(`${API_BASE}/email/tags`, {
        headers: { 'x-api-key': API_KEY }
      });
      
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        if (tagsData.tags && tagsData.tags.length > 0) {
          const testTag = tagsData.tags[0];
          console.log(`   Testing with tag: ${testTag.name}`);
          
          const testEmailData = {
            subject: 'Test Email from OAuth Setup',
            body: 'This is a test email to verify Gmail OAuth setup.',
            serviceType: 'GMAIL'
          };
          
          const emailResponse = await fetch(`${API_BASE}/email/tags/${testTag.id}/send-bulk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': API_KEY,
            },
            body: JSON.stringify(testEmailData)
          });
          
          if (emailResponse.ok) {
            const result = await emailResponse.json();
            console.log('✅ Email sending test successful!');
            console.log('   Success count:', result.successCount);
            console.log('   Failure count:', result.failureCount);
          } else {
            const errorData = await emailResponse.json();
            console.log('❌ Email sending test failed:', emailResponse.status);
            console.log('   Error:', errorData.message || errorData);
            
            if (emailResponse.status === 401) {
              console.log('   💡 This suggests OAuth tokens are missing or invalid');
              console.log('   💡 Please complete the OAuth flow first');
            }
          }
        }
      }
    } catch (error) {
      console.log('❌ Error testing email sending:', error.message);
    }

    console.log('\n📋 Summary and Next Steps:');
    console.log('===========================');
    console.log('If you see any ❌ errors above, follow these steps:');
    console.log('');
    console.log('1. Make sure your backend/.env file has correct Gmail OAuth credentials');
    console.log('2. Start the backend server: cd backend && npm run start:dev');
    console.log('3. Complete OAuth flow: POST to http://localhost:4002/api/mail-accounts/google-oauth');
    console.log('4. Run this test again to verify everything works');
    console.log('');
    console.log('🔗 Useful URLs:');
    console.log('- OAuth Login: POST http://localhost:4002/api/mail-accounts/google-oauth');
console.log('- OAuth Callback: http://localhost:4002/api/mail-accounts/oauth-callback');
    console.log('- Test Tokens: http://localhost:4002/email/test-tokens');
    console.log('');

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

// Run the test
testGmailOAuthSetup();
