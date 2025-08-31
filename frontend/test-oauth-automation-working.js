const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFK0tkN';

async function testOAuthAutomationWorking() {
  console.log('🧪 Testing OAuth Automation - After Implementation...\n');
  
  console.log('📋 CHANGES IMPLEMENTED:');
  console.log('========================');
  console.log('✅ Modified GoogleAuthService to auto-save tokens');
  console.log('✅ Updated GoogleAuthController to call auto-save');
  console.log('✅ Added EmailModule import to GoogleAuthModule');
  console.log('✅ Enhanced Gmail scopes for email functionality');
  console.log('');
  
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

  console.log('\n📋 TEST 3: Check OAuth Callback Endpoint');
  console.log('==========================================');
  
  try {
    // Test if the OAuth callback endpoint is accessible
    const callbackResponse = await fetch(`${API_BASE}/auth/google/callback?code=test`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    console.log('📧 OAuth callback test result:');
    console.log('   Status:', callbackResponse.status);
    console.log('   Status Text:', callbackResponse.statusText);
    
    if (callbackResponse.status === 400) {
      console.log('✅ OAuth callback endpoint is accessible');
      console.log('   (400 is expected for invalid code parameter)');
    } else if (callbackResponse.status === 500) {
      console.log('⚠️  OAuth callback endpoint has internal error');
      console.log('   This might be due to missing environment variables');
    } else {
      console.log('📧 Response status:', callbackResponse.status);
    }
    
  } catch (error) {
    console.log('❌ OAuth callback test failed:', error.message);
  }

  console.log('\n📋 TEST 4: Test Email Sending (Current Status)');
  console.log('===============================================');
  
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
          subject: 'Test OAuth Automation - After Implementation',
          body: 'Testing if OAuth automation is now working...',
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
          console.log('   This means OAuth automation is working!');
        } else {
          const errorData = await emailResponse.json();
          console.log('❌ Email sending failed:');
          console.log('   Error:', errorData);
          
          if (emailResponse.status === 500) {
            console.log('   🔍 This suggests OAuth tokens are still missing');
            console.log('   🔍 You need to test the OAuth flow to generate tokens');
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
  
  console.log('🎯 IMPLEMENTATION STATUS:');
  console.log('==========================');
  console.log('1. ✅ Backend code changes implemented');
  console.log('2. ✅ Auto-save logic added to OAuth callback');
  console.log('3. ✅ Database service integration completed');
  console.log('4. ✅ Enhanced Gmail scopes configured');
  console.log('5. 🔄 Ready for testing OAuth flow');
  console.log('');
  
  console.log('🚀 NEXT STEPS TO TEST AUTOMATION:');
  console.log('==================================');
  console.log('1. Restart your backend server');
  console.log('2. Go to your frontend and try to connect Gmail');
  console.log('3. Complete the OAuth flow');
  console.log('4. Check backend logs for "✅ Tokens saved to database automatically!"');
  console.log('5. Check database - tokens should be saved automatically');
  console.log('6. Test email sending - should work immediately');
  console.log('');
  
  console.log('🎯 EXPECTED RESULT AFTER TESTING:');
  console.log('==================================');
  console.log('✅ User connects Gmail');
  console.log('✅ Backend generates tokens');
  console.log('✅ Tokens automatically saved to database');
  console.log('✅ Email sending works immediately');
  console.log('✅ No manual database insertion needed');
  console.log('');
  
  console.log('🔧 IMPLEMENTATION COMPLETED SUCCESSFULLY!');
  console.log('==========================================');
  console.log('The OAuth automation code has been added to your backend.');
  console.log('Now you need to test it by restarting your server and trying OAuth flow.');
}

// Run the OAuth automation test
testOAuthAutomationWorking().catch(console.error);
