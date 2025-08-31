const axios = require('axios');

// Test the tags API endpoint
async function testTagsAPI() {
  const API_BASE = 'http://localhost:4002';
  
  try {
    console.log('🔍 Testing Tags API...');
    
    // Test 1: Get all tags (should work without auth for testing)
    console.log('\n1️⃣ Testing GET /tags endpoint...');
    try {
      const response = await axios.get(`${API_BASE}/tags`);
      console.log('✅ Tags endpoint working!');
      console.log(`📊 Found ${response.data.length} tags:`, response.data.map(t => t.name));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  Tags endpoint requires authentication (JWT token)');
        console.log('   This is expected behavior for security');
      } else {
        console.log('❌ Tags endpoint error:', error.message);
      }
    }
    
    // Test 2: Check if server is running
    console.log('\n2️⃣ Testing server connectivity...');
    try {
      const response = await axios.get(`${API_BASE}/health`);
      console.log('✅ Server is running!');
      console.log('📊 Health status:', response.data);
    } catch (error) {
      console.log('❌ Server not responding:', error.message);
      console.log('   Make sure to run: npm run start:dev');
    }
    
    // Test 3: Check database connection
    console.log('\n3️⃣ Testing database connection...');
    try {
      const response = await axios.get(`${API_BASE}/health/database`);
      console.log('✅ Database connection working!');
      console.log('📊 Database status:', response.data);
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      console.log('   Check your .env file and database connection');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testTagsAPI();
