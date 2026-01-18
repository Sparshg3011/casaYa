import { Router } from 'express';
import {
  signupLandlord,
  loginLandlord,
  getLandlordProfile,
  addProperty,
  updateProperty,
  deleteProperty,
  getLandlordProperties,
  getLandlordProperty,
  updateLandlordProfile,
  updateLandlordBankInfo,
  uploadLandlordProfileImage,
  deleteLandlordProfileImage,
  getPropertyApplications,
  updateApplicationStatus,
  uploadPropertyPhotos,
  updatePropertyLeaseStatus,
} from '../services/landlord.service';
import { authenticateToken } from '../middleware/auth.middleware';
import multer from 'multer';
import { supabase } from '../lib/supabase';
import { createSupabaseClient } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const propertyPhotosUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for property photos
  }
}).array('photos', 10);
const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for profile images
  }}).single('image');

// Update the interfaces at the top of the file
interface PropertyData {
  id: string;
  landlordId: string;
}

interface ApplicationWithProperty {
  id: string;
  landlordId: string;
  propertyId: string;
  tenantId: string;
  Property: PropertyData;
}

interface ApplicationData {
  id: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  Property: PropertyData | null;
}

router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, isOAuth } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email) {
      const missingFields = [];
      if (!firstName) missingFields.push('firstName');
      if (!lastName) missingFields.push('lastName');
      if (!email) missingFields.push('email');
      
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Only validate password for non-OAuth signups
    if (!isOAuth && !password) {
      return res.status(400).json({ 
        error: 'Password is required for non-OAuth signup' 
      });
    }

    // Get access token from Authorization header for OAuth signups
    let accessToken;
    if (isOAuth) {
      const authHeader = req.header('Authorization');
      if (!authHeader) {
        return res.status(400).json({ 
          error: 'Authorization header is required for OAuth signup' 
        });
      }
      accessToken = authHeader.replace('Bearer ', '');
    }
    
    const landlord = await signupLandlord({ firstName, lastName, email, password, isOAuth }, accessToken);
    
    return res.status(201).json({ 
      landlordId: landlord.supabaseId, 
      message: 'Signup successful',
      token: accessToken // Return the token for OAuth signups
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginLandlord({ email, password });
    res.status(200).json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
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

    res.status(200).json({ 
      message: 'Password reset instructions have been sent to your email' 
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Get the Supabase ID from the request header
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    // Return success response
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const profile = await getLandlordProfile(supabaseId);
    res.status(200).json(profile);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/properties', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const propertyData = {
      // Set default values for boolean fields
      hasParking: false,
      hasMicrowave: false,
      hasRefrigerator: false,
      isPetFriendly: false,
      // Spread the rest of the data
      ...req.body
    };
    
    // Validate required fields (removing the boolean fields)
    const requiredFields = [
      'address', 'city', 'state', 'postalCode', 'country',
      'price', 'propertyType', 'style', 'availableDate',
      'bedrooms', 'bathrooms', 'heatingAndAC', 'laundryType'
    ];

    const missingFields = requiredFields.filter(field => !propertyData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Additional validation for specific property types
    if (['Apartment', 'Condo'].includes(propertyData.propertyType)) {
      if (!propertyData.floorNumber) {
        throw new Error('Floor number is required for apartments and condos');
      }
      if (!propertyData.unitNumber?.trim()) {
        throw new Error('Unit number is required for apartments and condos');
      }
    }

    // Only validate parking spaces if hasParking is true
    if (propertyData.hasParking && !propertyData.parkingSpaces) {
      throw new Error('Number of parking spaces is required when parking is available');
    }

    // Convert date string to Date object
    propertyData.availableDate = new Date(propertyData.availableDate);

    const result = await addProperty(supabaseId, propertyData);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/properties/:propertyId', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const { propertyId } = req.params;
    if (!propertyId) throw new Error('Missing property ID');

    const propertyData = req.body;
    if (Object.keys(propertyData).length === 0) {
      throw new Error('No update data provided');
    }

    // Convert date string to Date object if provided
    if (propertyData.availableDate) {
      propertyData.availableDate = new Date(propertyData.availableDate);
    }

    // Validate parking spaces if parking status is being updated
    if (propertyData.hasParking !== undefined && propertyData.hasParking && !propertyData.parkingSpaces) {
      throw new Error('Number of parking spaces is required when parking is available');
    }

    // Validate floor number for apartments and condos if property type is being updated
    if (propertyData.propertyType && ['Apartment', 'Condo'].includes(propertyData.propertyType) && 
        !propertyData.floorNumber) {
      throw new Error('Floor number is required for apartments and condos');
    }

    const result = await updateProperty(supabaseId, propertyId, propertyData);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/properties', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const properties = await getLandlordProperties(supabaseId);
    res.status(200).json(properties);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/properties/:propertyId', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const { propertyId } = req.params;
    if (!propertyId) throw new Error('Missing property ID');
    
    const property = await getLandlordProperty(supabaseId, propertyId);
    res.status(200).json(property);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/properties/:propertyId/applications', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) {
      return res.status(400).json({ error: 'Missing Supabase ID' });
    }

    const { propertyId } = req.params;
    if (!propertyId) {
      return res.status(400).json({ error: 'Missing property ID' });
    }

    const result = await getPropertyApplications(supabaseId, propertyId);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/properties/:propertyId/applications/:applicationId/status', authenticateToken, async (req, res) => {
  try {
    console.log('Starting application status update...');
    console.log('Request params:', { propertyId: req.params.propertyId, applicationId: req.params.applicationId });
    console.log('Request body:', req.body);
    
    const { propertyId, applicationId } = req.params;
    const { status } = req.body;
    const supabaseId = req.header('x-supabase-id');
    
    console.log('Extracted data:', { supabaseId, propertyId, applicationId, status });
    
    if (!supabaseId) {
      console.log('Missing Supabase ID');
      return res.status(400).json({ 
        error: 'Missing Supabase ID',
        details: 'The x-supabase-id header is required'
      });
    }

    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({ 
        error: 'Invalid status value',
        validValues: ['Approved', 'Rejected', 'Pending']
      });
    }

    const result = await updateApplicationStatus(supabaseId, propertyId, applicationId, status);
    
    console.log('Application status updated successfully:', result);
    return res.status(200).json(result);

  } catch (err: any) {
    console.error('Unexpected error in application status update:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) {
      throw new Error('Missing Supabase ID');
    }

    const result = await updateLandlordProfile(supabaseId, req.body);

    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/bank-info', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const { 
      bankName, 
      accountNumber, 
      routingNumber, 
      accountName,
      eTransferEmail,
      eTransferPhone,
      preferredPaymentMethod 
    } = req.body;

    // Validate based on preferred payment method
    if (preferredPaymentMethod === 'directDeposit') {
      if (!bankName || !accountNumber || !routingNumber || !accountName) {
        throw new Error('All direct deposit fields are required');
      }
    } else if (preferredPaymentMethod === 'eTransfer') {
      if (!eTransferEmail && !eTransferPhone) {
        throw new Error('Either e-transfer email or phone is required');
      }
    } else {
      throw new Error('Invalid payment method');
    }

    const result = await updateLandlordBankInfo(supabaseId, req.body);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/profile-image', 
  authenticateToken,
  (req, res, next) => {
    profileImageUpload(req, res, (err: any): void => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ 
            error: 'Profile image too large. Maximum size is 5MB. Please try a smaller image.' 
          });
          return;
        }
        res.status(400).json({ 
          error: `Upload error: ${err.message}` 
        });
        return;
      }
      if (err) {
        res.status(400).json({ 
          error: `Unknown upload error: ${err.message}` 
        });
        return;
      }
      next();
    });
  }, 
  async (req, res) => {
    try {
      const supabaseId = req.header('x-supabase-id');
      if (!supabaseId) {
        return res.status(400).json({ error: 'Missing Supabase ID' });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const result = await uploadLandlordProfileImage(supabaseId, req.file);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
);

router.delete('/profile-image', 
  authenticateToken, 
  async (req, res) => {
    try {
      const supabaseId = req.header('x-supabase-id');
      if (!supabaseId) throw new Error('Missing Supabase ID');

      const result = await deleteLandlordProfileImage(supabaseId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
});

router.post('/properties/:propertyId/photos',
  authenticateToken,
  (req, res, next) => {
    propertyPhotosUpload(req, res, (err: any): void => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ 
            error: 'File too large. Maximum size is 50MB per photo.' 
          });
          return;
        }
        res.status(400).json({ 
          error: `Upload error: ${err.message}` 
        });
        return;
      }
      if (err) {
        res.status(400).json({ 
          error: `Unknown upload error: ${err.message}` 
        });
        return;
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const supabaseId = req.header('x-supabase-id');
      if (!supabaseId) {
        return res.status(400).json({ error: 'Missing Supabase ID' });
      }

      const { propertyId } = req.params;
      if (!propertyId) {
        return res.status(400).json({ error: 'Missing property ID' });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No photos provided' });
      }

      const accessToken = req.header('Authorization')?.replace('Bearer ', '');
      if (!accessToken) {
        return res.status(400).json({ error: 'No access token provided' });
      }

      const result = await uploadPropertyPhotos(
        supabaseId,
        propertyId,
        req.files
      );
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
);

router.delete('/properties/:propertyId', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const { propertyId } = req.params;
    if (!propertyId) throw new Error('Missing property ID');

    const result = await deleteProperty(supabaseId, propertyId);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/properties/:propertyId/lease', authenticateToken, async (req, res) => {
  try {
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) throw new Error('Missing Supabase ID');

    const { propertyId } = req.params;
    const { isLeased } = req.body;

    if (typeof isLeased !== 'boolean') {
      throw new Error('isLeased must be a boolean value');
    }

    const result = await updatePropertyLeaseStatus(supabaseId, propertyId, isLeased);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/applications/:applicationId/documents', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const supabaseId = req.header('x-supabase-id');
    
    if (!supabaseId) {
      return res.status(400).json({ error: 'Missing Supabase ID' });
    }

    const supabaseAdmin = createSupabaseClient(true);

    const { data: application, error: accessError } = await supabaseAdmin
      .from('Application')
      .select(`
        id,
        landlordId,
        propertyId,
        tenantId,
        Property (
          id,
          landlordId
        )
      `)
      .eq('id', applicationId)
      .single() as { data: ApplicationWithProperty | null, error: any };

    if (accessError) {
      return res.status(500).json({ 
        error: 'Error checking access',
        details: accessError.message,
        code: accessError.code
      });
    }

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const hasAccess = application.landlordId === supabaseId || 
                     application.Property?.landlordId === supabaseId;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data: files, error: storageError } = await supabaseAdmin.storage
      .from('application-documents')
      .list(application.tenantId);

    if (storageError) {
      return res.status(500).json({ 
        error: 'Storage access error',
        details: storageError.message
      });
    }

    if (files && files.length > 0) {
      const { data: signedUrls, error: signedUrlError } = await supabaseAdmin.storage
        .from('application-documents')
        .createSignedUrls(
          files.map(f => `${application.tenantId}/${f.name}`),
          60
        );

      if (signedUrlError) {
        return res.status(500).json({ 
          error: 'Error generating signed URLs',
          details: signedUrlError.message
        });
      }

      const documentStatus = {
        id: {
          exists: files.some(f => f.name.toLowerCase().includes('id')),
          url: signedUrls.find(u => u.path && u.path.toLowerCase().includes('id'))?.signedUrl || null
        },
        bankStatement: {
          exists: files.some(f => f.name.toLowerCase().includes('bank')),
          url: signedUrls.find(u => u.path && u.path.toLowerCase().includes('bank'))?.signedUrl || null
        },
        form410: {
          exists: files.some(f => f.name.toLowerCase().includes('form410')),
          url: signedUrls.find(u => u.path && u.path.toLowerCase().includes('form410'))?.signedUrl || null
        }
      };

      return res.status(200).json({ data: documentStatus });
    }

    return res.status(200).json({
      data: {
        id: { exists: false, url: null },
        bankStatement: { exists: false, url: null },
        form410: { exists: false, url: null }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

router.get('/applications/:applicationId/documents/:documentType', authenticateToken, async (req, res) => {
  try {
    const { applicationId, documentType } = req.params;
    const { view } = req.query;
    const supabaseId = req.header('x-supabase-id');
    if (!supabaseId) {
      return res.status(400).json({ error: 'Missing Supabase ID' });
    }

    // Create a new Supabase client with service role
    const adminSupabase = createSupabaseClient(true);

    // First verify that the application exists and belongs to this landlord
    const { data: application, error: applicationError } = await adminSupabase
      .from('Application')
      .select(`
        id,
        propertyId,
        landlordId,
        tenantId,
        Property (
          id,
          landlordId
        )
      `)
      .eq('id', applicationId)
      .single() as { data: ApplicationWithProperty | null, error: any };

    if (applicationError) {
      return res.status(403).json({ error: 'Error fetching application details' });
    }

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if user is either direct landlord or property landlord
    const hasAccess = application.landlordId === supabaseId || 
                     application.Property?.landlordId === supabaseId;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // List files in storage using tenantId
    const { data: files, error: storageError } = await adminSupabase.storage
      .from('application-documents')
      .list(application.tenantId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (storageError) {
      return res.status(400).json({ error: storageError.message });
    }

    // Find the matching file
    const matchingFile = files?.find(f => {
      switch(documentType) {
        case 'id':
          return f.name.toLowerCase().includes('id');
        case 'bankStatement':
          return f.name.toLowerCase().includes('bank');
        case 'form410':
          return f.name.toLowerCase().includes('form410');
        default:
          return false;
      }
    });

    if (!matchingFile) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get the file data using tenantId
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from('application-documents')
      .download(`${application.tenantId}/${matchingFile.name}`);

    if (downloadError) {
      return res.status(400).json({ error: downloadError.message });
    }

    if (!fileData) {
      return res.status(404).json({ error: 'Document data not found' });
    }

    // Set appropriate headers based on view parameter
    res.setHeader('Content-Type', 'application/pdf');
    if (view === 'true') {
      // For viewing in browser
      res.setHeader('Content-Disposition', 'inline');
    } else {
      // For downloading
      res.setHeader('Content-Disposition', `attachment; filename="${matchingFile.name}"`);
    }

    // Send the file data
    const buffer = await fileData.arrayBuffer();
    return res.send(Buffer.from(buffer));

  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router; 