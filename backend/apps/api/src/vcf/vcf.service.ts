import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { VcfFileDto, VcfUploadResponseDto, VcfProcessResponseDto } from './dto/vcf-file.dto';

@Injectable()
export class VcfService {
  private readonly logger = new Logger(VcfService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'vcf');
  private vcfFiles: Map<string, VcfFileDto> = new Map();

  constructor() {
    // Ensure upload directory exists
    this.ensureUploadDirectory();
    // Load existing files on startup
    this.loadExistingFiles();
  }

  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created VCF upload directory: ${this.uploadDir}`);
    }
  }

  private loadExistingFiles() {
    try {
      if (fs.existsSync(this.uploadDir)) {
        const files = fs.readdirSync(this.uploadDir);
        files.forEach(file => {
          if (file.endsWith('.vcf') || file.endsWith('.vcard')) {
            const filePath = path.join(this.uploadDir, file);
            const stats = fs.statSync(filePath);
            
            const vcfFile: VcfFileDto = {
              id: uuidv4(),
              filename: file,
              size: stats.size,
              uploadedAt: stats.birthtime.toISOString(),
              contactCount: 0,
              status: 'pending',
              filePath: filePath,
            };
            
            this.vcfFiles.set(vcfFile.id, vcfFile);
          }
        });
        this.logger.log(`Loaded ${this.vcfFiles.size} existing VCF files`);
      }
    } catch (error) {
      this.logger.error('Error loading existing VCF files:', error);
    }
  }

  async uploadFile(file: any): Promise<VcfUploadResponseDto> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (!file.originalname.endsWith('.vcf') && !file.originalname.endsWith('.vcard')) {
        throw new BadRequestException('Only .vcf and .vcard files are allowed');
      }

      const fileId = uuidv4();
      const filename = `${fileId}_${file.originalname}`;
      const filePath = path.join(this.uploadDir, filename);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      const vcfFile: VcfFileDto = {
        id: fileId,
        filename: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        contactCount: 0,
        status: 'pending',
        filePath: filePath,
      };

      this.vcfFiles.set(fileId, vcfFile);

      this.logger.log(`VCF file uploaded: ${file.originalname} (${file.size} bytes)`);

      return {
        success: true,
        file: vcfFile,
        message: 'VCF file uploaded successfully',
      };
    } catch (error) {
      this.logger.error('Error uploading VCF file:', error);
      throw error;
    }
  }

  async getFiles(): Promise<VcfFileDto[]> {
    return Array.from(this.vcfFiles.values());
  }

  async getFileById(id: string): Promise<VcfFileDto> {
    const file = this.vcfFiles.get(id);
    if (!file) {
      throw new NotFoundException(`VCF file with ID ${id} not found`);
    }
    return file;
  }

  async processFile(id: string): Promise<VcfProcessResponseDto> {
    try {
      const file = await this.getFileById(id);
      
      if (file.status === 'processing') {
        throw new BadRequestException('File is already being processed');
      }

      // Update status to processing
      file.status = 'processing';
      this.vcfFiles.set(id, file);

      this.logger.log(`Processing VCF file: ${file.filename}`);

      // Read and parse VCF file
      const content = fs.readFileSync(file.filePath, 'utf-8');
      const contacts = this.parseVcfContent(content);
      
      // Update file with results
      file.contactCount = contacts.length;
      file.status = 'completed';
      this.vcfFiles.set(id, file);

      this.logger.log(`VCF file processed: ${contacts.length} contacts extracted`);

      return {
        success: true,
        contactCount: contacts.length,
        message: `Successfully processed ${contacts.length} contacts from VCF file`,
      };
    } catch (error) {
      this.logger.error('Error processing VCF file:', error);
      
      // Update status to failed
      const file = this.vcfFiles.get(id);
      if (file) {
        file.status = 'failed';
        file.errorMessage = error.message;
        this.vcfFiles.set(id, file);
      }

      throw error;
    }
  }

  async deleteFile(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const file = await this.getFileById(id);
      
      // Delete file from disk
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

      // Remove from memory
      this.vcfFiles.delete(id);

      this.logger.log(`VCF file deleted: ${file.filename}`);

      return {
        success: true,
        message: 'VCF file deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error deleting VCF file:', error);
      throw error;
    }
  }

  async getFileStatus(id: string): Promise<{ status: string; contactCount: number; errorMessage?: string }> {
    const file = await this.getFileById(id);
    return {
      status: file.status,
      contactCount: file.contactCount,
      errorMessage: file.errorMessage,
    };
  }

  private parseVcfContent(content: string): any[] {
    try {
      const vcards = content.split('BEGIN:VCARD').filter(vcard => vcard.trim());
      const contacts = [];

      vcards.forEach((vcard, index) => {
        const lines = vcard.split('\n');
        const contact: any = {
          id: `vcf_${index + 1}`,
          name: '',
          email: '',
          phone: '',
          company: '',
        };

        lines.forEach(line => {
          const trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('FN:')) {
            contact.name = trimmedLine.substring(3);
          } else if (trimmedLine.startsWith('TEL;')) {
            const colonIndex = trimmedLine.lastIndexOf(':');
            if (colonIndex !== -1) {
              contact.phone = trimmedLine.substring(colonIndex + 1);
            }
          } else if (trimmedLine.startsWith('EMAIL;')) {
            const colonIndex = trimmedLine.lastIndexOf(':');
            if (colonIndex !== -1) {
              contact.email = trimmedLine.substring(colonIndex + 1);
            }
          } else if (trimmedLine.startsWith('ORG:')) {
            contact.company = trimmedLine.substring(4);
          }
        });

        // Only include contacts with at least a name or phone
        if (contact.name || contact.phone) {
          contacts.push(contact);
        }
      });

      return contacts;
    } catch (error) {
      this.logger.error('Error parsing VCF content:', error);
      throw new BadRequestException('Invalid VCF file format');
    }
  }

  // Get the latest VCF file for mobile sync
  async getLatestVcfFile(): Promise<VcfFileDto | null> {
    const files = Array.from(this.vcfFiles.values())
      .filter(file => file.status === 'completed')
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    return files.length > 0 ? files[0] : null;
  }
}
