import { Injectable, Logger } from '@nestjs/common';
import { SourceSystem } from '../../common/types/enums';
import { InvoicePrismaService } from '../../common/prisma/invoice-prisma.service';

export interface InvoiceContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company: string;
  designation?: string;
  relationship_type?: string;
}

@Injectable()
export class InvoiceAdapter {
  private readonly logger = new Logger(InvoiceAdapter.name);
  private tableExists: boolean | null = null; // Cache table existence check
  private lastQueryTime: number = 0; // Track last query time

  constructor(private readonly invoicePrismaService: InvoicePrismaService) {}

  async fetchContacts(): Promise<InvoiceContact[]> {
    this.logger.log('📊 Fetching REAL contacts from invoice database using Prisma');
    
    try {
      // Always fetch from real database - no fallback to mock data
      const contacts = await this.fetchFromDatabase();
      
      if (contacts.length > 0) {
        this.logger.log(`✅ Successfully fetched ${contacts.length} REAL contacts from invoice database`);
        this.logger.log(`💼 These are actual customer contacts from your invoice system`);
        return contacts;
      } else {
        this.logger.error('❌ No contacts found in invoice database');
        this.logger.error('💡 Please check if your invoice database has customer data');
        this.logger.error('💡 Verify the WHERE clause: [del_sts] = \'N\' AND [status] = \'APP\'');
        throw new Error('No customer contacts found in invoice database');
      }
    } catch (error) {
      this.logger.error('❌ Failed to fetch from invoice database:', error);
      this.logger.error('❌ Error details:', error.message);
      this.logger.error('💡 This endpoint requires REAL data from your invoice database');
      this.logger.error('💡 Check database connection and table data');
      throw error; // Don't fall back to mock data - fail fast
    }
  }

  private async fetchFromDatabase(): Promise<InvoiceContact[]> {
    const startTime = Date.now();
    
    try {
      this.logger.log('🔌 Connecting to invoice database via Prisma...');
      
      // Cache table existence check - only check once per session
      if (this.tableExists === null) {
        this.logger.log('🔍 Checking if table exists (first time)...');
        const tableTest = await this.invoicePrismaService.$queryRaw`
          SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_SCHEMA = 'dbo_user_new' AND TABLE_NAME = 'customer_contacts'
        `;
        
        this.tableExists = tableTest[0].count > 0;
        this.logger.log(`📊 Table exists: ${this.tableExists}`);
      } else {
        this.logger.log('✅ Using cached table existence check');
      }
      
      if (this.tableExists) {
        this.logger.log('✅ Table dbo_user_new.customer_contacts found in invoice database');
        
        // Execute optimized SQL query
        this.logger.log('🔍 Executing optimized query...');
        const queryStartTime = Date.now();
        
        const result = await this.invoicePrismaService.$queryRaw`
          SELECT TOP (500) 
            [contactid],
            [customerid],
            [contact_person_name],
            [contact_no],
            [designation],
            [contact_person_email],
            [added_by],
            [status]
          FROM [dbo_user_new].[customer_contacts]
          WHERE [del_sts] = 'N' AND [status] = 'APP'
          ORDER BY [contactid]
        `;
        
        const queryTime = Date.now() - queryStartTime;
        this.logger.log(`⚡ Query executed in ${queryTime}ms`);
        
        if (!result || (result as any[]).length === 0) {
          this.logger.warn('⚠️ Query returned no results - check if data matches WHERE clause');
          this.logger.warn('💡 WHERE [del_sts] = \'N\' AND [status] = \'APP\'');
          throw new Error('Query returned no results');
        }
        
        this.logger.log(`📊 Raw database result: ${(result as any[]).length} records`);
        
        // Transform database results to InvoiceContact format
        const transformStartTime = Date.now();
        const contacts: InvoiceContact[] = (result as any[]).map((row: any, index: number) => ({
          id: `inv_${String(row.contactid || index + 1).padStart(3, '0')}`,
          name: row.contact_person_name || `Contact ${index + 1}`,
          email: row.contact_person_email || undefined,
          phone: row.contact_no || undefined,
          company: String(row.customerid || 'Unknown Company'), // Convert to string
          designation: row.designation || undefined,
          relationship_type: 'CLIENT',
        }));
        
        const transformTime = Date.now() - transformStartTime;
        this.logger.log(`⚡ Transformation completed in ${transformTime}ms`);
        this.logger.log(`🔄 Transformed ${contacts.length} contacts from database`);
        
        // Log performance summary
        const totalTime = Date.now() - startTime;
        this.logger.log(`🚀 Total database operation: ${totalTime}ms (Query: ${queryTime}ms, Transform: ${transformTime}ms)`);
        
        return contacts;
        
      } else {
        this.logger.warn('⚠️ Table dbo_user_new.customer_contacts not found in invoice database');
        throw new Error('Required table not found in invoice database');
      }
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error(`❌ Database operation failed after ${totalTime}ms:`, error);
      this.logger.error('❌ Error message:', error.message);
      throw error;
    }
  }

  // Remove mock data methods - we only want real data now
  /*
  private getFallbackData(): InvoiceContact[] {
    this.logger.warn('⚠️ Using fallback mock data (2 contacts)');
    return [
      {
        id: 'inv_001',
        name: 'Charlie Brown',
        email: 'charlie.brown@invoice.com',
        phone: '+919876543214',
        company: 'Invoice Corp',
        designation: 'Manager',
        relationship_type: 'CLIENT',
      },
      {
        id: 'inv_002',
        name: 'Diana Prince',
        email: 'diana.prince@billing.com',
        phone: '+919876543215',
        company: 'Billing Inc',
        designation: 'Director',
        relationship_type: 'VENDOR',
      },
    ];
  }
  */

  async transformToStaging(contacts: InvoiceContact[]): Promise<any[]> {
    this.logger.log(`🔄 Transforming ${contacts.length} real invoice contacts to staging format`);
    
    return contacts.map((contact, index) => {
      // Determine realistic relationship type based on company/designation
      let relationshipType = 'CLIENT'; // Default
      if (contact.designation?.toLowerCase().includes('vendor') || 
          contact.designation?.toLowerCase().includes('supplier')) {
        relationshipType = 'VENDOR';
      } else if (contact.designation?.toLowerCase().includes('lead') || 
                 contact.designation?.toLowerCase().includes('prospect')) {
        relationshipType = 'LEAD';
      }
      
      const stagingContact = {
        rawName: String(contact.name || `Contact ${index + 1}`),
        rawEmail: contact.email ? String(contact.email) : undefined,
        rawPhone: contact.phone ? String(contact.phone) : undefined,
        rawCompany: String(contact.company || 'Unknown Company'),
        relationshipType: relationshipType,
        dataOwnerName: 'Invoice System - Real Data',
        sourceSystem: SourceSystem.INVOICE,
        sourceRecordId: String(contact.id),
        // Add designation if available
        ...(contact.designation && { rawDesignation: String(contact.designation) }),
      };
      
      // Log first few contacts for verification
      if (index < 3) {
        this.logger.log(`📋 Contact ${index + 1}: ${contact.name} (${contact.company}) - ${relationshipType}`);
      }
      
      return stagingContact;
    });
  }

  // Method to reset cache if needed
  resetCache(): void {
    this.tableExists = null;
    this.logger.log('🔄 Cache reset - will check table existence on next query');
  }

  // Get performance stats
  getPerformanceStats(): { lastQueryTime: number; cacheStatus: string } {
    return {
      lastQueryTime: this.lastQueryTime,
      cacheStatus: this.tableExists === null ? 'Not checked' : (this.tableExists ? 'Exists' : 'Not found')
    };
  }

  // Test database connection and show sample data
  async testDatabaseConnection(): Promise<{ connected: boolean; sampleData?: any[]; error?: string }> {
    try {
      this.logger.log('🧪 Testing invoice database connection...');
      
      // Test basic connection
      await this.invoicePrismaService.$queryRaw`SELECT 1 as test`;
      this.logger.log('✅ Basic connection test passed');
      
      // Check table exists
      const tableTest = await this.invoicePrismaService.$queryRaw`
        SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo_user_new' AND TABLE_NAME = 'customer_contacts'
      `;
      
      if (tableTest[0].count === 0) {
        return { connected: false, error: 'Table dbo_user_new.customer_contacts not found' };
      }
      
      // Get sample data
      const sampleData = await this.invoicePrismaService.$queryRaw`
        SELECT TOP (3)
          [contactid],
          [customerid],
          [contact_person_name],
          [contact_no],
          [designation],
          [contact_person_email],
          [status],
          [del_sts]
        FROM [dbo_user_new].[customer_contacts]
        WHERE [del_sts] = 'N' AND [status] = 'APP'
        ORDER BY [contactid]
      `;
      
      this.logger.log(`📊 Sample data found: ${(sampleData as any[]).length} records`);
      
      return { 
        connected: true, 
        sampleData: sampleData as any[],
        error: undefined
      };
      
    } catch (error) {
      this.logger.error('❌ Database connection test failed:', error);
      return { 
        connected: false, 
        error: error.message,
        sampleData: undefined
      };
    }
  }
}
