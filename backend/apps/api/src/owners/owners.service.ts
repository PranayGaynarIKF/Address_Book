import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOwnerDto, UpdateOwnerDto, OwnerResponseDto } from './dto/owner.dto';

@Injectable()
export class OwnersService {
  constructor(private prisma: PrismaService) {}

  async create(createOwnerDto: CreateOwnerDto): Promise<OwnerResponseDto> {
    // Check if owner with same name exists
    const existing = await this.prisma.owner.findUnique({
      where: { name: createOwnerDto.name },
    });

    if (existing) {
      throw new ConflictException('Owner with this name already exists');
    }

    return this.prisma.owner.create({
      data: createOwnerDto,
    });
  }

  async findAll(): Promise<OwnerResponseDto[]> {
    return this.prisma.owner.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<OwnerResponseDto> {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    return owner;
  }

  async update(id: string, updateOwnerDto: UpdateOwnerDto): Promise<OwnerResponseDto> {
    const existing = await this.prisma.owner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Owner not found');
    }

    // Check for name conflict if name is being updated
    if (updateOwnerDto.name && updateOwnerDto.name !== existing.name) {
      const nameConflict = await this.prisma.owner.findUnique({
        where: { name: updateOwnerDto.name },
      });

      if (nameConflict) {
        throw new ConflictException('Owner with this name already exists');
      }
    }

    return this.prisma.owner.update({
      where: { id },
      data: updateOwnerDto,
    });
  }

  async remove(id: string): Promise<void> {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    await this.prisma.owner.delete({
      where: { id },
    });
  }

  async addContactOwner(contactId: string, ownerId: string): Promise<void> {
    // Check if contact exists
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Check if owner exists
    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Check if association already exists
    const existing = await this.prisma.contactOwner.findUnique({
      where: {
        contactId_ownerId: {
          contactId,
          ownerId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Contact is already associated with this owner');
    }

    await this.prisma.contactOwner.create({
      data: {
        contactId,
        ownerId,
      },
    });
  }

  async removeContactOwner(contactId: string, ownerId: string): Promise<void> {
    const contactOwner = await this.prisma.contactOwner.findUnique({
      where: {
        contactId_ownerId: {
          contactId,
          ownerId,
        },
      },
    });

    if (!contactOwner) {
      throw new NotFoundException('Contact-owner association not found');
    }

    await this.prisma.contactOwner.delete({
      where: {
        contactId_ownerId: {
          contactId,
          ownerId,
        },
      },
    });
  }
}
