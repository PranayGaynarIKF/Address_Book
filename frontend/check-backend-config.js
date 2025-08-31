const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function checkBackendConfig() {
  console.log('🔍 Checking Backend Configuration for Email Response Format Error...\n');

  try {
    // 1. Check email service health
    console.log('1️⃣ Checking Email Service Health...');
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

    // 2. Check Gmail OAuth configuration
    console.log('\n2️⃣ Checking Gmail OAuth Configuration...');
    try {
      const oauthResponse = await fetch(`${API_BASE}/email/auth/GMAIL/url`, {
        headers: { 'x-api-key': API_KEY }
      });
      
      if (oauthResponse.ok) {
        const oauthData = await oauthResponse.json();
        console.log('✅ Gmail OAuth URL generated successfully');
        console.log('   OAuth URL:', oauthData.authUrl ? 'Generated' : 'Not generated');
      } else {
        const errorData = await oauthResponse.json();
        console.log('❌ Gmail OAuth configuration error:', errorData);
        console.log('   Status:', oauthResponse.status);
        console.log('   Message:', errorData.message || 'Unknown error');
      }
    } catch (oauthError) {
      console.log('❌ Gmail OAuth check failed:', oauthError.message);
    }

    // 3. Check email service configuration
    console.log('\n3️⃣ Checking Email Service Configuration...');
    try {
      const configResponse = await fetch(`${API_BASE}/email/services/config`, {
        headers: { 'x-api-key': API_KEY }
      });
      
      if (configResponse.ok) {
        const config = await configResponse.json();
        console.log('✅ Email service configuration retrieved');
        console.log('   Config:', JSON.stringify(config, null, 2));
      } else {
        console.log('❌ Config check failed:', configResponse.status);
      }
    } catch (configError) {
      console.log('❌ Config check failed:', configError.message);
    }

    // 4. Check backend environment variables (if accessible)
    console.log('\n4️⃣ Checking Backend Environment...');
    try {
      const envResponse = await fetch(`${API_BASE}/email/services/env-check`, {
        headers: { 'x-api-key': API_KEY }
      });
      
      if (envResponse.ok) {
        const envData = await envResponse.json();
        console.log('✅ Environment check successful');
        console.log('   Environment data:', envData);
      } else {
        console.log('⚠️  Environment check endpoint not available');
      }
    } catch (envError) {
      console.log('⚠️  Environment check not available');
    }

    // 5. Test a simple email endpoint to see exact error
    console.log('\n5️⃣ Testing Email Endpoint for Exact Error...');
    try {
      const testResponse = await fetch(`${API_BASE}/email/tags/test/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          subject: 'Test',
          body: 'Test body',
          serviceType: 'GMAIL'
        })
      });
      
      console.log('📧 Test endpoint response:');
      console.log('   Status:', testResponse.status);
      console.log('   Status Text:', testResponse.statusText);
      
      const testData = await testResponse.text();
      console.log('   Response:', testData);
      
      // Try to parse as JSON
      try {
        const parsedTest = JSON.parse(testData);
        console.log('   Parsed response:', parsedTest);
      } catch (parseError) {
        console.log('   Response is not valid JSON');
      }
      
    } catch (testError) {
      console.log('❌ Test endpoint failed:', testError.message);
    }

    // 6. Summary and recommendations
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('======================');
    console.log('🎯 Email Response Format Error Causes:');
    console.log('   1. Gmail OAuth not configured');
    console.log('   2. Backend environment variables missing');
    console.log('   3. Email service not properly initialized');
    console.log('   4. Database connection issues');
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('======================');
    console.log('   1. Set up Gmail OAuth credentials');
    console.log('   2. Check backend .env file for missing variables');
    console.log('   3. Verify database connection');
    console.log('   4. Check backend logs for detailed error messages');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('===============');
    console.log('   1. Run: node quick-gmail-setup.js');
    console.log('   2. Set up Gmail OAuth');
    console.log('   3. Test again with: node test-email-sending.js');

  } catch (error) {
    console.log('❌ Error in backend config check:', error.message);
  }

  console.log('\n🎯 Backend configuration check completed!');
}

// Run the backend config check
checkBackendConfig().catch(console.error);
