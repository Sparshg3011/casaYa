// server/services/tenant.service.ts
import { supabase } from '../lib/supabase';
import { prisma } from '../models/prisma';
import {
  findTenantBySupabaseId,
  createTenant,
  countApplications,
} from '../models/tenant.model';
import {
  createFavorite,
  createApplication,
  findAllProperties,
  findPropertiesByFilter,
} from '../models/property.model';
import { Prisma, Property } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import type { Multer } from 'multer';
import {
  verifyTenantIncome,
  verifyTenantIdentity,
  verifyTenantBankAccount,
  createPlaidLinkToken,
  exchangePublicToken,
  createSandboxPublicToken as createPlaidSandboxToken,
} from './plaid.service';
import { Tenant } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { validateEmail, validatePassword, validatePhone, validateUrl, sanitizeInput } from '../utils/security';
import { ensureStorageBuckets } from '../lib/supabase';

// ---------- 1. AUTH ----------

interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;  // Make password optional
  isOAuth?: boolean;  // Add isOAuth flag
}

interface LoginPayload {
  email: string;
  password: string;
}

export async function signupTenant({ firstName, lastName, email, password, isOAuth }: SignupPayload, accessToken?: string) {
  console.log('Starting tenant signup with data:', { 
    firstName, 
    lastName, 
    email, 
    hasPassword: !!password, 
    isOAuth,
    hasAccessToken: !!accessToken
  });
  
  try {
    // Validate input
    validateEmail(email);
    
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedLastName = sanitizeInput(lastName);

    let userData;
    
    try {
      if (!isOAuth && password) {
        console.log('Performing regular email/password signup');
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              firstName: sanitizedFirstName,
              lastName: sanitizedLastName
            }
          }
        });
        if (error) {
          console.error('Supabase signUp error:', error);
          throw error;
        }
        if (!data.user) {
          console.error('No user returned from Supabase signUp');
          throw new Error('No user returned from Supabase');
        }
        userData = data.user;
      } else {
        console.log('Performing OAuth signup, using provided access token');
        if (!accessToken) {
          console.error('No access token provided for OAuth signup');
          throw new Error('Access token is required for OAuth signup');
        }

        // Get user data using the provided access token
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
        if (userError) {
          console.error('Error getting user with token:', userError);
          throw userError;
        }
        if (!user) {
          console.error('No user found with provided token');
          throw new Error('No authenticated user found');
        }
        userData = user;
        console.log('Found OAuth user:', { 
          id: user.id, 
          email: user.email,
          metadata: user.user_metadata 
        });
      }

      // Check if tenant already exists
      const existingTenant = await findTenantBySupabaseId(userData.id);
      if (existingTenant) {
        console.log('Tenant already exists:', existingTenant);
        return existingTenant;
      }

      // Create new tenant
      console.log('Creating new tenant record for user:', userData.id);
      const tenant = await createTenant(userData.id, sanitizedFirstName, sanitizedLastName, email, false);
      console.log('Tenant created successfully:', tenant);
      return tenant;
    } catch (error: any) {
      console.error('Error in Supabase auth flow:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Error in signupTenant:', error);
    throw error;
  }
}

export async function loginTenant({ email, password }: LoginPayload) {
  // Validate input
  validateEmail(email);

  // Sign in with Supabase (let Supabase handle password verification)
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password
  });
  if (error) throw new Error('Invalid credentials');
  if (!data.session?.access_token) throw new Error('No access token returned from Supabase');

  // Verify user exists in tenant table
  const tenant = await findTenantBySupabaseId(data.user.id);
  if (!tenant) {
    throw new Error('Account not found. Please sign up as a tenant first.');
  }

  return {
    token: data.session.access_token,
    message: 'Login successful',
  };
}

// ---------- 2. PROFILE ----------

export async function getTenantProfile(supabaseId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  // Count application statuses
  const ongoing = await countApplications(supabaseId, 'Pending');
  const rejected = await countApplications(supabaseId, 'Rejected');
  const completed = await countApplications(supabaseId, 'Approved');

  // Get primary bank account from bankAccounts JSON array if it exists
  const bankAccounts = (tenant as any).bankAccounts as any[] | null;
  const primaryAccount = bankAccounts?.find(acc => acc.subtype === 'checking') || bankAccounts?.[0];

  return {
    tenantId: supabaseId,
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    email: tenant.email,
    phone: tenant.phone,
    verified: tenant.verified,
    profileImage: tenant.profileImage,
    dateOfBirth: tenant.dateOfBirth,
    currentAddress: tenant.currentAddress,
    ssn: tenant.ssn,
    creditScore: tenant.creditScore,
    lastCreditCheck: tenant.lastCreditCheck,
    backgroundCheckStatus: tenant.backgroundCheckStatus,
    isRenting: tenant.isRenting,
    socialLinks: {
      linkedin: tenant.linkedinUrl,
      facebook: tenant.facebookUrl,
      instagram: tenant.instagramUrl,
    },
    paymentInfo: {
      cardLast4: tenant.creditCardLast4,
      cardBrand: tenant.creditCardBrand,
      cardExpiry: tenant.creditCardExpiry,
    },
    profile: {
      occupation: tenant.occupation,
      income: tenant.income,
      preferredMoveInDate: tenant.preferredMoveInDate,
      bio: tenant.bio,
    },
    // Bank account details
    bankName: primaryAccount?.name || null,
    bankAccountType: primaryAccount?.subtype || null,
    bankAccountBalance: primaryAccount?.balances?.current || null,
    bankAccountMask: primaryAccount?.mask || null,
    plaidInstitutionName: (tenant as any).plaidInstitutionName,
    
    // Verification statuses and details
    verifications: {
      identity: tenant.identityVerified,
      income: Boolean(tenant.verifiedIncome),
      bankAccount: tenant.bankAccountVerified,
      lastVerified: tenant.plaidVerifiedAt?.toISOString(),
    },
    
    // Verified information
    verifiedFirstName: tenant.verifiedFirstName,
    verifiedLastName: tenant.verifiedLastName,
    verifiedEmail: tenant.verifiedEmail,
    verifiedPhone: tenant.verifiedPhone,
    verifiedIncome: tenant.verifiedIncome,
    incomeVerifiedAt: tenant.incomeVerifiedAt?.toISOString(),
    identityVerifiedAt: tenant.identityVerifiedAt?.toISOString(),
    bankAccountVerifiedAt: tenant.bankAccountVerifiedAt?.toISOString(),
    plaidVerifiedAt: tenant.plaidVerifiedAt?.toISOString(),
    
    // Application counts
    applications: {
      ongoing,
      rejected,
      completed,
    },
  };
}

interface UpdateTenantProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  occupation?: string;
  income?: number;
  preferredMoveInDate?: Date;
  bio?: string;
}

export async function updateTenantProfile(supabaseId: string, data: UpdateTenantProfilePayload) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const updatedTenant = await prisma.tenant.update({
    where: { supabaseId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return {
    message: 'Profile updated successfully',
    profile: {
      firstName: updatedTenant.firstName,
      lastName: updatedTenant.lastName,
      email: updatedTenant.email,
      phone: updatedTenant.phone,
      profileImage: updatedTenant.profileImage,
      socialLinks: {
        linkedin: updatedTenant.linkedinUrl,
        facebook: updatedTenant.facebookUrl,
        instagram: updatedTenant.instagramUrl,
      },
      occupation: updatedTenant.occupation,
      income: updatedTenant.income,
      preferredMoveInDate: updatedTenant.preferredMoveInDate,
      bio: updatedTenant.bio,
    },
  };
}

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: Express.Multer.File) {
  console.log('Validating file:', {
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    throw new Error(`Invalid file type: ${file.mimetype}. Allowed types are: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }
}

export async function uploadTenantProfileImage(supabaseId: string, file: Express.Multer.File, accessToken: string) {
  validateFile(file);
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  // Create a new Supabase client with the user's token
  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );

  // Sanitize filename and create unique path - ensure safe characters only
  const fileExt = file.originalname.split('.').pop()?.toLowerCase();
  const timestamp = Date.now();
  const sanitizedFileName = `${supabaseId.replace(/[^a-zA-Z0-9-]/g, '')}/profile-${timestamp}.${fileExt}`;

  // Upload to Supabase storage with auth context
  const { data, error } = await userSupabase.storage
    .from('profile-images')
    .upload(sanitizedFileName, file.buffer, {
      upsert: true,
      contentType: file.mimetype,
      cacheControl: '3600'
    });

  if (error) {
    throw error;
  }

  // Get public URL with content security policy
  const { data: urlData } = userSupabase.storage
    .from('profile-images')
    .getPublicUrl(sanitizedFileName);

  // Construct the transformed URL manually to ensure correct format
  const baseUrl = urlData.publicUrl;
  const transformedUrl = `${baseUrl}?width=800&height=800&resize=cover`;

  // Delete old profile image if exists
  if (tenant.profileImage) {
    try {
      const oldUrl = new URL(tenant.profileImage);
      const oldPath = oldUrl.pathname.split('/profile-images/')[1];
      if (oldPath) {
        await userSupabase.storage
          .from('profile-images')
          .remove([oldPath]);
      }
    } catch (error) {
      console.error('Error deleting old profile image:', error);
    }
  }

  // Update tenant profile with new image URL
  await prisma.tenant.update({
    where: { supabaseId },
    data: { 
      profileImage: transformedUrl,
      updatedAt: new Date()
    }
  });

  return { publicUrl: transformedUrl };
}

export async function deleteTenantProfileImage(supabaseId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  // Update tenant profile to remove image URL
  await prisma.tenant.update({
    where: { supabaseId },
    data: { profileImage: null }
  });

  return { message: 'Profile image removed successfully' };
}

// ---------- 3. PROPERTY SEARCH & FAVORITES ----------

export async function getAllProperties() {
  const properties = await findAllProperties();
  return properties.map((p) => ({
    propertyId: p.id,
    address: p.address,
    city: p.city,
    state: p.state,
    postalCode: p.postalCode,
    country: p.country,
    price: p.price,
    propertyType: p.propertyType,
    floorNumber: p.floorNumber,
    availableDate: p.availableDate,
    totalSquareFeet: p.totalSquareFeet,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    roomDetails: p.roomDetails,
    hasParking: p.hasParking,
    parkingSpaces: p.parkingSpaces,
    heatingAndAC: p.heatingAndAC,
    laundryType: p.laundryType,
    hasMicrowave: p.hasMicrowave,
    hasRefrigerator: p.hasRefrigerator,
    isPetFriendly: p.isPetFriendly,
    hasBasement: p.hasBasement,
    photos: p.photos || [],
    description: p.description,
    landlord: p.landlord ? {
      firstName: p.landlord.firstName,
      lastName: p.landlord.lastName,
      email: p.landlord.email,
      phone: p.landlord.phone,
    } : null,
  }));
}

interface SearchPreferences {
  priceRange?: [number, number];
  location?: string;
  bedrooms?: number;
}

export async function searchPropertiesUsingAI(preferences: SearchPreferences) {
  const [min, max] = preferences.priceRange || [0, 9999999];
  const whereClause: any = {
    price: { gte: min, lte: max },
  };
  const properties = await findPropertiesByFilter(whereClause);
  return properties;
}

export async function filterProperties(query: any) {
  const whereClause: any = {};

  if (query.priceRange) {
    const [min, max] = query.priceRange.split(',').map(Number);
    whereClause.price = { gte: min, lte: max };
  }
  if (query.location) {
    whereClause.address = { contains: query.location, mode: 'insensitive' };
  }
  if (query.bedrooms) {
    whereClause.bedrooms = parseInt(query.bedrooms);
  }

  return findPropertiesByFilter(whereClause);
}

export async function addToFavorites(supabaseId: string, propertyId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  // Check if favorite already exists
  const existingFavorite = await prisma.favorite.findFirst({
    where: {
      tenantId: supabaseId,
      propertyId: propertyId
    }
  });

  if (existingFavorite) {
    throw new Error('Property is already in favorites');
  }

  // Create new favorite if it doesn't exist
  const favorite = await prisma.favorite.create({
    data: {
      id: uuidv4(), // Make sure to import { v4 as uuidv4 } from 'uuid'
      tenantId: supabaseId,
      propertyId: propertyId,
      updatedAt: new Date()
    },
    include: {
      property: {
        select: {
          id: true,
          address: true,
          price: true,
          photos: true,
          bedrooms: true,
          bathrooms: true,
          landlord: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      }
    }
  });

  return { favorite };
}

export async function removeFromFavorites(supabaseId: string, propertyId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  // Delete the favorite
  await prisma.favorite.deleteMany({
    where: {
      tenantId: supabaseId,
      propertyId: propertyId
    }
  });

  return { message: 'Property removed from favorites successfully' };
}

export async function getFavorites(supabaseId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const favorites = await prisma.favorite.findMany({
    where: { 
      tenantId: supabaseId  // This matches the column name in the Favorite table
    },
    include: {
      property: {
        select: {
          id: true,
          address: true,
          price: true,
          photos: true,
          bedrooms: true,
          bathrooms: true,
          landlord: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return { favorites };
}

// ---------- 4. APPLICATION ----------

export async function applyToProperty(tenantId: string, propertyId: string, documents: any) {
  try {
    // First check if tenant is verified
    const tenant = await prisma.tenant.findUnique({
      where: { supabaseId: tenantId }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (!tenant.verified) {
      throw new Error('Tenant must be verified before applying to properties');
    }

    // Check if property exists and is not leased
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      throw new Error('Property not found');
    }

    if (property.isLeased) {
      throw new Error('Property is already leased');
    }

    // Check if tenant has already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        tenantId,
        propertyId
      }
    });

    if (existingApplication) {
      throw new Error('You have already applied to this property');
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        tenant: {
          connect: { supabaseId: tenantId }
        },
        property: {
          connect: { id: propertyId }
        },
        landlord: {
          connect: { supabaseId: property.landlordId! }
        },
        documents,
        status: 'Pending'
      }
    });

    // Increment the number of applicants for the property
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        numApplicants: {
          increment: 1
        }
      }
    });

    return application;
  } catch (error) {
    console.error('Error in applyToProperty:', error);
    throw error;
  }
}

interface UpdateTenantPaymentInfoPayload {
  creditCardLast4?: string;
  creditCardBrand?: string;
  creditCardExpiry?: string;
}

export async function updateTenantPaymentInfo(supabaseId: string, data: UpdateTenantPaymentInfoPayload) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const updatedTenant = await prisma.tenant.update({
    where: { supabaseId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return {
    message: 'Payment information updated successfully',
    paymentInfo: {
      cardLast4: updatedTenant.creditCardLast4,
      cardBrand: updatedTenant.creditCardBrand,
      cardExpiry: updatedTenant.creditCardExpiry,
    },
  };
}

export async function uploadApplicationDocuments(
  supabaseId: string,
  idFile: Express.Multer.File,
  bankStatementFile: Express.Multer.File,
  form410File: Express.Multer.File
) {
  try {
    // Validate all files
    [idFile, bankStatementFile, form410File].forEach(validateFile);

    const tenant = await findTenantBySupabaseId(supabaseId);
    if (!tenant) throw new Error('Tenant not found');

    // Ensure storage buckets exist before uploading
    await ensureStorageBuckets();

    // Use service role for admin operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const uploadDocument = async (file: Express.Multer.File, docType: string) => {
      try {
        const fileExt = file.originalname.split('.').pop()?.toLowerCase() || '';
        const fileName = `${supabaseId}/${docType}-${Date.now()}.${fileExt}`.replace(/[^a-zA-Z0-9-_./]/g, '');

        const { data, error } = await adminSupabase.storage
          .from('application-documents')
          .upload(fileName, file.buffer, {
            upsert: true,
            contentType: file.mimetype,
            cacheControl: '3600'
          });

        if (error) throw error;

        const { data: { publicUrl } } = adminSupabase.storage
          .from('application-documents')
          .getPublicUrl(fileName);

        return publicUrl;
      } catch (error) {
        throw error;
      }
    };

    const [idUrl, bankStatementUrl, form410Url] = await Promise.all([
      uploadDocument(idFile, 'id'),
      uploadDocument(bankStatementFile, 'bank-statement'),
      uploadDocument(form410File, 'form410')
    ]);

    return {
      documents: {
        id: idUrl,
        bankStatement: bankStatementUrl,
        form410: form410Url
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to upload application documents: ${error.message}`);
  }
}

export async function updateApplicationDocuments(
  supabaseId: string,
  applicationId: string,
  idFile?: Express.Multer.File,
  bankStatementFile?: Express.Multer.File,
  form410File?: Express.Multer.File
) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  // Check if application exists and belongs to tenant
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { tenant: true }
  });

  if (!application) throw new Error('Application not found');
  if (application.tenantId !== supabaseId) throw new Error('Application does not belong to this tenant');
  if (application.status !== 'Pending') throw new Error('Can only update documents for pending applications');

  // Use service role for admin operations
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const uploadDocument = async (file: Express.Multer.File, docType: string) => {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${supabaseId}/${docType}-${Date.now()}.${fileExt}`;

    const { error } = await adminSupabase.storage
      .from('application-documents')
      .upload(fileName, file.buffer, {
        upsert: true,
        contentType: file.mimetype
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = adminSupabase.storage
      .from('application-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Get existing documents
  const existingDocs = application.documents as { 
    id: string; 
    bankStatement: string; 
    form410: string; 
  } | null;

  // Upload new documents and merge with existing ones
  const updatedDocs = {
    id: idFile ? await uploadDocument(idFile, 'id') : existingDocs?.id,
    bankStatement: bankStatementFile ? await uploadDocument(bankStatementFile, 'bank-statement') : existingDocs?.bankStatement,
    form410: form410File ? await uploadDocument(form410File, 'form-410') : existingDocs?.form410
  };

  // Update application with new document URLs and flags
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      documents: updatedDocs,
      hasId: idFile ? true : application.hasId,
      hasBankStatement: bankStatementFile ? true : application.hasBankStatement,
      hasForm140: form410File ? true : application.hasForm140
    }
  });

  return { documents: updatedDocs };
}

export async function revokeApplication(supabaseId: string, applicationId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { tenant: true }
  });

  if (!application) throw new Error('Application not found');
  if (application.tenantId !== supabaseId) throw new Error('Application does not belong to this tenant');

  await prisma.application.delete({
    where: { id: applicationId }
  });

  return { message: 'Application revoked successfully' };
}

export async function revokeManyApplications(supabaseId: string, applicationIds: string[]) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const applications = await prisma.application.findMany({
    where: { id: { in: applicationIds } },
    include: { tenant: true }
  });

  // Verify all applications belong to this tenant
  applications.forEach(app => {
    if (app.tenantId !== supabaseId) throw new Error('One or more applications do not belong to this tenant');
  });

  await prisma.application.deleteMany({
    where: { id: { in: applicationIds } }
  });

  return { message: 'Applications revoked successfully' };
}

export async function addApplicationNote(supabaseId: string, applicationId: string, data: { content: string }) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { tenant: true }
  });

  if (!application) throw new Error('Application not found');
  if (application.tenantId !== supabaseId) throw new Error('Application does not belong to this tenant');

  await prisma.$executeRaw`
    INSERT INTO "ApplicationNote" ("id", "applicationId", "content", "creatorType", "creatorId", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${applicationId}, ${data.content}, 'Tenant', ${supabaseId}, NOW(), NOW())
  `;

  return { message: 'Note added successfully' };
}

export async function getApplicationNotes(supabaseId: string, applicationId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { tenant: true }
  });

  if (!application) throw new Error('Application not found');
  if (application.tenantId !== supabaseId) throw new Error('Application does not belong to this tenant');

  const notes = await prisma.applicationNote.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'desc' }
  });

  return { notes };
}

// ---------- 5. PLAID VERIFICATION ----------

export async function initiatePlaidVerification(supabaseId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const linkToken = await createPlaidLinkToken(supabaseId);
  return { linkToken };
}

export async function completePlaidVerification(supabaseId: string, publicToken: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  // Exchange public token for access token
  const accessToken = await exchangePublicToken(publicToken);

  // Run verifications in parallel
  const [identityResult, incomeResult, bankAccountResult] = await Promise.all([
    verifyTenantIdentity(supabaseId, accessToken),
    verifyTenantIncome(supabaseId, accessToken),
    verifyTenantBankAccount(supabaseId, accessToken),
  ]);

  // Update overall verification status
  await prisma.tenant.update({
    where: { supabaseId },
    data: {
      plaidVerified: true,
      plaidVerifiedAt: new Date(),
      verified: true, // Also update the main verified flag
    }
  });

  return {
    success: true,
    message: 'Plaid verification completed successfully',
    verifications: {
      identity: identityResult,
      income: incomeResult,
      bankAccount: bankAccountResult
    }
  };
}

export async function getVerificationStatus(supabaseId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  // Use raw query to get all verification fields including JSON
  const result = await prisma.$queryRaw`
    SELECT 
      "plaidVerified",
      "plaidVerifiedAt",
      "identityVerified",
      "identityVerifiedAt",
      "bankAccountVerified",
      "bankAccountVerifiedAt",
      "verifiedIncome",
      "incomeVerifiedAt",
      "verifiedFirstName",
      "verifiedLastName",
      "verifiedEmail",
      "verifiedPhone",
      "bankAccounts",
      "plaidItemId",
      "plaidInstitutionId",
      "plaidInstitutionName"
    FROM "Tenant"
    WHERE "supabaseId" = ${supabaseId}
  ` as any;

  if (!result?.[0]) throw new Error('Failed to fetch verification status');

  const data = result[0];
  
  // Get primary bank account from bankAccounts JSON array
  const bankAccounts = (data.bankAccounts as any[] | null) || [];
  const primaryAccount = bankAccounts.find(acc => acc.subtype === 'checking') || bankAccounts[0];

  return {
    plaidVerified: Boolean(data.plaidVerified),
    plaidVerifiedAt: data.plaidVerifiedAt,
    identityVerified: Boolean(data.identityVerified),
    identityVerifiedAt: data.identityVerifiedAt,
    bankAccountVerified: Boolean(data.bankAccountVerified),
    bankAccountVerifiedAt: data.bankAccountVerifiedAt,
    verifiedIncome: data.verifiedIncome,
    incomeVerifiedAt: data.incomeVerifiedAt,
    identity: {
      firstName: data.verifiedFirstName,
      lastName: data.verifiedLastName,
      email: data.verifiedEmail,
      phone: data.verifiedPhone,
    },
    bankAccount: primaryAccount ? {
      bankName: primaryAccount.name,
      accountType: primaryAccount.subtype,
      balance: primaryAccount.balances?.current,
      accountMask: primaryAccount.mask,
      ownerName: primaryAccount.ownerName,
      routingNumber: primaryAccount.routing_number,
      accountNumberMask: primaryAccount.account_number_mask,
    } : null,
    plaidInfo: {
      itemId: data.plaidItemId,
      institutionId: data.plaidInstitutionId,
      institutionName: data.plaidInstitutionName,
    },
    allBankAccounts: bankAccounts
  };
}

export async function createSandboxPublicToken(supabaseId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const publicToken = await createPlaidSandboxToken();
  return { publicToken };
}

export async function getTenantApplications(supabaseId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const applications = await prisma.application.findMany({
    where: { tenantId: supabaseId },
    include: {
      property: {
        select: {
          id: true,
          address: true,
          price: true,
          photos: true,
          bedrooms: true,
          bathrooms: true,
          landlord: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return {
    applications: applications.map(app => ({
      id: app.id,
      status: app.status,
      documents: app.documents,
      createdAt: app.createdAt,
      property: {
        id: app.property.id,
        address: app.property.address,
        price: app.property.price,
        photos: app.property.photos,
        bedrooms: app.property.bedrooms,
        bathrooms: app.property.bathrooms,
        landlord: app.property.landlord
      }
    }))
  };
}

export async function getTenantApplication(supabaseId: string, applicationId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      property: {
        select: {
          id: true,
          address: true,
          price: true,
          photos: true,
          bedrooms: true,
          bathrooms: true,
          landlord: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      }
    }
  });

  if (!application) throw new Error('Application not found');
  if (application.tenantId !== supabaseId) throw new Error('Application does not belong to this tenant');

  return {
    id: application.id,
    status: application.status,
    documents: application.documents,
    createdAt: application.createdAt,
    property: {
      id: application.property.id,
      address: application.property.address,
      price: application.property.price,
      photos: application.property.photos,
      bedrooms: application.property.bedrooms,
      bathrooms: application.property.bathrooms,
      landlord: application.property.landlord
    }
  };
}

export async function getTenantApplicationsByStatus(supabaseId: string, status: 'Pending' | 'Approved' | 'Rejected') {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const applications = await prisma.application.findMany({
    where: { 
      tenantId: supabaseId,
      status
    },
    include: {
      property: {
        select: {
          id: true,
          address: true,
          price: true,
          photos: true,
          bedrooms: true,
          bathrooms: true,
          landlord: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return {
    applications: applications.map(app => ({
      id: app.id,
      status: app.status,
      documents: app.documents,
      createdAt: app.createdAt,
      property: {
        id: app.property.id,
        address: app.property.address,
        price: app.property.price,
        photos: app.property.photos,
        bedrooms: app.property.bedrooms,
        bathrooms: app.property.bathrooms,
        landlord: app.property.landlord
      }
    }))
  };
}

export async function checkApplicationExists(supabaseId: string, propertyId: string) {
  const tenant = await findTenantBySupabaseId(supabaseId);
  if (!tenant) throw new Error('Tenant not found');

  const application = await prisma.application.findFirst({
    where: {
      tenantId: supabaseId,
      propertyId,
      createdAt: {
        // Only check applications from the current month
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    }
  });

  return {
    hasApplied: Boolean(application),
    application: application ? {
      id: application.id,
      status: application.status,
      createdAt: application.createdAt
    } : null
  };
}
