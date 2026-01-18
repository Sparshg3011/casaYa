// server/models/tenant.model.ts
import { prisma } from './prisma';

export async function findTenantBySupabaseId(supabaseId: string) {
  return prisma.tenant.findUnique({
    where: { supabaseId }
  });
}

export async function createTenant(
  supabaseId: string,
  firstName: string,
  lastName: string,
  email: string,
  verified = false
) {
  return prisma.tenant.create({
    data: {
      supabaseId,
      firstName,
      lastName,
      email,
      verified,
      // Set default values for required fields
      phone: null,
      linkedinUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      occupation: null,
      income: null,
      preferredMoveInDate: null,
      bio: null,
      creditCardLast4: null,
      creditCardBrand: null,
      creditCardExpiry: null,
    },
  });
}

export async function updateTenantProfileImage(supabaseId: string, url: string) {
  return prisma.tenant.update({
    where: { supabaseId },
    data: {
      profileImage: url,
    },
  });
}

export async function updateTenantBackgroundCheck(supabaseId: string, status: string) {
  return prisma.tenant.update({
    where: { supabaseId },
    data: {
      backgroundCheckStatus: status,
    },
  });
}

export async function countApplications(supabaseId: string, status: string) {
  return prisma.application.count({
    where: { 
      tenantId: supabaseId,
      status 
    },
  });
}