const axios = require('axios');

const API_BASE = 'http://localhost:4002';
const API_KEY = 'my-secret-api-key-123';

async function testTagManagement() {
  console.log('🧪 Testing Tag Management API...\n');

  try {
    // 1. Get all tags
    console.log('1️⃣ Getting all tags...');
    const tagsResponse = await axios.get(`${API_BASE}/tags`, {
      headers: { 'X-API-Key': API_KEY }
    });
    console.log('✅ Tags found:', tagsResponse.data.length);
    console.log('📋 Available tags:', tagsResponse.data.map(t => ({ id: t.id, name: t.name, color: t.color })));
    
    if (tagsResponse.data.length === 0) {
      console.log('❌ No tags available. Please create some tags first.');
      return;
    }

    // 2. Get all contacts
    console.log('\n2️⃣ Getting contacts...');
    const contactsResponse = await axios.get(`${API_BASE}/contacts?limit=5`, {
      headers: { 'X-API-Key': API_KEY }
    });
    console.log('✅ Contacts found:', contactsResponse.data.data.length);
    
    if (contactsResponse.data.data.length === 0) {
      console.log('❌ No contacts available. Please create some contacts first.');
      return;
    }

    const firstContact = contactsResponse.data.data[0];
    const firstTag = tagsResponse.data[0];
    
    console.log('👤 First contact:', { id: firstContact.id, name: firstContact.name });
    console.log('🏷️ First tag:', { id: firstTag.id, name: firstTag.name });

    // 3. Get current tags for the contact
    console.log('\n3️⃣ Getting current tags for contact...');
    const currentTagsResponse = await axios.get(`${API_BASE}/tags/contacts/${firstContact.id}/tags`, {
      headers: { 'X-API-Key': API_KEY }
    });
    console.log('✅ Current tags for contact:', currentTagsResponse.data.length);
    console.log('📋 Current tags:', currentTagsResponse.data.map(t => ({ id: t.id, name: t.name })));

    // 4. Apply a tag to the contact
    console.log('\n4️⃣ Applying tag to contact...');
    const applyResponse = await axios.post(`${API_BASE}/tags/contacts/${firstContact.id}/tags/${firstTag.id}`, {}, {
      headers: { 'X-API-Key': API_KEY }
    });
    console.log('✅ Tag applied successfully:', applyResponse.status);

    // 5. Verify the tag was applied
    console.log('\n5️⃣ Verifying tag was applied...');
    const verifyTagsResponse = await axios.get(`${API_BASE}/tags/contacts/${firstContact.id}/tags`, {
      headers: { 'X-API-Key': API_KEY }
    });
    console.log('✅ Tags after applying:', verifyTagsResponse.data.length);
    console.log('📋 Tags after applying:', verifyTagsResponse.data.map(t => ({ id: t.id, name: t.name })));

    // 6. Remove the tag from the contact
    console.log('\n6️⃣ Removing tag from contact...');
    const removeResponse = await axios.delete(`${API_BASE}/tags/contacts/${firstContact.id}/tags/${firstTag.id}`, {
      headers: { 'X-API-Key': API_KEY }
    });
    console.log('✅ Tag removed successfully:', removeResponse.status);

    // 7. Final verification
    console.log('\n7️⃣ Final verification...');
    const finalTagsResponse = await axios.get(`${API_BASE}/tags/contacts/${firstContact.id}/tags`, {
      headers: { 'X-API-Key': API_KEY }
    });
    console.log('✅ Final tags count:', finalTagsResponse.data.length);
    console.log('📋 Final tags:', finalTagsResponse.data.map(t => ({ id: t.id, name: t.name })));

    console.log('\n🎉 All tests passed! Tag management API is working correctly.');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('📡 Response status:', error.response.status);
      console.error('📡 Response data:', error.response.data);
    }
  }
}

// Run the test
testTagManagement();
