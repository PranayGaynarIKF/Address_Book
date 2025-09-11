// WhatsApp Service for MyOperator API Integration
interface MyOperatorConfig {
  baseUrl: string;
  phoneNumberId: string;
  apiKey: string;
  companyId: string;
}

interface Contact {
  id: string;
  name: string;
  phone?: string;
  mobile?: string;
  email?: string;
  companyName?: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  fields: string[];
  status: 'active' | 'pending' | 'rejected';
}

interface SendMessagePayload {
  phone_number_id: string;
  customer_country_code: string;
  customer_number: string;
  data: {
    type: 'template';
    context: {
      template_name: string;
      language: string;
      body: Record<string, string>;
    };
  };
  reply_to: null;
  myop_ref_id: string;
}

interface SendMessageResponse {
  status: string;
  code: string;
  message: string;
  data: {
    conversation_id: string;
    message_id: string;
  };
}

class WhatsAppService {
  private config: MyOperatorConfig;

  constructor() {
    this.config = {
      baseUrl: 'https://publicapi.myoperator.co',
      phoneNumberId: '690875100784871',
      apiKey: '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN',
      companyId: '689044bc84f5e822'
    };
  }

  /**
   * Send WhatsApp message using MyOperator API
   */
  async sendMessage(
    contact: Contact,
    templateName: string,
    templateFields: Record<string, string>
  ): Promise<{ success: boolean; data?: SendMessageResponse; error?: string }> {
    try {
      const phoneNumber = contact.phone || contact.mobile;
      if (!phoneNumber) {
        throw new Error('No phone number available for contact');
      }

      // Clean phone number (remove +91, spaces, etc.)
      const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
      const customerNumber = cleanPhone.startsWith('91') ? cleanPhone.substring(2) : cleanPhone;

      const payload: SendMessagePayload = {
        phone_number_id: this.config.phoneNumberId,
        customer_country_code: "91",
        customer_number: customerNumber,
        data: {
          type: "template",
          context: {
            template_name: templateName,
            language: "en",
            body: templateFields
          }
        },
        reply_to: null,
        myop_ref_id: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      console.log('📱 Sending WhatsApp message:', {
        contact: contact.name,
        phone: customerNumber,
        template: templateName,
        fields: templateFields
      });

      const response = await fetch(`${this.config.baseUrl}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: SendMessageResponse = await response.json();
      
      console.log('✅ WhatsApp message sent successfully:', result);

      return { success: true, data: result };
    } catch (error) {
      console.error('❌ WhatsApp send error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send bulk messages with progress tracking
   */
  async sendBulkMessages(
    contacts: Contact[],
    templateName: string,
    templateFields: Record<string, string>,
    onProgress?: (progress: { sent: number; failed: number; total: number; current: number }) => void
  ): Promise<{ success: boolean; results: any[]; error?: string }> {
    const results: any[] = [];
    let sent = 0;
    let failed = 0;

    try {
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        
        const result = await this.sendMessage(contact, templateName, templateFields);
        results.push({
          contact,
          success: result.success,
          data: result.data,
          error: result.error
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        // Call progress callback
        if (onProgress) {
          onProgress({
            sent,
            failed,
            total: contacts.length,
            current: i + 1
          });
        }

        // Add delay between messages to avoid rate limiting
        if (i < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('❌ Bulk send error:', error);
      return { 
        success: false, 
        results, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get available templates (mock implementation)
   * In real implementation, this would fetch from MyOperator API
   */
  async getTemplates(): Promise<Template[]> {
    // Mock templates - replace with actual API call
    return [
      {
        id: '1',
        name: 'basic',
        content: 'Hello {{name}}, welcome to our service!',
        fields: ['name'],
        status: 'active'
      },
      {
        id: '2',
        name: 'welcome',
        content: 'Hi {{name}}, welcome to {{company}}! We are excited to have you.',
        fields: ['name', 'company'],
        status: 'active'
      },
      {
        id: '3',
        name: 'follow_up',
        content: 'Hello {{name}}, this is a follow-up regarding your inquiry. Please contact us at {{phone}}.',
        fields: ['name', 'phone'],
        status: 'active'
      },
      {
        id: '4',
        name: 'promotion',
        content: 'Hi {{name}}, get {{discount}}% off on your next purchase! Use code {{code}}.',
        fields: ['name', 'discount', 'code'],
        status: 'active'
      },
      {
        id: '5',
        name: 'appointment',
        content: 'Hello {{name}}, your appointment is scheduled for {{date}} at {{time}}. Please confirm.',
        fields: ['name', 'date', 'time'],
        status: 'active'
      }
    ];
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone: string): { isValid: boolean; cleaned: string; error?: string } {
    const cleaned = phone.replace(/[^\d]/g, '');
    
    if (cleaned.length < 10) {
      return { isValid: false, cleaned, error: 'Phone number too short' };
    }
    
    if (cleaned.length > 15) {
      return { isValid: false, cleaned, error: 'Phone number too long' };
    }

    return { isValid: true, cleaned };
  }

  /**
   * Generate unique reference ID
   */
  generateRefId(): string {
    return `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export default new WhatsAppService();
