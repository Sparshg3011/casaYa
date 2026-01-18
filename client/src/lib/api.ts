import axios from 'axios';
import type { TenantProfile } from '@/types/tenant';
import { supabase } from '@/lib/supabase';

interface AuthResponseData {
  token: string;
}

export interface UserData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  userType: 'tenant' | 'landlord';
  isOAuth?: boolean;
}

export interface PropertyData {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  price: number;
  propertyType: string;
  style: string;
  floorNumber?: number;
  unitNumber?: string;
  availableDate: string;
  totalSquareFeet?: number;
  bedrooms: number;
  bathrooms: number;
  roomDetails?: any;
  hasParking: boolean;
  parkingSpaces?: number;
  heatingAndAC: string;
  laundryType: string;
  hasMicrowave: boolean;
  hasRefrigerator: boolean;
  isPetFriendly: boolean;
  hasBasement?: boolean;
  description?: string;
  photos?: string[] | null;
  lat?: number;
  lng?: number;
}

export interface PropertyResponse {
  id: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  price: number;
  description?: string;
  photos?: any[];
  lat?: number;
  lng?: number;
  propertyType: string;
  style: string;
  floorNumber?: number;
  unitNumber?: string;
  availableDate: string;
  postedDate: string;
  totalSquareFeet?: number;
  bedrooms: number;
  bathrooms: number;
  roomDetails?: any;
  hasParking: boolean;
  parkingSpaces?: number;
  heatingAndAC: string;
  laundryType: string;
  hasMicrowave: boolean;
  hasRefrigerator: boolean;
  isPetFriendly: boolean;
  hasBasement?: boolean;
  numApplicants: number;
  isLeased: boolean;
  landlordId?: string;
  createdAt: string;
  updatedAt: string;
  applications?: Array<{
    id: string;
    status: string;
    createdAt: string;
    tenant: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

export interface LandlordProfile {
  type: 'landlord';
  landlordId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  verified: boolean;
  profileImage: string | null;
  socialLinks: {
    linkedin: string | null;
    facebook: string | null;
    instagram: string | null;
    website: string | null;
  };
  businessInfo: {
    companyName: string | null;
    businessAddress: string | null;
    taxId: string | null;
  };
  bankInfo: {
    bankName: string | null;
    accountNumber: string | null;
    routingNumber: string | null;
    accountName: string | null;
    eTransferEmail: string | null;
    eTransferPhone: string | null;
    preferredPaymentMethod: string | null;
  };
  profile: {
    bio: string | null;
    yearsOfExperience: number | null;
  };
  properties: PropertyResponse[];
}

export interface VerificationStatusResponse {
  plaidVerified: boolean;
  plaidVerifiedAt: string | null;
  identityVerified: boolean;
  identityVerifiedAt: string | null;
  bankAccountVerified: boolean;
  bankAccountVerifiedAt: string | null;
  verifiedIncome: number | null;
  incomeVerifiedAt: string | null;
  identity: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  bankAccount: {
    bankName: string | null;
    accountType: string | null;
    balance: number | null;
    accountMask: string | null;
    ownerName: string | null;
    routingNumber: string | null;
    accountNumberMask: string | null;
  } | null;
  plaidInfo: {
    itemId: string | null;
    institutionId: string | null;
    institutionName: string | null;
  };
  allBankAccounts: any[];
}

export interface PlaidInitResponse {
  linkToken: string;
}

export interface UploadDocumentsResponse {
  documents: {
    id: string;
    bankStatement: string;
    form410: string;
  };
}

// Get the API URL based on environment
const getApiUrl = () => {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_API_URL || '';
  
  return window.location.hostname === 'localhost' 
    ? 'http://localhost:4000'
    : 'https://rentcasaya-server.vercel.app';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token and Supabase ID
api.interceptors.request.use((config) => {
  // Ensure headers object exists
  config.headers = config.headers || {};

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Get Supabase ID from local storage instead of session
  const supabaseAuth = localStorage.getItem('sb-manyzxfbauebqzjmfkti-auth-token');
  if (supabaseAuth) {
    try {
      const { user } = JSON.parse(supabaseAuth);
      if (user?.id) {
        config.headers['x-supabase-id'] = user.id;
      }
    } catch (error) {
      console.error('Error parsing Supabase auth:', error);
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Create a separate instance for public endpoints
const publicApi = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Auth endpoints
const auth = {
  tenantLogin: (email: string, password: string) => 
    publicApi.post<AuthResponseData>('/api/tenant/login', { email, password }),
  tenantSignup: (userData: UserData) => {
    const accessToken = localStorage.getItem('sb-manyzxfbauebqzjmfkti-auth-token');
    const token = accessToken ? JSON.parse(accessToken).access_token : null;
    
    // Ensure userType and isOAuth are included
    const signupData = {
      ...userData,
      userType: 'tenant',
      isOAuth: !userData.password
    };
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return publicApi.post<AuthResponseData>('/api/tenant/signup', signupData, { headers });
  },
  landlordLogin: (email: string, password: string) => 
    publicApi.post<AuthResponseData>('/api/landlord/login', { email, password }),
  landlordSignup: (userData: UserData) => {
    const accessToken = localStorage.getItem('sb-manyzxfbauebqzjmfkti-auth-token');
    const token = accessToken ? JSON.parse(accessToken).access_token : null;
    
    // Ensure userType and isOAuth are included
    const signupData = {
      ...userData,
      userType: 'landlord',
      isOAuth: !userData.password
    };
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return publicApi.post<AuthResponseData>('/api/landlord/signup', signupData, { headers });
  },
  logout: () => {
    const userMode = localStorage.getItem('userMode');
    return api.post(`/api/${userMode}/auth/logout`);
  },
  forgotPassword: (email: string, userType: 'tenant' | 'landlord') => 
    publicApi.post(`/api/${userType}/forgot-password`, { email }),
};

// Tenant endpoints
const tenants = {
  // Profile
  getProfile: () => 
    api.get('/api/tenant/profile'),
  updateProfile: (data: any) => 
    api.put('/api/tenant/profile', data),
  updatePaymentInfo: (data: any) => 
    api.put('/api/tenant/payment-info', data),
  uploadProfileImage: (formData: FormData) => 
    api.post('/api/tenant/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteProfileImage: () => 
    api.delete('/api/tenant/profile-image'),

  // Notes
  getNotes: () => 
    api.get('/api/tenant/notes'),
  addNote: (content: string) => 
    api.post('/api/tenant/notes', { content }),
  updateNote: (noteId: string, content: string) => 
    api.put(`/api/tenant/notes/${noteId}`, { content }),
  deleteNote: (noteId: string) => 
    api.delete(`/api/tenant/notes/${noteId}`),

  // Properties
  getAllProperties: () => 
    api.get<PropertyResponse[]>('/api/tenant/properties'),
  getProperty: (id: string) => {
    if (!id) {
      return Promise.reject(new Error('Property ID is required'));
    }
    return api.get<PropertyResponse>(`/api/tenant/properties/${id}`);
  },
  searchProperties: (preferences: any) => 
    api.post('/api/tenant/properties/search', { preferences }),
  filterProperties: (filters: any) => 
    api.get('/api/tenant/properties/filter', { params: filters }),

  // Applications
  applyToProperty: (propertyId: string, documents: any) => 
    api.post('/api/tenant/applications', { propertyId, documents }),
  uploadApplicationDocuments: (formData: FormData) => 
    api.post<UploadDocumentsResponse>('/api/tenant/applications/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updateApplicationDocuments: (applicationId: string, formData: FormData) => 
    api.put(`/api/tenant/applications/${applicationId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  revokeApplication: (applicationId: string) => 
    api.delete(`/api/tenant/applications/${applicationId}`),
  getApplications: () => 
    api.get('/api/tenant/applications'),
  getApplication: (applicationId: string) => 
    api.get(`/api/tenant/applications/${applicationId}`),
  addApplicationNote: (applicationId: string, content: string) => 
    api.post(`/api/tenant/applications/${applicationId}/notes`, { content }),
  getApplicationNotes: (applicationId: string) => 
    api.get(`/api/tenant/applications/${applicationId}/notes`),
  getApplicationsByStatus: (status: 'Pending' | 'Approved' | 'Rejected') => 
    api.get('/api/tenant/applications', { params: { status } }),
  revokeManyApplications: (applicationIds: string[]) => 
    api.post('/api/tenant/applications/revoke-many', { applicationIds }),
  checkApplicationExists: (propertyId: string) =>
    api.get<{ hasApplied: boolean; application: any | null }>(`/api/tenant/applications/check/${propertyId}`),

  // Verification
  initiatePlaidVerification: () => 
    api.post<PlaidInitResponse>('/api/tenant/verify/plaid/init'),
  completePlaidVerification: (publicToken: string) => 
    api.post('/api/tenant/verify/plaid/complete', { public_token: publicToken }),
  getVerificationStatus: () => 
    api.get<VerificationStatusResponse>('/api/tenant/verify/status'),
  createSandboxToken: () => 
    api.post('/api/tenant/verify/plaid/sandbox-token'),

  // Favorites
  addToFavorites: (propertyId: string) => 
    api.post('/api/tenant/favorites', { propertyId }),
  removeFromFavorites: (propertyId: string) => 
    api.delete(`/api/tenant/favorites/${propertyId}`),
  getFavorites: () => 
    api.get<{
      favorites: Array<{
        id: string;
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
          };
        };
      }>;
    }>('/api/tenant/favorites'),

  // New method
  async createApplication(propertyId: string) {
    const response = await api.post<{ id: string }>(
      `/tenant/applications`,
      { propertyId }
    );
    return response.data;
  },
  getApplicationStatus: (propertyId: string) => 
    api.get<{ hasApplied: boolean; application?: any }>(`/tenant/applications/${propertyId}/status`),
};

// Landlord endpoints
const landlords = {
  // Profile
  getProfile: () => 
    api.get<LandlordProfile>('/api/landlord/profile'),
  updateProfile: (data: any) => 
    api.put('/api/landlord/profile', data),
  updateBankInfo: (data: {
    bankName?: string | null;
    accountNumber?: string | null;
    routingNumber?: string | null;
    accountName?: string | null;
    eTransferEmail?: string | null;
    eTransferPhone?: string | null;
    preferredPaymentMethod?: string | null;
  }) => 
    api.put('/api/landlord/bank-info', data),
  uploadProfileImage: (formData: FormData) => 
    api.post('/api/landlord/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteProfileImage: () => 
    api.delete('/api/landlord/profile-image'),

  // Properties
  addProperty: (propertyData: PropertyData) => 
    api.post<PropertyResponse>('/api/landlord/properties', propertyData),
  updateProperty: (propertyId: string, propertyData: Partial<PropertyData>) => 
    api.put<PropertyResponse>(`/api/landlord/properties/${propertyId}`, propertyData),
  deleteProperty: (propertyId: string) => 
    api.delete(`/api/landlord/properties/${propertyId}`),
  getProperties: () => 
    api.get('/api/landlord/properties'),
  uploadPropertyPhotos: (propertyId: string, formData: FormData) => 
    api.post(`/api/landlord/properties/${propertyId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deletePropertyPhoto: (propertyId: string, photoUrl: string) => 
    api.delete(`/api/landlord/properties/${propertyId}/photos`, { 
      params: { photoUrl } 
    }),
  
  // Applications
  getPropertyApplications: (propertyId: string, status?: 'Pending' | 'Approved' | 'Rejected') => 
    api.get(`/api/landlord/properties/${propertyId}/applications`, { params: { status } }),
  updateApplicationStatus: (propertyId: string, applicationId: string, status: 'Approved' | 'Rejected') => 
    api.put(`/api/landlord/properties/${propertyId}/applications/${applicationId}/status`, { status }),
  getApplicationDocuments: (applicationId: string) => 
    api.get(`/api/landlord/applications/${applicationId}/documents`),
  addApplicationNote: (applicationId: string, content: string) => 
    api.post(`/api/landlord/applications/${applicationId}/notes`, { content }),
  getApplicationNotes: (applicationId: string) => 
    api.get(`/api/landlord/applications/${applicationId}/notes`),

  // Reviews
  addTenantReview: (tenantId: string, data: { rating: number; content: string; isPublic: boolean }) => 
    api.post(`/api/landlord/tenants/${tenantId}/reviews`, data),
  getTenantReviews: (tenantId: string) => 
    api.get(`/api/landlord/tenants/${tenantId}/reviews`),
};

// Scoring endpoints
const scoring = {
  calculateScore: (propertyId: string) => 
    api.post('/api/scoring/calculate-score', { propertyId }),
  checkCreditScore: () => 
    api.post('/api/scoring/check-credit-score'),
  checkCompatibility: (tenantId: string, propertyId: string) => 
    api.post('/api/scoring/check-compatibility', { tenantId, propertyId }),
};

// Property endpoints (general)
const properties = {
  getAll: () => api.get('/api/properties'),
  search: (filters: any) => api.get('/api/properties/search', { params: filters }),
  getProperty: (id: string) => {
    if (!id) {
      return Promise.reject(new Error('Property ID is required'));
    }
    const userMode = localStorage.getItem('userMode');
    if (userMode === 'landlord') {
      return api.get<PropertyResponse>(`/api/landlord/properties/${id}`);
    } else {
      return api.get<PropertyResponse>(`/api/tenant/properties/${id}`);
    }
  },
  getPublicProperty: (id: string) => api.get<PropertyResponse>(`/api/properties/${id}/public`),
  updateProperty: (id: string, data: Partial<PropertyResponse>) => api.put(`/api/properties/${id}`, data),
  deleteProperty: (id: string) => api.delete(`/api/properties/${id}`),
  getApplications: (id: string) => {
    if (!id) {
      return Promise.reject(new Error('Property ID is required'));
    }
    const userMode = localStorage.getItem('userMode');
    if (userMode === 'landlord') {
      return api.get(`/api/landlord/properties/${id}/applications`);
    } else {
      return api.get(`/api/tenant/properties/${id}/applications`);
    }
  },
  updateApplicationStatus: (propertyId: string, applicationId: string, data: { status: string }) => 
    api.put(`/api/properties/${propertyId}/applications/${applicationId}/status`, data),
};

// Profile endpoints
const profiles = {
  // Tenant profiles
  updateTenantProfile: (data: any) => 
    api.put('/api/profile/tenant', data),
  getTenantProfile: () => 
    api.get<TenantProfile>('/api/profile/tenant'),
  uploadProfileImage: (formData: FormData) =>
    api.post<{ url: string }>('/api/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  // Landlord profiles
  updateLandlordProfile: (data: any) => 
    api.put('/api/profile/landlord', data),
  getLandlordProfile: () => 
    api.get<LandlordProfile>('/api/profile/landlord'),
};

// Export the API object with all endpoints
export default {
  auth,
  tenants,
  landlord: landlords,
  scoring,
  properties,
  profiles,
}; 