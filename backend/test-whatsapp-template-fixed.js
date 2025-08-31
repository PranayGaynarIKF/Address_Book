const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function testFixedTemplateEndpoint() {
    console.log('🧪 Testing Fixed WhatsApp Template Endpoint...\n');

    try {
        // Test the corrected /send-template/:contactId endpoint
        console.log('1️⃣ Testing /whatsapp/send-template/:contactId endpoint...');
        
        const contactId = 'cmejr21xr00siyjb5oc7k8vam';
        const templatePayload = {
            phone_number_id: "690875100784871",
            customer_country_code: "91",
            customer_number: "9307768467",
            data: {
                type: "template",
                context: {
                    template_name: "basic", // Use the approved template name
                    language: "en",
                    body: {
                        Pushkar: "Pranay" // Use the exact parameter name from the approved template
                    }
                }
            },
            reply_to: null,
            myop_ref_id: `template_test_${Date.now()}`
        };

        console.log('📤 Sending template payload to:', `${API_BASE}/whatsapp/send-template/${contactId}`);
        console.log('📤 Payload:', JSON.stringify(templatePayload, null, 2));

        const response = await fetch(`${API_BASE}/whatsapp/send-template/${contactId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
                'Accept': 'application/json'
            },
            body: JSON.stringify(templatePayload)
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Template message sent successfully:', result);
        } else {
            const errorText = await response.text();
            console.error('❌ Template message failed:', response.status);
            console.error('❌ Error response:', errorText);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testFixedTemplateEndpoint();
