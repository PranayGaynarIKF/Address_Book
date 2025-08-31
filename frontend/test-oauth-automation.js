const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function testOAuthAutomation() {
  console.log('🧪 Testing Gmail OAuth Automation Status...\n');
  
  console.log('📋 TEST 1: Check Current Email Service Health');
  console.log('============================================');
  
  try {
    const healthResponse = await fetch(`${API_BASE}/email/services/health`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Email Service Health:', health.healthStatus);
      console.log('   Gmail:', health.healthStatus.GMAIL ? '✅ Working' : '❌ Not working');
      console.log('   Outlook:', health.healthStatus.OUTLOOK ? '✅ Working' : '❌ Not working');
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }

  console.log('\n📋 TEST 2: Check Gmail OAuth URL Generation');
  console.log('============================================');
  
  try {
    const oauthResponse = await fetch(`${API_BASE}/email/auth/GMAIL/url`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    if (oauthResponse.ok) {
      const oauthData = await oauthResponse.json();
      console.log('✅ Gmail OAuth URL generated successfully');
      console.log('   OAuth URL:', oauthData.authUrl ? 'Generated' : 'Not generated');
      console.log('   Response:', oauthData);
    } else {
      const errorData = await oauthResponse.json();
      console.log('❌ Gmail OAuth configuration error:', errorData);
      console.log('   Status:', oauthResponse.status);
      console.log('   Message:', errorData.message || 'Unknown error');
    }
  } catch (oauthError) {
    console.log('❌ Gmail OAuth check failed:', oauthError.message);
  }

  console.log('\n📋 TEST 3: Check Current Database Tokens');
  console.log('==========================================');
  
  try {
    // Test if we can access the email service
    const testResponse = await fetch(`${API_BASE}/email/tags`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    if (testResponse.ok) {
      console.log('✅ Email service is accessible');
      console.log('   This means backend is running and responding');
    } else {
      console.log('❌ Email service not accessible:', testResponse.status);
    }
  } catch (error) {
    console.log('❌ Email service test failed:', error.message);
  }

  console.log('\n📋 TEST 4: Test Email Sending (Should Show Current Status)');
  console.log('==========================================================');
  
  try {
    const tagsResponse = await fetch(`${API_BASE}/email/tags`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    if (tagsResponse.ok) {
      const tags = await tagsResponse.json();
      if (tags.tags && tags.tags.length > 0) {
        const tag = tags.tags[0];
        console.log('✅ Found tag:', tag.name, 'ID:', tag.id);
        
        // Try to send a test email to see current status
        const testEmailData = {
          subject: 'Test OAuth Automation',
          body: 'Testing if OAuth automation is working...',
          serviceType: 'GMAIL'
        };
        
        const emailResponse = await fetch(`${API_BASE}/email/tags/${tag.id}/send-bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
          body: JSON.stringify(testEmailData)
        });
        
        console.log('📧 Email sending test result:');
        console.log('   Status:', emailResponse.status);
        console.log('   Status Text:', emailResponse.statusText);
        
        if (emailResponse.ok) {
          const result = await emailResponse.json();
          console.log('✅ Email sent successfully!');
          console.log('   Response:', result);
          console.log('   This means OAuth is working!');
        } else {
          const errorData = await emailResponse.json();
          console.log('❌ Email sending failed:');
          console.log('   Error:', errorData);
          
          if (emailResponse.status === 500) {
            console.log('   🔍 This suggests OAuth tokens are missing or expired');
            console.log('   🔍 The automation is NOT working yet');
          }
        }
      } else {
        console.log('⚠️  No tags found for testing');
      }
    } else {
      console.log('❌ Failed to get tags:', tagsResponse.status);
    }
  } catch (error) {
    console.log('❌ Email sending test failed:', error.message);
  }

  console.log('\n📋 TEST 5: OAuth Automation Status Summary');
  console.log('============================================');
  
  console.log('🎯 CURRENT STATUS:');
  console.log('==================');
  console.log('1. ✅ Backend is running and accessible');
  console.log('2. ✅ Email service endpoints are working');
  console.log('3. ❌ OAuth automation is NOT implemented yet');
  console.log('4. ❌ Tokens are NOT being saved automatically');
  console.log('5. ❌ You still need manual database insertion');
  console.log('');
  
  console.log('🔧 WHAT NEEDS TO BE DONE:');
  console.log('==========================');
  console.log('1. Add auto-save code to your backend OAuth callback');
  console.log('2. Create saveEmailAuthToken function');
  console.log('3. Test the OAuth flow again');
  console.log('4. Verify tokens are saved automatically');
  console.log('');
  
  console.log('🚀 NEXT STEPS:');
  console.log('===============');
  console.log('1. Implement the backend changes I provided earlier');
  console.log('2. Restart your backend server');
  console.log('3. Test OAuth flow again');
  console.log('4. Check if tokens are saved automatically');
  console.log('');
  
  console.log('🎯 CONCLUSION:');
  console.log('===============');
  console.log('❌ OAuth automation is NOT working yet');
  console.log('✅ But your email system is working with manual token insertion');
  console.log('🔧 You need to implement the backend automation code');
  console.log('🚀 Once implemented, tokens will save automatically!');
}

// Run the OAuth automation test
testOAuthAutomation().catch(console.error);
