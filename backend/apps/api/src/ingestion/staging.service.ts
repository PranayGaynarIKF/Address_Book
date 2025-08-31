import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SourceSystem } from '@/common/types/enums';

@Injectable()
export class StagingService {
  private readonly logger = new Logger(StagingService.name);

  constructor(private prisma: PrismaService) {}

  async createStagingContacts(contacts: any[]): Promise<any[]> {
    this.logger.log(`Creating ${contacts.length} staging contacts`);

    const stagingContacts = [];
    for (const contact of contacts) {
      const stagingContact = await this.prisma.stagingContact.create({
        data: {
          rawName: contact.rawName,
          rawEmail: contact.rawEmail,
          rawPhone: contact.rawPhone,
          rawCompany: contact.rawCompany,
          relationshipType: contact.relationshipType,
          dataOwnerName: contact.dataOwnerName,
          sourceSystem: contact.sourceSystem,
          sourceRecordId: contact.sourceRecordId,
        },
      });
      stagingContacts.push(stagingContact);
    }

    return stagingContacts;
  }

  async createImportRun(sourceSystem: SourceSystem): Promise<any> {
    this.logger.log(`Creating import run for ${sourceSystem}`);

    return this.prisma.importRun.create({
      data: {
        sourceSystem,
        startedAt: new Date(),
      },
    });
  }

  async updateImportRun(importRunId: string, data: {
    finishedAt?: Date;
    total?: number;
    inserted?: number;
    updated?: number;
    duplicates?: number;
    conflicts?: number;
    reportJson?: string;
  }): Promise<void> {
    await this.prisma.importRun.update({
      where: { id: importRunId },
      data,
    });
  }

  async getLatestImportRun(sourceSystem?: SourceSystem): Promise<any> {
    const where = sourceSystem ? { sourceSystem } : {};
    
    return this.prisma.importRun.findFirst({
      where,
      orderBy: { startedAt: 'desc' },
    });
  }

  async clearStagingContacts(sourceSystem?: SourceSystem): Promise<void> {
    const where = sourceSystem ? { sourceSystem } : {};
    
    await this.prisma.stagingContact.deleteMany({
      where,
    });
  }

  async getStagingContacts(sourceSystem?: SourceSystem): Promise<any[]> {
    const where = sourceSystem ? { sourceSystem } : {};
    
    return this.prisma.stagingContact.findMany({
      where,
      orderBy: { importedAt: 'desc' },
    });
  }
}
