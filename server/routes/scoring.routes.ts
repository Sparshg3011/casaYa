import { Router, Response, Request, RequestHandler } from 'express';
import { calculateTenantScore, getPropertyCompatibility } from '../services/scoring.service';
import { verifyTenantIncome } from '../services/plaid.service';
import { prisma } from '../models/prisma';
import { Tenant } from '@prisma/client';
import { EquifaxService } from '../services/equifax.service';
import { supabase } from '../lib/supabase';

// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
  user: {
    supabaseId: string;
  };
}

const router = Router();
const equifaxService = new EquifaxService();

// Debug middleware to log all requests
router.use((req, _res, next) => {
  console.log(`Scoring Route: ${req.method} ${req.path}`);
  next();
});

// Middleware to verify token and get supabaseId
const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Add supabaseId to request object
    (req as AuthenticatedRequest).user = { supabaseId: user.id };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

const calculateScoreHandler: RequestHandler = async (req, res) => {
  try {
    const { supabaseId, propertyId } = req.body;
    
    const tenant = await prisma.tenant.findUnique({
      where: { supabaseId }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!tenant.plaidVerified || !tenant.plaidAccessToken) {
      return res.status(400).json({ error: 'Tenant has not completed Plaid verification' });
    }

    const verificationResult = await verifyTenantIncome(tenant.supabaseId, tenant.plaidAccessToken);
    if (!verificationResult.success) {
      return res.status(400).json({ error: 'Failed to verify tenant income' });
    }

    const scoringResult = calculateTenantScore(verificationResult, {
      monthlyRent: property.price
    });

    return res.json({
      success: true,
      data: scoringResult
    });
  } catch (error) {
    console.error('Error calculating tenant score:', error);
    return res.status(500).json({ error: 'Failed to calculate tenant score' });
  }
};

const checkCreditHandler: RequestHandler = async (req, res) => {
  try {
    const supabaseId = (req as AuthenticatedRequest).user.supabaseId;
    
    const tenant = await prisma.tenant.findUnique({
      where: { supabaseId }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if required fields for credit check are present
    if (!tenant.ssn || !tenant.dateOfBirth || !tenant.currentAddress) {
      return res.status(400).json({ 
        error: 'Missing required information for credit check',
        missingFields: {
          ssn: !tenant.ssn,
          dateOfBirth: !tenant.dateOfBirth,
          currentAddress: !tenant.currentAddress
        }
      });
    }

    // Get credit score from Equifax
    try {
      const creditScoreResponse = await equifaxService.getTenantCreditScore(
        tenant.firstName,
        tenant.lastName,
        tenant.ssn,
        tenant.dateOfBirth,
        tenant.currentAddress
      );

      // Update tenant's credit score in database using raw SQL
      await prisma.$executeRaw`
        UPDATE "Tenant"
        SET "creditScore" = ${creditScoreResponse.score},
            "lastCreditCheck" = ${new Date()}
        WHERE "supabaseId" = ${supabaseId};
      `;

      // Return raw credit score data
      return res.json({
        success: true,
        data: {
          score: creditScoreResponse.score,
          status: creditScoreResponse.status,
          reportDate: creditScoreResponse.reportDate,
          lastChecked: new Date()
        }
      });
    } catch (error) {
      console.error('Error fetching credit score:', error);
      return res.status(400).json({ error: 'Failed to fetch credit score' });
    }
  } catch (error) {
    console.error('Error checking credit score:', error);
    return res.status(500).json({ error: 'Failed to check credit score' });
  }
};

const checkCompatibilityHandler: RequestHandler = async (req, res) => {
  try {
    const { monthlyIncome, propertyId } = req.body;

    if (!monthlyIncome || !propertyId) {
      return res.status(400).json({ error: 'Monthly income and property ID are required' });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const compatibility = getPropertyCompatibility(monthlyIncome, property.price);

    return res.json({
      success: true,
      data: {
        property: {
          id: property.id,
          price: property.price,
          address: property.address
        },
        compatibility
      }
    });
  } catch (error) {
    console.error('Error checking property compatibility:', error);
    return res.status(500).json({ error: 'Failed to check property compatibility' });
  }
};

// Register routes
router.post('/calculate-score', calculateScoreHandler);
router.get('/check-credit', authMiddleware, checkCreditHandler);
router.post('/check-compatibility', checkCompatibilityHandler);

export default router; 