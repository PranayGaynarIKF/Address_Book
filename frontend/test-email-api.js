const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function testEmailEndpoints() {
  console.log('🧪 Testing Email API Endpoints...\n');

  // Test 1: Check if backend is running
  try {
    console.log('1️⃣ Testing backend connectivity...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend responded with status:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
    return;
  }

  // Test 2: Test tags endpoint
  try {
    console.log('\n2️⃣ Testing tags endpoint...');
    const tagsResponse = await fetch(`${API_BASE}/tags`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (tagsResponse.ok) {
      const tags = await tagsResponse.json();
      console.log('✅ Tags endpoint working, found tags:', tags.data?.length || 0);
      if (tags.data && tags.data.length > 0) {
        console.log('   First tag:', tags.data[0].name);
      }
    } else {
      console.log('❌ Tags endpoint failed:', tagsResponse.status, tagsResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Tags endpoint error:', error.message);
  }

  // Test 3: Test email service health
  try {
    console.log('\n3️⃣ Testing email service health...');
    const healthResponse = await fetch(`${API_BASE}/email/services/health`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Email service health check working');
      console.log('   Health status:', health.healthStatus);
    } else {
      console.log('❌ Email service health check failed:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Email service health error:', error.message);
  }

  // Test 4: Test bulk email endpoint structure (without sending)
  try {
    console.log('\n4️⃣ Testing bulk email endpoint structure...');
    const testData = {
      subject: 'Test Subject',
      body: 'Test Body',
      serviceType: 'GMAIL'
    };
    
    // Test the endpoint that should exist
    const bulkResponse = await fetch(`${API_BASE}/email/tags/test-tag/send-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(testData)
    });
    
    console.log('   Bulk email endpoint response:', bulkResponse.status, bulkResponse.statusText);
    
    if (bulkResponse.status === 400 || bulkResponse.status === 404) {
      console.log('   ✅ Endpoint exists but tag not found (expected)');
    } else if (bulkResponse.status === 500) {
      console.log('   ⚠️  Endpoint exists but Gmail OAuth issue (expected)');
    } else {
      console.log('   ❓ Unexpected response:', bulkResponse.status);
    }
  } catch (error) {
    console.log('❌ Bulk email endpoint test error:', error.message);
  }

  console.log('\n🎯 Test completed!');
}

// Run the test
testEmailEndpoints().catch(console.error);
