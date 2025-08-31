import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OwnersService } from './owners.service';
import { CreateOwnerDto, UpdateOwnerDto, OwnerResponseDto } from './dto/owner.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Owners')
@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new owner' })
  @ApiResponse({ status: 201, description: 'Owner created successfully', type: OwnerResponseDto })
  @ApiResponse({ status: 409, description: 'Owner with this name already exists' })
  create(@Body() createOwnerDto: CreateOwnerDto) {
    return this.ownersService.create(createOwnerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all owners' })
  @ApiResponse({ status: 200, description: 'Owners retrieved successfully', type: [OwnerResponseDto] })
  findAll() {
    return this.ownersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an owner by ID' })
  @ApiResponse({ status: 200, description: 'Owner retrieved successfully', type: OwnerResponseDto })
  @ApiResponse({ status: 404, description: 'Owner not found' })
  findOne(@Param('id') id: string) {
    return this.ownersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an owner' })
  @ApiResponse({ status: 200, description: 'Owner updated successfully', type: OwnerResponseDto })
  @ApiResponse({ status: 404, description: 'Owner not found' })
  @ApiResponse({ status: 409, description: 'Owner with this name already exists' })
  update(@Param('id') id: string, @Body() updateOwnerDto: UpdateOwnerDto) {
    return this.ownersService.update(id, updateOwnerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an owner' })
  @ApiResponse({ status: 200, description: 'Owner deleted successfully' })
  @ApiResponse({ status: 404, description: 'Owner not found' })
  remove(@Param('id') id: string) {
    return this.ownersService.remove(id);
  }

  @Post(':contactId/owners/:ownerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Associate a contact with an owner' })
  @ApiResponse({ status: 201, description: 'Contact associated with owner successfully' })
  @ApiResponse({ status: 404, description: 'Contact or owner not found' })
  @ApiResponse({ status: 409, description: 'Contact is already associated with this owner' })
  addContactOwner(@Param('contactId') contactId: string, @Param('ownerId') ownerId: string) {
    return this.ownersService.addContactOwner(contactId, ownerId);
  }

  @Delete(':contactId/owners/:ownerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove association between contact and owner' })
  @ApiResponse({ status: 200, description: 'Contact-owner association removed successfully' })
  @ApiResponse({ status: 404, description: 'Contact-owner association not found' })
  removeContactOwner(@Param('contactId') contactId: string, @Param('ownerId') ownerId: string) {
    return this.ownersService.removeContactOwner(contactId, ownerId);
  }
}
