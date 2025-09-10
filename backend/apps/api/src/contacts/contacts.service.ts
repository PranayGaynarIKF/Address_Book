import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateContactDto, UpdateContactDto, ContactFilterDto, ContactResponseDto } from './dto/contact.dto';
import { RelationshipType, SourceSystem, castToRelationshipType, castToSourceSystem } from '@/common/types/enums';
import { normalizePhoneNumber } from '@utils/phone.utils';
import { calculateDataQualityScore } from '@utils/scoring.utils';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto): Promise<ContactResponseDto> {
    const { mobileE164, email, ...data } = createContactDto;

    // Check for duplicate (name + mobileE164) - v1.2 rule using raw SQL
    if (mobileE164) {
      const existing = await this.prisma.$queryRaw`
        SELECT * FROM [app].[Contacts] WHERE [name] = ${data.name} AND [mobileno] = ${mobileE164}
      ` as any[];

      if (existing.length > 0) {
        throw new ConflictException('Contact with same name and mobile number already exists');
      }
    }

    // Simple data quality score calculation
    let qualityScore = 0;
    if (mobileE164) qualityScore += 40;
    if (email) qualityScore += 20;
    if (data.companyName && data.companyName !== 'Unknown') qualityScore += 15;
    if (data.relationshipType) qualityScore += 15;
    if (data.sourceSystem === 'INVOICE' || data.sourceSystem === 'ZOHO') qualityScore += 10;

    // Generate unique ID
    const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use raw SQL to create contact (temporary fix for Prisma mapping issue)
    await this.prisma.$executeRaw`
      INSERT INTO [app].[Contacts] (
        [id], [name], [company_name], [email], [mobileno], 
        [relationship_type], [is_whatsapp_reachable], [data_quality_score],
        [source_system], [source_record_id], [created_at], [updated_at]
      ) VALUES (
        ${contactId}, ${data.name}, ${data.companyName}, 
        ${email || null}, ${mobileE164 || null}, ${data.relationshipType || null}, 
        0, ${qualityScore}, ${data.sourceSystem}, ${data.sourceRecordId}, 
        GETUTCDATE(), GETUTCDATE()
      )
    `;

    // Fetch the created contact using raw SQL
    const result = await this.prisma.$queryRaw`
      SELECT * FROM [app].[Contacts] WHERE [id] = ${contactId}
    ` as any[];

    if (result.length === 0) {
      throw new Error('Failed to create contact');
    }

    const contact = result[0];

    return {
      id: contact.id,
      name: contact.name,
      companyName: contact.company_name,
      email: contact.email,
      mobileE164: contact.mobileno,
      relationshipType: castToRelationshipType(contact.relationship_type),
      sourceSystem: castToSourceSystem(contact.source_system),
      sourceRecordId: contact.source_record_id,
      isWhatsappReachable: contact.is_whatsapp_reachable,
      dataQualityScore: contact.data_quality_score,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    } as ContactResponseDto;
  }

  async findAll(filters: ContactFilterDto): Promise<{ data: ContactResponseDto[]; total: number; page: number; limit: number }> {
    try {
      console.log('🔍 ContactsService.findAll called with filters:', filters);
      const { page = 1, limit = 20, q, ownerName, relationshipType, whatsappReachable, minScore, sourceSystem, company } = filters;
      const skip = (page - 1) * limit;

      console.log('🔍 Building where clause...');
      // Build where clause
      const where: any = {};

      if (q) {
        where.OR = [
          { name: { contains: q } },
          { email: { contains: q } },
          { companyName: { contains: q } },
        ];
      }

      if (relationshipType) {
        where.relationshipType = relationshipType;
      }

      if (whatsappReachable !== undefined) {
        where.isWhatsappReachable = whatsappReachable;
      }

      if (minScore !== undefined) {
        where.dataQualityScore = { gte: minScore };
      }

      if (sourceSystem) {
        where.sourceSystem = sourceSystem;
      }

      if (company) {
        where.companyName = { contains: company };
      }

      // Handle owner filter
      if (ownerName) {
        where.owners = {
          some: {
            owner: {
              name: { contains: ownerName },
            },
          },
        };
      }

      console.log('🔍 Where clause built:', JSON.stringify(where, null, 2));
      console.log('🔍 About to execute Prisma queries...');

      // Use raw SQL to bypass Prisma schema mapping issue
      const whereConditions = [];
      const params = [];
      let paramIndex = 1;

      if (q) {
        whereConditions.push(`(c.name LIKE @P${paramIndex} OR c.email LIKE @P${paramIndex} OR c.company_name LIKE @P${paramIndex})`);
        params.push(`%${q}%`);
        paramIndex++;
      }

      if (relationshipType) {
        whereConditions.push(`c.relationship_type = @P${paramIndex}`);
        params.push(relationshipType);
        paramIndex++;
      }

      if (whatsappReachable !== undefined) {
        whereConditions.push(`c.is_whatsapp_reachable = @P${paramIndex}`);
        params.push(whatsappReachable);
        paramIndex++;
      }

      if (minScore !== undefined) {
        whereConditions.push(`c.data_quality_score >= @P${paramIndex}`);
        params.push(minScore);
        paramIndex++;
      }

      if (sourceSystem) {
        whereConditions.push(`c.source_system = @P${paramIndex}`);
        params.push(sourceSystem);
        paramIndex++;
      }

      if (company) {
        whereConditions.push(`c.company_name LIKE @P${paramIndex}`);
        params.push(`%${company}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get data with owners
      const dataQuery = `
        SELECT 
          c.*,
          o.id as owner_id,
          o.name as owner_name,
          o.is_active as owner_is_active
        FROM [app].[Contacts] c
        LEFT JOIN [app].[ContactOwners] co ON c.id = co.contact_id
        LEFT JOIN [app].[Owners] o ON co.owner_id = o.id
        ${whereClause}
        ORDER BY c.created_at DESC
        OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY
      `;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM [app].[Contacts] c
        ${whereClause}
      `;

      const [dataResult, totalResult] = await Promise.all([
        this.prisma.$queryRawUnsafe(dataQuery, ...params),
        this.prisma.$queryRawUnsafe(countQuery, ...params),
      ]);

      const data = dataResult as any[];
      const total = (totalResult as any[])[0].total;

      console.log('✅ Prisma queries successful');
      console.log('✅ Data count:', data.length);
      console.log('✅ Total count:', total);

      // Transform raw SQL data to match expected format
      const transformedData = data.map(contact => ({
        id: contact.id,
        name: contact.name,
        companyName: contact.company_name,
        email: contact.email,
        mobileE164: contact.mobileno,
        relationshipType: castToRelationshipType(contact.relationship_type),
        isWhatsappReachable: contact.is_whatsapp_reachable,
        dataQualityScore: contact.data_quality_score,
        sourceSystem: castToSourceSystem(contact.source_system),
        sourceRecordId: contact.source_record_id,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at,
        owners: contact.owner_id ? [{
          id: contact.owner_id,
          name: contact.owner_name,
          isActive: contact.owner_is_active,
          createdAt: contact.created_at,
          updatedAt: contact.updated_at,
        }] : [],
      })) as ContactResponseDto[];

      return {
        data: transformedData,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('❌ ContactsService.findAll error:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error meta:', error.meta);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<ContactResponseDto> {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        owners: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return {
      ...contact,
      relationshipType: castToRelationshipType(contact.relationshipType),
      sourceSystem: castToSourceSystem(contact.sourceSystem),
      owners: contact.owners.map(co => co.owner),
    } as ContactResponseDto;
  }

  async testConnection(): Promise<number> {
    try {
      console.log('🔍 Testing database connection with simple query...');
      const count = await this.prisma.contact.count();
      console.log('✅ Database connection test successful, contact count:', count);
      return count;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      throw error;
    }
  }

  async testSimpleConnection(): Promise<any> {
    try {
      console.log('🔍 Testing simple database connection...');
      // Test with a simple query to see if database is accessible
      const result = await this.prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Simple database test successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Simple database test failed:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      throw error;
    }
  }

  async testTableAccess(): Promise<any> {
    try {
      console.log('🔍 Testing table access...');
      // Test if we can access the contacts table
      const result = await this.prisma.$queryRaw`SELECT COUNT(*) as count FROM [app].[app.Contacts]`;
      console.log('✅ Table access test successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Table access test failed:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      throw error;
    }
  }

  async update(id: string, updateContactDto: UpdateContactDto): Promise<ContactResponseDto> {
    const { mobileE164, email, ...data } = updateContactDto;

    // Check if contact exists
    const existing = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Contact not found');
    }

    // Normalize phone number if provided
    const normalizedPhone = mobileE164 ? normalizePhoneNumber(mobileE164) : existing.mobileE164;

    // Check for duplicate (name + mobileE164) if name or phone changed
    if ((data.name && data.name !== existing.name) || (normalizedPhone && normalizedPhone !== existing.mobileE164)) {
      const duplicate = await this.prisma.contact.findFirst({
        where: {
          name: data.name || existing.name,
          mobileE164: normalizedPhone,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException('Contact with same name and mobile number already exists');
      }
    }

    // Recalculate quality score if relevant fields changed
    let qualityScore = existing.dataQualityScore;
    if (mobileE164 || email || data.companyName || data.relationshipType) {
      qualityScore = calculateDataQualityScore({
        name: data.name || existing.name,
        email: email || existing.email,
        mobileE164: normalizedPhone,
        companyName: data.companyName || existing.companyName,
        relationshipType: data.relationshipType || existing.relationshipType,
        sourceSystem: castToSourceSystem(existing.sourceSystem),
      });
    }

    const contact = await this.prisma.contact.update({
      where: { id },
      data: {
        ...data,
        email: email !== undefined ? email : existing.email,
        mobileE164: normalizedPhone,
        dataQualityScore: qualityScore,
      },
    });

    return {
      ...contact,
      relationshipType: castToRelationshipType(contact.relationshipType),
      sourceSystem: castToSourceSystem(contact.sourceSystem),
    } as ContactResponseDto;
  }

  async remove(id: string): Promise<void> {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contact.delete({
      where: { id },
    });
  }
}
