export enum SourceSystem {
  INVOICE = 'INVOICE',
  GMAIL = 'GMAIL',
  OUTLOOK = 'OUTLOOK',
  YAHOO = 'YAHOO',
  ZOHO = 'ZOHO',
  ASHISH = 'ASHISH',
  MOBILE = 'MOBILE'
}

export enum RelationshipType {
  CLIENT = 'CLIENT',
  VENDOR = 'VENDOR',
  LEAD = 'LEAD',
  OTHER = 'OTHER'
}

export enum MessageChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL'
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

// Array constants for validation
export const RELATIONSHIP_TYPES: RelationshipType[] = [RelationshipType.CLIENT, RelationshipType.VENDOR, RelationshipType.LEAD, RelationshipType.OTHER];
export const SOURCE_SYSTEMS: SourceSystem[] = [SourceSystem.INVOICE, SourceSystem.GMAIL, SourceSystem.OUTLOOK, SourceSystem.YAHOO, SourceSystem.ZOHO, SourceSystem.ASHISH, SourceSystem.MOBILE];
export const MESSAGE_CHANNELS: MessageChannel[] = [MessageChannel.WHATSAPP, MessageChannel.EMAIL];
export const MESSAGE_STATUSES: MessageStatus[] = [MessageStatus.PENDING, MessageStatus.SENT, MessageStatus.DELIVERED, MessageStatus.READ, MessageStatus.FAILED];

// Helper functions to safely cast string values to enum types
export function castToRelationshipType(value: string | null): RelationshipType | null {
  if (!value) return null;
  return value as RelationshipType;
}

export function castToSourceSystem(value: string): SourceSystem {
  return value as SourceSystem;
}

export function castToMessageChannel(value: string): MessageChannel {
  return value as MessageChannel;
}

export function castToMessageStatus(value: string): MessageStatus {
  return value as MessageStatus;
}
