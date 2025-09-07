import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiParam, ApiSecurity } from '@nestjs/swagger';
import { VcfService } from './vcf.service';
import { VcfFileDto, VcfUploadResponseDto, VcfProcessResponseDto } from './dto/vcf-file.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@ApiTags('VCF Files')
@Controller('vcf')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class VcfController {
  private readonly logger = new Logger(VcfController.name);

  constructor(private readonly vcfService: VcfService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload VCF file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'VCF file uploaded successfully', type: VcfUploadResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async uploadFile(@UploadedFile() file: any): Promise<VcfUploadResponseDto> {
    this.logger.log(`Uploading VCF file: ${file?.originalname}`);
    return this.vcfService.uploadFile(file);
  }

  @Get('files')
  @ApiOperation({ summary: 'Get all VCF files' })
  @ApiResponse({ status: 200, description: 'List of VCF files', type: [VcfFileDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async getFiles(): Promise<{ data: VcfFileDto[] }> {
    this.logger.log('Fetching all VCF files');
    const files = await this.vcfService.getFiles();
    return { data: files };
  }

  @Get('files/:id')
  @ApiOperation({ summary: 'Get VCF file by ID' })
  @ApiParam({ name: 'id', description: 'VCF file ID' })
  @ApiResponse({ status: 200, description: 'VCF file details', type: VcfFileDto })
  @ApiResponse({ status: 404, description: 'VCF file not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async getFileById(@Param('id') id: string): Promise<VcfFileDto> {
    this.logger.log(`Fetching VCF file: ${id}`);
    return this.vcfService.getFileById(id);
  }

  @Post('files/:id/process')
  @ApiOperation({ summary: 'Process VCF file to extract contacts' })
  @ApiParam({ name: 'id', description: 'VCF file ID' })
  @ApiResponse({ status: 200, description: 'VCF file processed successfully', type: VcfProcessResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - File already processing or invalid format' })
  @ApiResponse({ status: 404, description: 'VCF file not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async processFile(@Param('id') id: string): Promise<VcfProcessResponseDto> {
    this.logger.log(`Processing VCF file: ${id}`);
    return this.vcfService.processFile(id);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete VCF file' })
  @ApiParam({ name: 'id', description: 'VCF file ID' })
  @ApiResponse({ status: 200, description: 'VCF file deleted successfully' })
  @ApiResponse({ status: 404, description: 'VCF file not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async deleteFile(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting VCF file: ${id}`);
    return this.vcfService.deleteFile(id);
  }

  @Get('files/:id/status')
  @ApiOperation({ summary: 'Get VCF file processing status' })
  @ApiParam({ name: 'id', description: 'VCF file ID' })
  @ApiResponse({ status: 200, description: 'VCF file status' })
  @ApiResponse({ status: 404, description: 'VCF file not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - API key required' })
  async getFileStatus(@Param('id') id: string): Promise<{ status: string; contactCount: number; errorMessage?: string }> {
    this.logger.log(`Getting status for VCF file: ${id}`);
    return this.vcfService.getFileStatus(id);
  }
}
