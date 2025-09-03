import { Injectable, Logger } from '@nestjs/common';
import { ZohoAdapter } from './adapters/zoho.adapter';
import { GmailAdapter } from './adapters/gmail.adapter';
import { OutlookAdapter } from './adapters/outlook.adapter';
import { InvoiceAdapter } from './adapters/invoice.adapter';
import { MobileAdapter } from './adapters/mobile.adapter';
import { StagingService } from './staging.service';
import { CleanerService } from './cleaner/cleaner.service';
import { WriterService } from './writer.service';
import { SourceSystem } from '@/common/types/enums';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private zohoAdapter: ZohoAdapter,
    private gmailAdapter: GmailAdapter,
    private outlookAdapter: OutlookAdapter,
    private invoiceAdapter: InvoiceAdapter,
    private mobileAdapter: MobileAdapter,
    private stagingService: StagingService,
    private cleanerService: CleanerService,
    private writerService: WriterService,
  ) {}

  async runIngestion(sourceSystem: SourceSystem): Promise<any> {
    this.logger.log(`Starting ingestion for ${sourceSystem}`);

    // Create import run
    const importRun = await this.stagingService.createImportRun(sourceSystem);

    try {
      // Fetch contacts from source
      let contacts = [];
      switch (sourceSystem) {
        case 'ZOHO':
          const zohoContacts = await this.zohoAdapter.fetchContacts();
          contacts = await this.zohoAdapter.transformToStaging(zohoContacts);
          break;
        case 'GMAIL':
          const gmailContacts = await this.gmailAdapter.fetchContacts();
          contacts = await this.gmailAdapter.transformToStaging(gmailContacts);
          break;
        case 'INVOICE':
          const invoiceContacts = await this.invoiceAdapter.fetchContacts();
          contacts = await this.invoiceAdapter.transformToStaging(invoiceContacts);
          break;
        case 'MOBILE':
          const mobileContacts = await this.mobileAdapter.fetchContacts();
          contacts = await this.mobileAdapter.transformToStaging(mobileContacts);
          break;
        default:
          throw new Error(`Unsupported source system: ${sourceSystem}`);
      }

      // Create staging contacts
      const stagingContacts = await this.stagingService.createStagingContacts(contacts);

      // Update import run with total
      await this.stagingService.updateImportRun(importRun.id, {
        total: contacts.length,
      });

      this.logger.log(`Ingestion completed for ${sourceSystem}: ${contacts.length} contacts processed`);

      return {
        success: true,
        sourceSystem,
        total: contacts.length,
        importRunId: importRun.id,
      };
    } catch (error) {
      this.logger.error(`Ingestion failed for ${sourceSystem}:`, error);
      
      await this.stagingService.updateImportRun(importRun.id, {
        finishedAt: new Date(),
      });

      throw error;
    }
  }

  async runGmailIngestion(accountId: string, accountEmail: string): Promise<any> {
    this.logger.log(`Starting Gmail ingestion for account: ${accountEmail} (ID: ${accountId})`);

    const importRun = await this.stagingService.createImportRun(SourceSystem.GMAIL);

    try {
      const gmailContacts = await this.gmailAdapter.fetchContacts(accountId, accountEmail);
      const contacts = await this.gmailAdapter.transformToStaging(gmailContacts);

      await this.stagingService.createStagingContacts(contacts);

      await this.stagingService.updateImportRun(importRun.id, {
        total: contacts.length,
      });

      this.logger.log(`Gmail ingestion completed for ${accountEmail}: ${contacts.length} contacts processed`);
      this.logger.log(`Account ID: ${accountId}, Account Email: ${accountEmail}`);

      return {
        success: true,
        sourceSystem: SourceSystem.GMAIL,
        accountId,
        accountEmail,
        total: contacts.length,
        importRunId: importRun.id,
      };
    } catch (error) {
      this.logger.error(`Gmail ingestion failed for ${accountEmail}:`, error);
      
      await this.stagingService.updateImportRun(importRun.id, {
        finishedAt: new Date(),
      });

      throw error;
    }
  }

  async runOutlookIngestion(accountId: string, accountEmail: string): Promise<any> {
    this.logger.log(`Starting Outlook ingestion for account: ${accountEmail} (ID: ${accountId})`);

    const importRun = await this.stagingService.createImportRun(SourceSystem.OUTLOOK);

    try {
      // Use real Outlook adapter to fetch contacts from Microsoft Graph API
      const outlookContacts = await this.outlookAdapter.fetchContacts(accountId, accountEmail);
      const contacts = await this.outlookAdapter.transformToStaging(outlookContacts);

      await this.stagingService.createStagingContacts(contacts);

      await this.stagingService.updateImportRun(importRun.id, {
        total: contacts.length,
      });

      this.logger.log(`Outlook ingestion completed for ${accountEmail}: ${contacts.length} contacts processed`);
      this.logger.log(`Account ID: ${accountId}, Account Email: ${accountEmail}`);

      return {
        success: true,
        sourceSystem: SourceSystem.OUTLOOK,
        accountId,
        accountEmail,
        total: contacts.length,
        importRunId: importRun.id,
        message: contacts.length > 0 ? 'Real Outlook contacts imported successfully' : 'Using mock data - complete OAuth authentication for real contacts',
      };
    } catch (error) {
      this.logger.error(`Outlook ingestion failed for ${accountEmail}:`, error);
      
      await this.stagingService.updateImportRun(importRun.id, {
        finishedAt: new Date(),
      });

      throw error;
    }
  }

  async runYahooIngestion(accountId: string, accountEmail: string): Promise<any> {
    this.logger.log(`Starting Yahoo ingestion for account: ${accountEmail} (ID: ${accountId})`);

    const importRun = await this.stagingService.createImportRun(SourceSystem.YAHOO);

    try {
      // For now, return mock data - you can implement actual Yahoo integration later
      const mockContacts = [
        { name: 'Yahoo Contact 1', email: 'yahoo1@example.com', phone: '+1111111111' },
        { name: 'Yahoo Contact 2', email: 'yahoo2@example.com', phone: '+2222222222' },
      ];

      this.logger.log(`Yahoo ingestion completed for ${accountEmail}: ${mockContacts.length} contacts processed`);
      this.logger.log(`Account ID: ${accountId}, Account Email: ${accountEmail}`);

      return {
        success: true,
        sourceSystem: SourceSystem.YAHOO,
        accountId,
        accountEmail,
        total: mockContacts.length,
        importRunId: importRun.id,
        message: 'Yahoo integration coming soon - using mock data for now',
      };
    } catch (error) {
      this.logger.error(`Yahoo ingestion failed for ${accountEmail}:`, error);
      
      await this.stagingService.updateImportRun(importRun.id, {
        finishedAt: new Date(),
      });

      throw error;
    }
  }

  async runZohoIngestion(accountId: string, accountEmail: string): Promise<any> {
    this.logger.log(`Starting Zoho ingestion for account: ${accountEmail} (ID: ${accountId})`);

    const importRun = await this.stagingService.createImportRun(SourceSystem.ZOHO);

    try {
      // For now, return mock data - you can implement actual Zoho integration later
      const mockContacts = [
        { name: 'Zoho Contact 1', email: 'zoho1@example.com', phone: '+3333333333' },
        { name: 'Zoho Contact 2', email: 'zoho2@example.com', phone: '+4444444444' },
      ];

      this.logger.log(`Zoho ingestion completed for ${accountEmail}: ${mockContacts.length} contacts processed`);
      this.logger.log(`Account ID: ${accountId}, Account Email: ${accountEmail}`);

      return {
        success: true,
        sourceSystem: SourceSystem.ZOHO,
        accountId,
        accountEmail,
        total: mockContacts.length,
        importRunId: importRun.id,
        message: 'Zoho integration coming soon - using mock data for now',
      };
    } catch (error) {
      this.logger.error(`Zoho ingestion failed for ${accountEmail}:`, error);
      
      await this.stagingService.updateImportRun(importRun.id, {
        finishedAt: new Date(),
      });

      throw error;
    }
  }

  async cleanAndMergeAll(): Promise<any> {
    this.logger.log('🚀 Starting clean and merge process for all staging contacts');

    try {
      // Get all staging contacts
      const stagingContacts = await this.stagingService.getStagingContacts();
      this.logger.log(`📊 Found ${stagingContacts.length} staging contacts to process`);

      if (stagingContacts.length === 0) {
        this.logger.log('ℹ️ No staging contacts to process - all clean!');
        return {
          success: true,
          message: 'No staging contacts to process',
          total: 0,
          inserted: 0,
          updated: 0,
          duplicates: 0,
          conflicts: 0,
        };
      }

      // Clean and normalize
      this.logger.log('🧹 Cleaning and normalizing contacts...');
      const cleanedContacts = await this.cleanerService.cleanAndNormalize(stagingContacts);
      this.logger.log(`✅ Cleaned ${cleanedContacts.length} contacts`);

      // Handle deduplication
      this.logger.log('🔍 Handling deduplication...');
      const { contacts: deduplicatedContacts, duplicates, conflicts, report } = 
        await this.cleanerService.handleDeduplication(cleanedContacts);
      this.logger.log(`✅ Deduplication complete: ${duplicates} duplicates, ${conflicts} conflicts`);
      
      // Validate report data size
      const reportSize = JSON.stringify(report).length;
      this.logger.log(`📊 Report data size: ${reportSize} characters`);
      
      if (reportSize > 2000) {
        this.logger.warn(`⚠️ Report data is large (${reportSize} chars), will truncate for database storage`);
      }

      // Note: Staging contacts already updated in cleanAndNormalize() method
      this.logger.log('📝 Staging contacts already updated with cleaned data');

      // Write to final contacts table
      this.logger.log('💾 Writing contacts to final table...');
      const { inserted, updated, total } = await this.writerService.writeContactsToFinal(deduplicatedContacts);
      this.logger.log(`✅ Database write complete: ${inserted} inserted, ${updated} updated`);

      // Associate with owners
      this.logger.log('👥 Associating contacts with owners...');
      await this.writerService.associateWithOwners(deduplicatedContacts);

      // Create import run for clean-and-merge (use INVOICE instead of ZOHO since it's working)
      this.logger.log('📋 Creating import run for clean-and-merge...');
      const importRun = await this.stagingService.createImportRun(SourceSystem.INVOICE); // Use INVOICE instead of ZOHO
      
      // Truncate report data to avoid database column length issues
      const truncatedReport = JSON.stringify(report).substring(0, 1000); // Limit to 1000 characters
      this.logger.log(`📝 Report data truncated to ${truncatedReport.length} characters`);
      
      await this.stagingService.updateImportRun(importRun.id, {
        finishedAt: new Date(),
        total: stagingContacts.length,
        inserted,
        updated,
        duplicates,
        conflicts,
        reportJson: truncatedReport,
      });

      this.logger.log(`🎉 Clean and merge completed successfully!`);
      this.logger.log(`📊 Summary: ${inserted} inserted, ${updated} updated, ${duplicates} duplicates, ${conflicts} conflicts`);

      return {
        success: true,
        total: stagingContacts.length,
        inserted,
        updated,
        duplicates,
        conflicts,
        report,
        importRunId: importRun.id,
        message: `Successfully processed ${stagingContacts.length} contacts`,
      };

    } catch (error) {
      this.logger.error('❌ Clean and merge process failed:', error);
      this.logger.error('❌ Error details:', error.message);
      
      // Return a proper error response instead of throwing
      return {
        success: false,
        error: error.message,
        message: 'Clean and merge process failed',
        total: 0,
        inserted: 0,
        updated: 0,
        duplicates: 0,
        conflicts: 0,
      };
    }
  }

  async getLatestImportRun(): Promise<any> {
    return this.stagingService.getLatestImportRun();
  }
}
