import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export interface TenantApplication {
  id: string;
  propertyId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  property: {
    id: string;
    address: string;
    price: number;
    photos: string[];
    bedrooms: number;
    bathrooms: number;
    landlord: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      rating?: number;
      responseTime?: string;
    };
  };
}

const tenantApi = {
  // Applications
  getApplications: () => 
    api.get<{ applications: TenantApplication[] }>('/api/tenant/applications'),

  getApplicationsByStatus: (status: 'Pending' | 'Approved' | 'Rejected') => 
    api.get<{ applications: TenantApplication[] }>('/api/tenant/applications', { 
      params: { status } 
    }),

  revokeApplication: (applicationId: string) => 
    api.delete(`/api/tenant/applications/${applicationId}`),

  // Documents
  uploadApplicationDocuments: (formData: FormData) => 
    api.post('/api/tenant/applications/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  updateApplicationDocuments: (applicationId: string, formData: FormData) => 
    api.put(`/api/tenant/applications/${applicationId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export default tenantApi; 