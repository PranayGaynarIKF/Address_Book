import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SourceSystem } from '@/common/types/enums';

@Injectable()
export class WriterService {
  private readonly logger = new Logger(WriterService.name);

  constructor(private prisma: PrismaService) {}

  async writeContactsToFinal(stagingContacts: any[]): Promise<{
    inserted: number;
    updated: number;
    total: number;
  }> {
    this.logger.log(`Writing ${stagingContacts.length} contacts to final table`);

    let inserted = 0;
    let updated = 0;

    const sanitizePhone = (value?: string | null): string | null => {
      if (!value) return null;
      const digits = String(value).replace(/[^0-9]+/g, '');
      if (digits.length === 0) return null;
      if (digits.length === 10) return `+91${digits}`; // default to IN if plain 10 digits
      if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
      if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
      if (digits.startsWith('+' )) return `+${digits.replace(/^\++/, '')}`;
      return `+${digits}`;
    };

    for (const stagingContact of stagingContacts) {
      try {
        // Resolve fields from either camelCase (in-memory) or snake_case (DB rows)
        const sourceSystem = stagingContact.sourceSystem ?? stagingContact.source_system ?? null;
        const sourceRecordId = stagingContact.sourceRecordId ?? stagingContact.source_record_id ?? null;
        const normName = stagingContact.normName ?? stagingContact.norm_name ?? null;
        const normCompany = stagingContact.normCompany ?? stagingContact.norm_company ?? null;
        const normEmail = stagingContact.normEmail ?? stagingContact.norm_email ?? null;
        const normPhoneE164 = stagingContact.normPhoneE164 ?? stagingContact.norm_phone_e164 ?? null;
        const rawName = stagingContact.rawName ?? stagingContact.raw_name ?? null;
        const rawCompany = stagingContact.rawCompany ?? stagingContact.raw_company ?? null;
        const rawEmail = stagingContact.rawEmail ?? stagingContact.raw_email ?? null;
        const rawPhone = stagingContact.rawPhone ?? stagingContact.raw_phone ?? null;
        const relationshipType = stagingContact.relationshipType ?? stagingContact.relationship_type ?? null;
        const qualityScore = stagingContact.qualityScore ?? stagingContact.data_quality_score ?? stagingContact.quality_score ?? null;

        // Prefer normalized email/phone, else raw
        const matchEmail = (normEmail ?? rawEmail ?? null);
        const matchPhone = sanitizePhone(normPhoneE164 ?? rawPhone ?? null);

        // Check if contact already exists by (source_system + source_record_id) OR by email (case-insensitive) OR by exact name + phone match
        const existing = await this.prisma.$queryRaw`
          SELECT TOP 1 * FROM [app].[Contacts]
          WHERE (source_system = ${sourceSystem} AND source_record_id = ${sourceRecordId})
             OR ((${matchEmail} IS NOT NULL) AND LOWER(email) = LOWER(${matchEmail}))
             OR ((${matchPhone} IS NOT NULL) AND name = ${normName ?? rawName} AND
                 REPLACE(REPLACE(REPLACE(mobileno,'+',''),' ',''),'-','') = 
                 REPLACE(REPLACE(REPLACE(${matchPhone},'+',''),' ',''),'-',''))
        `;

        if (existing && Array.isArray(existing) && existing.length > 0) {
          // Update existing contact using raw SQL
          await this.prisma.$executeRaw`
            UPDATE [app].[Contacts]
            SET 
              name = COALESCE(${normName ?? rawName}, name),
              company_name = COALESCE(${normCompany ?? rawCompany}, company_name),
              email = COALESCE(${normEmail ?? rawEmail}, email),
              mobileno = COALESCE(${sanitizePhone(normPhoneE164 ?? rawPhone)}, mobileno),
              relationship_type = COALESCE(${relationshipType}, relationship_type),
              data_quality_score = COALESCE(${qualityScore}, data_quality_score),
              updated_at = GETUTCDATE()
            WHERE id = ${existing[0].id}
          `;
          updated++;
        } else {
          // Create new contact using raw SQL
          const contactId = require('crypto').randomUUID();
          await this.prisma.$executeRaw`
            INSERT INTO [app].[Contacts] (
              id, name, company_name, email, mobileno, relationship_type, 
              source_system, source_record_id, data_quality_score, 
              is_whatsapp_reachable, created_at, updated_at
            ) VALUES (
              ${contactId}, ${normName ?? rawName}, ${normCompany ?? rawCompany}, 
              ${normEmail ?? rawEmail}, ${sanitizePhone(normPhoneE164 ?? rawPhone)}, 
              ${relationshipType}, ${sourceSystem}, 
              ${sourceRecordId}, ${qualityScore}, 
              1, GETUTCDATE(), GETUTCDATE()
            )
          `;
          inserted++;
        }
      } catch (error) {
        this.logger.error(`Failed to write contact ${stagingContact.sourceRecordId}:`, error);
      }
    }

    return {
      inserted,
      updated,
      total: inserted + updated,
    };
  }

  async associateWithOwners(stagingContacts: any[]): Promise<void> {
    this.logger.log('Associating contacts with owners');

    for (const stagingContact of stagingContacts) {
      try {
        // Handle NULL or empty dataOwnerName
        const ownerName = stagingContact.dataOwnerName?.trim() || 'Unknown Owner';
        
        // Find or create owner using raw SQL
        let owner = await this.prisma.$queryRaw`
          SELECT TOP 1 * FROM [app].[Owners] WHERE name = ${ownerName}
        `;

        if (!owner || !Array.isArray(owner) || owner.length === 0) {
          // Create new owner using raw SQL
          const ownerId = require('crypto').randomUUID();
          await this.prisma.$executeRaw`
            INSERT INTO [app].[Owners] (id, name, is_active, created_at, updated_at)
            VALUES (${ownerId}, ${ownerName}, 1, GETUTCDATE(), GETUTCDATE())
          `;
          owner = [{ id: ownerId }];
        }

        // Find the contact using raw SQL
        const contact = await this.prisma.$queryRaw`
          SELECT TOP 1 * FROM [app].[Contacts] 
          WHERE source_system = ${stagingContact.sourceSystem} 
          AND source_record_id = ${stagingContact.sourceRecordId}
        `;

        if (contact && Array.isArray(contact) && contact.length > 0) {
          // Check if association already exists using raw SQL
          const existingAssociation = await this.prisma.$queryRaw`
            SELECT TOP 1 * FROM [app].[ContactOwners] 
            WHERE contact_id = ${contact[0].id} AND owner_id = ${owner[0].id}
          `;

          if (!existingAssociation || !Array.isArray(existingAssociation) || existingAssociation.length === 0) {
            // Create association using raw SQL
            await this.prisma.$executeRaw`
              INSERT INTO [app].[ContactOwners] (contact_id, owner_id, created_at, updated_at)
              VALUES (${contact[0].id}, ${owner[0].id}, GETUTCDATE(), GETUTCDATE())
            `;
          }
        }
      } catch (error) {
        this.logger.error(`Failed to associate contact with owner:`, error);
      }
    }
  }
}
