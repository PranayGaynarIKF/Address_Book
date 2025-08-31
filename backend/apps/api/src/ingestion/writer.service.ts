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
        // Check if contact already exists by source system + record ID
        const existing = await this.prisma.contact.findFirst({
          where: {
            sourceSystem: stagingContact.sourceSystem,
            sourceRecordId: stagingContact.sourceRecordId,
          },
        });

        if (existing) {
          // Update existing contact
          await this.prisma.contact.update({
            where: { id: existing.id },
            data: {
              name: stagingContact.normName,
              companyName: stagingContact.normCompany,
              email: stagingContact.normEmail,
              mobileE164: stagingContact.normPhoneE164,
              relationshipType: stagingContact.relationshipType,
              dataQualityScore: stagingContact.qualityScore,
            },
          });
          updated++;
        } else {
          // Create new contact
          await this.prisma.contact.create({
            data: {
              name: stagingContact.normName,
              companyName: stagingContact.normCompany,
              email: stagingContact.normEmail,
              mobileE164: stagingContact.normPhoneE164,
              relationshipType: stagingContact.relationshipType,
              sourceSystem: stagingContact.sourceSystem,
              sourceRecordId: stagingContact.sourceRecordId,
              dataQualityScore: stagingContact.qualityScore,
            },
          });
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
        // Find or create owner
        let owner = await this.prisma.owner.findUnique({
          where: { name: stagingContact.dataOwnerName },
        });

        if (!owner) {
          owner = await this.prisma.owner.create({
            data: {
              name: stagingContact.dataOwnerName,
              isActive: true,
            },
          });
        }

        // Find the contact
        const contact = await this.prisma.contact.findFirst({
          where: {
            sourceSystem: stagingContact.sourceSystem,
            sourceRecordId: stagingContact.sourceRecordId,
          },
        });

        if (contact) {
          // Check if association already exists
          const existingAssociation = await this.prisma.contactOwner.findUnique({
            where: {
              contactId_ownerId: {
                contactId: contact.id,
                ownerId: owner.id,
              },
            },
          });

          if (!existingAssociation) {
            await this.prisma.contactOwner.create({
              data: {
                contactId: contact.id,
                ownerId: owner.id,
              },
            });
          }
        }
      } catch (error) {
        this.logger.error(`Failed to associate contact with owner:`, error);
      }
    }
  }
}
