import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MergeHistoryService } from './merge-history.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Merge History')
@Controller('merge-history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MergeHistoryController {
  constructor(private readonly mergeHistoryService: MergeHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get merge history with filters' })
  @ApiResponse({ status: 200, description: 'Merge history retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'mergeType', required: false, description: 'Filter by merge type' })
  @ApiQuery({ name: 'sourceSystem', required: false, description: 'Filter by source system' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  async getMergeHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('mergeType') mergeType?: string,
    @Query('sourceSystem') sourceSystem?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    };

    if (mergeType) filters.mergeType = mergeType;
    if (sourceSystem) filters.sourceSystem = sourceSystem;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.mergeHistoryService.getMergeHistory(filters);
  }

  @Get('contact/:contactId')
  @ApiOperation({ summary: 'Get merge history for a specific contact' })
  @ApiResponse({ status: 200, description: 'Contact merge history retrieved successfully' })
  async getMergeHistoryForContact(@Param('contactId') contactId: string) {
    return this.mergeHistoryService.getMergeHistoryForContact(contactId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get merge statistics and analytics' })
  @ApiResponse({ status: 200, description: 'Merge statistics retrieved successfully' })
  async getMergeStatistics() {
    return this.mergeHistoryService.getMergeStatistics();
  }
}
