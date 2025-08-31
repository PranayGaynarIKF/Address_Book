import { PrismaClient } from '@prisma/client';
import { SourceSystem, RelationshipType, MessageChannel } from './common/types/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create owners
  const owners = await Promise.all([
    prisma.owner.upsert({
      where: { name: 'Zoho CRM' },
      update: {},
      create: { name: 'Zoho CRM', isActive: true },
    }),
    prisma.owner.upsert({
      where: { name: 'Gmail' },
      update: {},
      create: { name: 'Gmail', isActive: true },
    }),
    prisma.owner.upsert({
      where: { name: 'Invoice System' },
      update: {},
      create: { name: 'Invoice System', isActive: true },
    }),
    prisma.owner.upsert({
      where: { name: 'Ashish Contacts' },
      update: {},
      create: { name: 'Ashish Contacts', isActive: true },
    }),
  ]);

  console.log('Created owners:', owners.length);

  // Create sample contacts
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { id: 'sample_contact_001' },
      update: {},
      create: {
        name: 'Sample Contact 1',
        companyName: 'Sample Corp',
        email: 'sample1@example.com',
        mobileE164: '+919876543210',
        relationshipType: RelationshipType.CLIENT,
        sourceSystem: SourceSystem.ZOHO,
        sourceRecordId: 'sample_001',
        dataQualityScore: 85,
        isWhatsappReachable: true,
      },
    }),
    prisma.contact.upsert({
      where: { id: 'sample_contact_002' },
      update: {},
      create: {
        name: 'Sample Contact 2',
        companyName: 'Test Inc',
        email: 'sample2@test.com',
        mobileE164: '+919876543211',
        relationshipType: RelationshipType.VENDOR,
        sourceSystem: SourceSystem.GMAIL,
        sourceRecordId: 'sample_002',
        dataQualityScore: 75,
        isWhatsappReachable: false,
      },
    }),
  ]);

  console.log('Created contacts:', contacts.length);

  // Associate contacts with owners
  await Promise.all([
    prisma.contactOwner.upsert({
      where: {
        contactId_ownerId: {
          contactId: contacts[0].id,
          ownerId: owners[0].id,
        },
      },
      update: {},
      create: {
        contactId: contacts[0].id,
        ownerId: owners[0].id,
      },
    }),
    prisma.contactOwner.upsert({
      where: {
        contactId_ownerId: {
          contactId: contacts[1].id,
          ownerId: owners[1].id,
        },
      },
      update: {},
      create: {
        contactId: contacts[1].id,
        ownerId: owners[1].id,
      },
    }),
  ]);

  // Create message templates
  const templates = await Promise.all([
    prisma.messageTemplate.upsert({
      where: { name: 'Welcome Template' },
      update: {},
      create: {
        name: 'Welcome Template',
        channel: MessageChannel.WHATSAPP,
        body: 'Hello {{name}}! Welcome to {{company}}. We\'re excited to have you on board.',
        isActive: true,
      },
    }),
    prisma.messageTemplate.upsert({
      where: { name: 'Follow Up Template' },
      update: {},
      create: {
        name: 'Follow Up Template',
        channel: MessageChannel.EMAIL,
        body: 'Hi {{name}}, Just following up on our conversation. Looking forward to hearing from you!',
        isActive: true,
      },
    }),
  ]);

  console.log('Created templates:', templates.length);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
