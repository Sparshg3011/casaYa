export * from './property.types';
export * from './landlord.types';

export interface UpdateLandlordProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  businessAddress?: string;
  bio?: string;
  yearsOfExperience?: number;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
} 