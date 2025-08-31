import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateContactDto, UpdateContactDto, ContactFilterDto, ContactResponseDto } from './dto/contact.dto';
import { RelationshipType, SourceSystem, castToRelationshipType, castToSourceSystem } from '@/common/types/enums';
import { calculateDataQualityScore } from '@utils/scoring.utils';
import { normalizePhoneNumber } from '@utils/phone.utils';
import { validateEmail } from '@utils/email.utils';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto): Promise<ContactResponseDto> {
    const { mobileE164, email, ...data } = createContactDto;

    // Normalize phone number
    const normalizedPhone = mobileE164 ? normalizePhoneNumber(mobileE164) : null;

    // Check for duplicate (name + mobileE164) - v1.2 rule
    if (normalizedPhone) {
      const existing = await this.prisma.contact.findFirst({
        where: {
          name: data.name,
          mobileE164: normalizedPhone,
        },
      });

      if (existing) {
        throw new ConflictException('Contact with same name and mobile number already exists');
      }
    }

    // Calculate data quality score
    const qualityScore = calculateDataQualityScore({
      name: data.name,
      email,
      mobileE164: normalizedPhone,
      companyName: data.companyName,
      relationshipType: data.relationshipType,
      sourceSystem: data.sourceSystem,
    });

    const contact = await this.prisma.contact.create({
      data: {
        ...data,
        email: email || null,
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

  async findAll(filters: ContactFilterDto): Promise<{ data: ContactResponseDto[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, q, ownerName, relationshipType, whatsappReachable, minScore, sourceSystem, company } = filters;
    const skip = (page - 1) * limit;

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

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owners: {
            include: {
              owner: true,
            },
          },
        },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data: data.map(contact => ({
        ...contact,
        relationshipType: castToRelationshipType(contact.relationshipType),
        sourceSystem: castToSourceSystem(contact.sourceSystem),
        owners: contact.owners.map(co => co.owner),
      })) as ContactResponseDto[],
      total,
      page,
      limit,
    };
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
