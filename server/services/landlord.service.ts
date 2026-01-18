import { supabase } from '../lib/supabase';
import { prisma } from '../models/prisma';
import {
  findLandlordBySupabaseId,
  createLandlord,
} from '../models/landlord.model';
import {
  createProperty,
  updatePropertyById,
  deletePropertyById,
  findPropertyByIdAndLandlord,
} from '../models/property.model';
import { createClient } from '@supabase/supabase-js';
import type { Multer } from 'multer';
import type { 
  PropertyCreateData, 
  AddPropertyPayload,
  UpdateLandlordProfilePayload,
  LandlordBankInfoPayload,
  LandlordAuthPayload
} from '../types';
import { validateEmail, validatePassword, validatePhone, validateUrl, sanitizeInput } from '../utils/security';
import { sanitizeLandlordProfileData, sanitizeLandlordBankData } from '../utils/sanitization';

// ---------- 1. AUTH ----------

export async function signupLandlord({ firstName, lastName, email, password, isOAuth }: LandlordAuthPayload, accessToken?: string) {
  console.log('Starting landlord signup with data:', { 
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

      try {
        // Check if landlord already exists
        const existingLandlord = await findLandlordBySupabaseId(userData.id);
        if (existingLandlord) {
          console.log('Landlord already exists:', existingLandlord);
          return existingLandlord;
        }

        // Create new landlord
        console.log('Creating new landlord record for user:', userData.id);
        const landlord = await createLandlord(userData.id, sanitizedFirstName, sanitizedLastName, email, false);
        console.log('Landlord created successfully:', landlord);
        return landlord;
      } catch (error: any) {
        console.error('Error in landlord database operation:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error in Supabase auth flow:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Error in signupLandlord:', error);
    throw error;
  }
}

interface LoginPayload {
  email: string;
  password: string;
}

export async function loginLandlord({ email, password }: LoginPayload) {
  // Validate input
  validateEmail(email);

  // Sign in with Supabase (let Supabase handle password verification)
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password
  });
  if (error) throw new Error('Invalid credentials');
  if (!data.session?.access_token) throw new Error('No access token returned from Supabase');

  // Verify user exists in landlord table
  const landlord = await findLandlordBySupabaseId(data.user.id);
  if (!landlord) {
    throw new Error('Account not found. Please sign up as a landlord first.');
  }

  return {
    token: data.session.access_token,
    message: 'Login successful',
  };
}

// ---------- 2. PROFILE ----------

export async function getLandlordProfile(supabaseId: string) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  return {
    landlordId: supabaseId,
    firstName: landlord.firstName,
    lastName: landlord.lastName,
    email: landlord.email,
    phone: landlord.phone,
    verified: landlord.verified,
    profileImage: landlord.profileImage,
    socialLinks: {
      linkedin: landlord.linkedinUrl,
      facebook: landlord.facebookUrl,
      instagram: landlord.instagramUrl,
      website: landlord.websiteUrl,
    },
    businessInfo: {
      companyName: landlord.companyName,
      businessAddress: landlord.businessAddress,
      taxId: landlord.taxId,
    },
    bankInfo: {
      bankName: landlord.bankName,
      accountNumber: landlord.accountNumber,
      routingNumber: landlord.routingNumber,
    },
    profile: {
      bio: landlord.bio,
      yearsOfExperience: landlord.yearsOfExperience,
    },
    properties: landlord.properties.map(p => ({
      id: p.id,
      address: p.address,
      price: p.price,
      photos: p.photos,
      description: p.description,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      applications: p.applications.map(a => ({
        id: a.id,
        status: a.status,
        tenant: a.tenant,
      })),
    })),
  };
}

// ---------- 3. PROPERTY MANAGEMENT ----------

export async function addProperty(supabaseId: string, propertyData: AddPropertyPayload) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  const property = await createProperty(supabaseId, propertyData);
  return property;
}

export async function updateProperty(supabaseId: string, propertyId: string, propertyData: Partial<AddPropertyPayload>) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  const property = await updatePropertyById(propertyId, supabaseId, propertyData);
  return property;
}

export async function deleteProperty(supabaseId: string, propertyId: string) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  await deletePropertyById(propertyId, supabaseId);
  return { message: 'Property deleted successfully' };
}

export async function getPropertyDetails(supabaseId: string, propertyId: string) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  const property = await findPropertyByIdAndLandlord(propertyId, supabaseId);
  if (!property) throw new Error('Property not found');

  return property;
}

export async function updateLandlordProfile(supabaseId: string, data: UpdateLandlordProfilePayload) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  // Extract social links from the payload
  const socialLinks = data.socialLinks || {};
  // Prepare the update data
  const updateData = {
    ...(data.firstName && { firstName: data.firstName }),
    ...(data.lastName && { lastName: data.lastName }),
    ...(data.phone && { phone: data.phone }),
    ...(data.companyName && { companyName: data.companyName }),
    ...(data.businessAddress && { businessAddress: data.businessAddress }),
    ...(data.bio && { bio: data.bio }),
    ...(data.yearsOfExperience && { yearsOfExperience: data.yearsOfExperience }),
    // Social links
    ...(socialLinks.linkedin !== undefined && { linkedinUrl: socialLinks.linkedin }),
    ...(socialLinks.facebook !== undefined && { facebookUrl: socialLinks.facebook }),
    ...(socialLinks.instagram !== undefined && { instagramUrl: socialLinks.instagram }),
    ...(socialLinks.website !== undefined && { websiteUrl: socialLinks.website }),
    updatedAt: new Date()
  };


  try {
    // Update the landlord profile
    const updatedLandlord = await prisma.landlord.update({
      where: { supabaseId },
      data: updateData
    });

    return {
      message: 'Profile updated successfully',
      profile: {
        firstName: updatedLandlord.firstName,
        lastName: updatedLandlord.lastName,
        email: updatedLandlord.email,
        phone: updatedLandlord.phone,
        profileImage: updatedLandlord.profileImage,
        socialLinks: {
          linkedin: updatedLandlord.linkedinUrl,
          facebook: updatedLandlord.facebookUrl,
          instagram: updatedLandlord.instagramUrl,
          website: updatedLandlord.websiteUrl,
        },
        businessInfo: {
          companyName: updatedLandlord.companyName,
          businessAddress: updatedLandlord.businessAddress,
          taxId: updatedLandlord.taxId,
        },
        bio: updatedLandlord.bio,
        yearsOfExperience: updatedLandlord.yearsOfExperience,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function updateLandlordBankInfo(supabaseId: string, data: LandlordBankInfoPayload) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  // Validate data based on preferred payment method
  if (data.preferredPaymentMethod === 'directDeposit') {
    if (!data.bankName || !data.accountNumber || !data.routingNumber || !data.accountName) {
      throw new Error('All direct deposit fields are required');
    }
  } else if (data.preferredPaymentMethod === 'eTransfer') {
    if (!data.eTransferEmail && !data.eTransferPhone) {
      throw new Error('Either e-transfer email or phone is required');
    }
    if (data.eTransferEmail) {
      validateEmail(data.eTransferEmail);
    }
    if (data.eTransferPhone) {
      validatePhone(data.eTransferPhone);
    }
  }

  // Sanitize input data using the centralized sanitization service
  const sanitizedData = sanitizeLandlordBankData(data);

  return prisma.landlord.update({
    where: { supabaseId },
    data: sanitizedData,
  });
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB to match multer config
const MAX_PHOTOS_PER_PROPERTY = 20;

function validateFile(file: Express.Multer.File) {
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF and PDF files are allowed.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 50MB.');
  }
}

export async function uploadLandlordProfileImage(
  supabaseId: string,
  file: Express.Multer.File
): Promise<{ imageUrl: string }> {
  try {
    // Create Supabase client with service role key for server-side operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
    
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Create a unique file path
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${supabaseId}-${Date.now()}.${fileExt}`;
    const filePath = `${supabaseId}/${fileName}`;

    // Upload to Supabase Storage using admin client
    const { data, error } = await adminSupabase
      .storage
      .from('profile-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = adminSupabase
      .storage
      .from('profile-images')
      .getPublicUrl(filePath);

    // Update the landlord's profile with the new image URL
    await prisma.landlord.update({
      where: { supabaseId },
      data: { profileImage: publicUrl }
    });

    return { imageUrl: publicUrl };
  } catch (error: any) {
    console.error('Profile image upload error:', error);
    throw error;
  }
}

export async function deleteLandlordProfileImage(supabaseId: string) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  // Update landlord profile to remove image URL
  await prisma.landlord.update({
    where: { supabaseId },
    data: { 
      profileImage: null,
      updatedAt: new Date()
    }
  });

  return { message: 'Profile image removed successfully' };
}

export async function getLandlordProperties(supabaseId: string) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  const properties = await prisma.property.findMany({
    where: { landlordId: supabaseId },
    include: {
      applications: {
        include: {
          tenant: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              backgroundCheckStatus: true,
            }
          }
        }
      }
    }
  });

  return {
    properties: properties.map(p => ({
      id: p.id,
      address: p.address,
      price: p.price,
      photos: p.photos,
      description: p.description,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      applications: p.applications.map(a => ({
        id: a.id,
        status: a.status,
        tenant: a.tenant,
      })),
    }))
  };
}

export async function getLandlordProperty(supabaseId: string, propertyId: string) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      landlordId: supabaseId
    },
    include: {
      applications: {
        include: {
          tenant: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              backgroundCheckStatus: true,
            }
          }
        }
      }
    }
  });

  if (!property) throw new Error('Property not found');

  return {
    id: property.id,
    address: property.address,
    price: property.price,
    photos: property.photos,
    description: property.description,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    applications: property.applications.map(a => ({
      id: a.id,
      status: a.status,
      tenant: a.tenant,
    })),
  };
}

export async function getPropertyApplications(supabaseId: string, propertyId: string, status?: 'Pending' | 'Approved' | 'Rejected') {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      landlordId: supabaseId
    }
  });

  if (!property) throw new Error('Property not found');

  const applications = await prisma.application.findMany({
    where: {
      propertyId,
      ...(status ? { status } : {})
    },
    include: {
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          backgroundCheckStatus: true,
          plaidVerified: true,
          identityVerified: true,
          bankAccountVerified: true,
          verifiedIncome: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return { applications };
}

export async function updateApplicationStatus(
  supabaseId: string,
  propertyId: string,
  applicationId: string,
  status: 'Approved' | 'Rejected'
) {
  console.log('Starting updateApplicationStatus service function...');
  
  return await prisma.$transaction(async (tx) => {
    // Check if landlord exists
    const landlord = await tx.landlord.findUnique({
      where: { supabaseId }
    });
    if (!landlord) throw new Error('Landlord not found');

    // Check if property exists and belongs to landlord
    const property = await tx.property.findFirst({
      where: {
        id: propertyId,
        landlordId: supabaseId
      }
    });
    if (!property) throw new Error('Property not found or does not belong to this landlord');

    // Check if application exists and belongs to property
    const application = await tx.application.findFirst({
      where: {
        id: applicationId,
        propertyId
      },
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });
    if (!application) throw new Error('Application not found or does not belong to this property');

    // Update application status
    const updatedApplication = await tx.application.update({
      where: { id: applicationId },
      data: { status },
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // If approved, update property lease status
    if (status === 'Approved') {
      await tx.property.update({
        where: { id: propertyId },
        data: { isLeased: true }
      });
    }

    return {
      message: `Application ${status.toLowerCase()} successfully`,
      application: updatedApplication
    };
  });
}

export async function addApplicationNote(supabaseId: string, applicationId: string, data: { content: string }) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      property: {
        landlordId: supabaseId
      }
    }
  });

  if (!application) throw new Error('Application not found or does not belong to your property');

  await prisma.applicationNote.create({
    data: {
      applicationId,
      content: data.content,
      creatorType: 'Landlord',
      creatorId: supabaseId
    }
  });

  return { message: 'Note added successfully' };
}

export async function getApplicationNotes(supabaseId: string, applicationId: string) {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      property: {
        landlordId: supabaseId
      }
    }
  });

  if (!application) throw new Error('Application not found or does not belong to your property');

  const notes = await prisma.applicationNote.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'desc' }
  });

  return { notes };
}

export async function uploadPropertyPhotos(
  supabaseId: string,
  propertyId: string,
  files: Express.Multer.File[]
) {
  try {
    console.log('Starting upload process for landlord:', supabaseId);
    console.log('Property ID:', propertyId);
    console.log('Number of files:', files.length);

    const landlord = await findLandlordBySupabaseId(supabaseId);
    if (!landlord) throw new Error('Landlord not found');
    console.log('Landlord found:', landlord.supabaseId);

    const property = await findPropertyByIdAndLandlord(propertyId, supabaseId);
    if (!property) throw new Error('Property not found');
    console.log('Property found:', property.id);

    // Validate number of files
    if (files.length > MAX_PHOTOS_PER_PROPERTY) {
      throw new Error(`Maximum ${MAX_PHOTOS_PER_PROPERTY} photos allowed per property`);
    }

    // Validate all files first
    files.forEach(validateFile);
    console.log('Files validated successfully');

    // Create Supabase client with service role key for server-side operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
    console.log('Supabase admin client created');

    const uploadPhoto = async (file: Express.Multer.File, index: number) => {
      try {
        const fileExt = file.originalname.split('.').pop()?.toLowerCase();
        const sanitizedFileName = `${supabaseId}/${propertyId}/photo-${Date.now()}-${index}.${fileExt}`;
        console.log('Attempting to upload file:', sanitizedFileName);

        const { data, error } = await adminSupabase.storage
          .from('property-photos')
          .upload(sanitizedFileName, file.buffer, {
            upsert: true,
            contentType: file.mimetype,
            cacheControl: '3600'
          });

        if (error) {
          console.error('Supabase upload error:', error);
          throw error;
        }
        console.log('File uploaded successfully:', sanitizedFileName);

        // Get the direct storage URL without using the render endpoint
        const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-photos/${sanitizedFileName}`;
        return storageUrl;
      } catch (error: any) {
        console.error(`Error uploading photo ${index}:`, error);
        throw new Error(`Failed to upload photo ${index + 1}: ${error.message || 'Unknown error'}`);
      }
    };

    // Upload all photos in parallel
    const photoUrls = await Promise.all(
      files.map((file, index) => uploadPhoto(file, index))
    );

    // Get existing photos
    const existingPhotos = property.photos as string[] || [];

    // Update property with new photo URLs
    await prisma.property.update({
      where: {
        id: propertyId,
        landlordId: supabaseId,
      },
      data: {
        photos: [...existingPhotos, ...photoUrls],
        updatedAt: new Date()
      }
    });

    return {
      message: 'Photos uploaded successfully',
      photos: photoUrls
    };
  } catch (error: any) {
    console.error('Property photos upload error:', error);
    throw new Error(error.message || 'Failed to upload property photos');
  }
}

export async function updatePropertyLeaseStatus(supabaseId: string, propertyId: string, isLeased: boolean): Promise<any> {
  const landlord = await findLandlordBySupabaseId(supabaseId);
  if (!landlord) throw new Error('Landlord not found');

  const property = await updatePropertyLeaseStatus(propertyId, supabaseId, isLeased);
  return property;
}
