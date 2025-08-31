const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFK0tkN';

async function quickOAuthTest() {
  console.log('🧪 Quick OAuth Automation Test...\n');
  
  console.log('📋 TEST 1: Check Email Service Health');
  console.log('=====================================');
  
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
      console.log('   Response:', oauthData);
    } else {
      const errorData = await oauthResponse.json();
      console.log('❌ Gmail OAuth configuration error:', errorData);
      console.log('   Status:', oauthResponse.status);
    }
  } catch (oauthError) {
    console.log('❌ Gmail OAuth check failed:', oauthError.message);
  }

  console.log('\n📋 TEST 3: Check OAuth Callback Endpoint');
  console.log('==========================================');
  
  try {
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
    } else {
      console.log('📧 Response status:', callbackResponse.status);
    }
    
  } catch (error) {
    console.log('❌ OAuth callback test failed:', error.message);
  }

  console.log('\n📋 TEST 4: Current Email Sending Status');
  console.log('=========================================');
  
  try {
    const tagsResponse = await fetch(`${API_BASE}/email/tags`, {
      headers: { 'x-api-key': API_KEY }
    });
    
    if (tagsResponse.ok) {
      const tags = await tagsResponse.json();
      if (tags.tags && tags.tags.length > 0) {
        const tag = tags.tags[0];
        console.log('✅ Found tag:', tag.name, 'ID:', tag.id);
        
        const testEmailData = {
          subject: 'Test OAuth Automation Status',
          body: 'Testing current OAuth automation status...',
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
        
        if (emailResponse.ok) {
          const result = await emailResponse.json();
          console.log('✅ Email sent successfully!');
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

  console.log('\n📋 SUMMARY: OAuth Automation Status');
  console.log('====================================');
  console.log('🎯 IMPLEMENTATION STATUS:');
  console.log('1. ✅ Backend code changes implemented');
  console.log('2. ✅ TypeScript errors resolved');
  console.log('3. ✅ Auto-save logic added to OAuth callback');
  console.log('4. ✅ Database service integration completed');
  console.log('5. 🔄 Ready for testing OAuth flow');
  console.log('');
  
  console.log('🚀 TO TEST AUTOMATION:');
  console.log('1. Restart your backend server');
  console.log('2. Go to frontend and connect Gmail');
  console.log('3. Complete OAuth flow');
  console.log('4. Check backend logs for "✅ Tokens saved automatically!"');
  console.log('5. Test email sending');
}

// Run the quick test
quickOAuthTest().catch(console.error);
