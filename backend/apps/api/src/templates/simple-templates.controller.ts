import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, TemplateResponseDto } from './dto/template.dto';

@ApiTags('Simple Templates')
@Controller('simple-templates')
export class SimpleTemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new message template (no auth required)' })
  @ApiResponse({ status: 201, description: 'Template created successfully', type: TemplateResponseDto })
  @ApiResponse({ status: 409, description: 'Template with this name already exists' })
  create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(createTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all message templates (no auth required)' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully', type: [TemplateResponseDto] })
  findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID (no auth required)' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully', type: TemplateResponseDto })
  @ApiResponse({ status: 404, description: 'Template not found' })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template (no auth required)' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}
