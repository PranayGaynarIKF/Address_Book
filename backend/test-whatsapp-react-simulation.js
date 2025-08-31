const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4002';
const API_KEY = '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';

async function simulateReactAppBehavior() {
    console.log('🧪 Simulating React App WhatsApp Manager Behavior...\n');

    try {
        // Step 1: Simulate tag selection (like in React app)
        console.log('1️⃣ Simulating Tag Selection...');
        const selectedTags = new Set(['tag_client']); // Simulate selected tag
        console.log('   Selected tags:', Array.from(selectedTags));
        
        // Step 2: Fetch contacts from selected tag
        console.log('\n2️⃣ Fetching Contacts from Tag...');
        const tagName = Array.from(selectedTags)[0];
        console.log('   Tag name:', tagName);
        
        const tagResponse = await fetch(`${API_BASE}/tags/${tagName}/contacts`, {
            headers: { 
                'X-API-Key': API_KEY,
                'Accept': '*/*'
            }
        });
        
        if (!tagResponse.ok) {
            throw new Error(`Tag API failed: ${tagResponse.status}`);
        }
        
        const tagContacts = await tagResponse.json();
        console.log('   ✅ Tag contacts fetched successfully');
        console.log('   Contacts found:', tagContacts.length);
        console.log('   First contact:', tagContacts[0]?.name, '(', tagContacts[0]?.mobileE164, ')');
        
        // Step 3: Simulate message composition
        console.log('\n3️⃣ Simulating Message Composition...');
        const message = "Hello! This is a test message from React app simulation.";
        console.log('   Message:', message);
        console.log('   Message length:', message.length);
        
        // Step 4: Simulate bulk message sending (exact React app logic)
        console.log('\n4️⃣ Simulating Bulk Message Sending...');
        
        let successCount = 0;
        let totalCount = tagContacts.length;
        let allContacts = [...tagContacts]; // Copy contacts from tag
        
        console.log('   Total contacts to process:', totalCount);
        console.log('   All contacts:', allContacts.map(c => ({ id: c.id, name: c.name, phone: c.mobileE164 })));
        
        // Remove duplicates (like in React app)
        const uniqueContacts = allContacts.filter((contact, index, self) => 
            index === self.findIndex(c => c.id === contact.id)
        );
        
        console.log('   Unique contacts after deduplication:', uniqueContacts.length);
        
        if (uniqueContacts.length === 0) {
            throw new Error('No contacts found after processing');
        }
        
        // Send messages to each contact (exact React app logic)
        for (const contact of uniqueContacts) {
            try {
                console.log(`\n   📱 Processing contact: ${contact.name} (${contact.id})`);
                
                // Check if contact has required fields (exact React app logic)
                if (!contact.mobileE164 && !contact.phone) {
                    console.log(`   ⚠️ Skipping contact ${contact.name}: missing phone number`);
                    continue;
                }

                // Use mobileE164 if available, otherwise use phone (exact React app logic)
                const phone = contact.mobileE164 || contact.phone;
                const countryCode = phone.startsWith('91') ? '91' : '91';
                // Fix: Remove ALL country code prefixes, not just '91' (same as React app)
                let phoneNumber = phone;
                if (phone.startsWith('+91')) {
                  phoneNumber = phone.replace('+91', '');
                } else if (phone.startsWith('91')) {
                  phoneNumber = phone.replace('91', '');
                }
                
                // Ensure phone number is clean (no special characters)
                phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

                console.log(`   📱 Sending to ${contact.name} (${phone})`);
                console.log(`   📱 Country: ${countryCode}, Number: ${phoneNumber}`);

                const messagePayload = {
                    phone_number_id: "690875100784871",
                    customer_country_code: countryCode,
                    customer_number: phoneNumber,
                    data: {
                        type: "text",
                        context: {
                            body: message,
                            preview_url: false
                        }
                    },
                    reply_to: null,
                    myop_ref_id: `react_sim_${Date.now()}_${contact.id}`
                };

                console.log('   📤 Sending payload:', JSON.stringify(messagePayload, null, 2));

                const response = await fetch(`${API_BASE}/whatsapp/send-text-message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': API_KEY,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(messagePayload)
                });

                console.log(`   📡 Response status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    const result = await response.json();
                    successCount++;
                    console.log(`   ✅ Message sent successfully to ${contact.name}:`, result);
                } else {
                    console.error(`   ❌ Failed to send to ${contact.name}: ${response.status}`);
                    const errorText = await response.text();
                    console.error(`   ❌ Error response:`, errorText);
                }
            } catch (error) {
                console.error(`   ❌ Error sending to contact ${contact.name || contact.id}:`, error.message);
            }
        }

        // Step 5: Show final results
        console.log('\n5️⃣ Final Results:');
        console.log(`   🏁 Bulk send completed: ${successCount}/${totalCount} successful`);
        
        if (successCount === totalCount) {
            console.log('   🎉 SUCCESS: All messages sent successfully!');
        } else if (successCount > 0) {
            console.log('   ⚠️ PARTIAL SUCCESS: Some messages sent successfully');
        } else {
            console.log('   ❌ FAILURE: No messages sent successfully');
        }

    } catch (error) {
        console.error('❌ Simulation failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the simulation
simulateReactAppBehavior();
