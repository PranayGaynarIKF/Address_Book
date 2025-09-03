import { Controller, Post, Get, UseGuards, Logger, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { SourceSystem } from '../common/types/enums';

interface GmailIngestionDto {
  accountId?: string;
  accountEmail?: string;
}

@ApiTags('Ingestion')
@Controller('ingestion')
@UseGuards(ApiKeyGuard)
@ApiSecurity('ingestion-api-key')
export class IngestionController {
  private readonly logger = new Logger(IngestionController.name);

  constructor(private readonly ingestionService: IngestionService) {}

  @Post('gmail/run')
  @ApiOperation({ summary: 'Run Gmail ingestion for specific account' })
  @ApiBody({ type: Object, description: 'Gmail account details' })
  @ApiResponse({ status: 200, description: 'Gmail ingestion completed successfully' })
  async runGmailIngestion(@Body() gmailData: GmailIngestionDto) {
    return this.ingestionService.runGmailIngestionAuto(gmailData.accountId, gmailData.accountEmail);
  }

  @Post('outlook/run')
  @ApiOperation({ summary: 'Run Outlook ingestion for specific account' })
  @ApiBody({ type: Object, description: 'Outlook account details' })
  @ApiResponse({ status: 200, description: 'Outlook ingestion completed successfully' })
  async runOutlookIngestion(@Body() outlookData: GmailIngestionDto) {
    this.logger.log(`Starting Outlook ingestion for account: ${outlookData.accountEmail}`);
    return this.ingestionService.runOutlookIngestion(outlookData.accountId, outlookData.accountEmail);
  }

  @Post('yahoo/run')
  @ApiOperation({ summary: 'Run Yahoo ingestion for specific account' })
  @ApiBody({ type: Object, description: 'Yahoo account details' })
  @ApiResponse({ status: 200, description: 'Yahoo ingestion completed successfully' })
  async runYahooIngestion(@Body() yahooData: GmailIngestionDto) {
    this.logger.log(`Starting Yahoo ingestion for account: ${yahooData.accountEmail}`);
    return this.ingestionService.runYahooIngestion(yahooData.accountId, yahooData.accountEmail);
  }

  @Post('zoho/run')
  @ApiOperation({ summary: 'Run Zoho ingestion for specific account' })
  @ApiBody({ type: Object, description: 'Zoho account details' })
  @ApiResponse({ status: 200, description: 'Zoho ingestion completed successfully' })
  async runZohoIngestion(@Body() zohoData: GmailIngestionDto) {
    this.logger.log(`Starting Zoho ingestion for account: ${zohoData.accountEmail}`);
    return this.ingestionService.runZohoIngestion(zohoData.accountId, zohoData.accountEmail);
  }

  @Post('invoice/run')
  @ApiOperation({ summary: 'Run Invoice system ingestion' })
  @ApiResponse({ status: 200, description: 'Invoice ingestion completed successfully' })
  async runInvoiceIngestion() {
    this.logger.log('Starting Invoice ingestion');
    return this.ingestionService.runIngestion(SourceSystem.INVOICE);
  }

  @Post('mobile/run')
  @ApiOperation({ summary: 'Run Mobile contacts ingestion' })
  @ApiSecurity('ingestion-api-key')
  @ApiResponse({ status: 200, description: 'Mobile ingestion completed successfully' })
  @ApiResponse({ status: 401, description: 'API key is required' })
  async runMobileIngestion() {
    this.logger.log('Starting Mobile ingestion');
    return this.ingestionService.runIngestion(SourceSystem.MOBILE);
  }

  @Post('clean-and-merge')
  @ApiOperation({ summary: 'Clean and merge all staging contacts' })
  @ApiResponse({ status: 200, description: 'Clean and merge completed successfully' })
  async cleanAndMerge() {
    this.logger.log('Starting clean and merge process');
    return this.ingestionService.cleanAndMergeAll();
  }

  @Get('import-runs/latest')
  @ApiOperation({ summary: 'Get latest import run' })
  @ApiResponse({ status: 200, description: 'Latest import run retrieved' })
  async getLatestImportRun() {
    return this.ingestionService.getLatestImportRun();
  }
}
