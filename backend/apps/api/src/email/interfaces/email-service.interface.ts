export interface EmailMessage {
  id: string;
  subject: string;
  sender: string;
  recipients: string[];
  body: string;
  htmlBody?: string;
  attachments?: EmailAttachment[];
  receivedAt: Date;
  threadId?: string;
  labels?: string[];
  isRead: boolean;
  isStarred: boolean;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data?: Buffer;
  url?: string;
}

export interface EmailAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface EmailAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string; // Changed from string[] to string (JSON string) for consistency
  userId?: string;
  email?: string;
}

// Database-specific interfaces
export interface EmailServiceConfig {
  id?: string;
  userId: string;
  serviceType: EmailServiceType;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[]; // Keep as array for input
  isActive: boolean;
  accountName?: string; // Add support for multiple accounts
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailAuthToken {
  id?: string;
  userId: string;
  serviceType: EmailServiceType;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string; // Changed from string[] to string (JSON string) to match database
  email: string;
  isValid: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EmailServiceType = 
  | 'GMAIL' 
  | 'OUTLOOK' 
  | 'YAHOO' 
  | 'ZOHO' 
  | 'EXCHANGE' 
  | 'THUNDERBIRD' 
  | 'APPLE_MAIL' 
  | 'PROTONMAIL';

export interface IEmailService {
  readonly serviceType: EmailServiceType;
  
  // Authentication
  getAuthUrl(clientId: string, clientSecret: string, redirectUri: string): string;
  authenticate(code: string): Promise<EmailAuthResult>;
  refreshToken(refreshToken: string): Promise<EmailAuthResult>;
  revokeToken(accessToken: string): Promise<void>;
  
  // Email Operations
  getMessages(options?: EmailFetchOptions): Promise<EmailMessage[]>;
  getMessage(messageId: string): Promise<EmailMessage>;
  sendMessage(message: EmailSendRequest): Promise<string>;
  deleteMessage(messageId: string): Promise<void>;
  markAsRead(messageId: string, read: boolean): Promise<void>;
  addLabel(messageId: string, label: string): Promise<void>;
  removeLabel(messageId: string, label: string): Promise<void>;
  
  // Folder/Label Management
  getFolders(): Promise<EmailFolder[]>;
  getLabels(): Promise<EmailLabel[]>;
  
  // Health Check
  isHealthy(): Promise<boolean>;
}

export interface EmailFetchOptions {
  maxResults?: number;
  query?: string;
  labelIds?: string[];
  includeSpamTrash?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface EmailSendRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export interface EmailFolder {
  id: string;
  name: string;
  type: 'INBOX' | 'SENT' | 'DRAFT' | 'TRASH' | 'SPAM' | 'CUSTOM';
  messageCount: number;
  unreadCount: number;
}

export interface EmailLabel {
  id: string;
  name: string;
  color?: string;
  messageCount: number;
  unreadCount: number;
}
