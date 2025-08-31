import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import { RelationshipType, SourceSystem } from '../common/types/enums';

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    contact: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should normalize phone number "98765 43210" to "+919876543210"', async () => {
      const createDto = {
        name: 'Test Contact',
        companyName: 'Test Corp',
        email: 'test@example.com',
        mobileE164: '98765 43210',
        relationshipType: RelationshipType.CLIENT,
        sourceSystem: SourceSystem.ZOHO,
        sourceRecordId: 'test_001',
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(null);
      mockPrismaService.contact.create.mockResolvedValue({
        id: 'contact_001',
        ...createDto,
        mobileE164: '+919876543210',
        dataQualityScore: 85,
      });

      const result = await service.create(createDto);

      expect(result.mobileE164).toBe('+919876543210');
      expect(result.dataQualityScore).toBe(85);
    });

    it('should calculate correct data quality score', async () => {
      const createDto = {
        name: 'Test Contact',
        companyName: 'Test Corp',
        email: 'test@example.com',
        mobileE164: '+919876543210',
        relationshipType: RelationshipType.CLIENT,
        sourceSystem: SourceSystem.ZOHO,
        sourceRecordId: 'test_001',
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(null);
      mockPrismaService.contact.create.mockResolvedValue({
        id: 'contact_001',
        ...createDto,
        dataQualityScore: 100, // 40 (phone) + 20 (email) + 15 (company) + 15 (relationship) + 10 (trusted source)
      });

      const result = await service.create(createDto);

      expect(result.dataQualityScore).toBe(100);
    });

    it('should block contact with identical name and mobileE164', async () => {
      const createDto = {
        name: 'Test Contact',
        companyName: 'Test Corp',
        email: 'test@example.com',
        mobileE164: '+919876543210',
        relationshipType: RelationshipType.CLIENT,
        sourceSystem: SourceSystem.ZOHO,
        sourceRecordId: 'test_001',
      };

      mockPrismaService.contact.findFirst.mockResolvedValue({
        id: 'existing_contact',
        name: 'Test Contact',
        mobileE164: '+919876543210',
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should filter contacts by ownerName', async () => {
      const filters = {
        ownerName: 'Zoho CRM',
        page: 1,
        limit: 20,
      };

      const mockContacts = [
        {
          id: 'contact_001',
          name: 'Test Contact',
          owners: [{ owner: { name: 'Zoho CRM' } }],
        },
      ];

      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);
      mockPrismaService.contact.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter contacts by minScore', async () => {
      const filters = {
        minScore: 80,
        page: 1,
        limit: 20,
      };

      const mockContacts = [
        {
          id: 'contact_001',
          name: 'Test Contact',
          dataQualityScore: 85,
          owners: [],
        },
      ];

      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);
      mockPrismaService.contact.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(result.data).toHaveLength(1);
    });

    it('should filter contacts by whatsappReachable', async () => {
      const filters = {
        whatsappReachable: true,
        page: 1,
        limit: 20,
      };

      const mockContacts = [
        {
          id: 'contact_001',
          name: 'Test Contact',
          isWhatsappReachable: true,
          owners: [],
        },
      ];

      mockPrismaService.contact.findMany.mockResolvedValue(mockContacts);
      mockPrismaService.contact.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(result.data).toHaveLength(1);
    });
  });
});
