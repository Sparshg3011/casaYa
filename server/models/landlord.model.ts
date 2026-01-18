// server/models/landlord.model.ts
import { prisma } from './prisma';
import type { AddPropertyPayload, UpdatePropertyPayload } from '../types/property.types';

export async function createLandlord(
  supabaseId: string,
  firstName: string,
  lastName: string,
  email: string,
  verified = false
) {
  return prisma.landlord.create({
    data: {
      supabaseId,
      firstName,
      lastName,
      email,
      verified,
      // Set default values
      phone: null,
      linkedinUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      companyName: null,
      businessAddress: null,
      taxId: null,
      bankName: null,
      accountNumber: null,
      routingNumber: null,
      bio: null,
      yearsOfExperience: null,
    },
  });
}

export async function findLandlordBySupabaseId(supabaseId: string) {
  return prisma.landlord.findUnique({
    where: { supabaseId },
    include: {
      properties: {
        include: {
          applications: {
            include: {
              tenant: true
            }
          }
        }
      }
    }
  });
}

export async function updateLandlordProfileImage(supabaseId: string, url: string) {
  return prisma.landlord.update({
    where: { supabaseId },
    data: {
      profileImage: url,
    },
  });
}

export async function countApplications(supabaseId: string, status: string) {
  return prisma.application.count({
    where: { 
      property: {
        landlordId: supabaseId
      },
      status 
    },
  });
}

export async function updatePropertyById(
  propertyId: string,
  landlordId: string,
  data: UpdatePropertyPayload
) {
  // First verify the property belongs to this landlord
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      landlordId
    }
  });

  if (!property) throw new Error('Property not found or not owned by this landlord');

  return prisma.property.update({
    where: { id: propertyId },
    data
  });
}

export async function deletePropertyById(propertyId: string, landlordId: string) {
  // First verify the property belongs to this landlord
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      landlordId
    }
  });

  if (!property) throw new Error('Property not found or not owned by this landlord');

  return prisma.property.delete({
    where: { id: propertyId }
  });
}

export async function findPropertiesByLandlordId(landlordId: string) {
  return prisma.property.findMany({
    where: { landlordId },
    include: {
      applications: {
        include: {
          tenant: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              backgroundCheckStatus: true
            }
          }
        }
      }
    }
  });
}

export async function findPropertyByIdAndLandlord(propertyId: string, landlordId: string) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      landlordId
    },
    include: {
      applications: {
        include: {
          tenant: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              backgroundCheckStatus: true
            }
          }
        }
      }
    }
  });

  if (!property) throw new Error('Property not found or not owned by this landlord');
  return property;
}
