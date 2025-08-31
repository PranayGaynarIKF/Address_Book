const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function testEmailSending() {
  console.log('🧪 Testing Email Sending Process...\n');

  // Test 1: Check email service health
  try {
    console.log('1️⃣ Checking email service health...');
    const healthResponse = await fetch(`${API_BASE}/email/services/health`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Email service health:', health.healthStatus);
      console.log('   Gmail:', health.healthStatus.GMAIL ? '✅ Working' : '❌ Not working');
      console.log('   Outlook:', health.healthStatus.OUTLOOK ? '✅ Working' : '❌ Not working');
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }

  // Test 2: Get a tag with contacts
  try {
    console.log('\n2️⃣ Getting tag with contacts...');
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
        console.log('   Contact count:', tag.contactCount);
        console.log('   Email contact count:', tag.emailContactCount);
        
        // Test 3: Get contacts for this tag
        console.log('\n3️⃣ Getting contacts for tag:', tag.id);
        const contactsResponse = await fetch(`${API_BASE}/email/tags/${tag.id}/contacts`, {
          headers: {
            'x-api-key': API_KEY
          }
        });
        
        if (contactsResponse.ok) {
          const contacts = await contactsResponse.json();
          console.log('✅ Contacts retrieved:', contacts.count);
          console.log('   Contacts data:', contacts.contacts);
          
          if (contacts.contacts && contacts.contacts.length > 0) {
            // Test 4: Try to send a test email
            console.log('\n4️⃣ Testing email sending...');
            const testEmailData = {
              subject: 'Test Email from API',
              body: 'This is a test email to verify the email sending functionality.',
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
            
            console.log('📧 Email response status:', emailResponse.status);
            console.log('📧 Email response status text:', emailResponse.statusText);
            
            if (emailResponse.ok) {
              const emailResult = await emailResponse.json();
              console.log('✅ Email sent successfully!');
              console.log('📧 Response structure:', Object.keys(emailResult));
              console.log('📧 Full response:', emailResult);
              console.log('📧 Success count:', emailResult.successCount);
              console.log('📧 Failure count:', emailResult.failureCount);
              console.log('📧 Message:', emailResult.message);
              
              // Check if successCount is undefined
              if (emailResult.successCount === undefined) {
                console.log('⚠️  WARNING: successCount is undefined!');
                console.log('🔍 This explains the "undefined contacts" message');
                console.log('🔍 Available fields:', Object.keys(emailResult));
              }
            } else {
              const errorData = await emailResponse.json().catch(() => ({}));
              console.log('❌ Email sending failed:', emailResponse.status);
              console.log('❌ Error details:', errorData);
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
    console.log('❌ Error in email sending test:', error.message);
  }

  console.log('\n🎯 Email sending test completed!');
}

// Run the test
testEmailSending().catch(console.error);
