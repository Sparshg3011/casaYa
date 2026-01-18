import { Router, Response, Request, RequestHandler } from 'express';
import { prisma } from '../models/prisma';
import { Tenant, Landlord } from '@prisma/client';
import { supabase } from '../lib/supabase';

// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
  user: {
    supabaseId: string;
  };
}

const router = Router();

// Debug middleware to log all requests
router.use((req, _res, next) => {
  console.log(`Profile Route: ${req.method} ${req.path}`);
  next();
});

// Middleware to verify token and get supabaseId
const authMiddleware: RequestHandler = async (req, res, next) => {
  console.log('Auth middleware called');
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 10) + '...');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Invalid token:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Add supabaseId to request object
    (req as AuthenticatedRequest).user = { supabaseId: user.id };
    console.log('Auth successful for user:', user.id);
    return next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const updateTenantProfileHandler: RequestHandler = async (req, res) => {
  try {
    const supabaseId = (req as AuthenticatedRequest).user.supabaseId;
    const updateData = req.body;

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'phone'];
    const missingFields = requiredFields.filter(field => !updateData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Update tenant profile
    const updatedTenant = await prisma.tenant.update({
      where: { supabaseId },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone,
        ssn: updateData.ssn,
        dateOfBirth: updateData.dateOfBirth,
        currentAddress: updateData.currentAddress,
        occupation: updateData.occupation,
        income: updateData.income,
        preferredMoveInDate: updateData.preferredMoveInDate,
        bio: updateData.bio,
        linkedinUrl: updateData.linkedinUrl,
        facebookUrl: updateData.facebookUrl,
        instagramUrl: updateData.instagramUrl
      }
    });

    return res.json({
      success: true,
      data: {
        profile: {
          firstName: updatedTenant.firstName,
          lastName: updatedTenant.lastName,
          phone: updatedTenant.phone,
          occupation: updatedTenant.occupation,
          income: updatedTenant.income,
          preferredMoveInDate: updatedTenant.preferredMoveInDate,
          bio: updatedTenant.bio,
          socialLinks: {
            linkedin: updatedTenant.linkedinUrl,
            facebook: updatedTenant.facebookUrl,
            instagram: updatedTenant.instagramUrl
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating tenant profile:', error);
    return res.status(500).json({ error: 'Failed to update tenant profile' });
  }
};

const updateLandlordProfileHandler: RequestHandler = async (req, res) => {
  try {
    const supabaseId = (req as AuthenticatedRequest).user.supabaseId;

    // Validate required fields
    const updateData = req.body;
    const requiredFields = ['firstName', 'lastName', 'phone'];
    const missingFields = requiredFields.filter(field => !updateData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Prepare update data by flattening nested objects
    const flattenedData = {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      phone: updateData.phone,
      // Extract from businessInfo
      companyName: updateData.businessInfo?.companyName,
      businessAddress: updateData.businessInfo?.businessAddress,
      // Extract from profile
      bio: updateData.profile?.bio,
      yearsOfExperience: updateData.profile?.yearsOfExperience,
      // Extract from socialLinks
      linkedinUrl: updateData.socialLinks?.linkedin,
      facebookUrl: updateData.socialLinks?.facebook,
      instagramUrl: updateData.socialLinks?.instagram,
      websiteUrl: updateData.socialLinks?.website
    };

    
    // Update landlord profile
    const updatedLandlord = await prisma.landlord.update({
      where: { supabaseId },
      data: flattenedData
    });

    return res.json({
      success: true,
      data: {
        profile: {
          firstName: updatedLandlord.firstName,
          lastName: updatedLandlord.lastName,
          phone: updatedLandlord.phone,
          companyName: updatedLandlord.companyName,
          businessAddress: updatedLandlord.businessAddress,
          bio: updatedLandlord.bio,
          yearsOfExperience: updatedLandlord.yearsOfExperience,
          socialLinks: {
            linkedin: updatedLandlord.linkedinUrl,
            facebook: updatedLandlord.facebookUrl,
            instagram: updatedLandlord.instagramUrl,
            website: updatedLandlord.websiteUrl
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating landlord profile:', error);
    return res.status(500).json({ error: 'Failed to update landlord profile' });
  }
};

const getTenantProfileHandler: RequestHandler = async (req, res) => {
  try {
    const supabaseId = (req as AuthenticatedRequest).user.supabaseId;

    const tenant = await prisma.tenant.findUnique({
      where: { supabaseId }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    return res.json({
      success: true,
      data: {
        profile: {
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          email: tenant.email,
          phone: tenant.phone,
          occupation: tenant.occupation,
          income: tenant.income,
          preferredMoveInDate: tenant.preferredMoveInDate,
          bio: tenant.bio,
          socialLinks: {
            linkedin: tenant.linkedinUrl,
            facebook: tenant.facebookUrl,
            instagram: tenant.instagramUrl
          },
          // Only return sensitive info if it exists
          ...(tenant.ssn && { ssn: '***-**-' + tenant.ssn.slice(-4) }),
          ...(tenant.dateOfBirth && { dateOfBirth: tenant.dateOfBirth }),
          ...(tenant.currentAddress && { currentAddress: tenant.currentAddress })
        }
      }
    });
  } catch (error) {
    console.error('Error getting tenant profile:', error);
    return res.status(500).json({ error: 'Failed to get tenant profile' });
  }
};

const getLandlordProfileHandler: RequestHandler = async (req, res) => {
  try {
    const supabaseId = (req as AuthenticatedRequest).user.supabaseId;

    const landlord = await prisma.landlord.findUnique({
      where: { supabaseId }
    });

    if (!landlord) {
      return res.status(404).json({ error: 'Landlord not found' });
    }

    return res.json({
      success: true,
      data: {
        profile: {
          firstName: landlord.firstName,
          lastName: landlord.lastName,
          email: landlord.email,
          phone: landlord.phone,
          companyName: landlord.companyName,
          businessAddress: landlord.businessAddress,
          bio: landlord.bio,
          yearsOfExperience: landlord.yearsOfExperience,
          socialLinks: {
            linkedin: landlord.linkedinUrl,
            facebook: landlord.facebookUrl,
            instagram: landlord.instagramUrl,
            website: landlord.websiteUrl
          }
        }
      }
    });
  } catch (error) {
    console.error('Error getting landlord profile:', error);
    return res.status(500).json({ error: 'Failed to get landlord profile' });
  }
};

// Register routes
router.put('/tenant', authMiddleware, updateTenantProfileHandler);
router.put('/landlord', authMiddleware, updateLandlordProfileHandler);
router.get('/tenant', authMiddleware, getTenantProfileHandler);
router.get('/landlord', authMiddleware, getLandlordProfileHandler);

export default router; 