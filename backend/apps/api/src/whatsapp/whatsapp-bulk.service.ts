import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppBulkService {
  private readonly myOperatorBaseUrl = 'https://publicapi.myoperator.co';
  private readonly apiKey = process.env.WHATSAPP_API_KEY;

  async sendBulkMessages(
    contacts: any[],
    template: {
      id: string;
      name: string;
      content: string;
      variables: string[];
    },
    phoneNumberId: string,
    companyId: string
  ) {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const contact of contacts) {
      try {
        // Generate dynamic content for the template
        let messageContent = template.content;
        
        // Replace template variables with contact data
        messageContent = messageContent.replace(/\{\{name\}\}/g, contact.name || 'Customer');
        messageContent = messageContent.replace(/\{\{mobile\}\}/g, contact.mobile || contact.phone || '');
        messageContent = messageContent.replace(/\{\{email\}\}/g, contact.email || '');

        // Prepare the payload for MyOperator API
        const payload = {
          phone_number_id: phoneNumberId,
          customer_country_code: "91",
          customer_number: this.cleanPhoneNumber(contact.mobile || contact.phone),
          data: {
            type: "template",
            context: {
              template_name: template.name,
              language: "en",
              body: {
                name: contact.name || 'Customer',
                mobile: contact.mobile || contact.phone || '',
                email: contact.email || ''
              }
            }
          },
          reply_to: null,
          myop_ref_id: `bulk_${Date.now()}_${contact.id}`
        };

        // Send message via MyOperator API
        const response = await axios.post(
          `${this.myOperatorBaseUrl}/chat/messages`,
          {
            ...payload,
            api_key: this.apiKey
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Company-ID': companyId
            }
          }
        );

        if (response.data.status === 'success') {
          successCount++;
          results.push({
            contactId: contact.id,
            contactName: contact.name,
            status: 'sent',
            messageId: response.data.data?.message_id,
            conversationId: response.data.data?.conversation_id
          });
        } else {
          failureCount++;
          results.push({
            contactId: contact.id,
            contactName: contact.name,
            status: 'failed',
            error: response.data.message || 'Unknown error'
          });
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        failureCount++;
        results.push({
          contactId: contact.id,
          contactName: contact.name,
          status: 'failed',
          error: error.message || 'Failed to send message'
        });
      }
    }

    return {
      totalContacts: contacts.length,
      successCount,
      failureCount,
      results
    };
  }

  private cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/[^0-9]/g, '');
    
    // Remove country code if present
    if (cleaned.startsWith('91')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('+91')) {
      cleaned = cleaned.substring(3);
    }
    
    return cleaned;
  }
}
