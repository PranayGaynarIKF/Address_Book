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
  async findAll(@Query() filters: ContactFilterDto) {
    try {
      console.log('🔍 Contacts findAll called with filters:', filters);
      const result = await this.contactsService.findAll(filters);
      console.log('✅ Contacts findAll successful, count:', result.total);
      return result;
    } catch (error) {
      console.error('❌ Contacts findAll error:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Return a more specific error response
      if (error.code === 'P2002') {
        throw new Error('Database constraint violation');
      } else if (error.code === 'P2024') {
        throw new Error('Database connection timeout');
      } else if (error.code === 'P2025') {
        throw new Error('Record not found');
      } else {
        throw new Error(`Database error: ${error.message}`);
      }
    }
  }

  @Get('test')
  @ApiOperation({ summary: 'Test database connection' })
  @ApiResponse({ status: 200, description: 'Database connection test' })
  async testConnection() {
    try {
      console.log('🔍 Testing database connection...');
      // Simple test query
      const count = await this.contactsService.testConnection();
      console.log('✅ Database connection test successful');
      return { message: 'Database connection successful', count };
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      throw error;
    }
  }

  @Get('test-simple')
  @ApiOperation({ summary: 'Simple database connection test' })
  @ApiResponse({ status: 200, description: 'Simple database test' })
  async testSimpleConnection() {
    try {
      console.log('🔍 Testing simple database connection...');
      // Test with raw SQL to see if it's a Prisma issue
      const result = await this.contactsService.testSimpleConnection();
      console.log('✅ Simple database test successful');
      return { message: 'Simple database test successful', result };
    } catch (error) {
      console.error('❌ Simple database test failed:', error);
      throw error;
    }
  }

  @Get('test-table')
  @ApiOperation({ summary: 'Test table access' })
  @ApiResponse({ status: 200, description: 'Table access test' })
  async testTableAccess() {
    try {
      console.log('🔍 Testing table access...');
      const result = await this.contactsService.testTableAccess();
      console.log('✅ Table access test successful');
      return { message: 'Table access test successful', result };
    } catch (error) {
      console.error('❌ Table access test failed:', error);
      throw error;
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  async healthCheck() {
    try {
      console.log('🔍 Basic health check...');
      return { 
        message: 'Contacts controller is working',
        timestamp: new Date().toISOString(),
        status: 'healthy'
      };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
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
