const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function debugEmailResponse() {
  console.log('🔍 Debugging Email Response Structure...\n');

  try {
    // Get a tag with contacts
    console.log('1️⃣ Getting tag with contacts...');
    const tagsResponse = await fetch(`${API_BASE}/email/tags`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (tagsResponse.ok) {
      const tags = await tagsResponse.json();
      if (tags.tags && tags.tags.length > 0) {
        const tag = tags.tags[0];
        console.log('✅ Found tag:', tag.name, 'ID:', tag.id);
        
        // Get contacts for this tag
        console.log('\n2️⃣ Getting contacts for tag:', tag.id);
        const contactsResponse = await fetch(`${API_BASE}/email/tags/${tag.id}/contacts`, {
          headers: {
            'x-api-key': API_KEY
          }
        });
        
        if (contactsResponse.ok) {
          const contacts = await contactsResponse.json();
          console.log('✅ Contacts retrieved:', contacts.count);
          console.log('📧 Contacts data:', contacts.contacts);
          
          if (contacts.contacts && contacts.contacts.length > 0) {
            // Try to send a test email and capture the FULL response
            console.log('\n3️⃣ Testing email sending to see FULL response...');
            const testEmailData = {
              subject: 'Debug Test Email',
              body: 'This is a debug test to see the exact response structure.',
              serviceType: 'GMAIL'
            };
            
            console.log('📧 Test email data:', testEmailData);
            console.log('📧 API endpoint:', `${API_BASE}/email/tags/${tag.id}/send-bulk`);
            
            const emailResponse = await fetch(`${API_BASE}/email/tags/${tag.id}/send-bulk`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
              },
              body: JSON.stringify(testEmailData)
            });
            
            console.log('\n📧 EMAIL RESPONSE ANALYSIS:');
            console.log('==========================');
            console.log('📧 Status:', emailResponse.status);
            console.log('📧 Status Text:', emailResponse.statusText);
            console.log('📧 Headers:', Object.fromEntries(emailResponse.headers.entries()));
            
            // Get the response text first to see raw response
            const responseText = await emailResponse.text();
            console.log('\n📧 RAW RESPONSE TEXT:');
            console.log('====================');
            console.log(responseText);
            
            // Try to parse as JSON
            let responseData;
            try {
              responseData = JSON.parse(responseText);
              console.log('\n📧 PARSED JSON RESPONSE:');
              console.log('=======================');
              console.log('📧 Response type:', typeof responseData);
              console.log('📧 Response keys:', Object.keys(responseData));
              console.log('📧 Full response object:', responseData);
              
              // Check specific fields that might contain contact count
              console.log('\n📧 FIELD ANALYSIS:');
              console.log('=================');
              console.log('📧 successCount:', responseData.successCount);
              console.log('📧 failureCount:', responseData.failureCount);
              console.log('📧 count:', responseData.count);
              console.log('📧 results:', responseData.results);
              console.log('📧 message:', responseData.message);
              console.log('📧 tagId:', responseData.tagId);
              
              // Check if any field contains the contact count
              if (responseData.successCount !== undefined) {
                console.log('✅ successCount found:', responseData.successCount);
              } else {
                console.log('❌ successCount is undefined');
              }
              
              if (responseData.count !== undefined) {
                console.log('✅ count found:', responseData.count);
              } else {
                console.log('❌ count is undefined');
              }
              
              if (responseData.results && Array.isArray(responseData.results)) {
                console.log('✅ results array found with length:', responseData.results.length);
              } else {
                console.log('❌ results array not found or not an array');
              }
              
            } catch (parseError) {
              console.log('❌ Failed to parse response as JSON:', parseError.message);
              console.log('📧 Response is not valid JSON');
            }
            
            // Now test the frontend parsing logic
            console.log('\n📧 FRONTEND PARSING TEST:');
            console.log('==========================');
            if (responseData) {
              // Test the exact logic from the frontend
              let successCount = responseData.successCount || responseData.count || responseData.results?.length || 'unknown';
              let failureCount = responseData.failureCount || 0;
              
              console.log('📧 Frontend parsing result:');
              console.log('   successCount variable:', successCount);
              console.log('   failureCount variable:', failureCount);
              console.log('   This explains the "unknown contacts" message!');
            }
            
          } else {
            console.log('⚠️  No contacts found for this tag');
          }
        } else {
          console.log('❌ Failed to get contacts:', contactsResponse.status);
        }
      } else {
        console.log('⚠️  No tags found');
      }
    } else {
      console.log('❌ Failed to get tags:', tagsResponse.status);
    }
  } catch (error) {
    console.log('❌ Error in debug:', error.message);
  }

  console.log('\n🎯 Debug completed!');
}

// Run the debug
debugEmailResponse().catch(console.error);
