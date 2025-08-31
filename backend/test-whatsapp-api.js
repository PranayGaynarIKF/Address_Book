const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function testAPI() {
    console.log('🧪 Testing WhatsApp API functionality...\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing API Health...');
        const healthResponse = await fetch(`${API_BASE}/whatsapp/health`, {
            headers: { 'X-API-Key': API_KEY }
        });
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ API Health Check: SUCCESS');
            console.log('   Response:', healthData);
        } else {
            console.log('❌ API Health Check: FAILED');
            console.log('   Status:', healthResponse.status);
        }
        console.log('');

        // Test 2: Tag Contacts Endpoint
        console.log('2️⃣ Testing Tag Contacts Endpoint...');
        const tagResponse = await fetch(`${API_BASE}/tags/tag_client/contacts`, {
            headers: { 
                'X-API-Key': API_KEY,
                'Accept': '*/*'
            }
        });
        
        if (tagResponse.ok) {
            const tagData = await tagResponse.json();
            console.log('✅ Tag Contacts: SUCCESS');
            console.log('   Endpoint: /tags/tag_client/contacts');
            console.log('   Contacts found:', Array.isArray(tagData) ? tagData.length : 'Unknown format');
            if (Array.isArray(tagData) && tagData.length > 0) {
                console.log('   First contact:', tagData[0].name, '(', tagData[0].mobileE164, ')');
            }
            console.log('   Response preview:', JSON.stringify(tagData).substring(0, 200) + '...');
        } else {
            console.log('❌ Tag Contacts: FAILED');
            console.log('   Status:', tagResponse.status);
            console.log('   Endpoint: /tags/tag_client/contacts');
        }
        console.log('');

        // Test 3: Send Text Message
        console.log('3️⃣ Testing Send Text Message...');
        const messagePayload = {
            phone_number_id: "690875100784871",
            customer_country_code: "91",
            customer_number: "9307768467",
            data: {
                type: "text",
                context: {
                    body: "Test message from Node.js - " + new Date().toISOString(),
                    preview_url: false
                }
            },
            reply_to: null,
            myop_ref_id: `test_node_${Date.now()}`
        };

        const messageResponse = await fetch(`${API_BASE}/whatsapp/send-text-message`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messagePayload)
        });
        
        if (messageResponse.ok) {
            const messageData = await messageResponse.json();
            console.log('✅ Send Text Message: SUCCESS');
            console.log('   Message ID:', messageData.messageId);
            console.log('   Status:', messageData.status);
        } else {
            console.log('❌ Send Text Message: FAILED');
            console.log('   Status:', messageResponse.status);
            const errorText = await messageResponse.text();
            console.log('   Error:', errorText);
        }
        console.log('');

        console.log('🎯 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the test
testAPI();
