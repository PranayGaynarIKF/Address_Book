import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsHexColor, IsBoolean } from 'class-validator';

export class UpdateTagDto {
  @ApiProperty({
    description: 'Tag name (must be unique)',
    example: 'VIP',
    required: false,
    minLength: 1,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Tag color in hex format',
    example: '#FFD700',
    required: false
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiProperty({
    description: 'Tag description',
    example: 'Very Important Person',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Whether the tag is active',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
