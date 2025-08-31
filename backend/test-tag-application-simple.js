const axios = require('axios');

const API_BASE = 'http://localhost:4002';
const API_KEY = 'my-secret-api-key-123';

async function testTagApplication() {
  try {
    console.log('🧪 Testing Tag Application API...\n');

    // 1. Get all tags
    console.log('1️⃣ Fetching all tags...');
    const tagsResponse = await axios.get(`${API_BASE}/tags`, {
      headers: { 'X-API-Key': API_KEY }
    });
    const tags = tagsResponse.data;
    console.log(`✅ Found ${tags.length} tags:`, tags.map(t => t.name));

    // 2. Get first contact
    console.log('\n2️⃣ Fetching first contact...');
    const contactsResponse = await axios.get(`${API_BASE}/contacts?limit=1`, {
      headers: { 'X-API-Key': API_KEY }
    });
    const contact = contactsResponse.data.data[0];
    console.log(`✅ Found contact: ${contact.name} (ID: ${contact.id})`);

    if (tags.length === 0) {
      console.log('❌ No tags available to test with');
      return;
    }

    // 3. Apply first tag to contact
    const tagToApply = tags[1]; // Use second tag instead of first
    console.log(`\n3️⃣ Applying tag "${tagToApply.name}" to contact "${contact.name}"...`);
    
    const applyResponse = await axios.post(
      `${API_BASE}/tags/contacts/${contact.id}/tags/${tagToApply.id}`,
      {},
      { headers: { 'X-API-Key': API_KEY } }
    );
    
    if (applyResponse.status === 200 || applyResponse.status === 201) {
      console.log('✅ Tag applied successfully!');
    } else {
      console.log('⚠️ Unexpected response:', applyResponse.status, applyResponse.statusText);
    }

    // 4. Verify tag was applied
    console.log('\n4️⃣ Verifying tag was applied...');
    const contactTagsResponse = await axios.get(`${API_BASE}/tags/contacts/${contact.id}/tags`, {
      headers: { 'X-API-Key': API_KEY }
    });
    const contactTags = contactTagsResponse.data;
    console.log(`✅ Contact now has ${contactTags.length} tags:`, contactTags.map(t => t.name));

    // 5. Remove the tag
    console.log('\n5️⃣ Removing tag...');
    const removeResponse = await axios.delete(
      `${API_BASE}/tags/contacts/${contact.id}/tags/${tagToApply.id}`,
      { headers: { 'X-API-Key': API_KEY } }
    );
    
    if (removeResponse.status === 200) {
      console.log('✅ Tag removed successfully!');
    } else {
      console.log('⚠️ Unexpected response:', removeResponse.status, removeResponse.statusText);
    }

    // 6. Final verification
    console.log('\n6️⃣ Final verification...');
    const finalTagsResponse = await axios.get(`${API_BASE}/tags/contacts/${contact.id}/tags`, {
      headers: { 'X-API-Key': API_KEY }
    });
    const finalTags = finalTagsResponse.data;
    console.log(`✅ Contact now has ${finalTags.length} tags:`, finalTags.map(t => t.name));

    console.log('\n🎉 Tag application test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testTagApplication();
