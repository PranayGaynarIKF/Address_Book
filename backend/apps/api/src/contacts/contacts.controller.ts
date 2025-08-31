import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, ContactFilterDto, ContactResponseDto } from './dto/contact.dto';
import { FlexibleAuthGuard } from '../common/guards/flexible-auth.guard';

@ApiTags('Contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @UseGuards(FlexibleAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({ name: 'X-API-Key', description: 'API key for data ingestion' })
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully', type: ContactResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Contact with same name and mobile number already exists' })
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contacts with filters' })
  @ApiResponse({ status: 200, description: 'Contacts retrieved successfully' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'ownerName', required: false, description: 'Filter by owner name' })
  @ApiQuery({ name: 'relationshipType', required: false, enum: ['CLIENT', 'VENDOR', 'LEAD', 'OTHER'] })
  @ApiQuery({ name: 'whatsappReachable', required: false, type: Boolean })
  @ApiQuery({ name: 'minScore', required: false, type: Number })
  @ApiQuery({ name: 'sourceSystem', required: false, enum: ['INVOICE', 'GMAIL', 'ZOHO', 'MOBILE'] })
  @ApiQuery({ name: 'company', required: false, description: 'Filter by company name' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() filters: ContactFilterDto) {
    return this.contactsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by ID' })
  @ApiResponse({ status: 200, description: 'Contact retrieved successfully', type: ContactResponseDto })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FlexibleAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({ name: 'X-API-Key', description: 'API key for data ingestion' })
  @ApiOperation({ summary: 'Update a contact' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully', type: ContactResponseDto })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  @ApiResponse({ status: 409, description: 'Contact with same name and mobile number already exists' })
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @UseGuards(FlexibleAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({ name: 'X-API-Key', description: 'API key for data ingestion' })
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
