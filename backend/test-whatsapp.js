const fetch = require('node-fetch');

async function testWhatsAppAPI() {
  const baseUrl = 'http://localhost:4002';
  const apiKey = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';
  
  console.log('🧪 Testing WhatsApp API...\n');
  
  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const healthResponse = await fetch(`${baseUrl}/whatsapp/health`, {
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health Check Passed:', healthData);
    } else {
      console.log('❌ Health Check Failed:', healthResponse.status, healthResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Health Check Error:', error.message);
  }
  
  console.log('\n2️⃣ Testing Template Message...');
  
  // Test 2: Send Template Message (you'll need a valid contact ID)
  const contactId = 'cme9p0aqr01ctb3wcmkiwo0nq'; // Replace with actual contact ID
  console.log('Using WhatsApp Number:', '8044186875');
  
  try {
    const templateResponse = await fetch(`${baseUrl}/whatsapp/send-template/${contactId}`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'template',
        templateName: 'basic',
        templateParams: {
          name: 'Test User'
        }
      })
    });
    
    if (templateResponse.ok) {
      const templateData = await templateResponse.json();
      console.log('✅ Template Message Sent:', templateData);
    } else {
      const errorText = await templateResponse.text();
      console.log('❌ Template Message Failed:', templateResponse.status, templateResponse.statusText);
      console.log('Error Details:', errorText);
    }
  } catch (error) {
    console.log('❌ Template Message Error:', error.message);
  }
  
  console.log('\n3️⃣ Testing Text Message...');
  
  // Test 3: Send Text Message
  try {
    const textResponse = await fetch(`${baseUrl}/whatsapp/send/${contactId}`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hello! This is a test message from the updated WhatsApp service.',
        type: 'text'
      })
    });
    
    if (textResponse.ok) {
      const textData = await textResponse.json();
      console.log('✅ Text Message Sent:', textData);
    } else {
      const errorText = await textResponse.text();
      console.log('❌ Text Message Failed:', textResponse.status, textResponse.statusText);
      console.log('Error Details:', errorText);
    }
  } catch (error) {
    console.log('❌ Text Message Error:', error.message);
  }
  
  console.log('\n🎯 Test completed!');
}

// Run the test
testWhatsAppAPI().catch(console.error);
