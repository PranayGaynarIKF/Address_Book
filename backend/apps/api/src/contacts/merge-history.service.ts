import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface MergeHistoryData {
  mergeType: 'AUTO_MERGE' | 'MANUAL_MERGE' | 'DEDUPLICATION';
  primaryContactId: string;
  primaryContactName: string;
  mergedContactId?: string;
  mergedContactName?: string;
  sourceSystem: string;
  sourceRecordId?: string;
  mergeReason: 'SAME_PHONE' | 'SIMILAR_NAME' | 'EXACT_MATCH' | 'DUPLICATE_ENTRY';
  mergeDetails: any;
  mergedBy?: string;
  beforeMergeData?: any;
  afterMergeData?: any;
  beforeQualityScore: number;
  afterQualityScore: number;
  involvedSourceSystems: string[];
}

@Injectable()
export class MergeHistoryService {
  private readonly logger = new Logger(MergeHistoryService.name);

  // Define email source systems
  private readonly EMAIL_SOURCES = [
    'GMAIL', 'OUTLOOK', 'YAHOO', 'ZOHO', 'EXCHANGE', 
    'THUNDERBIRD', 'APPLE_MAIL', 'PROTONMAIL'
  ];

  constructor(private prisma: PrismaService) {}

  async createMergeHistory(data: MergeHistoryData): Promise<void> {
    try {
      await (this.prisma as any).mergeHistory.create({
        data: {
          mergeType: data.mergeType,
          primaryContactId: data.primaryContactId,
          primaryContactName: data.primaryContactName,
          mergedContactId: data.mergedContactId,
          mergedContactName: data.mergedContactName,
          sourceSystem: data.sourceSystem,
          sourceRecordId: data.sourceRecordId,
          mergeReason: data.mergeReason,
          mergeDetails: JSON.stringify(data.mergeDetails),
          mergedBy: data.mergedBy || 'SYSTEM',
          beforeMergeData: data.beforeMergeData ? JSON.stringify(data.beforeMergeData) : null,
          afterMergeData: data.afterMergeData ? JSON.stringify(data.afterMergeData) : null,
          beforeQualityScore: data.beforeQualityScore,
          afterQualityScore: data.afterQualityScore,
          involvedSourceSystems: data.involvedSourceSystems.join(','),
        },
      });

      this.logger.log(`📝 Merge history recorded: ${data.mergeType} for ${data.primaryContactName}`);
    } catch (error) {
      this.logger.error('❌ Failed to create merge history:', error);
      // Don't throw error - merge history failure shouldn't break the main process
    }
  }

  async getMergeHistory(filters?: {
    contactId?: string;
    mergeType?: string;
    sourceSystem?: string | string[]; // Allow multiple sources
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    emailOnly?: boolean; // New filter for email sources only
  }): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    filters: any;
  }> {
    const { 
      page = 1, 
      limit = 20, 
      contactId, 
      mergeType, 
      sourceSystem, 
      startDate, 
      endDate,
      emailOnly = false 
    } = filters || {};
    
    const skip = (page - 1) * limit;
    const where: any = {};

    if (contactId) {
      where.OR = [
        { primaryContactId: contactId },
        { mergedContactId: contactId },
      ];
    }

    if (mergeType) {
      where.mergeType = mergeType;
    }

    // Enhanced source system filtering
    if (emailOnly) {
      // Filter for email sources only
      where.sourceSystem = {
        in: this.EMAIL_SOURCES
      };
    } else if (sourceSystem) {
      if (Array.isArray(sourceSystem)) {
        where.sourceSystem = { in: sourceSystem };
      } else {
        where.sourceSystem = sourceSystem;
      }
    }

    if (startDate || endDate) {
      where.mergedAt = {};
      if (startDate) where.mergedAt.gte = startDate;
      if (endDate) where.mergedAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      (this.prisma as any).mergeHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { mergedAt: 'desc' },
      }),
      (this.prisma as any).mergeHistory.count({ where }),
    ]);

    // Parse JSON fields
    const parsedData = data.map(item => ({
      ...item,
      mergeDetails: item.mergeDetails ? JSON.parse(item.mergeDetails) : null,
      beforeMergeData: item.beforeMergeData ? JSON.parse(item.beforeMergeData) : null,
      afterMergeData: item.afterMergeData ? JSON.parse(item.afterMergeData) : null,
      involvedSourceSystems: item.involvedSourceSystems ? item.involvedSourceSystems.split(',') : [],
    }));

    return {
      data: parsedData,
      total,
      page,
      limit,
      filters: { ...filters, emailOnly, sourceSystem: emailOnly ? this.EMAIL_SOURCES : sourceSystem }
    };
  }

  async getMergeHistoryForContact(contactId: string): Promise<any[]> {
    const history = await (this.prisma as any).mergeHistory.findMany({
      where: {
        OR: [
          { primaryContactId: contactId },
          { mergedContactId: contactId },
        ],
      },
      orderBy: { mergedAt: 'desc' },
    });

    return history.map(item => ({
      ...item,
      mergeDetails: item.mergeDetails ? JSON.parse(item.mergeDetails) : null,
      beforeMergeData: item.beforeMergeData ? JSON.parse(item.beforeMergeData) : null,
      afterMergeData: item.afterMergeData ? JSON.parse(item.afterMergeData) : null,
      involvedSourceSystems: item.involvedSourceSystems ? item.involvedSourceSystems.split(',') : [],
    }));
  }

  async getMergeStatistics(): Promise<{
    totalMerges: number;
    mergesByType: Record<string, number>;
    mergesByReason: Record<string, number>;
    mergesBySource: Record<string, number>;
    recentMerges: number;
    emailSourceStats: Record<string, number>;
  }> {
    const [
      totalMerges,
      mergesByType,
      mergesByReason,
      mergesBySource,
      recentMerges,
      emailSourceStats,
    ] = await Promise.all([
      (this.prisma as any).mergeHistory.count(),
      (this.prisma as any).mergeHistory.groupBy({
        by: ['mergeType'],
        _count: { mergeType: true },
      }),
      (this.prisma as any).mergeHistory.groupBy({
        by: ['mergeReason'],
        _count: { mergeReason: true },
      }),
      (this.prisma as any).mergeHistory.groupBy({
        by: ['sourceSystem'],
        _count: { sourceSystem: true },
      }),
      (this.prisma as any).mergeHistory.count({
        where: {
          mergedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      // Get email source specific statistics
      (this.prisma as any).mergeHistory.groupBy({
        by: ['sourceSystem'],
        _count: { sourceSystem: true },
        where: {
          sourceSystem: { in: this.EMAIL_SOURCES }
        }
      }),
    ]);

    return {
      totalMerges,
      mergesByType: mergesByType.reduce((acc, item) => {
        acc[item.mergeType] = item._count.mergeType;
        return acc;
      }, {} as Record<string, number>),
      mergesByReason: mergesByReason.reduce((acc, item) => {
        acc[item.mergeReason] = item._count.mergeReason;
        return acc;
      }, {} as Record<string, number>),
      mergesBySource: mergesBySource.reduce((acc, item) => {
        acc[item.sourceSystem] = item._count.sourceSystem;
        return acc;
      }, {} as Record<string, number>),
      recentMerges,
      emailSourceStats: emailSourceStats.reduce((acc, item) => {
        acc[item.sourceSystem] = item._count.sourceSystem;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // New method: Get data specifically from email sources
  async getEmailSourceData(options?: {
    sourceSystem?: string | string[];
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    mergeType?: string;
  }) {
    return this.getMergeHistory({
      ...options,
      emailOnly: true
    });
  }

  // New method: Get available email source systems
  getAvailableEmailSources(): string[] {
    return [...this.EMAIL_SOURCES];
  }

  // New method: Check if a source system is an email source
  isEmailSource(sourceSystem: string): boolean {
    return this.EMAIL_SOURCES.includes(sourceSystem.toUpperCase());
  }
}
