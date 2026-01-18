import { Prisma } from '@prisma/client';

export type PropertyCreateData = {
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
  availableDate: Date;
  totalSquareFeet?: number;
  bedrooms: number;
  bathrooms: number;
  roomDetails?: Prisma.InputJsonValue;
  hasParking: boolean;
  parkingSpaces?: number;
  heatingAndAC: string;
  laundryType: string;
  hasMicrowave: boolean;
  hasRefrigerator: boolean;
  isPetFriendly: boolean;
  hasBasement?: boolean;
  description?: string;
  photos?: Prisma.InputJsonValue;
};

export type AddPropertyPayload = PropertyCreateData;

export interface UpdatePropertyPayload {
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  price?: number;
  propertyType?: string;
  style?: string;
  floorNumber?: number;
  unitNumber?: string;
  availableDate?: Date;
  totalSquareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  roomDetails?: any;
  hasParking?: boolean;
  parkingSpaces?: number;
  heatingAndAC?: string;
  laundryType?: string;
  hasMicrowave?: boolean;
  hasRefrigerator?: boolean;
  isPetFriendly?: boolean;
  hasBasement?: boolean;
  description?: string;
  photos?: any;
  lat?: number;
  lng?: number;
} 