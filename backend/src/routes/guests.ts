import { Router } from 'express';
import { prisma } from '../services/db';
import type { Prisma } from '@prisma/client';

const router = Router();

// GET /api/guests - List guests with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    // Parse query parameters
    const {
      q = '',
      status,
      type,
      diet,
      allergy,
      cabin,
      vip,
      page = '1',
      limit = '25',
      sort = 'name:asc'
    } = req.query as Record<string, string>;

    // Build where clause
    const where: Prisma.GuestWhereInput = {};
    
    // Search query
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { preferredName: { contains: q, mode: 'insensitive' } },
        { nationality: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Status filter
    if (status && status !== 'All') {
      where.status = status as any;
    }

    // Type filter
    if (type && type !== 'All') {
      where.type = type as any;
    }

    // VIP filter
    if (vip && vip !== 'All') {
      if (vip === 'vip') {
        where.OR = [
          { type: 'vip' },
          { type: 'owner' }
        ];
      }
    }

    // Dietary restrictions filter
    if (diet && diet !== 'All') {
      if (diet === 'has-dietary') {
        where.NOT = {
          dietaryRestrictions: {
            isEmpty: true
          }
        };
      } else {
        where.dietaryRestrictions = {
          has: diet
        };
      }
    }

    // Allergy filter
    if (allergy && allergy !== 'All') {
      if (allergy === 'has-allergies') {
        where.NOT = {
          allergies: {
            isEmpty: true
          }
        };
      } else {
        where.allergies = {
          has: allergy
        };
      }
    }

    // Cabin/Location filter
    if (cabin && cabin !== 'All') {
      where.locationId = cabin;
    }

    // Parse sort parameter
    const [sortField, sortDirection] = sort.split(':');
    let orderBy: Prisma.GuestOrderByWithRelationInput = {};
    
    switch (sortField) {
      case 'name':
        orderBy = sortDirection === 'desc'
          ? { firstName: 'desc' }
          : { firstName: 'asc' };
        break;
      case 'checkinAt':
      case 'checkInDate':
        orderBy = sortDirection === 'desc'
          ? { checkInDate: 'desc' }
          : { checkInDate: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Parse pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const [data, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          serviceRequests: {
            select: { id: true, status: true }
          }
        }
      }),
      prisma.guest.count({ where })
    ]);

    // Return paginated response
    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Fetch guests error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch guests' });
  }
});

// GET /api/guests/stats - Get guest statistics
router.get('/stats', async (req, res) => {
  try {
    const [onboard, expected, vip, dietaryAlerts] = await Promise.all([
      prisma.guest.count({ where: { status: 'onboard' } }),
      prisma.guest.count({ where: { status: 'expected' } }),
      prisma.guest.count({ where: { OR: [{ type: 'vip' }, { type: 'owner' }] } }),
      prisma.guest.count({
        where: {
          AND: [
            { status: 'onboard' },
            {
              OR: [
                { NOT: { allergies: { isEmpty: true } } },
                { NOT: { dietaryRestrictions: { isEmpty: true } } }
              ]
            }
          ]
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        onboard,
        expected,
        vip,
        dietaryAlerts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch guest stats' });
  }
});

// GET /api/guests/meta - Get metadata for filters
router.get('/meta', async (req, res) => {
  try {
    const [guests, locations] = await Promise.all([
      prisma.guest.findMany({
        select: {
          status: true,
          type: true,
          allergies: true,
          dietaryRestrictions: true
        }
      }),
      prisma.location.findMany({
        select: {
          id: true,
          name: true
        }
      })
    ]);

    // Extract unique values
    const statuses = [...new Set(guests.map(g => g.status))];
    const types = [...new Set(guests.map(g => g.type))];
    const allergies = [...new Set(guests.flatMap(g => g.allergies))];
    const diets = [...new Set(guests.flatMap(g => g.dietaryRestrictions))];
    const cabins = locations.map(l => ({ id: l.id, name: l.name }));

    res.json({
      success: true,
      data: {
        statuses,
        types,
        allergies,
        diets,
        cabins
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch metadata' });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body ?? {};
    const { 
      firstName, 
      lastName, 
      preferredName, 
      photo,
      type, 
      status, 
      nationality, 
      languages,
      passportNumber
    } = body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        error: 'First name and last name are required' 
      });
    }

    // Create with only fields that exist in Prisma schema
    const item = await prisma.guest.create({ 
      data: { 
        firstName, 
        lastName, 
        preferredName: preferredName || null,
        photo: photo || null,
        type: type ?? 'guest',
        status: status ?? 'expected',
        nationality: nationality || null,
        languages: Array.isArray(languages) ? languages : [],
        passportNumber: passportNumber || null
      } 
    });
    
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Create guest error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create guest' 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.guest.findUnique({
      where: { id },
      include: {
        serviceRequests: true
      }
    });
    
    if (!data) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch guest' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};
    const {
      // Basic Info
      firstName,
      lastName,
      preferredName,
      photo,
      type,
      status,
      nationality,
      languages,
      passportNumber,
      
      // Accommodation
      locationId,
      checkInDate,
      checkOutDate,
      
      // Dietary & Medical
      allergies,
      dietaryRestrictions,
      medicalConditions,
      
      // Preferences & Notes
      preferences,
      notes,
      
      // Emergency Contact
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation
    } = body;
    
    // Update with only fields that exist in Prisma schema
    const updateData: any = {};
    
    // Basic Info
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (preferredName !== undefined) updateData.preferredName = preferredName || null;
    if (photo !== undefined) updateData.photo = photo || null;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (nationality !== undefined) updateData.nationality = nationality || null;
    if (languages !== undefined) updateData.languages = Array.isArray(languages) ? languages : [];
    if (passportNumber !== undefined) updateData.passportNumber = passportNumber || null;
    
    // Accommodation
    if (locationId !== undefined) updateData.locationId = locationId || null;
    if (checkInDate !== undefined) updateData.checkInDate = checkInDate ? new Date(checkInDate) : null;
    if (checkOutDate !== undefined) updateData.checkOutDate = checkOutDate ? new Date(checkOutDate) : null;
    
    // Dietary & Medical
    if (allergies !== undefined) updateData.allergies = Array.isArray(allergies) ? allergies : [];
    if (dietaryRestrictions !== undefined) updateData.dietaryRestrictions = Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [];
    if (medicalConditions !== undefined) updateData.medicalConditions = Array.isArray(medicalConditions) ? medicalConditions : [];
    
    // Preferences & Notes
    if (preferences !== undefined) updateData.preferences = preferences || null;
    if (notes !== undefined) updateData.notes = notes || null;
    
    // Emergency Contact
    if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName || null;
    if (emergencyContactPhone !== undefined) updateData.emergencyContactPhone = emergencyContactPhone || null;
    if (emergencyContactRelation !== undefined) updateData.emergencyContactRelation = emergencyContactRelation || null;
    
    const data = await prisma.guest.update({
      where: { id },
      data: updateData
    });
    
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Update guest error:', error);
    res.json({ 
      success: false, 
      error: error.message || 'Failed to update guest' 
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.guest.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete guest' });
  }
});

export default router;