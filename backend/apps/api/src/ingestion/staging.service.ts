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
      // Use raw SQL to bypass Prisma schema mapping issue
      const result = await this.prisma.$queryRaw`
        INSERT INTO [app].[StagingContacts] (
          id, raw_name, raw_email, raw_phone, raw_company, 
          relationship_type, data_owner_name, source_system, 
          source_record_id, imported_at
        )
        OUTPUT INSERTED.*
        VALUES (
          NEWID(), 
          ${contact.rawName || null}, 
          ${contact.rawEmail || null}, 
          ${contact.rawPhone || null}, 
          ${contact.rawCompany || null},
          ${contact.relationshipType || null}, 
          ${contact.dataOwnerName || null}, 
          ${contact.sourceSystem}, 
          ${contact.sourceRecordId},
          GETUTCDATE()
        )
      `;
      
      if (result && Array.isArray(result) && result.length > 0) {
        stagingContacts.push(result[0]);
      }
    }

    return stagingContacts;
  }

  async createImportRun(sourceSystem: SourceSystem): Promise<any> {
    this.logger.log(`Creating import run for ${sourceSystem}`);

    // Use raw SQL to bypass Prisma schema mapping issue
    const result = await this.prisma.$queryRaw`
      INSERT INTO [app].[ImportRuns] (
        id, source_system, started_at, total, inserted, updated, 
        duplicates, conflicts, report_json
      )
      OUTPUT INSERTED.*
      VALUES (
        NEWID(), 
        ${sourceSystem}, 
        GETUTCDATE(), 
        0, 0, 0, 0, 0, NULL
      )
    `;

    return result && Array.isArray(result) && result.length > 0 ? result[0] : null;
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
    // Use raw SQL to bypass Prisma schema mapping issue
    const setParts = [];
    const values = [];

    if (data.finishedAt !== undefined) {
      setParts.push('finished_at = @P' + (values.length + 1));
      values.push(data.finishedAt);
    }
    if (data.total !== undefined) {
      setParts.push('total = @P' + (values.length + 1));
      values.push(data.total);
    }
    if (data.inserted !== undefined) {
      setParts.push('inserted = @P' + (values.length + 1));
      values.push(data.inserted);
    }
    if (data.updated !== undefined) {
      setParts.push('updated = @P' + (values.length + 1));
      values.push(data.updated);
    }
    if (data.duplicates !== undefined) {
      setParts.push('duplicates = @P' + (values.length + 1));
      values.push(data.duplicates);
    }
    if (data.conflicts !== undefined) {
      setParts.push('conflicts = @P' + (values.length + 1));
      values.push(data.conflicts);
    }
    if (data.reportJson !== undefined) {
      setParts.push('report_json = @P' + (values.length + 1));
      values.push(data.reportJson);
    }

    if (setParts.length > 0) {
      const query = `
        UPDATE [app].[ImportRuns] 
        SET ${setParts.join(', ')} 
        WHERE id = @P${values.length + 1}
      `;
      values.push(importRunId);

      await this.prisma.$executeRawUnsafe(query, ...values);
    }
  }

  async getLatestImportRun(sourceSystem?: SourceSystem): Promise<any> {
    // Use raw SQL to bypass Prisma schema mapping issue
    const whereClause = sourceSystem ? 'WHERE source_system = @P1' : '';
    const params = sourceSystem ? [sourceSystem] : [];
    
    const query = `
      SELECT TOP 1 * FROM [app].[ImportRuns] 
      ${whereClause}
      ORDER BY started_at DESC
    `;
    
    const result = await this.prisma.$queryRawUnsafe(query, ...params);
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  async clearStagingContacts(sourceSystem?: SourceSystem): Promise<void> {
    // Use raw SQL to bypass Prisma schema mapping issue
    const whereClause = sourceSystem ? 'WHERE source_system = @P1' : '';
    const params = sourceSystem ? [sourceSystem] : [];
    
    const query = `DELETE FROM [app].[StagingContacts] ${whereClause}`;
    await this.prisma.$executeRawUnsafe(query, ...params);
  }

  async getStagingContacts(sourceSystem?: SourceSystem): Promise<any[]> {
    // Use raw SQL to bypass Prisma schema mapping issue
    const whereClause = sourceSystem ? 'WHERE source_system = @P1' : '';
    const params = sourceSystem ? [sourceSystem] : [];
    
    const query = `
      SELECT * FROM [app].[StagingContacts] 
      ${whereClause}
      ORDER BY imported_at DESC
    `;
    
    const result = await this.prisma.$queryRawUnsafe(query, ...params);
    return Array.isArray(result) ? result : [];
  }
}
