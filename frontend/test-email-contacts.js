const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function testEmailContacts() {
  console.log('🧪 Testing Email Contacts Endpoints...\n');

  // Test 1: Get all tags for email
  try {
    console.log('1️⃣ Getting all tags for email operations...');
    const tagsResponse = await fetch(`${API_BASE}/email/tags`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (tagsResponse.ok) {
      const tags = await tagsResponse.json();
      console.log('✅ Tags for email:', tags);
      
      if (tags.tags && tags.tags.length > 0) {
        const firstTag = tags.tags[0];
        console.log('📧 First tag:', firstTag.name, 'ID:', firstTag.id);
        
        // Test 2: Get contacts for this tag
        console.log('\n2️⃣ Getting contacts for tag:', firstTag.id);
        const contactsResponse = await fetch(`${API_BASE}/email/tags/${firstTag.id}/contacts`, {
          headers: {
            'x-api-key': API_KEY
          }
        });
        
        if (contactsResponse.ok) {
          const contacts = await contactsResponse.json();
          console.log('✅ Contacts for tag:', contacts);
          console.log('📧 Contacts structure:', Object.keys(contacts));
          console.log('📧 Contacts array:', contacts.contacts);
          console.log('📧 Count:', contacts.count);
          console.log('📧 Message:', contacts.message);
          
          if (contacts.contacts && contacts.contacts.length > 0) {
            console.log('📧 First contact:', contacts.contacts[0]);
            console.log('📧 Contact emails:', contacts.contacts.map(c => c.email).filter(Boolean));
          }
        } else {
          console.log('❌ Failed to get contacts:', contactsResponse.status, contactsResponse.statusText);
          const errorData = await contactsResponse.json().catch(() => ({}));
          console.log('❌ Error details:', errorData);
        }
      } else {
        console.log('⚠️ No tags found for email operations');
      }
    } else {
      console.log('❌ Failed to get tags:', tagsResponse.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Compare with general tags endpoint
  try {
    console.log('\n3️⃣ Comparing with general tags endpoint...');
    const generalTagsResponse = await fetch(`${API_BASE}/tags`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (generalTagsResponse.ok) {
      const generalTags = await tagsResponse.json();
      console.log('✅ General tags:', generalTags);
      
      if (generalTags.data && generalTags.data.length > 0) {
        const firstGeneralTag = generalTags.data[0];
        console.log('📧 First general tag:', firstGeneralTag.name, 'ID:', firstGeneralTag.id);
        
        // Test contacts for general tag
        const generalContactsResponse = await fetch(`${API_BASE}/tags/${firstGeneralTag.id}/contacts`, {
          headers: {
            'x-api-key': API_KEY
          }
        });
        
        if (generalContactsResponse.ok) {
          const generalContacts = await generalContactsResponse.json();
          console.log('✅ General tag contacts:', generalContacts);
          console.log('📧 General contacts structure:', Object.keys(generalContacts));
        } else {
          console.log('❌ Failed to get general tag contacts:', generalContactsResponse.status);
        }
      }
    } else {
      console.log('❌ Failed to get general tags:', generalTagsResponse.status);
    }
  } catch (error) {
    console.log('❌ Error in general tags test:', error.message);
  }

  console.log('\n🎯 Test completed!');
}

// Run the test
testEmailContacts().catch(console.error);
