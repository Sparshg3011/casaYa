import { Router } from 'express';
import {
  getAllProperties,
  searchProperties,
} from '../services/property.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_req, res) => {
  try {
    const properties = await getAllProperties();
    res.status(200).json(properties);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/search', async (req, res) => {
  try {
    const filters = req.body;
    const properties = await searchProperties(filters);
    res.status(200).json(properties);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:propertyId/public', async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (!propertyId) throw new Error('Missing property ID');

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        price: true,
        propertyType: true,
        floorNumber: true,
        availableDate: true,
        totalSquareFeet: true,
        bedrooms: true,
        bathrooms: true,
        roomDetails: true,
        hasParking: true,
        parkingSpaces: true,
        heatingAndAC: true,
        laundryType: true,
        hasMicrowave: true,
        hasRefrigerator: true,
        isPetFriendly: true,
        hasBasement: true,
        description: true,
        photos: true,
        landlord: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    return res.status(200).json(property);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Protected routes below
router.use(authenticateToken);

export default router; 