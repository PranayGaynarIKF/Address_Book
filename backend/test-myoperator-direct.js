const fetch = require('node-fetch');

// MyOperator API credentials (from your .env file)
const MYOPERATOR_API_KEY = 'your_myoperator_api_key_here'; // Replace with actual key
const MYOPERATOR_BASE_URL = 'https://publicapi.myoperator.co';
const MYOPERATOR_COMPANY_ID = '689044bc84f5e822';

async function testMyOperatorDirect() {
    console.log('🧪 Testing MyOperator API Directly...\n');

    try {
        console.log('1️⃣ Testing direct MyOperator API call...');
        
        const templatePayload = {
            phone_number_id: "690875100784871",
            customer_country_code: "91",
            customer_number: "9307768467",
            data: {
                type: "template",
                context: {
                    template_name: "basic",
                    language: "en",
                    body: {
                        name: "pranay"
                    }
                }
            },
            reply_to: null,
            myop_ref_id: `direct_test_${Date.now()}`
        };

        console.log('📤 Sending to MyOperator API:', `${MYOPERATOR_BASE_URL}/chat/messages`);
        console.log('📤 Payload:', JSON.stringify(templatePayload, null, 2));

        const response = await fetch(`${MYOPERATOR_BASE_URL}/chat/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MYOPERATOR_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-MYOP-COMPANY-ID': MYOPERATOR_COMPANY_ID
            },
            body: JSON.stringify(templatePayload)
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Direct MyOperator API call successful:', result);
        } else {
            const errorText = await response.text();
            console.error('❌ Direct MyOperator API call failed:', response.status);
            console.error('❌ Error response:', errorText);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
console.log('⚠️  NOTE: You need to replace MYOPERATOR_API_KEY with your actual API key from .env file');
testMyOperatorDirect();
