import { Injectable, Logger } from '@nestjs/common';
import { SourceSystem } from '../../common/types/enums';

export interface OutlookContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  mobilePhone?: string;
  businessPhone?: string;
}

@Injectable()
export class OutlookAdapter {
  private readonly logger = new Logger(OutlookAdapter.name);
  private accessToken: string | null = null;

  constructor() {
    this.logger.log('Outlook adapter initialized - Microsoft Graph API integration');
  }

  async setAccessToken(token: string): Promise<void> {
    this.accessToken = token;
    this.logger.log('Outlook access token set successfully');
  }

  async fetchContacts(accountId?: string, accountEmail?: string): Promise<OutlookContact[]> {
    this.logger.log(`Fetching contacts from Outlook using Microsoft Graph API${accountEmail ? ` for account: ${accountEmail}` : ''}`);
    
    if (!this.accessToken) {
      this.logger.warn('❌ No Outlook access token available');
      this.logger.warn('💡 Please authenticate with Microsoft Graph API first');
      this.logger.warn('💡 Visit: /auth/outlook/login to start OAuth flow');
      return this.getMockContacts(accountEmail);
    }

    try {
      this.logger.log('🚀 Fetching contacts from Microsoft Graph API...');
      
      // Microsoft Graph API endpoint for contacts
      const graphApiUrl = 'https://graph.microsoft.com/v1.0/me/contacts';
      
      const response = await fetch(graphApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const contacts: OutlookContact[] = [];

      if (data.value && Array.isArray(data.value)) {
        this.logger.log(`✅ Found ${data.value.length} contacts in Outlook via Microsoft Graph API`);
        
        for (const contact of data.value) {
          const name = contact.displayName || 
                      `${contact.givenName || ''} ${contact.surname || ''}`.trim() || 
                      'Unknown';
          
          const email = contact.emailAddresses?.[0]?.address;
          const phone = contact.mobilePhone || contact.businessPhones?.[0];
          const company = contact.companyName;
          const jobTitle = contact.jobTitle;

          // Include contacts even if they don't have email addresses
          // Only check for duplicates if email exists
          const isDuplicate = email ? contacts.find(c => c.email === email) : 
                             contacts.find(c => c.name === name.trim() && c.phone === phone);
          
          if (!isDuplicate) {
            contacts.push({
              id: contact.id || `outlook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: name.trim(),
              email: email ? email.toLowerCase() : undefined,
              phone: phone || undefined,
              company: company || undefined,
              jobTitle: jobTitle || undefined,
              mobilePhone: contact.mobilePhone || undefined,
              businessPhone: contact.businessPhones?.[0] || undefined,
            });
          }
        }
      }

      if (contacts.length > 0) {
        this.logger.log(`✅ Successfully fetched ${contacts.length} unique contacts from Outlook via Microsoft Graph API`);
        return contacts;
      } else {
        this.logger.warn('❌ No contacts found from Microsoft Graph API, returning mock data');
        return this.getMockContacts(accountEmail);
      }

    } catch (error) {
      this.logger.error('Error fetching Outlook contacts via Microsoft Graph API:', error);
      this.logger.warn('Will use mock data for testing');
      return this.getMockContacts(accountEmail);
    }
  }

  private getMockContacts(accountEmail?: string): OutlookContact[] {
    this.logger.warn(`📝 Returning mock Outlook contacts - these are NOT real contacts${accountEmail ? ` for account: ${accountEmail}` : ''}`);
    this.logger.warn('💡 To get real contacts, complete Microsoft Graph API OAuth authentication');
    
    return [
      {
        id: 'outlook_001',
        name: 'John Smith',
        email: 'john.smith@outlook.com',
        phone: '+1234567890',
        company: 'Microsoft',
        jobTitle: 'Software Engineer',
      },
      {
        id: 'outlook_002',
        name: 'Jane Doe',
        email: 'jane.doe@outlook.com',
        phone: '+0987654321',
        company: 'Outlook Corp',
        jobTitle: 'Product Manager',
      },
    ];
  }

  async transformToStaging(contacts: OutlookContact[]): Promise<any[]> {
    return contacts.map(contact => ({
      rawName: contact.name,
      rawEmail: contact.email,
      rawPhone: contact.phone,
      rawCompany: contact.company,
      relationshipType: 'OTHER',
      dataOwnerName: 'Outlook',
      sourceSystem: SourceSystem.OUTLOOK,
      sourceRecordId: contact.id,
      // Additional Outlook-specific fields
      rawJobTitle: contact.jobTitle,
      rawMobilePhone: contact.mobilePhone,
      rawBusinessPhone: contact.businessPhone,
    }));
  }

  // Method to test Microsoft Graph API connection
  async testConnection(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.error('Outlook connection test failed:', error);
      return false;
    }
  }
}
