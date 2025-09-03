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

    const cleanedContacts = stagingContacts.map(contact => {
      // Map database field names to expected field names
      const rawName = contact.raw_name || contact.rawName;
      const rawEmail = contact.raw_email || contact.rawEmail;
      const rawPhone = contact.raw_phone || contact.rawPhone;
      const rawCompany = contact.raw_company || contact.rawCompany;
      const relationshipType = contact.relationship_type || contact.relationshipType;
      const sourceSystem = contact.source_system || contact.sourceSystem;

      // Normalize name
      const normName = rawName?.trim() || 'Unknown';

      // Normalize email
      const normEmail = rawEmail?.trim() || null;

      // Normalize phone number
      const normPhoneE164 = rawPhone ? normalizePhoneNumber(rawPhone) : null;

      // Normalize company
      let normCompany = rawCompany ? normalizeCompanyName(rawCompany) : 'Unknown';
      
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
        relationshipType: relationshipType,
        sourceSystem: sourceSystem,
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

    // CRITICAL FIX: Update the database with normalized data
    this.logger.log('Updating staging contacts with normalized data in database');
    await this.updateStagingContacts(cleanedContacts);

    return cleanedContacts;
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
        const existing = await this.prisma.$queryRaw`
          SELECT TOP 1 * FROM [app].[Contacts] 
          WHERE name = ${contact.normName} 
          AND mobileno = ${contact.normPhoneE164}
        `;

        if (existing && Array.isArray(existing) && existing.length > 0) {
          // Only merge if BOTH name AND phone match exactly
          duplicates++;
          
          // Generate new name with suffix
          const newName = findDuplicateSuffix(contact.normName, [existing[0].name]);
          
          // Track merge history
          await this.mergeHistoryService.createMergeHistory({
            mergeType: 'DEDUPLICATION',
            primaryContactId: existing[0].id,
            primaryContactName: existing[0].name,
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
            beforeQualityScore: existing[0].data_quality_score,
            afterQualityScore: existing[0].data_quality_score, // Keep existing score
            involvedSourceSystems: [existing[0].source_system, contact.sourceSystem],
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
            duplicateHint: `Duplicate of ${existing[0].name}`,
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
        const existing = await this.prisma.$queryRaw`
          SELECT TOP 1 * FROM [app].[Contacts] 
          WHERE name = ${contact.normName}
        `;

        if (existing && Array.isArray(existing) && existing.length > 0) {
          conflicts++;
          
          const newName = findDuplicateSuffix(contact.normName, [existing[0].name]);
          
          // Track merge history for name conflicts
          await this.mergeHistoryService.createMergeHistory({
            mergeType: 'DEDUPLICATION',
            primaryContactId: existing[0].id,
            primaryContactName: existing[0].name,
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
            beforeQualityScore: existing[0].data_quality_score,
            afterQualityScore: existing[0].data_quality_score, // Keep existing score
            involvedSourceSystems: [existing[0].source_system, contact.sourceSystem],
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
            duplicateHint: `Name conflict with ${existing[0].name}`,
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
    this.logger.log(`Updating ${stagingContacts.length} staging contacts with cleaned data`);

    for (const contact of stagingContacts) {
      try {
        await this.prisma.$executeRaw`
          UPDATE [app].[StagingContacts] 
          SET 
            norm_name = ${contact.normName},
            norm_email = ${contact.normEmail},
            norm_phone_e164 = ${contact.normPhoneE164},
            norm_company = ${contact.normCompany},
            quality_score = ${contact.qualityScore},
            duplicate_hint = ${contact.duplicateHint || null}
          WHERE id = ${contact.id}
        `;
      } catch (error) {
        this.logger.error(`Failed to update staging contact ${contact.id}:`, error);
      }
    }
    
    this.logger.log('✅ Staging contacts updated successfully');
  }
}
