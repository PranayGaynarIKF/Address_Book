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

    // Validate input
    if (!stagingContacts || !Array.isArray(stagingContacts)) {
      this.logger.error('Invalid staging contacts input:', stagingContacts);
      return [];
    }

    const cleanedContacts = stagingContacts.map((contact, index) => {
      try {
        // Validate contact object
        if (!contact) {
          this.logger.error(`Contact at index ${index} is null or undefined`);
          return null;
        }

        this.logger.log(`Processing contact ${index + 1}:`, JSON.stringify(contact, null, 2));

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
      } catch (error) {
        this.logger.error(`Error processing contact at index ${index}:`, error);
        this.logger.error(`Contact data:`, JSON.stringify(contact, null, 2));
        return null;
      }
    });

    // Filter out null contacts
    const validCleanedContacts = cleanedContacts.filter(contact => contact !== null);
    this.logger.log(`Filtered out ${cleanedContacts.length - validCleanedContacts.length} invalid contacts`);

    // CRITICAL FIX: Update the database with normalized data
    this.logger.log('Updating staging contacts with normalized data in database');
    await this.updateStagingContacts(validCleanedContacts);

    return validCleanedContacts;
  }

  async handleDeduplication(cleanedContacts: any[]): Promise<{
    contacts: any[];
    duplicates: number;
    conflicts: number;
    report: any[];
  }> {
    this.logger.log('Handling deduplication');
    this.logger.log('📋 Deduplication Rules:');
    this.logger.log('   🔄 MERGE: Same raw_name + Same norm_name + Same phone (exact match)');
    this.logger.log('   ➕ CREATE NEW: Different raw_name OR different norm_name + Same phone (different people, same number)');
    this.logger.log('   ➕ CREATE NEW: Same name + Different phone (same person, different numbers)');
    this.logger.log('   ➕ CREATE NEW: Different name + Different phone (completely different contacts)');
    this.logger.log('');
    this.logger.log('💡 Key Point: Same phone with different raw_name OR norm_name = SEPARATE CONTACTS');

    const report = [];
    let duplicates = 0;
    let conflicts = 0;

    const processedContacts = [];

    for (const contact of cleanedContacts) {
      try {
        // Validate contact object
        if (!contact) {
          this.logger.error('Contact is null or undefined in deduplication loop');
          continue;
        }

        // Check for existing contact with EXACT name + mobileE164 match
        if (contact.normPhoneE164) {
          // First check if there's an existing contact with same norm_name and phone
          const existing = await this.prisma.$queryRaw`
            SELECT TOP 1 [id], [name], [mobileno], [email], [company_name], [source_system], [source_record_id], [data_quality_score] FROM [app].[Contacts] 
            WHERE [name] = ${contact.normName} 
            AND [mobileno] = ${contact.normPhoneE164}
          `;

          if (existing && Array.isArray(existing) && existing.length > 0) {
            // Check if there's a staging contact with same phone but different raw_name
            const conflictingStaging = await this.prisma.$queryRaw`
              SELECT TOP 1 [id], [raw_name], [norm_name], [norm_phone_e164] FROM [app].[StagingContacts] 
              WHERE [norm_phone_e164] = ${contact.normPhoneE164} 
              AND [raw_name] != ${contact.rawName || contact.normName}
              AND [id] != ${contact.id}
            `;

            if (conflictingStaging && Array.isArray(conflictingStaging) && conflictingStaging.length > 0) {
              // Different raw_name with same phone = CREATE NEW CONTACT
              this.logger.log(`📱 Creating NEW contact: "${contact.normName}" (raw: "${contact.rawName}") with phone ${contact.normPhoneE164}`);
              this.logger.log(`   ℹ️  Reason: Different raw_name with same phone number (treating as separate contact)`);
              this.logger.log(`   ℹ️  Conflicting staging contact: "${conflictingStaging[0].raw_name}" (norm: "${conflictingStaging[0].norm_name}")`);
              
              processedContacts.push({
                ...contact,
                duplicateHint: `Different person with same phone as ${conflictingStaging[0].raw_name}`,
              });
              continue;
            }

            // Only merge if BOTH name AND phone match exactly AND no raw_name conflict
            duplicates++;
            
            this.logger.log('Found existing contact:', JSON.stringify(existing[0], null, 2));
            
            // Validate existing contact has name property
            if (!existing[0] || !existing[0].name) {
              this.logger.error('Existing contact missing name property:', existing[0]);
              this.logger.error('Available properties:', Object.keys(existing[0] || {}));
              continue;
            }
            
            // Generate new name with suffix
            let newName;
            try {
              newName = findDuplicateSuffix(contact.normName, [existing[0].name]);
              this.logger.log(`Generated new name: ${newName} for contact: ${contact.normName}`);
            } catch (error) {
              this.logger.error('Error generating duplicate suffix:', error);
              this.logger.error('Contact normName:', contact.normName);
              this.logger.error('Existing name:', existing[0].name);
              continue;
            }
            
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
            // No existing contact in Contacts table, check for staging conflicts
            const conflictingStaging = await this.prisma.$queryRaw`
              SELECT TOP 1 [id], [raw_name], [norm_name], [norm_phone_e164] FROM [app].[StagingContacts] 
              WHERE [norm_phone_e164] = ${contact.normPhoneE164} 
              AND [raw_name] != ${contact.rawName || contact.normName}
              AND [id] != ${contact.id}
            `;

            if (conflictingStaging && Array.isArray(conflictingStaging) && conflictingStaging.length > 0) {
              // Different raw_name with same phone = CREATE NEW CONTACT
              this.logger.log(`📱 Creating NEW contact: "${contact.normName}" (raw: "${contact.rawName}") with phone ${contact.normPhoneE164}`);
              this.logger.log(`   ℹ️  Reason: Different raw_name with same phone number (treating as separate contact)`);
              this.logger.log(`   ℹ️  Conflicting staging contact: "${conflictingStaging[0].raw_name}" (norm: "${conflictingStaging[0].norm_name}")`);
              
              processedContacts.push({
                ...contact,
                duplicateHint: `Different person with same phone as ${conflictingStaging[0].raw_name}`,
              });
            } else {
              // No conflicts, create new contact
              this.logger.log(`📱 Creating NEW contact: "${contact.normName}" (raw: "${contact.rawName}") with phone ${contact.normPhoneE164}`);
              this.logger.log(`   ℹ️  Reason: No existing contact with same phone number`);
              
              processedContacts.push({
                ...contact,
                duplicateHint: null,
              });
            }
          }
        } else {
          // No phone number, check for name conflicts
          const existing = await this.prisma.$queryRaw`
            SELECT TOP 1 [id], [name], [mobileno], [email], [company_name], [source_system], [source_record_id], [data_quality_score] FROM [app].[Contacts] 
            WHERE [name] = ${contact.normName}
          `;

          if (existing && Array.isArray(existing) && existing.length > 0) {
            conflicts++;
            
            // Validate existing contact has name property
            if (!existing[0] || !existing[0].name) {
              this.logger.error('Existing contact missing name property:', existing[0]);
              continue;
            }
            
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
      } catch (error) {
        this.logger.error('Error processing contact in deduplication:', error);
        this.logger.error('Contact data:', JSON.stringify(contact, null, 2));
        // Add the contact as-is to avoid losing data
        processedContacts.push(contact);
      }
    }

    // Log deduplication summary
    this.logger.log(`📊 Deduplication Summary:`);
    this.logger.log(`   🔄 Merged duplicates (same name + same phone): ${duplicates}`);
    this.logger.log(`   ⚠️  Name conflicts (same name, no phone): ${conflicts}`);
    this.logger.log(`   ➕ New contacts (including different names with same phone): ${processedContacts.length - duplicates - conflicts}`);
    this.logger.log(`   📱 Total processed: ${processedContacts.length}`);
    this.logger.log(`   💡 Note: Contacts with same phone but different names are kept as separate contacts`);

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