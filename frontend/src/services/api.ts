import axios from 'axios';
import type {
  User,
  Invoice,
  InvoiceListResponse,
  InvoiceUpdate,
  AuditLogListResponse,
  AuthToken
} from '../types/invoice';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (email: string, username: string, password: string): Promise<User> => {
    const response = await api.post('/auth/register', { email, username, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthToken> => {
    const response = await api.post('/auth/login/json', { email, password });
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

// Invoice API
export const invoiceApi = {
  upload: async (file: File): Promise<Invoice> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/invoices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  list: async (params?: {
    status?: string;
    validation_status?: string;
    page?: number;
    page_size?: number;
  }): Promise<InvoiceListResponse> => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  get: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  update: async (id: string, data: InvoiceUpdate): Promise<Invoice> => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  approve: async (id: string): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason?: string): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/reject`, null, {
      params: { reason },
    });
    return response.data;
  },

  reextract: async (id: string): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/reextract`);
    return response.data;
  },
};

// Audit API
export const auditApi = {
  getInvoiceAudit: async (invoiceId: string): Promise<AuditLogListResponse> => {
    const response = await api.get(`/invoices/${invoiceId}/audit`);
    return response.data;
  },

  getAll: async (params?: {
    action?: string;
    user_email?: string;
    invoice_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogListResponse> => {
    const response = await api.get('/audit', { params });
    return response.data;
  },
};

// Export API
export const exportApi = {
  invoiceJson: (id: string, includeAudit = true): string => {
    const token = localStorage.getItem('token');
    return `${API_BASE}/invoices/${id}/export/json?include_audit=${includeAudit}&token=${token}`;
  },

  invoiceCsv: (id: string): string => {
    const token = localStorage.getItem('token');
    return `${API_BASE}/invoices/${id}/export/csv?token=${token}`;
  },

  downloadInvoiceJson: async (id: string, includeAudit = true): Promise<void> => {
    const response = await api.get(`/invoices/${id}/export/json`, {
      params: { include_audit: includeAudit },
    });
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  downloadInvoiceCsv: async (id: string): Promise<void> => {
    const response = await api.get(`/invoices/${id}/export/csv`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${id}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  batchJson: async (invoiceIds: string[]): Promise<void> => {
    const response = await api.post('/export/batch/json', invoiceIds);
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices_batch.json';
    a.click();
    window.URL.revokeObjectURL(url);
  },

  batchCsv: async (invoiceIds: string[]): Promise<void> => {
    const response = await api.post('/export/batch/csv', invoiceIds, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices_batch.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

export default api;
