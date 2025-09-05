// API Response types
export interface LoginDto {
  email: string;
  password: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponseDto {
  access_token: string;
  token_type: string;
  user: UserResponseDto;
}

export interface CreateContactDto {
  name: string;
  companyName: string;
  email?: string;
  mobileE164?: string;
  relationshipType?: 'CLIENT' | 'VENDOR' | 'LEAD' | 'OTHER';
  sourceSystem: 'INVOICE' | 'GMAIL' | 'MOBILE';
  sourceRecordId: string;
}

export interface ContactResponseDto {
  id: string;
  name: string;
  companyName: string;
  email?: string;
  mobileE164?: string;
  relationshipType?: 'CLIENT' | 'VENDOR' | 'LEAD' | 'OTHER';
  isWhatsappReachable: boolean;
  dataQualityScore: number;
  sourceSystem: 'INVOICE' | 'GMAIL' | 'MOBILE';
  sourceRecordId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactsApiResponse {
  data: ContactResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateContactDto extends Partial<CreateContactDto> {}

export interface CreateOwnerDto {
  name: string;
  isActive?: boolean;
}

export interface OwnerResponseDto {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOwnerDto extends Partial<CreateOwnerDto> {}

export interface CreateTemplateDto {
  name: string;
  content: string;
  type: 'sms' | 'whatsapp' | 'email';
}

export interface TemplateResponseDto {
  id: string;
  name: string;
  content: string;
  type: 'sms' | 'whatsapp' | 'email';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTemplateDto extends Partial<CreateTemplateDto> {}

export interface PreviewMessageDto {
  templateId: string;
  variables: Record<string, string>;
}

export interface PreviewResponseDto {
  preview: string;
}

export interface SendMessageDto {
  contactId: string;
  templateId: string;
  variables?: Record<string, string>;
}

export interface MessageResponseDto {
  id: string;
  status: string;
  sentAt: string;
}

export interface WhatsAppWebhookDto {
  messageId: string;
  status: string;
  timestamp: string;
}
