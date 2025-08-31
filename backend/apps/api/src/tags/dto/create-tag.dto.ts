import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsHexColor } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    description: 'Tag name (must be unique)',
    example: 'VIP',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Tag color in hex format',
    example: '#3B82F6',
    required: false,
    default: '#3B82F6'
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
}
