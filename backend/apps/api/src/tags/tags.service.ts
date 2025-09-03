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
      const tagId = require('crypto').randomUUID();
      const tagName = createTagDto.name.trim();
      const tagColor = createTagDto.color || '#3B82F6';
      const tagDescription = createTagDto.description?.trim() || null;

      await this.prisma.$executeRaw`
        INSERT INTO [app].[Tags] (id, name, color, description, is_active, created_at, updated_at)
        VALUES (${tagId}, ${tagName}, ${tagColor}, ${tagDescription}, 1, GETDATE(), GETDATE())
      `;

      this.logger.log(`Tag created: ${tagName}`);
      
      return {
        id: tagId,
        name: tagName,
        color: tagColor,
        description: tagDescription,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error.message && error.message.includes('duplicate key')) {
        throw new ConflictException(`Tag with name '${createTagDto.name}' already exists`);
      }
      this.logger.error('Error creating tag:', error);
      throw error;
    }
  }

  async getAllTags(): Promise<TagWithContactCount[]> {
    try {
      // Use raw SQL to avoid Prisma ORM mapping issues
      const tags = await this.prisma.$queryRaw`
        SELECT 
          t.id,
          t.name,
          t.color,
          t.description,
          t.is_active as isActive,
          t.created_at as createdAt,
          t.updated_at as updatedAt,
          COALESCE(ct.contact_count, 0) as contactCount
        FROM [app].[Tags] t
        LEFT JOIN (
          SELECT tag_id, COUNT(*) as contact_count
          FROM [app].[ContactTags]
          GROUP BY tag_id
        ) ct ON t.id = ct.tag_id
        WHERE t.is_active = 1
        ORDER BY t.name ASC
      `;

      return tags as TagWithContactCount[];
    } catch (error) {
      this.logger.error('Error fetching tags:', error);
      // Return empty array if Tags table doesn't exist yet
      return [];
    }
  }

  async getTagById(id: string) {
    try {
      const tags = await this.prisma.$queryRaw`
        SELECT 
          t.id,
          t.name,
          t.color,
          t.description,
          t.is_active as isActive,
          t.created_at as createdAt,
          t.updated_at as updatedAt,
          COALESCE(ct.contact_count, 0) as contactCount
        FROM [app].[Tags] t
        LEFT JOIN (
          SELECT tag_id, COUNT(*) as contact_count
          FROM [app].[ContactTags]
          GROUP BY tag_id
        ) ct ON t.id = ct.tag_id
        WHERE t.id = ${id}
      `;

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        throw new NotFoundException(`Tag with ID ${id} not found`);
      }

      return tags[0] as TagWithContactCount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching tag by ID:', error);
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto) {
    try {
      // Build dynamic update query
      const updates = [];
      const params = [];
      
      if (updateTagDto.name) {
        updates.push('name = ?');
        params.push(updateTagDto.name.trim());
      }
      if (updateTagDto.color) {
        updates.push('color = ?');
        params.push(updateTagDto.color);
      }
      if (updateTagDto.description !== undefined) {
        updates.push('description = ?');
        params.push(updateTagDto.description?.trim() || null);
      }
      if (updateTagDto.isActive !== undefined) {
        updates.push('is_active = ?');
        params.push(updateTagDto.isActive ? 1 : 0);
      }
      
      if (updates.length === 0) {
        throw new Error('No fields to update');
      }
      
      updates.push('updated_at = GETDATE()');
      params.push(id);
      
      const updateQuery = `UPDATE [app].[Tags] SET ${updates.join(', ')} WHERE id = ?`;
      
      await this.prisma.$executeRawUnsafe(updateQuery, ...params);
      
      // Get updated tag
      const updatedTag = await this.getTagById(id);
      this.logger.log(`Tag updated: ${updatedTag.name}`);
      return updatedTag;
    } catch (error) {
      if (error.message && error.message.includes('duplicate key')) {
        throw new ConflictException(`Tag with name '${updateTagDto.name}' already exists`);
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating tag:', error);
      throw error;
    }
  }

  async deleteTag(id: string) {
    try {
      // Check if tag is used by any contacts
      const contactCountResult = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM [app].[ContactTags] WHERE tag_id = ${id}
      `;
      const contactCount = contactCountResult[0]?.count || 0;

      if (contactCount > 0) {
        // Soft delete - just mark as inactive
        await this.prisma.$executeRaw`
          UPDATE [app].[Tags] 
          SET is_active = 0, updated_at = GETDATE() 
          WHERE id = ${id}
        `;
        
        const tag = await this.getTagById(id);
        this.logger.log(`Tag soft deleted: ${tag.name} (${contactCount} contacts affected)`);
        return { message: `Tag deactivated. ${contactCount} contacts still have this tag.` };
      }

      // Hard delete if no contacts are using it
      const tag = await this.getTagById(id);
      await this.prisma.$executeRaw`
        DELETE FROM [app].[Tags] WHERE id = ${id}
      `;
      this.logger.log(`Tag hard deleted: ${tag.name}`);
      return { message: `Tag '${tag.name}' permanently deleted.` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error deleting tag:', error);
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
  }

  async searchTags(query: string): Promise<TagWithContactCount[]> {
    try {
      const tags = await this.prisma.$queryRaw`
        SELECT 
          t.id,
          t.name,
          t.color,
          t.description,
          t.is_active as isActive,
          t.created_at as createdAt,
          t.updated_at as updatedAt,
          COALESCE(ct.contact_count, 0) as contactCount
        FROM [app].[Tags] t
        LEFT JOIN (
          SELECT tag_id, COUNT(*) as contact_count
          FROM [app].[ContactTags]
          GROUP BY tag_id
        ) ct ON t.id = ct.tag_id
        WHERE t.is_active = 1
          AND (t.name LIKE ${'%' + query + '%'} OR t.description LIKE ${'%' + query + '%'})
        ORDER BY t.name ASC
      `;

      return (tags as TagWithContactCount[]).slice(0, 20);
    } catch (error) {
      this.logger.error('Error searching tags:', error);
      return [];
    }
  }

  async getPopularTags(limit: number = 10): Promise<TagWithContactCount[]> {
    try {
      const tags = await this.prisma.$queryRaw`
        SELECT TOP ${limit}
          t.id,
          t.name,
          t.color,
          t.description,
          t.is_active as isActive,
          t.created_at as createdAt,
          t.updated_at as updatedAt,
          COALESCE(ct.contact_count, 0) as contactCount
        FROM [app].[Tags] t
        LEFT JOIN (
          SELECT tag_id, COUNT(*) as contact_count
          FROM [app].[ContactTags]
          GROUP BY tag_id
        ) ct ON t.id = ct.tag_id
        WHERE t.is_active = 1
        ORDER BY ct.contact_count DESC, t.name ASC
      `;

      return tags as TagWithContactCount[];
    } catch (error) {
      this.logger.error('Error getting popular tags:', error);
      return [];
    }
  }

  // =============================================================================
  // CONTACT-TAG RELATIONSHIPS
  // =============================================================================

  async addTagToContact(contactId: string, tagId: string) {
    await this.ensureContactAndTagExist(contactId, tagId);

    try {
      const contactTagId = require('crypto').randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO [app].[ContactTags] (id, contact_id, tag_id, created_at)
        VALUES (${contactTagId}, ${contactId}, ${tagId}, GETDATE())
      `;
      
      return {
        id: contactTagId,
        contactId,
        tagId,
        createdAt: new Date(),
      };
    } catch (error) {
      if (error.message && error.message.includes('duplicate key')) {
        throw new ConflictException(`Contact ${contactId} already has tag ${tagId}`);
      }
      this.logger.error('Error adding tag to contact:', error);
      throw error;
    }
  }

  async removeTagFromContact(contactId: string, tagId: string) {
    await this.ensureContactAndTagExist(contactId, tagId);

    try {
      const result = await this.prisma.$executeRaw`
        DELETE FROM [app].[ContactTags] 
        WHERE contact_id = ${contactId} AND tag_id = ${tagId}
      `;
      
      if (result === 0) {
        throw new NotFoundException(`Tag ${tagId} not found on contact ${contactId}`);
      }

      return { success: true, message: `Tag ${tagId} removed from contact ${contactId}` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error removing tag from contact:', error);
      throw error;
    }
  }

  async getTagsForContact(contactId: string) {
    // Verify contact exists
    await this.ensureContactExists(contactId);

    try {
      const tags = await this.prisma.$queryRaw`
        SELECT t.*
        FROM [app].[Tags] t
        INNER JOIN [app].[ContactTags] ct ON t.id = ct.tag_id
        WHERE ct.contact_id = ${contactId}
        ORDER BY t.name ASC
      `;
      return tags;
    } catch (error) {
      this.logger.error('Error getting tags for contact:', error);
      return [];
    }
  }

  async getContactsWithTag(tagId: string) {
    // Verify tag exists
    await this.getTagById(tagId);

    try {
      const contacts = await this.prisma.$queryRaw`
        SELECT c.*
        FROM [app].[Contacts] c
        INNER JOIN [app].[ContactTags] ct ON c.id = ct.contact_id
        WHERE ct.tag_id = ${tagId}
      `;
      return contacts;
    } catch (error) {
      this.logger.error('Error getting contacts with tag:', error);
      return [];
    }
  }

  async getContactsWithEmailByTag(tagId: string) {
    // Verify tag exists
    await this.getTagById(tagId);

    try {
      const contacts = await this.prisma.$queryRaw`
        SELECT 
          c.id,
          c.name,
          c.email,
          c.company_name as companyName,
          c.relationship_type as relationshipType
        FROM [app].[Contacts] c
        INNER JOIN [app].[ContactTags] ct ON c.id = ct.contact_id
        WHERE ct.tag_id = ${tagId}
          AND c.email IS NOT NULL
          AND c.email != ''
      `;
      return contacts;
    } catch (error) {
      this.logger.error('Error getting contacts with email by tag:', error);
      return [];
    }
  }

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  async addTagsToContactBulk(contactId: string, tagIds: string[]) {
    await this.ensureContactExists(contactId);
    await this.ensureTagsExist(tagIds);

    try {
      let added = 0;
      for (const tagId of tagIds) {
        try {
          const contactTagId = require('crypto').randomUUID();
          await this.prisma.$executeRaw`
            INSERT INTO [app].[ContactTags] (id, contact_id, tag_id, created_at)
            VALUES (${contactTagId}, ${contactId}, ${tagId}, GETDATE())
          `;
          added++;
        } catch (error) {
          // Skip duplicates
          if (!error.message || !error.message.includes('duplicate key')) {
            this.logger.error(`Error adding tag ${tagId} to contact ${contactId}:`, error);
          }
        }
      }

      return { success: true, count: added };
    } catch (error) {
      this.logger.error('Error in bulk add tags to contact:', error);
      throw error;
    }
  }

  async removeTagsFromContactBulk(contactId: string, tagIds: string[]) {
    await this.ensureContactExists(contactId);
    await this.ensureTagsExist(tagIds);

    try {
      const result = await this.prisma.$executeRaw`
        DELETE FROM [app].[ContactTags] 
        WHERE contact_id = ${contactId} AND tag_id IN (${tagIds.join("','")})
      `;
      return { success: true, count: result };
    } catch (error) {
      this.logger.error('Error in bulk remove tags from contact:', error);
      throw error;
    }
  }

  async addTagToContactsBulk(tagId: string, contactIds: string[]) {
    await this.ensureTagExists(tagId);
    await this.ensureContactsExist(contactIds);

    try {
      let added = 0;
      for (const contactId of contactIds) {
        try {
          const contactTagId = require('crypto').randomUUID();
          await this.prisma.$executeRaw`
            INSERT INTO [app].[ContactTags] (id, contact_id, tag_id, created_at)
            VALUES (${contactTagId}, ${contactId}, ${tagId}, GETDATE())
          `;
          added++;
        } catch (error) {
          // Skip duplicates
          if (!error.message || !error.message.includes('duplicate key')) {
            this.logger.error(`Error adding tag ${tagId} to contact ${contactId}:`, error);
          }
        }
      }

      return { success: true, count: added };
    } catch (error) {
      this.logger.error('Error in bulk add tag to contacts:', error);
      throw error;
    }
  }

  async removeTagFromContactsBulk(tagId: string, contactIds: string[]) {
    await this.ensureTagExists(tagId);
    await this.ensureContactsExist(contactIds);

    try {
      const result = await this.prisma.$executeRaw`
        DELETE FROM [app].[ContactTags] 
        WHERE tag_id = ${tagId} AND contact_id IN (${contactIds.join("','")})
      `;
      return { success: true, count: result };
    } catch (error) {
      this.logger.error('Error in bulk remove tag from contacts:', error);
      throw error;
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async ensureContactAndTagExist(contactId: string, tagId: string) {
    await this.ensureContactExists(contactId);
    await this.ensureTagExists(tagId);
  }

  private async ensureContactExists(contactId: string) {
    try {
      const contacts = await this.prisma.$queryRaw`
        SELECT id FROM [app].[Contacts] WHERE id = ${contactId}
      `;
      if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        throw new NotFoundException(`Contact with ID ${contactId} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error checking contact existence:', error);
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }
  }

  private async ensureTagExists(tagId: string) {
    try {
      await this.getTagById(tagId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Tag with ID ${tagId} not found`);
    }
  }

  private async ensureContactsExist(contactIds: string[]) {
    try {
      const foundContacts = await this.prisma.$queryRaw`
        SELECT id FROM [app].[Contacts] WHERE id IN (${contactIds.join("','")})
      `;
      const foundContactIds = (foundContacts as any[]).map((c: any) => c.id);
      const missingContactIds = contactIds.filter(id => !foundContactIds.includes(id));
      if (missingContactIds.length > 0) {
        throw new NotFoundException(`Contacts with IDs ${missingContactIds.join(', ')} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error checking contacts existence:', error);
      throw new NotFoundException(`Contacts with IDs ${contactIds.join(', ')} not found`);
    }
  }

  private async ensureTagsExist(tagIds: string[]) {
    try {
      const foundTags = await this.prisma.$queryRaw`
        SELECT id FROM [app].[Tags] WHERE id IN (${tagIds.join("','")})
      `;
      const foundTagIds = (foundTags as any[]).map((t: any) => t.id);
      const missingTagIds = tagIds.filter(id => !foundTagIds.includes(id));
      if (missingTagIds.length > 0) {
        throw new NotFoundException(`Tags with IDs ${missingTagIds.join(', ')} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error checking tags existence:', error);
      throw new NotFoundException(`Tags with IDs ${tagIds.join(', ')} not found`);
    }
  }
}
