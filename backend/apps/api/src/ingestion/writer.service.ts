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

    for (const stagingContact of stagingContacts) {
      try {
        // Check if contact already exists by source system + record ID using raw SQL
        const existing = await this.prisma.$queryRaw`
          SELECT TOP 1 * FROM [app].[Contacts] 
          WHERE source_system = ${stagingContact.sourceSystem} 
          AND source_record_id = ${stagingContact.sourceRecordId}
        `;

        if (existing && Array.isArray(existing) && existing.length > 0) {
          // Update existing contact using raw SQL
          await this.prisma.$executeRaw`
            UPDATE [app].[Contacts] 
            SET 
              name = ${stagingContact.normName},
              company_name = ${stagingContact.normCompany},
              email = ${stagingContact.normEmail},
              mobileno = ${stagingContact.normPhoneE164},
              relationship_type = ${stagingContact.relationshipType},
              data_quality_score = ${stagingContact.qualityScore},
              updated_at = GETDATE()
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
              ${contactId}, ${stagingContact.normName}, ${stagingContact.normCompany}, 
              ${stagingContact.normEmail}, ${stagingContact.normPhoneE164}, 
              ${stagingContact.relationshipType}, ${stagingContact.sourceSystem}, 
              ${stagingContact.sourceRecordId}, ${stagingContact.qualityScore}, 
              1, GETDATE(), GETDATE()
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
      total: stagingContacts.length,
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
            VALUES (${ownerId}, ${ownerName}, 1, GETDATE(), GETDATE())
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
              VALUES (${contact[0].id}, ${owner[0].id}, GETDATE(), GETDATE())
            `;
          }
        }
      } catch (error) {
        this.logger.error(`Failed to associate contact with owner:`, error);
      }
    }
  }
}
