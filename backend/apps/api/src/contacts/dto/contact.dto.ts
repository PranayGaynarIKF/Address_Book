import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RelationshipType, SourceSystem, RELATIONSHIP_TYPES, SOURCE_SYSTEMS } from '@/common/types/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateContactDto {
  @ApiProperty({ description: 'Contact name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  companyName: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number in E.164 format' })
  @IsOptional()
  @IsString()
  mobileE164?: string;

  @ApiPropertyOptional({ enum: RELATIONSHIP_TYPES })
  @IsOptional()
  @IsEnum(RELATIONSHIP_TYPES)
  relationshipType?: RelationshipType;

  @ApiProperty({ enum: SOURCE_SYSTEMS })
  @IsEnum(SourceSystem)
  sourceSystem: SourceSystem;

  @ApiProperty({ description: 'Source record ID' })
  @IsString()
  sourceRecordId: string;
}

export class UpdateContactDto {
  @ApiPropertyOptional({ description: 'Contact name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number in E.164 format' })
  @IsOptional()
  @IsString()
  mobileE164?: string;

  @ApiPropertyOptional({ enum: RelationshipType })
  @IsOptional()
  @IsEnum(RelationshipType)
  relationshipType?: RelationshipType;

  @ApiPropertyOptional({ description: 'WhatsApp reachability flag' })
  @IsOptional()
  @IsBoolean()
  isWhatsappReachable?: boolean;
}

export class ContactFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search query for name, email, or company' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by owner name' })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional({ enum: RELATIONSHIP_TYPES })
  @IsOptional()
  @IsEnum(RELATIONSHIP_TYPES)
  relationshipType?: RelationshipType;

  @ApiPropertyOptional({ description: 'Filter by WhatsApp reachability' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  whatsappReachable?: boolean;

  @ApiPropertyOptional({ description: 'Minimum data quality score', minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minScore?: number;

  @ApiPropertyOptional({ enum: SOURCE_SYSTEMS })
  @IsOptional()
  @IsEnum(SOURCE_SYSTEMS)
  sourceSystem?: SourceSystem;

  @ApiPropertyOptional({ description: 'Filter by company name' })
  @IsOptional()
  @IsString()
  company?: string;
}

export class ContactResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  companyName: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  mobileE164?: string;

  @ApiPropertyOptional({ enum: RELATIONSHIP_TYPES })
  relationshipType?: RelationshipType;

  @ApiProperty()
  isWhatsappReachable: boolean;

  @ApiProperty()
  dataQualityScore: number;

  @ApiProperty({ enum: SOURCE_SYSTEMS })
  sourceSystem: SourceSystem;

  @ApiProperty()
  sourceRecordId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
