import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { normalizePhoneNumber } from '@utils/phone.utils';
import { validateEmail, extractCompanyFromEmail, normalizeCompanyName } from '@utils/email.utils';
import { calculateDataQualityScore, findDuplicateSuffix } from '@utils/scoring.utils';
import { SourceSystem, RelationshipType } from '@/common/types/enums';
import { MergeHistoryService } from '../../contacts/merge-history.service';

@Injectable()
export class CleanerService {
  private readonly logger = new Logger(CleanerService.name);

  constructor(
    private prisma: PrismaService,
    private mergeHistoryService: MergeHistoryService,
  ) {}

  async cleanAndNormalize(stagingContacts: any[]): Promise<any[]> {
    this.logger.log(`Cleaning and normalizing ${stagingContacts.length} contacts`);

    return stagingContacts.map(contact => {
      // Normalize name
      const normName = contact.rawName?.trim() || 'Unknown';

      // Normalize email
      const normEmail = contact.rawEmail?.trim() || null;

      // Normalize phone number
      const normPhoneE164 = contact.rawPhone ? normalizePhoneNumber(contact.rawPhone) : null;

      // Normalize company
      let normCompany = contact.rawCompany ? normalizeCompanyName(contact.rawCompany) : 'Unknown';
      
      // If no company provided but email exists, extract from email domain
      if (normCompany === 'Unknown' && normEmail) {
        normCompany = extractCompanyFromEmail(normEmail);
      }

      // Calculate quality score
      const qualityScore = calculateDataQualityScore({
        name: normName,
        email: normEmail,
        mobileE164: normPhoneE164,
        companyName: normCompany,
        relationshipType: contact.relationshipType,
        sourceSystem: contact.sourceSystem,
      });

      return {
        ...contact,
        normName,
        normEmail,
        normPhoneE164,
        normCompany,
        qualityScore,
      };
    });
  }

  async handleDeduplication(cleanedContacts: any[]): Promise<{
    contacts: any[];
    duplicates: number;
    conflicts: number;
    report: any[];
  }> {
    this.logger.log('Handling deduplication');
    this.logger.log('📋 Deduplication Rules:');
    this.logger.log('   ✅ Merge: Same name + Same phone (exact match)');
    this.logger.log('   ✅ Create New: Different name + Same phone');
    this.logger.log('   ✅ Create New: Same name + Different phone');
    this.logger.log('   ✅ Create New: Different name + Different phone');

    const report = [];
    let duplicates = 0;
    let conflicts = 0;

    const processedContacts = [];

    for (const contact of cleanedContacts) {
      // Check for existing contact with EXACT name + mobileE164 match
      if (contact.normPhoneE164) {
        const existing = await this.prisma.contact.findFirst({
          where: {
            name: contact.normName,
            mobileE164: contact.normPhoneE164,
          },
        });

        if (existing) {
          // Only merge if BOTH name AND phone match exactly
          duplicates++;
          
          // Generate new name with suffix
          const newName = findDuplicateSuffix(contact.normName, [existing.name]);
          
          // Track merge history
          await this.mergeHistoryService.createMergeHistory({
            mergeType: 'DEDUPLICATION',
            primaryContactId: existing.id,
            primaryContactName: existing.name,
            mergedContactId: contact.id,
            mergedContactName: contact.normName,
            sourceSystem: contact.sourceSystem,
            sourceRecordId: contact.sourceRecordId,
            mergeReason: 'EXACT_MATCH',
            mergeDetails: {
              originalName: contact.normName,
              newName,
              reason: 'Same name and mobile number (exact match)',
              sourceSystem: contact.sourceSystem,
              qualityScore: contact.qualityScore,
            },
            beforeQualityScore: existing.dataQualityScore,
            afterQualityScore: existing.dataQualityScore, // Keep existing score
            involvedSourceSystems: [existing.sourceSystem, contact.sourceSystem],
          });
          
          report.push({
            type: 'duplicate',
            originalName: contact.normName,
            newName,
            sourceSystem: contact.sourceSystem,
            sourceRecordId: contact.sourceRecordId,
            reason: 'Same name and mobile number (exact match)',
          });

          processedContacts.push({
            ...contact,
            normName: newName,
            duplicateHint: `Duplicate of ${existing.name}`,
          });
        } else {
          // Different name with same phone = CREATE NEW CONTACT
          this.logger.log(`📱 Creating new contact: "${contact.normName}" with phone ${contact.normPhoneE164} (different name)`);
          
          processedContacts.push({
            ...contact,
            duplicateHint: null, // No duplicate
          });
        }
      } else {
        // No phone number, check for name conflicts
        const existing = await this.prisma.contact.findFirst({
          where: {
            name: contact.normName,
          },
        });

        if (existing) {
          conflicts++;
          
          const newName = findDuplicateSuffix(contact.normName, [existing.name]);
          
          // Track merge history for name conflicts
          await this.mergeHistoryService.createMergeHistory({
            mergeType: 'DEDUPLICATION',
            primaryContactId: existing.id,
            primaryContactName: existing.name,
            mergedContactId: contact.id,
            mergedContactName: contact.normName,
            sourceSystem: contact.sourceSystem,
            sourceRecordId: contact.sourceRecordId,
            mergeReason: 'SIMILAR_NAME',
            mergeDetails: {
              originalName: contact.normName,
              newName,
              reason: 'Same name but no mobile number',
              sourceSystem: contact.sourceSystem,
              qualityScore: contact.qualityScore,
            },
            beforeQualityScore: existing.dataQualityScore,
            afterQualityScore: existing.dataQualityScore, // Keep existing score
            involvedSourceSystems: [existing.sourceSystem, contact.sourceSystem],
          });
          
          report.push({
            type: 'conflict',
            originalName: contact.normName,
            newName,
            sourceSystem: contact.sourceSystem,
            sourceRecordId: contact.sourceRecordId,
            reason: 'Same name but no mobile number',
          });

          processedContacts.push({
            ...contact,
            normName: newName,
            duplicateHint: `Name conflict with ${existing.name}`,
          });
        } else {
          processedContacts.push(contact);
        }
      }
    }

    // Log deduplication summary
    this.logger.log(`📊 Deduplication Summary:`);
    this.logger.log(`   🔄 Merged duplicates: ${duplicates}`);
    this.logger.log(`   ⚠️  Name conflicts: ${conflicts}`);
    this.logger.log(`   ➕ New contacts: ${processedContacts.length - duplicates - conflicts}`);
    this.logger.log(`   📱 Total processed: ${processedContacts.length}`);

    return {
      contacts: processedContacts,
      duplicates,
      conflicts,
      report,
    };
  }

  async updateStagingContacts(stagingContacts: any[]): Promise<void> {
    this.logger.log('Updating staging contacts with cleaned data');

    for (const contact of stagingContacts) {
      await this.prisma.stagingContact.update({
        where: { id: contact.id },
        data: {
          normName: contact.normName,
          normEmail: contact.normEmail,
          normPhoneE164: contact.normPhoneE164,
          normCompany: contact.normCompany,
          qualityScore: contact.qualityScore,
          duplicateHint: contact.duplicateHint,
        },
      });
    }
  }
}
