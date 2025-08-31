import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { castToMessageChannel } from '../common/types/enums';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto, TemplateResponseDto } from './dto/template.dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(createTemplateDto: CreateTemplateDto): Promise<TemplateResponseDto> {
    // Check if template with same name exists
    const existing = await this.prisma.messageTemplate.findUnique({
      where: { name: createTemplateDto.name },
    });

    if (existing) {
      throw new ConflictException('Template with this name already exists');
    }

    const template = await this.prisma.messageTemplate.create({
      data: createTemplateDto,
    });
    
    return {
      ...template,
      channel: castToMessageChannel(template.channel),
    } as TemplateResponseDto;
  }

  async findAll(): Promise<TemplateResponseDto[]> {
    const templates = await this.prisma.messageTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    
    return templates.map(template => ({
      ...template,
      channel: castToMessageChannel(template.channel),
    })) as TemplateResponseDto[];
  }

  async findOne(id: string): Promise<TemplateResponseDto> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return {
      ...template,
      channel: castToMessageChannel(template.channel),
    } as TemplateResponseDto;
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<TemplateResponseDto> {
    const existing = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Template not found');
    }

    // Check for name conflict if name is being updated
    if (updateTemplateDto.name && updateTemplateDto.name !== existing.name) {
      const nameConflict = await this.prisma.messageTemplate.findUnique({
        where: { name: updateTemplateDto.name },
      });

      if (nameConflict) {
        throw new ConflictException('Template with this name already exists');
      }
    }

    const template = await this.prisma.messageTemplate.update({
      where: { id },
      data: updateTemplateDto,
    });
    
    return {
      ...template,
      channel: castToMessageChannel(template.channel),
    } as TemplateResponseDto;
  }

  async remove(id: string): Promise<void> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.prisma.messageTemplate.delete({
      where: { id },
    });
  }

  async renderTemplate(templateId: string, variables: Record<string, string>): Promise<string> {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (!template.isActive) {
      throw new Error('Template is not active');
    }

    let renderedBody = template.body;

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      renderedBody = renderedBody.replace(regex, value);
    });

    return renderedBody;
  }
}
