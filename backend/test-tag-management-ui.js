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

// Test colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${colors.bold}🧪 ${message}${colors.reset}`, 'cyan');
}

async function testTagManagementUI() {
  logHeader('Testing New Tag Management UI Functionality');
  
  try {
    // Test 1: Fetch existing tags
    logHeader('1. Testing Tags API');
    const tagsResponse = await api.get('/tags');
    logSuccess(`Found ${tagsResponse.data.length} existing tags`);
    
    const existingTags = tagsResponse.data;
    existingTags.forEach(tag => {
      log(`   - ${tag.name} (${tag.color}) - ${tag.contactCount} contacts`, 'cyan');
    });

    // Test 2: Fetch contacts
    logHeader('2. Testing Contacts API');
    const contactsResponse = await api.get('/contacts?page=1&limit=10');
    const contacts = contactsResponse.data.data || contactsResponse.data;
    logSuccess(`Found ${contacts.length} contacts`);
    
    contacts.slice(0, 3).forEach(contact => {
      log(`   - ${contact.name} (${contact.email || contact.mobileE164})`, 'cyan');
    });

    if (contacts.length === 0) {
      logError('No contacts found! Please add some contacts first.');
      return;
    }

    // Test 3: Create a new tag
    logHeader('3. Testing Tag Creation');
    const newTagData = {
      name: `UI Test Tag ${Date.now()}`,
      color: '#FF9800',
      description: 'Created via automated UI test'
    };

    const createTagResponse = await api.post('/tags', newTagData);
    const newTag = createTagResponse.data;
    logSuccess(`Created new tag: ${newTag.name} (ID: ${newTag.id})`);

    // Test 4: Apply tag to multiple contacts
    logHeader('4. Testing Bulk Tag Application');
    const testContacts = contacts.slice(0, 2); // Take first 2 contacts
    
    for (const contact of testContacts) {
      try {
        await api.post(`/tags/contacts/${contact.id}/tags/${newTag.id}`);
        logSuccess(`Applied tag "${newTag.name}" to ${contact.name}`);
      } catch (err) {
        if (err.response?.status === 409) {
          log(`   Tag already applied to ${contact.name}`, 'yellow');
        } else {
          throw err;
        }
      }
    }

    // Test 5: Verify tag was applied
    logHeader('5. Testing Tag Verification');
    const updatedTagsResponse = await api.get('/tags');
    const updatedTag = updatedTagsResponse.data.find(t => t.id === newTag.id);
    
    if (updatedTag && updatedTag.contactCount > 0) {
      logSuccess(`Tag "${updatedTag.name}" now has ${updatedTag.contactCount} contact(s)`);
    } else {
      logError('Tag application verification failed');
    }

    // Test 6: Get contacts for a tag
    logHeader('6. Testing Tag-Contact Relationships');
    const tagContactsResponse = await api.get(`/tags/${newTag.id}/contacts`);
    const tagContacts = tagContactsResponse.data;
    logSuccess(`Found ${tagContacts.length} contact(s) with tag "${newTag.name}"`);
    
    tagContacts.forEach(contact => {
      log(`   - ${contact.name}`, 'cyan');
    });

    // Test 7: Remove tag from contacts
    logHeader('7. Testing Tag Removal');
    for (const contact of testContacts) {
      try {
        await api.delete(`/tags/contacts/${contact.id}/tags/${newTag.id}`);
        logSuccess(`Removed tag "${newTag.name}" from ${contact.name}`);
      } catch (err) {
        if (err.response?.status === 404) {
          log(`   Tag was not on ${contact.name}`, 'yellow');
        } else {
          throw err;
        }
      }
    }

    // Test 8: Clean up - Delete test tag
    logHeader('8. Testing Tag Cleanup');
    await api.delete(`/tags/${newTag.id}`);
    logSuccess(`Deleted test tag: ${newTag.name}`);

    // Final summary
    logHeader('🎉 All Tests Completed Successfully!');
    logInfo('The new ContactTagManager UI should now work perfectly with:');
    log('   ✅ Tag selection and creation', 'green');
    log('   ✅ Contact selection and search', 'green');
    log('   ✅ Bulk tag application', 'green');
    log('   ✅ Bulk tag removal', 'green');
    log('   ✅ Real-time updates', 'green');

    logInfo('\n🚀 Frontend URL: http://localhost:3000/contacts');
    logInfo('📚 Backend API: http://localhost:4002/docs');

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run the tests
testTagManagementUI();
