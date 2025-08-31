const axios = require('axios');

// Simple test for tag management
async function testTagManagement() {
  console.log('🧪 Testing Tag Management...\n');
  
  const api = axios.create({
    baseURL: 'http://localhost:4002',
    headers: {
      'X-API-Key': 'my-secret-api-key-123',
      'Content-Type': 'application/json'
    }
  });

  try {
    // Test 1: Get tags
    console.log('1️⃣ Getting tags...');
    const tagsResponse = await api.get('/tags');
    console.log(`✅ Found ${tagsResponse.data.length} tags`);
    
    // Test 2: Get contacts
    console.log('\n2️⃣ Getting contacts...');
    const contactsResponse = await api.get('/contacts?page=1&limit=5');
    const contacts = contactsResponse.data.data || contactsResponse.data;
    console.log(`✅ Found ${contacts.length} contacts`);
    
    if (contacts.length === 0) {
      console.log('❌ No contacts found!');
      return;
    }

    // Test 3: Create a test tag
    console.log('\n3️⃣ Creating test tag...');
    const newTag = {
      name: `Test Tag ${Date.now()}`,
      color: '#FF5722',
      description: 'Testing tag management'
    };
    
    const createResponse = await api.post('/tags', newTag);
    console.log(`✅ Created tag: ${createResponse.data.name}`);
    
    // Test 4: Apply tag to first contact
    console.log('\n4️⃣ Applying tag to contact...');
    const contact = contacts[0];
    await api.post(`/tags/contacts/${contact.id}/tags/${createResponse.data.id}`);
    console.log(`✅ Applied tag to ${contact.name}`);
    
    // Test 5: Verify tag application
    console.log('\n5️⃣ Verifying tag application...');
    const updatedTags = await api.get('/tags');
    const updatedTag = updatedTags.data.find(t => t.id === createResponse.data.id);
    console.log(`✅ Tag now has ${updatedTag.contactCount} contacts`);
    
    // Test 6: Clean up
    console.log('\n6️⃣ Cleaning up...');
    await api.delete(`/tags/contacts/${contact.id}/tags/${createResponse.data.id}`);
    await api.delete(`/tags/${createResponse.data.id}`);
    console.log('✅ Cleanup completed');
    
    console.log('\n🎉 All tests passed! Tag management is working correctly.');
    console.log('\n🚀 Now you can:');
    console.log('   1. Go to http://localhost:3000/contacts');
    console.log('   2. Scroll down to see "Contact Tag Manager"');
    console.log('   3. Select contacts and apply tags!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testTagManagement();
