import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { SourceSystem } from '../../common/types/enums';
import { GoogleAuthService } from '../../auth/google-auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface GmailContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

@Injectable()
export class GmailAdapter {
  private readonly logger = new Logger(GmailAdapter.name);
  private oauth2Client: any;
  private gmail: any;
  private people: any;

  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly prisma: PrismaService,
  ) {
    // Don't initialize on startup - use lazy loading
  }

  private async initializeGmailAPI() {
    try {
      // Check if we have valid OAuth 2.0 tokens
      const hasValidTokens = await this.googleAuthService.hasValidTokens();
      
      if (!hasValidTokens) {
        this.logger.warn('❌ No valid OAuth 2.0 tokens found');
        this.logger.warn('💡 Required scopes: contacts.readonly, userinfo.email, userinfo.profile');
        this.logger.warn('💡 Please authenticate first by visiting: http://localhost:4002/auth/google/login');
        this.logger.warn('💡 After authentication, restart the application to get real contacts');
        return;
      }

      // Get the authenticated OAuth 2.0 client
      const oauth2Client = this.googleAuthService.getOAuth2Client();
      
      this.logger.log(`✅ OAuth 2.0 authentication is active for ${process.env.GMAIL_USER_EMAIL}`);
      
      // Initialize Gmail and People APIs with authenticated OAuth 2.0 client
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      this.people = google.people({ version: 'v1', auth: oauth2Client });
      
      this.logger.log(`🚀 Gmail API initialized successfully using OAuth 2.0 - Ready to fetch real contacts!`);
      
    } catch (error) {
      this.logger.error('Failed to initialize Gmail API with OAuth 2.0:', error);
      this.logger.warn('Will use mock data for testing until OAuth 2.0 is set up');
    }
  }

  async fetchContacts(accountId?: string, accountEmail?: string): Promise<GmailContact[]> {
    this.logger.log(`Fetching contacts from Gmail using OAuth 2.0${accountEmail ? ` for account: ${accountEmail}` : ''}`);
    
    // If a specific accountId is provided, try to load its tokens first
    if (accountId) {
      try {
        const rows = await this.prisma.$queryRaw<{ access_token: string; refresh_token: string }[]>`
          SELECT TOP 1 [access_token], [refresh_token]
          FROM [app].[EmailAuthTokens]
          WHERE [id] = ${accountId} AND [service_type] = 'GMAIL' AND [is_valid] = 1
          ORDER BY [updated_at] DESC
        `;
        if (rows?.length) {
          this.oauth2Client = this.oauth2Client || new google.auth.OAuth2();
          this.oauth2Client.setCredentials({
            access_token: rows[0].access_token,
            refresh_token: rows[0].refresh_token,
          });
          this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
          this.people = google.people({ version: 'v1', auth: this.oauth2Client });
        }
      } catch (e) {
        this.logger.warn('Failed to load OAuth tokens from database for this account. Falling back to global auth.', e as any);
      }
    }

    // Lazy initialization - only initialize via global auth when not initialized by account tokens
    if (!this.gmail || !this.people) {
      await this.initializeGmailAPI();
    }
    
    try {
      if (!this.gmail || !this.people) {
        this.logger.warn('Gmail API not initialized, returning mock data');
        this.logger.warn('💡 OAuth 2.0 setup needs to be completed');
        return this.getMockContacts(accountEmail);
      }

      this.logger.log('Gmail API objects available, proceeding with OAuth 2.0 API calls');

      const contacts: GmailContact[] = [];
      
      // Method 1: Google Contacts API se direct contacts fetch karna (Primary method)
      try {
        this.logger.log('Fetching contacts from Google Contacts API using OAuth 2.0...');
        this.logger.log(`Using OAuth 2.0 for: ${accountEmail || process.env.GMAIL_USER_EMAIL}`);
        
        const contactsResponse = await this.people.people.connections.list({
          resourceName: 'people/me',
          pageSize: 100,
          personFields: 'names,emailAddresses,phoneNumbers,organizations,photos'
        });

        if (contactsResponse.data.connections) {
          this.logger.log(`✅ Found ${contactsResponse.data.connections.length} contacts in Google Contacts via OAuth 2.0`);
          
          for (const person of contactsResponse.data.connections) {
            const name = person.names?.[0]?.displayName || 
                        person.names?.[0]?.givenName + ' ' + person.names?.[0]?.familyName || 
                        'Unknown';
            const email = person.emailAddresses?.[0]?.value;
            const phone = person.phoneNumbers?.[0]?.value;
            const company = person.organizations?.[0]?.name;

            // Include contacts even if they don't have email addresses
            // Only check for duplicates if email exists
            const isDuplicate = email ? contacts.find(c => c.email === email) : 
                               contacts.find(c => c.name === name.trim() && c.phone === phone);
            
            if (!isDuplicate) {
              contacts.push({
                id: person.resourceName || `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: name.trim(),
                email: email ? email.toLowerCase() : undefined,
                phone: phone || undefined,
                company: company || undefined
              });
            }
          }
        } else {
          this.logger.warn('⚠️ Google Contacts API returned no connections - this might indicate a scope issue');
          this.logger.warn('💡 Required scopes: contacts.readonly, userinfo.email, userinfo.profile');
        }
      } catch (contactsError) {
        this.logger.warn('❌ Google Contacts API not accessible via OAuth 2.0, trying Gmail threads method');
        this.logger.error('OAuth 2.0 Contacts API Error Details:', {
          message: contactsError.message,
          code: contactsError.code,
          status: contactsError.status,
          details: contactsError.errors
        });
        
        if (contactsError.code === 401) {
          this.logger.error('🔑 OAuth 2.0 authentication failed - tokens needed or expired');
          this.logger.error('💡 Please re-authenticate at: http://localhost:4002/auth/google/login');
        } else if (contactsError.code === 403) {
          this.logger.error('🔒 Permission denied (403) - OAuth 2.0 scopes may be insufficient');
          this.logger.error('💡 Required scopes: contacts.readonly, userinfo.email, userinfo.profile');
          this.logger.error('💡 Please re-authenticate to grant proper permissions');
        } else if (contactsError.code === 400) {
          this.logger.error('🚫 Bad Request (400) - API request format issue');
        }
      }

      // Method 2: Gmail threads se contacts extract karna (Fallback method)
      if (contacts.length === 0) {
        this.logger.log('Fetching contacts from Gmail threads using OAuth 2.0...');
        
        try {
          const threadsResponse = await this.gmail.users.threads.list({
            userId: 'me',
            maxResults: 50, // Last 50 emails
            q: 'is:important OR is:starred OR newer_than:30d' // Important, starred, ya last 30 days
          });

          if (threadsResponse.data.threads) {
            this.logger.log(`Processing ${threadsResponse.data.threads.length} email threads via OAuth 2.0`);
            
            for (const thread of threadsResponse.data.threads) {
              try {
                const threadDetails = await this.gmail.users.threads.get({
                  userId: 'me',
                  id: thread.id
                });

                // Har email se contacts extract karte hain
                const messages = threadDetails.data.messages || [];
                for (const message of messages) {
                  const headers = message.payload?.headers || [];
                  
                  // From, To, CC fields se email addresses extract karte hain
                  const fromHeader = headers.find(h => h.name === 'From');
                  const toHeader = headers.find(h => h.name === 'To');
                  const ccHeader = headers.find(h => h.name === 'Cc');
                  
                  [fromHeader, toHeader, ccHeader].forEach(header => {
                    if (header?.value) {
                      const contact = this.parseEmailHeader(header.value);
                      if (contact && !contacts.find(c => c.email === contact.email)) {
                        contacts.push(contact);
                      }
                    }
                  });
                }
              } catch (threadError) {
                this.logger.warn(`Error processing thread ${thread.id}:`, threadError);
                continue;
              }
            }
          }
        } catch (gmailError) {
          this.logger.error('❌ Gmail threads API also failed via OAuth 2.0:', gmailError.message);
          if (gmailError.code === 401) {
            this.logger.error('🔑 OAuth 2.0 authentication failed - tokens needed');
          }
        }
      }

      if (contacts.length > 0) {
        this.logger.log(`✅ Successfully fetched ${contacts.length} unique contacts from Gmail via OAuth 2.0`);
        return contacts;
      } else {
        this.logger.warn('❌ No contacts found from Gmail API via OAuth 2.0, returning mock data');
        this.logger.warn('💡 OAuth 2.0 authentication flow needs to be completed');
        return this.getMockContacts(accountEmail);
      }

    } catch (error) {
      this.logger.error('Error fetching Gmail contacts via OAuth 2.0:', error);
      this.logger.warn('Will use mock data for testing');
      return this.getMockContacts(accountEmail);
    }
  }

  private parseEmailHeader(headerValue: string): GmailContact | null {
    try {
      // Email format: "John Doe <john.doe@example.com>" ya "john.doe@example.com"
      const emailMatch = headerValue.match(/<(.+?)>/) || headerValue.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      
      if (!emailMatch) return null;

      const email = (emailMatch[1] || emailMatch[2]).toLowerCase();
      
      // Gmail aur IKF emails ko filter karte hain (spam avoid karne ke liye)
      if (email.includes('noreply') || email.includes('no-reply') || 
          email.includes('donotreply') || email.includes('mailer-daemon')) {
        return null;
      }

      const name = headerValue.replace(/<.+?>/, '').trim() || email.split('@')[0];
      
      // Company name email domain se extract karte hain
      const domain = email.split('@')[1];
      let company = '';
      
      if (domain) {
        if (domain === 'ikf.co.in') {
          company = 'IKF';
        } else {
          company = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        }
      }

      return {
        id: `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        email,
        company
      };
    } catch (error) {
      this.logger.warn(`Failed to parse email header: ${headerValue}`);
      return null;
    }
  }

  private getMockContacts(accountEmail?: string): GmailContact[] {
    this.logger.warn(`📝 Returning mock contacts (Alice and Bob) - these are NOT real contacts${accountEmail ? ` for account: ${accountEmail}` : ''}`);
    this.logger.warn('💡 To get real contacts, complete OAuth 2.0 authentication flow');
    
    return [
      {
        id: 'gmail_001',
        name: 'Alice Johnson',
        email: 'alice.johnson@gmail.com',
        phone: '+919876543212',
        company: 'Gmail',
      },
      {
        id: 'gmail_002',
        name: 'Bob Wilson',
        email: 'bob.wilson@outlook.com',
        phone: '+919876543213',
        company: 'Outlook',
      },
    ];
  }

  async transformToStaging(contacts: GmailContact[]): Promise<any[]> {
    return contacts.map(contact => ({
      rawName: contact.name,
      rawEmail: contact.email,
      rawPhone: contact.phone,
      rawCompany: contact.company,
      relationshipType: 'OTHER',
      dataOwnerName: 'Gmail',
      sourceSystem: SourceSystem.GMAIL,
      sourceRecordId: contact.id,
    }));
  }
}
