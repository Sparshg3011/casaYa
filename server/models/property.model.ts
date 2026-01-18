// server/models/property.model.ts
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { sanitizePropertyData } from '../utils/sanitization';

type PropertyCreateData = {
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

// Define what landlord data is safe to expose
const safeLandlordSelect = {
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  profileImage: true,
  companyName: true,
  websiteUrl: true,
};

// Define what tenant data is safe to expose
const safeTenantSelect = {
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  verified: true,
  profileImage: true,
  backgroundCheckStatus: true,
} as const;

export async function createProperty(landlordId: string, data: PropertyCreateData) {
  // Sanitize input data
  const sanitizedData = sanitizePropertyData(data);

  // Validate required fields
  if (!sanitizedData.propertyType || !['House', 'Apartment', 'Condo', 'Villa'].includes(sanitizedData.propertyType)) {
    throw new Error('Invalid property type');
  }

  if (!sanitizedData.style || !['Detached', 'Bungalow', '2 Storey', '3+ Storey'].includes(sanitizedData.style)) {
    throw new Error('Invalid property style');
  }

  if (!sanitizedData.heatingAndAC || !['Heating Only', 'AC Only', 'Both', 'None'].includes(sanitizedData.heatingAndAC)) {
    throw new Error('Invalid heating and AC type');
  }

  if (!sanitizedData.laundryType || !['In-Unit', 'Shared', 'None'].includes(sanitizedData.laundryType)) {
    throw new Error('Invalid laundry type');
  }

  // Validate parking spaces if parking is available
  if (sanitizedData.hasParking && !sanitizedData.parkingSpaces) {
    throw new Error('Number of parking spaces is required when parking is available');
  }

  // Validate floor number for apartments and condos
  if (['Apartment', 'Condo'].includes(sanitizedData.propertyType)) {
    if (sanitizedData.floorNumber === undefined) {
      throw new Error('Floor number is required for apartments and condos');
    }
    if (!sanitizedData.unitNumber) {
      throw new Error('Unit number is required for apartments and condos');
    }
  }

  return prisma.property.create({
    data: {
      ...sanitizedData,
      landlord: {
        connect: { supabaseId: landlordId }
      }
    },
    include: {
      applications: {
        include: {
          tenant: {
            select: safeTenantSelect
          }
        }
      },
      landlord: {
        select: safeLandlordSelect
      }
    }
  });
}

type PropertyUpdateData = Partial<PropertyCreateData> & {
  isLeased?: boolean;
};

export async function updatePropertyById(propertyId: string, landlordId: string, data: PropertyUpdateData) {
  // First verify the property exists and belongs to the landlord
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      landlordId,
    },
  });

  if (!property) {
    throw new Error('Property not found or does not belong to landlord');
  }

  // Validate enum fields if they are being updated
  if (data.propertyType && !['House', 'Apartment', 'Condo', 'Villa'].includes(data.propertyType)) {
    throw new Error('Invalid property type');
  }

  if (data.style && !['Detached', 'Bungalow', '2 Storey', '3+ Storey'].includes(data.style)) {
    throw new Error('Invalid property style');
  }

  if (data.heatingAndAC && !['Heating Only', 'AC Only', 'Both', 'None'].includes(data.heatingAndAC)) {
    throw new Error('Invalid heating and AC type');
  }

  if (data.laundryType && !['In-Unit', 'Shared', 'None'].includes(data.laundryType)) {
    throw new Error('Invalid laundry type');
  }

  // Validate parking spaces if parking status is being updated
  if (data.hasParking !== undefined && data.hasParking && !data.parkingSpaces) {
    throw new Error('Number of parking spaces is required when parking is available');
  }

  // Validate floor number for apartments and condos
  if (data.propertyType && ['Apartment', 'Condo'].includes(data.propertyType) && 
      data.floorNumber === undefined) {
    throw new Error('Floor number is required for apartments and condos');
  }

  // Remove isLeased from regular updates to prevent accidental changes
  const { isLeased, ...updateFields } = data;

  // Remove any undefined values to avoid overwriting with null
  const updateData = Object.fromEntries(
    Object.entries({
      ...updateFields,
      price: updateFields.price !== undefined ? Number(updateFields.price) : undefined,
      bedrooms: updateFields.bedrooms !== undefined ? Number(updateFields.bedrooms) : undefined,
      bathrooms: updateFields.bathrooms !== undefined ? Number(updateFields.bathrooms) : undefined,
      totalSquareFeet: updateFields.totalSquareFeet !== undefined ? Number(updateFields.totalSquareFeet) : undefined,
      parkingSpaces: updateFields.parkingSpaces !== undefined ? Number(updateFields.parkingSpaces) : undefined,
    }).filter(([_, v]) => v !== undefined)
  );

  // Then update it
  return prisma.property.update({
    where: {
      id: propertyId,
      landlordId,
    },
    data: updateData,
  });
}

// Add a separate function for updating lease status
export async function updatePropertyLeaseStatus(propertyId: string, landlordId: string, isLeased: boolean) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      landlordId,
    },
  });

  if (!property) {
    throw new Error('Property not found or does not belong to landlord');
  }

  return prisma.property.update({
    where: {
      id: propertyId,
      landlordId,
    },
    data: {
      isLeased,
    },
  });
}

export async function deletePropertyById(propertyId: string, landlordId: string) {
  return prisma.property.delete({
    where: {
      id: propertyId,
      landlordId,
    },
  });
}

export async function findPropertyByIdAndLandlord(propertyId: string, landlordId: string) {
  return prisma.property.findFirst({
    where: {
      id: propertyId,
      landlordId,
    },
    include: {
      applications: {
        include: {
          tenant: {
            select: safeTenantSelect
          }
        }
      },
      landlord: {
        select: safeLandlordSelect
      }
    }
  });
}

export async function findAllProperties() {
  return prisma.property.findMany({
    include: {
      landlord: {
        select: safeLandlordSelect
      }
    }
  });
}

export async function findPropertiesByFilter(whereClause: Prisma.PropertyWhereInput) {
  return prisma.property.findMany({
    where: whereClause,
    include: {
      landlord: {
        select: safeLandlordSelect
      }
    }
  });
}

export async function createFavorite(tenantId: string, propertyId: string) {
  return prisma.favorite.create({
    data: {
      tenantId,
      propertyId,
    },
  });
}

export async function createApplication(tenantId: string, propertyId: string, data: {
  documents: {
    id: string;
    bankStatement: string;
    form410: string;
  };
  hasId?: boolean;
  hasBankStatement?: boolean;
  hasForm140?: boolean;
}) {
  // First get the property to get the landlordId
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { landlordId: true }
  });

  if (!property) {
    throw new Error('Property not found');
  }

  if (!property.landlordId) {
    throw new Error('Property has no associated landlord');
  }

  // Create the application with direct field assignments
  return prisma.$queryRaw`
    INSERT INTO "public"."Application" (
      "id",
      "tenantId",
      "propertyId",
      "landlordId",
      "status",
      "documents",
      "hasId",
      "hasBankStatement",
      "hasForm140",
      "createdAt",
      "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      ${tenantId},
      ${propertyId},
      ${property.landlordId},
      'Pending',
      ${JSON.stringify(data.documents)}::jsonb,
      ${data.hasId ?? true},
      ${data.hasBankStatement ?? true},
      ${data.hasForm140 ?? true},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING *;
  `;
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  return prisma.application.update({
    where: { id: applicationId },
    data: { status },
  });
}
