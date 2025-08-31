import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './dto';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  private readonly logger = new Logger(TagsController.name);

  constructor(private readonly tagsService: TagsService) {}

  // =============================================================================
  // TAG MANAGEMENT ENDPOINTS
  // =============================================================================

  @Post()
  @ApiOperation({ 
    summary: 'Create a new tag',
    description: 'Create a new tag with name, color, and description. Requires JWT authentication.'
  })
  @ApiBody({ 
    type: CreateTagDto,
    description: 'Tag creation data',
    examples: {
      example1: {
        summary: 'Create VIP Tag',
        value: {
          name: 'VIP',
          color: '#3B82F6',
          description: 'Very Important Person'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Tag created successfully',
    schema: {
      example: {
        id: 'cmeibuxf60000f8sar1lpg3oo',
        name: 'VIP',
        color: '#3B82F6',
        description: 'Very Important Person',
        isActive: true,
        createdAt: '2025-08-19T09:14:32.753Z',
        updatedAt: '2025-08-19T09:14:32.753Z'
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Tag name already exists' })
  async createTag(@Body() createTagDto: CreateTagDto) {
    this.logger.log(`Creating tag: ${createTagDto.name}`);
    return this.tagsService.createTag(createTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active tags with contact counts' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  async getAllTags() {
    this.logger.log('Retrieving all tags');
    return this.tagsService.getAllTags();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search tags by name or description' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiResponse({ status: 200, description: 'Tags found successfully' })
  async searchTags(@Query('q') query: string) {
    this.logger.log(`Searching tags with query: ${query}`);
    return this.tagsService.searchTags(query);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get most popular tags' })
  @ApiQuery({ name: 'limit', description: 'Number of tags to return', required: false })
  @ApiResponse({ status: 200, description: 'Popular tags retrieved successfully' })
  async getPopularTags(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.log(`Getting ${limitNum} popular tags`);
    return this.tagsService.getPopularTags(limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  @ApiResponse({ status: 200, description: 'Tag retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async getTagById(@Param('id') id: string) {
    this.logger.log(`Getting tag by ID: ${id}`);
    return this.tagsService.getTagById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tag' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  @ApiBody({ type: UpdateTagDto })
  @ApiResponse({ status: 200, description: 'Tag updated successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 409, description: 'Tag name already exists' })
  async updateTag(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    this.logger.log(`Updating tag: ${id}`);
    return this.tagsService.updateTag(id, updateTagDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tag (soft delete if contacts use it)' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async deleteTag(@Param('id') id: string) {
    this.logger.log(`Deleting tag: ${id}`);
    return this.tagsService.deleteTag(id);
  }

  // =============================================================================
  // CONTACT-TAG RELATIONSHIP ENDPOINTS
  // =============================================================================

  @Post('contacts/:contactId/tags/:tagId')
  @ApiOperation({ summary: 'Add tag to contact' })
  @ApiParam({ name: 'contactId', description: 'Contact ID' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  @ApiResponse({ status: 201, description: 'Tag added to contact successfully' })
  @ApiResponse({ status: 409, description: 'Contact already has this tag' })
  async addTagToContact(
    @Param('contactId') contactId: string,
    @Param('tagId') tagId: string,
  ) {
    this.logger.log(`Adding tag ${tagId} to contact ${contactId}`);
    return this.tagsService.addTagToContact(contactId, tagId);
  }

  @Delete('contacts/:contactId/tags/:tagId')
  @ApiOperation({ summary: 'Remove tag from contact' })
  @ApiParam({ name: 'contactId', description: 'Contact ID' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  @ApiResponse({ status: 200, description: 'Tag removed from contact successfully' })
  @ApiResponse({ status: 404, description: 'Contact-tag relationship not found' })
  async removeTagFromContact(
    @Param('contactId') contactId: string,
    @Param('tagId') tagId: string,
  ) {
    this.logger.log(`Removing tag ${tagId} from contact ${contactId}`);
    return this.tagsService.removeTagFromContact(contactId, tagId);
  }

  @Get('contacts/:contactId/tags')
  @ApiOperation({ summary: 'Get all tags for a contact' })
  @ApiParam({ name: 'contactId', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact tags retrieved successfully' })
  async getContactTags(@Param('contactId') contactId: string) {
    this.logger.log(`Getting tags for contact: ${contactId}`);
    return this.tagsService.getTagsForContact(contactId);
  }

  @Get(':tagId/contacts')
  @ApiOperation({ summary: 'Get all contacts with a specific tag' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  @ApiResponse({ status: 200, description: 'Contacts retrieved successfully' })
  async getContactsByTag(@Param('tagId') tagId: string) {
    this.logger.log(`Getting contacts for tag: ${tagId}`);
    return this.tagsService.getContactsWithTag(tagId);
  }

  // =============================================================================
  // BULK OPERATION ENDPOINTS
  // =============================================================================

  @Post('contacts/:contactId/tags')
  @ApiOperation({ summary: 'Add multiple tags to contact' })
  @ApiParam({ name: 'contactId', description: 'Contact ID' })
  @ApiBody({ schema: { type: 'object', properties: { tagIds: { type: 'array', items: { type: 'string' } } } } })
  @ApiResponse({ status: 201, description: 'Tags added to contact successfully' })
  async addTagsToContact(
    @Param('contactId') contactId: string,
    @Body() body: { tagIds: string[] },
  ) {
    this.logger.log(`Adding ${body.tagIds.length} tags to contact ${contactId}`);
    return this.tagsService.addTagsToContactBulk(contactId, body.tagIds);
  }

  @Delete('contacts/:contactId/tags')
  @ApiOperation({ summary: 'Remove multiple tags from contact' })
  @ApiParam({ name: 'contactId', description: 'Contact ID' })
  @ApiBody({ schema: { type: 'object', properties: { tagIds: { type: 'array', items: { type: 'string' } } } } })
  @ApiResponse({ status: 200, description: 'Tags removed from contact successfully' })
  async removeTagsFromContact(
    @Param('contactId') contactId: string,
    @Body() body: { tagIds: string[] },
  ) {
    this.logger.log(`Removing ${body.tagIds.length} tags from contact ${contactId}`);
    return this.tagsService.removeTagsFromContactBulk(contactId, body.tagIds);
  }

  @Post(':tagId/contacts')
  @ApiOperation({ summary: 'Add tag to multiple contacts' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  @ApiBody({ schema: { type: 'object', properties: { contactIds: { type: 'array', items: { type: 'string' } } } } })
  @ApiResponse({ status: 201, description: 'Tag added to contacts successfully' })
  async addTagToMultipleContacts(
    @Param('tagId') tagId: string,
    @Body() body: { contactIds: string[] },
  ) {
    this.logger.log(`Adding tag ${tagId} to ${body.contactIds.length} contacts`);
    return this.tagsService.addTagToContactsBulk(tagId, body.contactIds);
  }

  @Delete(':tagId/contacts')
  @ApiOperation({ summary: 'Remove tag from multiple contacts' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  @ApiBody({ schema: { type: 'object', properties: { contactIds: { type: 'array', items: { type: 'string' } } } } })
  @ApiResponse({ status: 200, description: 'Tag removed from contacts successfully' })
  async removeTagFromMultipleContacts(
    @Param('tagId') tagId: string,
    @Body() body: { contactIds: string[] },
  ) {
    this.logger.log(`Removing tag ${tagId} from ${body.contactIds.length} contacts`);
    return this.tagsService.removeTagFromContactsBulk(tagId, body.contactIds);
  }
}
