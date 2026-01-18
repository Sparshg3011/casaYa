import { sanitizeInput, validateEmail, validatePhone, validateUrl, validateNumber } from './security';
import type { PropertyCreateData } from '../types/property.types';
import type { UpdateLandlordProfilePayload } from '../types/landlord.types';

export function sanitizePropertyData(data: PropertyCreateData): PropertyCreateData {
  return {
    address: sanitizeInput(data.address),
    city: sanitizeInput(data.city),
    state: sanitizeInput(data.state),
    postalCode: sanitizeInput(data.postalCode),
    country: sanitizeInput(data.country),
    price: validateNumber(data.price, 0),
    propertyType: sanitizeInput(data.propertyType),
    style: sanitizeInput(data.style),
    floorNumber: data.floorNumber ? validateNumber(data.floorNumber, 0) : undefined,
    unitNumber: data.unitNumber ? sanitizeInput(data.unitNumber) : undefined,
    availableDate: new Date(data.availableDate),
    totalSquareFeet: data.totalSquareFeet ? validateNumber(data.totalSquareFeet, 0) : undefined,
    bedrooms: validateNumber(data.bedrooms, 0),
    bathrooms: validateNumber(data.bathrooms, 0),
    roomDetails: data.roomDetails ? JSON.parse(JSON.stringify(data.roomDetails)) : undefined,
    hasParking: Boolean(data.hasParking),
    parkingSpaces: data.parkingSpaces ? validateNumber(data.parkingSpaces, 0) : undefined,
    heatingAndAC: sanitizeInput(data.heatingAndAC),
    laundryType: sanitizeInput(data.laundryType),
    hasMicrowave: Boolean(data.hasMicrowave),
    hasRefrigerator: Boolean(data.hasRefrigerator),
    isPetFriendly: Boolean(data.isPetFriendly),
    hasBasement: data.hasBasement ? Boolean(data.hasBasement) : undefined,
    description: data.description ? sanitizeInput(data.description) : undefined,
    photos: data.photos ? JSON.parse(JSON.stringify(data.photos)) : undefined,
  };
}

export function sanitizeLandlordProfileData(data: UpdateLandlordProfilePayload) {
  return {
    ...(data.firstName && { firstName: sanitizeInput(data.firstName) }),
    ...(data.lastName && { lastName: sanitizeInput(data.lastName) }),
    ...(data.phone && { phone: validatePhone(data.phone) }),
    ...(data.linkedinUrl && { linkedinUrl: validateUrl(data.linkedinUrl) }),
    ...(data.facebookUrl && { facebookUrl: validateUrl(data.facebookUrl) }),
    ...(data.instagramUrl && { instagramUrl: validateUrl(data.instagramUrl) }),
    ...(data.websiteUrl && { websiteUrl: validateUrl(data.websiteUrl) }),
    ...(data.companyName && { companyName: sanitizeInput(data.companyName) }),
    ...(data.businessAddress && { businessAddress: sanitizeInput(data.businessAddress) }),
    ...(data.taxId && { taxId: sanitizeInput(data.taxId) }),
    ...(data.bio && { bio: sanitizeInput(data.bio) }),
    ...(data.yearsOfExperience && { yearsOfExperience: validateNumber(data.yearsOfExperience, 0, 100) }),
    updatedAt: new Date(),
  };
}

export function sanitizeLandlordBankData(data: {
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  accountName?: string;
  eTransferEmail?: string;
  eTransferPhone?: string;
  preferredPaymentMethod?: 'directDeposit' | 'eTransfer';
}) {
  return {
    ...(data.bankName && { bankName: sanitizeInput(data.bankName) }),
    ...(data.accountNumber && { accountNumber: sanitizeInput(data.accountNumber) }),
    ...(data.routingNumber && { routingNumber: sanitizeInput(data.routingNumber) }),
    ...(data.accountName && { accountName: sanitizeInput(data.accountName) }),
    ...(data.eTransferEmail && { eTransferEmail: validateEmail(data.eTransferEmail) }),
    ...(data.eTransferPhone && { eTransferPhone: validatePhone(data.eTransferPhone) }),
    ...(data.preferredPaymentMethod && { preferredPaymentMethod: data.preferredPaymentMethod }),
    updatedAt: new Date(),
  };
}

export function sanitizeApplicationData(data: {
  content: string;
}) {
  return {
    content: sanitizeInput(data.content),
  };
}

export function sanitizeSearchQuery(query: string) {
  return sanitizeInput(query).toLowerCase().trim();
}

export function sanitizeFilterParams(params: Record<string, any>) {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'number') {
      sanitized[key] = validateNumber(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : 
        typeof item === 'number' ? validateNumber(item) : 
        item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
} 