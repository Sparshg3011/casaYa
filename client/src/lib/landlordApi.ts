import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

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
  const supabaseId = localStorage.getItem('supabaseId');
  config.headers = config.headers || {};
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (supabaseId) {
    config.headers['x-supabase-id'] = supabaseId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Create Supabase client with auth
const getSupabaseClient = () => {
  const token = localStorage.getItem('token');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      }
    }
  );
};

interface LandlordSignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface LandlordLoginData {
  email: string;
  password: string;
}

interface LandlordProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface LandlordBankInfoData {
  accountNumber: string;
  routingNumber: string;
  bankName: string;
}

interface PropertyData {
  address: string;
  description: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  amenities: string[];
  availableDate: string;
  leaseLength: number;
  petPolicy: string;
  parkingDetails: string;
  utilityDetails: string;
}

export interface Application {
  id: string;
  propertyId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    backgroundCheckStatus: string;
    plaidVerified: boolean;
    identityVerified: boolean;
    bankAccountVerified: boolean;
    verifiedIncome: number;
  };
}

export interface GetPropertyApplicationsResponse {
  applications: Application[];
}

export interface Property {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms?: number;
  description?: string;
  photos?: string[];
  isLeased: boolean;
  createdAt: string;
  updatedAt: string;
  applications: {
    id: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    tenant: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      backgroundCheckStatus: string;
    };
  }[];
}

export interface GetLandlordPropertiesResponse {
  properties: Property[];
}

export interface ApplicationDocumentStatus {
  id: {
    exists: boolean;
    url: string | null;
  };
  bankStatement: {
    exists: boolean;
    url: string | null;
  };
  form410: {
    exists: boolean;
    url: string | null;
  };
}

const landlordApi = {
  // Auth
  signup: (data: LandlordSignupData) => api.post('/api/landlord/signup', data),
  login: (data: LandlordLoginData) => api.post('/api/landlord/login', data),
  
  // Profile
  getProfile: () => api.get('/api/landlord/profile'),
  updateProfile: (data: LandlordProfileData) => api.put('/api/landlord/profile', data),
  updateBankInfo: (data: LandlordBankInfoData) => api.put('/api/landlord/bank-info', data),
  uploadProfileImage: (formData: FormData) => api.post('/api/landlord/profile-image', formData),
  deleteProfileImage: () => api.delete('/api/landlord/profile-image'),
  
  // Properties
  addProperty: (data: PropertyData) => api.post('/api/landlord/properties', data),
  updateProperty: (propertyId: string, data: PropertyData) => api.put(`/api/landlord/properties/${propertyId}`, data),
  deleteProperty: (propertyId: string) => api.delete(`/api/landlord/properties/${propertyId}`),
  getLandlordProperties: () => api.get<GetLandlordPropertiesResponse>('/api/landlord/properties'),
  getLandlordProperty: (propertyId: string) => api.get(`/api/landlord/properties/${propertyId}`),
  uploadPropertyPhotos: (propertyId: string, formData: FormData) => api.post(`/api/landlord/properties/${propertyId}/photos`, formData),
  
  // Applications
  getPropertyApplications: (propertyId: string, status?: string) => api.get<GetPropertyApplicationsResponse>(`/api/landlord/properties/${propertyId}/applications${status ? `?status=${status}` : ''}`),
  updateApplicationStatus: (propertyId: string, applicationId: string, status: string) => api.put(`/api/landlord/properties/${propertyId}/applications/${applicationId}/status`, { status }),
  
  // Lease
  updatePropertyLeaseStatus: (propertyId: string, isLeased: boolean) => api.put(`/api/landlord/properties/${propertyId}/lease-status`, { isLeased }),

  getApplicationDocuments: async (applicationId: string) => {
    try {
      const response = await api.get<{ data: ApplicationDocumentStatus }>(
        `/api/landlord/applications/${applicationId}/documents`
      );
      return response.data;
    } catch (error) {
      return {
        data: {
          id: {
            exists: false,
            url: null
          },
          bankStatement: {
            exists: false,
            url: null
          },
          form410: {
            exists: false,
            url: null
          }
        }
      };
    }
  },

  downloadDocument: async (applicationId: string, documentType: 'id' | 'bankStatement' | 'form410', view = false) => {
    try {
      const response = await api.get(
        `/api/landlord/applications/${applicationId}/documents/${documentType}${view ? '?view=true' : ''}`,
        { responseType: 'blob' }
      );
      return { data: response.data };
    } catch (error) {
      throw error;
    }
  },

  viewDocument: async (applicationId: string, documentType: 'id' | 'bankStatement' | 'form410') => {
    return landlordApi.downloadDocument(applicationId, documentType, true);
  },
};

export default landlordApi; 