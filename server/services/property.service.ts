import { prisma } from '../models/prisma';
import { Property, Prisma } from '@prisma/client';

interface FilterOptions {
  priceRange?: [number, number];
  location?: string;
  bedrooms?: number;
  type?: string;
  category?: string;
}

export async function getAllProperties() {
  return prisma.property.findMany({
    include: {
      landlord: {
        select: {
          supabaseId: true,
          email: true,
          verified: true,
          profileImage: true
        }
      }
    }
  });
}

export async function searchProperties(filters: FilterOptions) {
  const whereClause: any = {};

  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    whereClause.price = {
      gte: min,
      lte: max
    };
  }

  if (filters.location) {
    whereClause.address = {
      contains: filters.location,
      mode: 'insensitive'
    };
  }

  if (filters.bedrooms) {
    whereClause.bedrooms = filters.bedrooms;
  }

  if (filters.type) {
    whereClause.type = filters.type;
  }

  if (filters.category) {
    whereClause.category = filters.category;
  }

  return prisma.property.findMany({
    where: whereClause,
    include: {
      landlord: {
        select: {
          supabaseId: true,
          email: true,
          verified: true,
          profileImage: true
        }
      }
    }
  });
} 