import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4002';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface MergeHistoryFilters {
  page?: number;
  limit?: number;
  mergeType?: string;
  sourceSystem?: string;
  startDate?: Date;
  endDate?: Date;
}

export const mergeHistoryAPI = {
  // Get merge history with filters
  getMergeHistory: async (filters: MergeHistoryFilters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.mergeType) params.append('mergeType', filters.mergeType);
    if (filters.sourceSystem) params.append('sourceSystem', filters.sourceSystem);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

    const response = await api.get(`/merge-history?${params.toString()}`);
    return response.data;
  },

  // Get merge history for a specific contact
  getMergeHistoryForContact: async (contactId: string) => {
    const response = await api.get(`/merge-history/contact/${contactId}`);
    return response.data;
  },

  // Get merge statistics
  getStatistics: async () => {
    const response = await api.get('/merge-history/statistics');
    return response.data;
  },
};
