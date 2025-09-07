import { ApiProperty } from '@nestjs/swagger';

export class VcfFileDto {
  @ApiProperty({ description: 'VCF file ID' })
  id: string;

  @ApiProperty({ description: 'Original filename' })
  filename: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt: string;

  @ApiProperty({ description: 'Number of contacts extracted' })
  contactCount: number;

  @ApiProperty({ description: 'Processing status', enum: ['pending', 'processing', 'completed', 'failed'] })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: 'File path on server' })
  filePath: string;

  @ApiProperty({ description: 'Error message if processing failed', required: false })
  errorMessage?: string;
}

export class VcfUploadResponseDto {
  @ApiProperty({ description: 'Upload success status' })
  success: boolean;

  @ApiProperty({ description: 'Uploaded file information', type: VcfFileDto })
  file: VcfFileDto;

  @ApiProperty({ description: 'Response message' })
  message: string;
}

export class VcfProcessResponseDto {
  @ApiProperty({ description: 'Processing success status' })
  success: boolean;

  @ApiProperty({ description: 'Number of contacts processed' })
  contactCount: number;

  @ApiProperty({ description: 'Response message' })
  message: string;
}
