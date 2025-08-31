#!/usr/bin/env node

const axios = require('axios');

// API Configuration
const API_BASE = 'http://localhost:4002';
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'X-API-Key': 'my-secret-api-key-123',
    'Content-Type': 'application/json'
  }
});

async function debugContactsAPI() {
  console.log('🔍 Testing Contacts API...\n');
  
  try {
    // Test 1: Get contacts with small limit
    console.log('1️⃣ Testing GET /contacts?page=1&limit=5');
    const response1 = await api.get('/contacts?page=1&limit=5');
    console.log('✅ Status:', response1.status);
    console.log('✅ Response structure:');
    console.log('   - Has data property:', !!response1.data);
    console.log('   - Data type:', typeof response1.data);
    console.log('   - Data keys:', Object.keys(response1.data));
    console.log('   - Has data.data:', !!response1.data.data);
    console.log('   - Data.data type:', typeof response1.data.data);
    console.log('   - Data.data length:', response1.data.data?.length);
    console.log('   - First contact:', response1.data.data?.[0] ? '✅' : '❌');
    if (response1.data.data?.[0]) {
      console.log('   - First contact keys:', Object.keys(response1.data.data[0]));
    }
    console.log('');
    
    // Test 2: Get contacts with larger limit
    console.log('2️⃣ Testing GET /contacts?page=1&limit=1000');
    try {
      const response2 = await api.get('/contacts?page=1&limit=1000');
      console.log('✅ Status:', response2.status);
      console.log('✅ Response structure:');
      console.log('   - Has data property:', !!response2.data);
      console.log('   - Data type:', typeof response2.data);
      console.log('   - Data keys:', Object.keys(response2.data));
      console.log('   - Has data.data:', !!response2.data.data);
      console.log('   - Data.data type:', typeof response2.data.data);
      console.log('   - Data.data length:', response2.data.data?.length);
    } catch (error) {
      console.log('❌ Error with limit=1000:');
      console.log('   - Status:', error.response?.status);
      console.log('   - Message:', error.response?.data?.message || error.message);
    }
    console.log('');
    
    // Test 3: Get tags
    console.log('3️⃣ Testing GET /tags');
    const response3 = await api.get('/tags');
    console.log('✅ Status:', response3.status);
    console.log('✅ Tags count:', response3.data?.length || 0);
    console.log('✅ First tag:', response3.data?.[0] ? '✅' : '❌');
    if (response3.data?.[0]) {
      console.log('   - First tag keys:', Object.keys(response3.data[0]));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugContactsAPI();
