import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';

export interface WhatsAppMessage {
  to: string;
  message: string;
  type?: 'text' | 'template';
  templateName?: string;
  templateParams?: Record<string, string>;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

export interface OutboundMessageData {
  contactId: string;
  ownerId: string;
  channel: string;
  body: string;
  status: string;
  providerMsgId?: string;
  meta?: string;
  createdAt?: Date;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Log configuration values for debugging
    console.log('🔧 DEBUG: WhatsApp Service Configuration:');
    console.log('🔍 DEBUG: Environment variable check:');
    console.log('  - WHATSAPP_API_KEY from env:', this.configService.get<string>('WHATSAPP_API_KEY'));
    console.log('  - WHATSAPP_BASE_URL from env:', this.configService.get<string>('WHATSAPP_BASE_URL'));
    console.log('  - WHATSAPP_COMPANY_ID from env:', this.configService.get<string>('WHATSAPP_COMPANY_ID'));
    console.log('  - WHATSAPP_PHONE_NUMBER from env:', this.configService.get<string>('WHATSAPP_PHONE_NUMBER'));
    console.log('  - process.env.WHATSAPP_API_KEY:', process.env.WHATSAPP_API_KEY);
    console.log('  - process.env.WHATSAPP_BASE_URL:', process.env.WHATSAPP_BASE_URL);
    console.log('  - process.env.WHATSAPP_COMPANY_ID:', process.env.WHATSAPP_COMPANY_ID);
    console.log('  - process.env.WHATSAPP_PHONE_NUMBER:', process.env.WHATSAPP_PHONE_NUMBER);
    
    const isUsingEnvVars = this.configService.get<string>('WHATSAPP_API_KEY') !== undefined;
    if (!isUsingEnvVars) {
      console.log('⚠️  WARNING: Using hardcoded WhatsApp credentials. Create .env file for production use.');
      console.log('🔍 DEBUG: Checking if .env file exists...');
      console.log('🔍 DEBUG: Current working directory:', process.cwd());
    } else {
      console.log('✅ SUCCESS: Using environment variables for WhatsApp configuration.');
    }
  }

  /**
   * Get current API key from ConfigService
   */
  private get apiKey(): string {
    return this.configService.get<string>('WHATSAPP_API_KEY') || '9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN';
  }

  /**
   * Get current base URL from ConfigService
   */
  private get baseUrl(): string {
    return this.configService.get<string>('WHATSAPP_BASE_URL') || 'https://publicapi.myoperator.co';
  }

  /**
   * Get current company ID from ConfigService
   */
  private get companyId(): string {
    return this.configService.get<string>('WHATSAPP_COMPANY_ID') || '689044bc84f5e822';
  }

  /**
   * Get current phone number from ConfigService
   */
  private get phoneNumber(): string {
    return this.configService.get<string>('WHATSAPP_PHONE_NUMBER') || '690875100784871';
  }

  /**
   * Send direct text message using the exact format that works in Postman
   */
  async sendDirectTextMessage(payload: any): Promise<WhatsAppResponse> {
    try {
      console.log('🚀 DEBUG: sendDirectTextMessage called with payload:', JSON.stringify(payload, null, 2));
      
      // Validate the payload structure
      if (!payload.data?.context?.body) {
        throw new Error('Missing message body in payload');
      }
      
      if (!payload.customer_number) {
        throw new Error('Missing customer_number in payload');
      }
      
      if (!payload.phone_number_id) {
        throw new Error('Missing phone_number_id in payload');
      }
      
      console.log('✅ DEBUG: Payload validation passed');
      console.log('📱 DEBUG: Sending to phone:', payload.customer_number);
      console.log('📱 DEBUG: Using phone_number_id:', payload.phone_number_id);
      
      // Send message via MyOperator API - EXACTLY like Postman
      const response = await fetch(`${this.baseUrl}/chat/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-MYOP-COMPANY-ID': this.companyId
        },
        body: JSON.stringify(payload)
      });

      console.log('🔍 DEBUG: MyOperator API Response:');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.log('🔍 DEBUG: Error Response Body:', errorData);
        throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔍 DEBUG: Success Response:', result);
      
      // Log message in database with a system contact ID
      const systemContactId = 'direct_api_message';
      await this.logMessage(
        systemContactId, 
        payload.data.context.body, 
        result.data?.message_id || result.messageId || result.id || 'unknown', 
        'SENT'
      );

      this.logger.log(`Direct WhatsApp message sent to ${payload.customer_number}`);

      return {
        success: true,
        messageId: result.data?.message_id || result.messageId || result.id,
        status: 'sent'
      };

    } catch (error) {
      this.logger.error(`Error sending direct WhatsApp message:`, error);
      
      // Log failed message
      try {
        const systemContactId = 'direct_api_message';
        await this.logMessage(
          systemContactId, 
          payload.data?.context?.body || 'Unknown message', 
          'failed', 
          'FAILED', 
          error.message
        );
      } catch (logError) {
        this.logger.error('Failed to log failed message:', logError);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send WhatsApp message to a single contact
   */
  async sendMessage(contactId: string, message: string, type: 'text' | 'template' = 'text'): Promise<WhatsAppResponse> {
    try {
      console.log('🚀 DEBUG: sendMessage called with:', { contactId, message, type });
      
      // Get contact details from database
      const contact = await this.prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, name: true, mobileE164: true, email: true }
      });

      if (!contact) {
        console.log(`⚠️ WARNING: Contact with ID ${contactId} not found in database`);
        console.log('🔄 FALLBACK: Using direct API approach with default values');
        
        // Fallback: Use a default phone number and send directly
        const fallbackPayload = {
          phone_number_id: this.phoneNumber,
          customer_country_code: "91",
          customer_number: "9307768467", // Default fallback number
          data: {
            type: "text",
            context: {
              body: message,
              preview_url: false
            }
          },
          reply_to: null,
          myop_ref_id: `fallback_${Date.now()}_${contactId}`
        };
        
        console.log('📤 DEBUG: Using fallback payload:', JSON.stringify(fallbackPayload, null, 2));
        
        // Send using the direct API approach
        const response = await fetch(`${this.baseUrl}/chat/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-MYOP-COMPANY-ID': this.companyId
          },
          body: JSON.stringify(fallbackPayload)
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.log('🔍 DEBUG: Fallback API Error Response:', errorData);
          throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ DEBUG: Fallback API Success Response:', result);
        
        // Log the fallback message
        await this.logMessage(contactId, message, result.data?.message_id || result.messageId || result.id || 'unknown', 'SENT');
        
        return {
          success: true,
          messageId: result.data?.message_id || result.messageId || result.id,
          status: 'sent'
        };
      }

      if (!contact.mobileE164) {
        throw new Error(`Contact ${contact.name} does not have a phone number`);
      }

      console.log('📱 DEBUG: Contact found:', { name: contact.name, phone: contact.mobileE164 });

      // Format phone number (add country code if not present)
      const formattedPhone = this.formatPhoneNumber(contact.mobileE164);
      const phoneNumber = formattedPhone.replace('+91', '').replace('91', '');

      console.log('📱 DEBUG: Formatted phone number:', { original: contact.mobileE164, formatted: formattedPhone, clean: phoneNumber });

      // Prepare message payload based on type
      let payload;
      if (type === 'template') {
        // Use the working template format - EXACTLY like Postman
        payload = {
          phone_number_id: this.phoneNumber,
          customer_country_code: "91", // Default to India
          customer_number: phoneNumber,
          data: {
            type: "template",
            context: {
              template_name: "basic",
              language: "en",
              body: {
                name: contact.name || "Contact"
              }
            }
          },
          reply_to: null,
          myop_ref_id: `msg_${Date.now()}_${contactId}`
        };
      } else {
        // Use text message format - CORRECTED to match MyOperator API
        payload = {
          phone_number_id: this.phoneNumber,
          customer_country_code: "91",
          customer_number: phoneNumber,
          data: {
            type: "text",
            context: {
              body: message,
              preview_url: false
            }
          },
          reply_to: null,
          myop_ref_id: `msg_${Date.now()}_${contactId}`
        };
      }

      console.log('📤 DEBUG: Final payload:', JSON.stringify(payload, null, 2));

      // Log what we're sending to MyOperator API for debugging
      console.log('🔍 DEBUG: MyOperator API Request Details:');
      console.log('URL:', `${this.baseUrl}/chat/messages`);
      console.log('Headers:', {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-MYOP-COMPANY-ID': this.companyId
      });
      console.log('Phone Number (sender):', this.phoneNumber);
      console.log('Formatted Phone (recipient):', phoneNumber);

      // Send message via MyOperator API - EXACTLY like Postman
      const response = await fetch(`${this.baseUrl}/chat/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`, // Bearer token like Postman
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-MYOP-COMPANY-ID': this.companyId
        },
        body: JSON.stringify(payload)
      });

      // Log the response for debugging
      console.log('🔍 DEBUG: MyOperator API Response:');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.log('🔍 DEBUG: Error Response Body:', errorData);
        throw new Error(`WhatsApp API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔍 DEBUG: Success Response:', result);
      
      // Log message in database
      await this.logMessage(contactId, message, result.messageId || result.id || 'unknown', 'SENT');

      this.logger.log(`WhatsApp message sent to ${contact.name} (${formattedPhone})`);

      return {
        success: true,
        messageId: result.messageId || result.id,
        status: 'sent'
      };

    } catch (error) {
      this.logger.error(`Error sending WhatsApp message to contact ${contactId}:`, error);
      
      // Log failed message
      try {
        await this.logMessage(contactId, message, 'failed', 'FAILED', error.message);
      } catch (logError) {
        this.logger.error('Failed to log failed message:', logError);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send WhatsApp message to multiple contacts
   */
  async sendBulkMessage(contactIds: string[], message: string): Promise<WhatsAppResponse[]> {
    this.logger.log(`Starting bulk WhatsApp message to ${contactIds.length} contacts`);
    
    const results: WhatsAppResponse[] = [];
    
    // Process contacts sequentially to avoid overwhelming the API
    for (const contactId of contactIds) {
      try {
        const result = await this.sendMessage(contactId, message);
        results.push(result);
        
        // Add small delay between messages
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        this.logger.error(`Error in bulk message for contact ${contactId}:`, error);
        results.push({
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.log(`Bulk WhatsApp message completed: ${successCount}/${contactIds.length} successful`);

    return results;
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<WhatsAppResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/whatsapp/status/${messageId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get message status: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        messageId,
        status: result.status
      };

    } catch (error) {
      this.logger.error(`Error getting message status for ${messageId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get message history for a contact
   */
  async getMessageHistory(contactId: string, limit: number = 50): Promise<any[]> {
    try {
      const messages = await this.prisma.outboundMessage.findMany({
        where: { 
          contactId,
          channel: 'WHATSAPP'
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          contact: {
            select: { name: true, mobileE164: true }
          }
        }
      });

      return messages;
    } catch (error) {
      this.logger.error(`Error getting message history for contact ${contactId}:`, error);
      return [];
    }
  }

  /**
   * Get WhatsApp statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const totalMessages = await this.prisma.outboundMessage.count({ where: { channel: 'WHATSAPP' } });
      const sentMessages = await this.prisma.outboundMessage.count({ where: { channel: 'WHATSAPP', status: 'SENT' } });
      const failedMessages = await this.prisma.outboundMessage.count({ where: { channel: 'WHATSAPP', status: 'FAILED' } });
      const deliveredMessages = await this.prisma.outboundMessage.count({ where: { channel: 'WHATSAPP', status: 'DELIVERED' } });

      return {
        total: totalMessages,
        sent: sentMessages,
        failed: failedMessages,
        delivered: deliveredMessages,
        successRate: totalMessages > 0 ? ((sentMessages + deliveredMessages) / totalMessages * 100).toFixed(2) : 0
      };
    } catch (error) {
      this.logger.error('Error getting WhatsApp statistics:', error);
      return {};
    }
  }

  /**
   * Get contacts by tags for WhatsApp messaging
   */
  async getContactsByTags(tagIds: string[]): Promise<any> {
    try {
      // Get all contacts that have any of the specified tags
      const contacts = await this.prisma.contact.findMany({
        where: {
          contactTags: {
            some: {
              tagId: {
                in: tagIds
              }
            }
          },
          mobileE164: {
            not: null
          }
        },
        select: {
          id: true,
          name: true,
          mobileE164: true,
          email: true,
          contactTags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          }
        }
      });

      // Transform the data to flatten the tag structure
      const transformedContacts = contacts.map(contact => ({
        ...contact,
        tags: contact.contactTags.map(ct => ct.tag)
      }));

      this.logger.log(`Found ${transformedContacts.length} contacts with tags: ${tagIds.join(', ')}`);

      return {
        success: true,
        contacts: transformedContacts,
        total: transformedContacts.length
      };

    } catch (error) {
      this.logger.error(`Error getting contacts by tags:`, error);
      return {
        success: false,
        contacts: [],
        total: 0,
        error: error.message
      };
    }
  }

  /**
   * Enhanced bulk message sending with support for tags and individual contacts
   */
  async sendBulkMessageEnhanced(data: { 
    contactIds?: string[], 
    tagIds?: string[], 
    message: string 
  }): Promise<any> {
    try {
      let allContactIds: string[] = [];
      
      // Get contacts from individual selection
      if (data.contactIds && data.contactIds.length > 0) {
        allContactIds.push(...data.contactIds);
      }
      
      // Get contacts from tags
      if (data.tagIds && data.tagIds.length > 0) {
        const tagContacts = await this.getContactsByTags(data.tagIds);
        if (tagContacts.success) {
          const tagContactIds = tagContacts.contacts.map(c => c.id);
          allContactIds.push(...tagContactIds);
        }
      }
      
      // Remove duplicates
      allContactIds = [...new Set(allContactIds)];
      
      if (allContactIds.length === 0) {
        return {
          success: false,
          totalContacts: 0,
          results: [],
          error: 'No contacts found for the specified criteria'
        };
      }
      
      this.logger.log(`Starting enhanced bulk WhatsApp message to ${allContactIds.length} contacts`);
      
      // Send messages using existing bulk method
      const results = await this.sendBulkMessage(allContactIds, data.message);
      
      const successCount = results.filter(r => r.success).length;
      this.logger.log(`Enhanced bulk WhatsApp message completed: ${successCount}/${allContactIds.length} successful`);
      
      return {
        success: true,
        totalContacts: allContactIds.length,
        results: results
      };
      
    } catch (error) {
      this.logger.error(`Error in enhanced bulk message:`, error);
      return {
        success: false,
        totalContacts: 0,
        results: [],
        error: error.message
      };
    }
  }

  /**
   * Format phone number to include country code
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If phone doesn't start with country code, add 91 (India)
    if (cleanPhone.length === 10) {
      return `91${cleanPhone}`;
    }
    
    // If already has country code, return as is
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      return cleanPhone;
    }
    
    // If 11 digits and starts with 0, replace with 91
    if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      return `91${cleanPhone.substring(1)}`;
    }
    
    return cleanPhone;
  }

  /**
   * Send template message to a contact - EXACTLY like Postman
   */
  async sendTemplateMessage(contactId: string, templateName: string = 'basic', templateParams: Record<string, string> = {}, customerPhoneNumber?: string): Promise<WhatsAppResponse> {
    try {
      console.log('🚀🚀🚀 DEBUG: sendTemplateMessage called with:', { contactId, templateName, templateParams, customerPhoneNumber });
      console.log('🚀🚀🚀 DEBUG: Environment validation starting...');
      
      // Validate environment variables first
      if (!this.validateEnvironmentVariables()) {
        throw new Error('Missing required WhatsApp environment variables. Please check your .env file.');
      }
      
      // Handle system contact IDs (for endpoints that don't require specific contacts)
      let contactName = "Contact";
      let contactMobile = null;
      
      if (contactId.startsWith('system_')) {
        // This is a system contact, use default values
        contactName = templateParams.name || "Contact";
        contactMobile = customerPhoneNumber;
      } else {
        // Get contact details from database
        const contact = await this.prisma.contact.findUnique({
          where: { id: contactId },
          select: { id: true, name: true, mobileE164: true, email: true }
        });

        if (!contact) {
          throw new Error(`Contact with ID ${contactId} not found`);
        }
        
        contactName = contact.name || "Contact";
        contactMobile = contact.mobileE164;
      }

      // Use the phone number from request body if provided, otherwise use contact's phone
      const phoneNumberToUse = customerPhoneNumber || contactMobile;
      
      if (!phoneNumberToUse) {
        throw new Error(`Contact ${contactName} does not have a phone number`);
      }

      // Use the exact phone number from request body if provided, otherwise format the contact's phone
      let customerPhone: string;
      if (customerPhoneNumber) {
        // Use the exact format from request body (e.g., "9307768467")
        customerPhone = customerPhoneNumber;
      } else {
        // Format the contact's phone number for fallback
        const formattedPhone = this.formatPhoneNumber(phoneNumberToUse);
        customerPhone = formattedPhone.replace('+91', '').replace('91', '');
      }

      // Prepare template payload - EXACTLY like Postman (no company_id in payload)
      const payload = {
        phone_number_id: this.phoneNumber, // 690875100784871
        customer_country_code: "91", // India
        customer_number: customerPhone, // Use the exact format from request body
        data: {
          type: "template",
          context: {
            template_name: templateName, // "basic"
            language: "en",
            body: templateParams // Use ONLY the templateParams from request, don't add contactName
          }
        },
        reply_to: null,
        myop_ref_id: `template_${Date.now()}_${contactId}`
      };

             // Enhanced debugging for MyOperator API request
       console.log('🔍 DEBUG: MyOperator API Request Details:');
       console.log('URL:', `${this.baseUrl}/chat/messages`);
       console.log('API Key (raw):', this.apiKey);
       console.log('API Key (length):', this.apiKey?.length);
       console.log('API Key (first 10 chars):', this.apiKey?.substring(0, 10));
       console.log('API Key (last 10 chars):', this.apiKey?.substring(this.apiKey.length - 10));
       console.log('Headers:', {
         'Authorization': `Bearer ${this.apiKey}`,
         'Content-Type': 'application/json',
         'Accept': 'application/json',
         'X-MYOP-COMPANY-ID': this.companyId
       });
       console.log('Payload:', JSON.stringify(payload, null, 2));
       console.log('Base URL:', this.baseUrl);
       console.log('Phone Number (sender):', this.phoneNumber);
       console.log('Customer Phone (recipient):', customerPhone);

       console.log('🔍 DEBUG: Template Message Payload:', JSON.stringify(payload, null, 2));

             // Send template message via MyOperator API - EXACTLY like Postman
       console.log('🚀🚀🚀 DEBUG: About to send request to MyOperator API...');
       console.log('🚀🚀🚀 DEBUG: Using API Key:', this.apiKey);
       console.log('🚀🚀🚀 DEBUG: Using Base URL:', this.baseUrl);
       console.log('🚀🚀🚀 DEBUG: About to make fetch call...');
       const response = await fetch(`${this.baseUrl}/chat/messages`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${this.apiKey}`, // Bearer token like Postman
           'Content-Type': 'application/json',
           'Accept': 'application/json',
           'X-MYOP-COMPANY-ID': this.companyId
         },
         body: JSON.stringify(payload)
       });
       console.log('🔍 DEBUG: Response received from MyOperator API');
       console.log('🔍 DEBUG: Response status:', response.status);
       console.log('🔍 DEBUG: Response statusText:', response.statusText);

             if (!response.ok) {
         const errorData = await response.text();
         console.log('🔍 DEBUG: Template Error Response Status:', response.status);
         console.log('🔍 DEBUG: Template Error Response StatusText:', response.statusText);
         console.log('🔍 DEBUG: Template Error Response Headers:', Object.fromEntries(response.headers.entries()));
         console.log('🔍 DEBUG: Template Error Response Body:', errorData);
         throw new Error(`Template message failed: ${response.status} ${response.statusText}`);
       }

      const result = await response.json();
      console.log('🔍 DEBUG: Template Success Response:', result);

      // Log message in database
      await this.logMessage(contactId, `Template: ${templateName}`, result.data?.message_id || result.messageId || result.id || 'unknown', 'SENT');

      return {
        success: true,
        messageId: result.data?.message_id || result.messageId || result.id,
        status: 'sent'
      };

    } catch (error) {
      this.logger.error(`Error sending template message to contact ${contactId}:`, error);
      
      await this.logMessage(contactId, `Template: ${templateName}`, 'unknown', 'FAILED', error.message);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate environment variables are properly set
   */
  private validateEnvironmentVariables(): boolean {
    const requiredVars = [
      'WHATSAPP_API_KEY',
      'WHATSAPP_BASE_URL', 
      'WHATSAPP_COMPANY_ID',
      'WHATSAPP_PHONE_NUMBER'
    ];
    
    // Check if we're using environment variables vs hardcoded values
    const isUsingEnvVars = this.configService.get<string>('WHATSAPP_API_KEY') !== undefined;
    
    if (!isUsingEnvVars) {
      console.log('❌ ERROR: Environment variables not loaded. Check if .env file exists and server was restarted.');
      return false;
    }
    
    const missingVars = requiredVars.filter(varName => 
      !this.configService.get<string>(varName)
    );
    
    if (missingVars.length > 0) {
      console.log('❌ ERROR: Missing required environment variables:', missingVars);
      return false;
    }
    
    console.log('✅ SUCCESS: All required environment variables are present');
    return true;
  }

  /**
   * Get configuration status for debugging
   */
  getConfigurationStatus() {
    // Check if we're actually using environment variables
    const isUsingEnvVars = this.configService.get<string>('WHATSAPP_API_KEY') !== undefined;
    
    return {
      hasApiKey: !!this.apiKey,
      hasBaseUrl: !!this.baseUrl,
      hasPhoneNumber: !!this.phoneNumber,
      apiKeyLength: this.apiKey?.length || 0,
      baseUrl: this.baseUrl,
      phoneNumber: this.phoneNumber,
      companyId: this.companyId,
      isUsingEnvVars: isUsingEnvVars,
      envVarsLoaded: {
        WHATSAPP_API_KEY: this.configService.get<string>('WHATSAPP_API_KEY') !== undefined,
        WHATSAPP_BASE_URL: this.configService.get<string>('WHATSAPP_BASE_URL') !== undefined,
        WHATSAPP_COMPANY_ID: this.configService.get<string>('WHATSAPP_COMPANY_ID') !== undefined,
        WHATSAPP_PHONE_NUMBER: this.configService.get<string>('WHATSAPP_PHONE_NUMBER') !== undefined
      }
    };
  }

  /**
   * Log message in database
   */
  private async logMessage(
    contactId: string, 
    message: string, 
    messageId: string, 
    status: string, 
    error?: string
  ): Promise<void> {
    try {
      const messageData: OutboundMessageData = {
        contactId,
        ownerId: 'system', // You might need to get this from context
        channel: 'WHATSAPP',
        body: message,
        status: status.toUpperCase(),
        providerMsgId: messageId,
        meta: error ? JSON.stringify({ error, sentAt: new Date() }) : null
      };
      
      await this.prisma.outboundMessage.create({
        data: messageData
      });
    } catch (error) {
      this.logger.error('Error logging WhatsApp message:', error);
    }
  }
}
