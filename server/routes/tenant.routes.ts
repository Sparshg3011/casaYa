// server/routes/tenant.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../models/prisma';
import {
  signupTenant,
  loginTenant,
  getTenantProfile,
  updateTenantProfile,
  uploadTenantProfileImage,
  deleteTenantProfileImage,
  getAllProperties,
  searchPropertiesUsingAI,
  filterProperties,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  applyToProperty,
  updateTenantPaymentInfo,
  uploadApplicationDocuments,
  updateApplicationDocuments,
  revokeApplication,
  revokeManyApplications,
  addApplicationNote,
  getApplicationNotes,
  initiatePlaidVerification,
  completePlaidVerification,
  getVerificationStatus,
  createSandboxPublicToken,
  getTenantApplications,
  getTenantApplication,
  getTenantApplicationsByStatus,
  checkApplicationExists,
} from '../services/tenant.service';
import { authenticateToken } from '../middleware/auth.middleware';
import multer from 'multer';
import { updateApplicationStatus } from '../models/property.model';
import { supabase } from '../lib/supabase';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  }
});
const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for profile images
  }
}).single('image');

router.post('/signup', async (req, res) => {
  try {
    console.log('Received signup request with body:', {
      ...req.body,
      password: req.body.password ? '[REDACTED]' : undefined
    });
    
    const { firstName, lastName, email, password, isOAuth } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email) {
      const missingFields = [];
      if (!firstName) missingFields.push('firstName');
      if (!lastName) missingFields.push('lastName');
      if (!email) missingFields.push('email');
      
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Only validate password for non-OAuth signups
    if (!isOAuth && !password) {
      console.error('Password required for non-OAuth signup');
      return res.status(400).json({ 
        error: 'Password is required for non-OAuth signup' 
      });
    }

    // Get access token from Authorization header for OAuth signups
    let accessToken;
    if (isOAuth) {
      const authHeader = req.header('Authorization');
      if (!authHeader) {
        console.error('No Authorization header for OAuth signup');
        return res.status(400).json({ 
          error: 'Authorization header is required for OAuth signup' 
        });
      }
      accessToken = authHeader.replace('Bearer ', '');
    }

    console.log('Creating tenant with:', { 
      firstName, 
      lastName, 
      email, 
      hasPassword: !!password,
      isOAuth,
      hasAccessToken: !!accessToken
    });
    
    const tenant = await signupTenant({ firstName, lastName, email, password, isOAuth }, accessToken);
    console.log('Tenant created successfully:', tenant);
    
    return res.status(201).json({ tenantId: tenant.supabaseId, message: 'Signup successful' });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginTenant({ email, password });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error('Email is required');

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_CLIENT_URL}/reset-password`,
    });

    if (error) throw error;

    return res.status(200).json({ 
      message: 'Password reset instructions have been sent to your email' 
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const profile = await getTenantProfile(supabaseId);
    return res.status(200).json(profile);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const result = await updateTenantProfile(supabaseId, req.body);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/payment-info', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const result = await updateTenantPaymentInfo(supabaseId, req.body);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/profile-image', 
  authenticateToken,
  (req, res, next) => {
    profileImageUpload(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'Profile image too large. Maximum size is 5MB. Please try a smaller image.' 
          });
        }
        return res.status(400).json({ 
          error: `Upload error: ${err.message}` 
        });
      }
      if (err) {
        return res.status(400).json({ 
          error: `Unknown upload error: ${err.message}` 
        });
      }
      return next();
    });
  }, 
  async (req, res) => {
    try {
      const supabaseId = req.header('x-supabase-id');
      if (!supabaseId) throw new Error('Missing Supabase ID');
      
      if (!req.file) throw new Error('No image file provided');

      const accessToken = req.header('Authorization')?.replace('Bearer ', '');
      if (!accessToken) throw new Error('No access token provided');

      const result = await uploadTenantProfileImage(supabaseId, req.file, accessToken);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
});

router.delete('/profile-image', 
  authenticateToken, 
  async (req, res) => {
    try {
      const supabaseId = req.header('x-supabase-id');
      if (!supabaseId) throw new Error('Missing Supabase ID');

      const result = await deleteTenantProfileImage(supabaseId);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
});

router.post('/favorites', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const { propertyId } = req.body;
    if (!propertyId) throw new Error('Missing propertyId');

    const result = await addToFavorites(supabaseId, propertyId);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/favorites', authenticateToken, async (req: Request, res: Response) => {
  try {
    const supabaseId = req.headers['x-supabase-id'] as string;
    if (!supabaseId) {
      return res.status(400).json({ error: 'x-supabase-id header is required' });
    }

    const result = await getFavorites(supabaseId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/applications/bulk-revoke', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const { applicationIds } = req.body;
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new Error('Must provide an array of application IDs');
    }

    const result = await revokeManyApplications(supabaseId, applicationIds);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/properties', async (_req, res) => {
  try {
    const properties = await getAllProperties();
    res.status(200).json(properties);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/properties/search', async (req, res) => {
  try {
    const { preferences } = req.body;
    const results = await searchPropertiesUsingAI(preferences || {});
    res.status(200).json(results);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/properties/filter', async (req, res) => {
  try {
    const results = await filterProperties(req.query);
    res.status(200).json(results);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const applications = await getTenantApplications(supabaseId);
    res.status(200).json(applications);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/applications/status/:status', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const { status } = req.params;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      throw new Error('Invalid status. Must be Pending, Approved, or Rejected');
    }

    const applications = await getTenantApplicationsByStatus(
      supabaseId, 
      status as 'Pending' | 'Approved' | 'Rejected'
    );
    res.status(200).json(applications);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/verify/plaid/init', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const supabaseId = req.headers['x-supabase-id'] as string;
    if (!supabaseId) {
      res.status(400).json({ error: 'Missing Supabase ID' });
      return;
    }

    const result = await initiatePlaidVerification(supabaseId);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify/plaid/complete', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const supabaseId = req.headers['x-supabase-id'] as string;
    if (!supabaseId) {
      res.status(400).json({ error: 'Missing Supabase ID' });
      return;
    }

    const { public_token } = req.body;
    if (!public_token) {
      res.status(400).json({ error: 'Public token is required' });
      return;
    }

    const result = await completePlaidVerification(supabaseId, public_token);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify/status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const supabaseId = req.headers['x-supabase-id'] as string;
    if (!supabaseId) {
      res.status(400).json({ error: 'Missing Supabase ID' });
      return;
    }

    const status = await getVerificationStatus(supabaseId);
    res.status(200).json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/applications', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const { propertyId, documents } = req.body;
    if (!propertyId) throw new Error('Missing propertyId');

    if (!documents) {
      throw new Error('Documents are required for application submission');
    }

    const requiredDocs = ['id', 'bankStatement', 'form410'];
    const missingDocs = requiredDocs.filter(doc => !documents[doc]);
    if (missingDocs.length > 0) {
      throw new Error(`Missing required documents: ${missingDocs.join(', ')}`);
    }

    const result = await applyToProperty(supabaseId, propertyId, documents);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/favorites/:propertyId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const supabaseId = req.headers['x-supabase-id'] as string;
    if (!supabaseId) {
      return res.status(400).json({ error: 'x-supabase-id header is required' });
    }

    const { propertyId } = req.params;
    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    const result = await removeFromFavorites(supabaseId, propertyId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/applications/documents', 
  authenticateToken,
  upload.fields([
    { name: 'idFile', maxCount: 1 },
    { name: 'bankStatementFile', maxCount: 1 },
    { name: 'form410File', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const supabaseId = req.header('x-supabase-id');
      if (!supabaseId) {
        throw new Error('Missing Supabase ID');
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.idFile?.[0] || !files.bankStatementFile?.[0] || !files.form410File?.[0]) {
        throw new Error('All required files must be provided');
      }

      const result = await uploadApplicationDocuments(
        supabaseId,
        files.idFile[0],
        files.bankStatementFile[0],
        files.form410File[0]
      );

      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/applications/check/:propertyId', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const { propertyId } = req.params;
    if (!propertyId) throw new Error('Missing property ID');

    const result = await checkApplicationExists(supabaseId, propertyId);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get tenant profile by ID (for landlords)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.params.id;
    if (!tenantId) throw new Error('Missing tenant ID');

    // Verify that the requester is a landlord
    const requesterId = req.header('x-supabase-id');
    if (!requesterId) throw new Error('Missing requester ID');

    const requester = await prisma.landlord.findUnique({
      where: { supabaseId: requesterId }
    });

    if (!requester) {
      return res.status(403).json({ error: 'Only landlords can view tenant profiles' });
    }

    const profile = await getTenantProfile(tenantId);
    return res.status(200).json(profile);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/properties/:propertyId/public', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        applications: true
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    console.log('Public property response:', JSON.stringify(property, null, 2));
    return res.json(property);
  } catch (error) {
    console.error('Error fetching public property:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;