import axios from 'axios';
import {
  LoginDto,
  LoginResponseDto,
  UserResponseDto,
  CreateContactDto,
  ContactResponseDto,
  ContactsApiResponse,
  UpdateContactDto,
  CreateOwnerDto,
  OwnerResponseDto,
  UpdateOwnerDto,
  CreateTemplateDto,
  TemplateResponseDto,
  UpdateTemplateDto,
  PreviewMessageDto,
  PreviewResponseDto,
  SendMessageDto,
  MessageResponseDto,
} from '../types';

// Configure axios base URL - change this to your backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'my-secret-api-key-123',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Always include API key for backend authentication
  config.headers['x-api-key'] = 'my-secret-api-key-123';
  return config;
});

// Auth API
export const authAPI = {
  login: (data: LoginDto) => {
    console.log('🌐 Making login request to:', `${API_BASE_URL}/auth/login`);
    console.log('📤 Request data:', { email: data.email, passwordLength: data.password.length });
    return api.post<LoginResponseDto>('/auth/login', data);
  },
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => 
    api.post<UserResponseDto>('/users/register', data),
  googleLogin: () => window.location.href = `${API_BASE_URL}/auth/google/login`,
  googleStatus: () => api.get('/auth/google/status'),
};

// Contacts API
export const contactsAPI = {
  create: (data: CreateContactDto) => api.post<ContactResponseDto>('/contacts', data),
  getAll: (filters?: { page?: number; limit?: number; sourceSystem?: string; q?: string }) => 
    api.get<ContactsApiResponse>('/contacts', { params: filters }),
  getById: (id: string) => api.get<ContactResponseDto>(`/contacts/${id}`),
  update: (id: string, data: UpdateContactDto) => api.patch<ContactResponseDto>(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

// Owners API
export const ownersAPI = {
  create: (data: CreateOwnerDto) => api.post<OwnerResponseDto>('/owners', data),
  getAll: () => api.get<OwnerResponseDto[]>('/owners'),
  getById: (id: string) => api.get<OwnerResponseDto>(`/owners/${id}`),
  update: (id: string, data: UpdateOwnerDto) => api.patch<OwnerResponseDto>(`/owners/${id}`, data),
  delete: (id: string) => api.delete(`/owners/${id}`),
  associateContact: (contactId: string, ownerId: string) => 
    api.post(`/owners/${contactId}/owners/${ownerId}`),
  removeAssociation: (contactId: string, ownerId: string) => 
    api.delete(`/owners/${contactId}/owners/${ownerId}`),
};

// Templates API
export const templatesAPI = {
  create: (data: CreateTemplateDto) => api.post<TemplateResponseDto>('/templates', data),
  getAll: () => api.get<TemplateResponseDto[]>('/templates'),
  getById: (id: string) => api.get<TemplateResponseDto>(`/templates/${id}`),
  update: (id: string, data: UpdateTemplateDto) => api.patch<TemplateResponseDto>(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
};

// Messages API
export const messagesAPI = {
  preview: (data: PreviewMessageDto) => api.post<PreviewResponseDto>('/messages/preview', data),
  send: (data: SendMessageDto) => api.post<MessageResponseDto>('/messages/send', data),
  getHistory: (contactId: string) => api.get(`/messages/history/${contactId}`),
};

// Ingestion API
export const ingestionAPI = {
  runZoho: () => api.post('/ingestion/zoho/run'),
  runGmail: () => api.post('/ingestion/gmail/run'),
  runInvoice: () => api.post('/ingestion/invoice/run'),
  runMobile: () => api.post('/ingestion/mobile/run'),
  cleanAndMerge: () => api.post('/ingestion/clean-and-merge'),
  getLatestImport: () => api.get('/ingestion/import-runs/latest'),
};

// Health API
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
