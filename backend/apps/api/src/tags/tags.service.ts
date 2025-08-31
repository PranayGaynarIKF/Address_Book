import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

import { CreateTagDto, UpdateTagDto } from './dto';

export interface TagWithContactCount {
  id: string;
  name: string;
  color: string;
  description?: string;
  isActive: boolean;
  contactCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactTagDto {
  contactId: string;
  tagId: string;
}

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =============================================================================
  // TAG MANAGEMENT
  // =============================================================================

  async createTag(createTagDto: CreateTagDto) {
    try {
      const tag = await this.prisma.tag.create({
        data: {
          name: createTagDto.name.trim(),
          color: createTagDto.color || '#3B82F6',
          description: createTagDto.description?.trim(),
        },
      });

      this.logger.log(`Tag created: ${tag.name}`);
      return tag;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Tag with name '${createTagDto.name}' already exists`);
      }
      throw error;
    }
  }

  async getAllTags(): Promise<TagWithContactCount[]> {
    const tags = await this.prisma.tag.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { contactTags: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tags.map(tag => ({
      ...tag,
      contactCount: tag._count.contactTags,
    }));
  }

  async getTagById(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { contactTags: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return {
      ...tag,
      contactCount: tag._count.contactTags,
    };
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto) {
    try {
      const tag = await this.prisma.tag.update({
        where: { id },
        data: {
          ...(updateTagDto.name && { name: updateTagDto.name.trim() }),
          ...(updateTagDto.color && { color: updateTagDto.color }),
          ...(updateTagDto.description !== undefined && { description: updateTagDto.description?.trim() }),
          ...(updateTagDto.isActive !== undefined && { isActive: updateTagDto.isActive }),
        },
      });

      this.logger.log(`Tag updated: ${tag.name}`);
      return tag;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Tag with name '${updateTagDto.name}' already exists`);
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Tag with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteTag(id: string) {
    try {
      // Check if tag is used by any contacts
      const contactCount = await this.prisma.contactTag.count({
        where: { tagId: id },
      });

      if (contactCount > 0) {
        // Soft delete - just mark as inactive
        const tag = await this.prisma.tag.update({
          where: { id },
          data: { isActive: false },
        });
        this.logger.log(`Tag soft deleted: ${tag.name} (${contactCount} contacts affected)`);
        return { message: `Tag deactivated. ${contactCount} contacts still have this tag.` };
      }

      // Hard delete if no contacts are using it
      const tag = await this.prisma.tag.delete({
        where: { id },
      });
      this.logger.log(`Tag hard deleted: ${tag.name}`);
      return { message: `Tag '${tag.name}' permanently deleted.` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Tag with ID ${id} not found`);
      }
      throw error;
    }
  }

  async searchTags(query: string): Promise<TagWithContactCount[]> {
    const tags = await this.prisma.tag.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
            ],
          },
        ],
      },
      include: {
        _count: {
          select: { contactTags: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 20,
    });

    return tags.map(tag => ({
      ...tag,
      contactCount: tag._count.contactTags,
    }));
  }

  async getPopularTags(limit: number = 10): Promise<TagWithContactCount[]> {
    const tags = await this.prisma.tag.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { contactTags: true },
        },
      },
      orderBy: {
        contactTags: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return tags.map(tag => ({
      ...tag,
      contactCount: tag._count.contactTags,
    }));
  }

  // =============================================================================
  // CONTACT-TAG RELATIONSHIPS
  // =============================================================================

  async addTagToContact(contactId: string, tagId: string) {
    await this.ensureContactAndTagExist(contactId, tagId);

    try {
      return await this.prisma.contactTag.create({
        data: {
          contactId,
          tagId,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') { // Unique constraint violation
        throw new ConflictException(`Contact ${contactId} already has tag ${tagId}`);
      }
      throw error;
    }
  }

  async removeTagFromContact(contactId: string, tagId: string) {
    await this.ensureContactAndTagExist(contactId, tagId);

    const result = await this.prisma.contactTag.deleteMany({
      where: {
        contactId,
        tagId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Tag ${tagId} not found on contact ${contactId}`);
    }
    return { success: true, message: `Tag ${tagId} removed from contact ${contactId}` };
  }

  async getTagsForContact(contactId: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }

    return this.prisma.contactTag.findMany({
      where: { contactId },
      include: { tag: true },
    }).then((contactTags: any[]) => contactTags.map(ct => ct.tag));
  }

  async getContactsWithTag(tagId: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${tagId} not found`);
    }

    return this.prisma.contactTag.findMany({
      where: { tagId },
      include: { contact: true },
    }).then((contactTags: any[]) => contactTags.map(ct => ct.contact));
  }

  async getContactsWithEmailByTag(tagId: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${tagId} not found`);
    }

    return this.prisma.contactTag.findMany({
      where: { 
        tagId,
        contact: {
          AND: [
            { email: { not: null } },
            { email: { not: '' } }
          ]
        }
      },
      include: { 
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            relationshipType: true
          }
        } 
      },
    }).then((contactTags: any[]) => contactTags.map(ct => ct.contact));
  }

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  async addTagsToContactBulk(contactId: string, tagIds: string[]) {
    await this.ensureContactExists(contactId);
    await this.ensureTagsExist(tagIds);

    const data = tagIds.map(tagId => ({
      contactId,
      tagId,
    }));

    const result = await this.prisma.contactTag.createMany({
      data,
    });
    return { success: true, count: result.count };
  }

  async removeTagsFromContactBulk(contactId: string, tagIds: string[]) {
    await this.ensureContactExists(contactId);
    await this.ensureTagsExist(tagIds);

    const result = await this.prisma.contactTag.deleteMany({
      where: {
        contactId,
        tagId: { in: tagIds },
      },
    });
    return { success: true, count: result.count };
  }

  async addTagToContactsBulk(tagId: string, contactIds: string[]) {
    await this.ensureTagExists(tagId);
    await this.ensureContactsExist(contactIds);

    const data = contactIds.map(contactId => ({
      contactId,
      tagId,
    }));

    const result = await this.prisma.contactTag.createMany({
      data,
    });
    return { success: true, count: result.count };
  }

  async removeTagFromContactsBulk(tagId: string, contactIds: string[]) {
    await this.ensureTagExists(tagId);
    await this.ensureContactsExist(contactIds);

    const result = await this.prisma.contactTag.deleteMany({
      where: {
        tagId,
        contactId: { in: contactIds },
      },
    });
    return { success: true, count: result.count };
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async ensureContactAndTagExist(contactId: string, tagId: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${tagId} not found`);
    }
  }

  private async ensureContactExists(contactId: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }
  }

  private async ensureTagExists(tagId: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${tagId} not found`);
    }
  }

  private async ensureContactsExist(contactIds: string[]) {
    const foundContacts = await this.prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true },
    });
    const missingContactIds = contactIds.filter(id => !foundContacts.some(c => c.id === id));
    if (missingContactIds.length > 0) {
      throw new NotFoundException(`Contacts with IDs ${missingContactIds.join(', ')} not found`);
    }
  }

  private async ensureTagsExist(tagIds: string[]) {
    const foundTags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true },
    });
    const missingTagIds = tagIds.filter(id => !foundTags.some(t => t.id === id));
    if (missingTagIds.length > 0) {
      throw new NotFoundException(`Tags with IDs ${missingTagIds.join(', ')} not found`);
    }
  }
}
