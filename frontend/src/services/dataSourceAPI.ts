import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002';

// API Key for authentication
const API_KEY = process.env.REACT_APP_API_KEY || 'my-secret-api-key-123';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

// Separate client for file uploads (without Content-Type header)
const fileUploadClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
  },
});

// Gmail Account Management
export const gmailAPI = {
  // Get all Gmail accounts
  getAccounts: async () => {
    const response = await apiClient.get('/gmail/accounts');
    return response.data;
  },

  // Add new Gmail account
  addAccount: async (data: { email: string; clientId: string; clientSecret: string }) => {
    const response = await apiClient.post('/gmail/accounts', data);
    return response.data;
  },

  // Update Gmail account
  updateAccount: async (id: string, data: Partial<{ email: string; clientId: string; clientSecret: string }>) => {
    const response = await apiClient.patch(`/gmail/accounts/${id}`, data);
    return response.data;
  },

  // Delete Gmail account
  deleteAccount: async (id: string) => {
    const response = await apiClient.delete(`/gmail/accounts/${id}`);
    return response.data;
  },

  // Sync contacts from Gmail
  syncContacts: async (accountId: string) => {
    const response = await apiClient.post(`/gmail/accounts/${accountId}/sync`);
    return response.data;
  },

  // Test Gmail connection
  testConnection: async (accountId: string) => {
    const response = await apiClient.post(`/gmail/accounts/${accountId}/test`);
    return response.data;
  },
};

// VCF File Management
export const vcfAPI = {
  // Get all VCF files
  getFiles: async () => {
    const response = await apiClient.get('/vcf/files');
    return response.data;
  },

  // Upload VCF file
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fileUploadClient.post('/vcf/upload', formData);
    return response.data;
  },

  // Process VCF file
  processFile: async (fileId: string) => {
    const response = await apiClient.post(`/vcf/files/${fileId}/process`);
    return response.data;
  },

  // Delete VCF file
  deleteFile: async (fileId: string) => {
    const response = await apiClient.delete(`/vcf/files/${fileId}`);
    return response.data;
  },

  // Get VCF file status
  getFileStatus: async (fileId: string) => {
    const response = await apiClient.get(`/vcf/files/${fileId}/status`);
    return response.data;
  },
};

// Invoice Database Management
export const invoiceAPI = {
  // Get all invoice databases
  getDatabases: async () => {
    const response = await apiClient.get('/invoice/databases');
    return response.data;
  },

  // Add new invoice database
  addDatabase: async (data: { 
    name: string; 
    server: string; 
    database: string; 
    username?: string; 
    password?: string; 
    useWindowsAuth: boolean;
  }) => {
    const response = await apiClient.post('/invoice/databases', data);
    return response.data;
  },

  // Update invoice database
  updateDatabase: async (id: string, data: Partial<{ 
    name: string; 
    server: string; 
    database: string; 
    username?: string; 
    password?: string; 
    useWindowsAuth: boolean;
  }>) => {
    const response = await apiClient.patch(`/invoice/databases/${id}`, data);
    return response.data;
  },

  // Delete invoice database
  deleteDatabase: async (id: string) => {
    const response = await apiClient.delete(`/invoice/databases/${id}`);
    return response.data;
  },

  // Sync contacts from invoice database
  syncContacts: async (dbId: string) => {
    const response = await apiClient.post(`/invoice/databases/${dbId}/sync`);
    return response.data;
  },

  // Test database connection
  testConnection: async (dbId: string) => {
    const response = await apiClient.post(`/invoice/databases/${dbId}/test`);
    return response.data;
  },
};

// Data Source Management (Unified API)
export const dataSourceAPI = {
  // Gmail Accounts
  getGmailAccounts: gmailAPI.getAccounts,
  addGmailAccount: gmailAPI.addAccount,
  updateGmailAccount: gmailAPI.updateAccount,
  deleteGmailAccount: gmailAPI.deleteAccount,
  syncGmailContacts: gmailAPI.syncContacts,
  testGmailConnection: gmailAPI.testConnection,

  // VCF Files
  getVcfFiles: vcfAPI.getFiles,
  uploadVcfFile: vcfAPI.uploadFile,
  processVcfFile: vcfAPI.processFile,
  deleteVcfFile: vcfAPI.deleteFile,
  getVcfFileStatus: vcfAPI.getFileStatus,

  // Invoice Databases
  getInvoiceDatabases: invoiceAPI.getDatabases,
  addInvoiceDatabase: invoiceAPI.addDatabase,
  updateInvoiceDatabase: invoiceAPI.updateDatabase,
  deleteInvoiceDatabase: invoiceAPI.deleteDatabase,
  syncInvoiceContacts: invoiceAPI.syncContacts,
  testInvoiceConnection: invoiceAPI.testConnection,

  // Data Ingestion
  runIngestion: async (sourceType: 'gmail' | 'vcf' | 'invoice', sourceId?: string) => {
    const response = await apiClient.post('/ingestion/run', { sourceType, sourceId });
    return response.data;
  },

  // Get ingestion status
  getIngestionStatus: async (runId: string) => {
    const response = await apiClient.get(`/ingestion/status/${runId}`);
    return response.data;
  },

  // Get all ingestion runs
  getIngestionRuns: async () => {
    const response = await apiClient.get('/ingestion/runs');
    return response.data;
  },

  // Clean and merge contacts
  cleanAndMergeContacts: async () => {
    const response = await apiClient.post('/ingestion/clean-and-merge');
    return response.data;
  },
};

// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('API Key authentication failed');
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      console.error('Access forbidden - check API permissions');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error occurred');
    }
    return Promise.reject(error);
  }
);

export default dataSourceAPI;
