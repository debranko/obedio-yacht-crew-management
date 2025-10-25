import { Router } from 'express';
import { prisma } from '../services/db';
import type { Prisma } from '@prisma/client';
import { asyncHandler, validate } from '../middleware/error-handler';
import { CreateGuestSchema, UpdateGuestSchema } from '../validators/schemas';

const router = Router();

// GET /api/guests - List guests with filtering, sorting, and pagination
router.get('/', asyncHandler(async (req, res) => {
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
}));

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

router.post('/', validate(CreateGuestSchema), asyncHandler(async (req, res) => {
  const item = await prisma.guest.create({
    data: req.body
  });

  res.json({ success: true, data: item });
}));

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

router.put('/:id', validate(UpdateGuestSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const data = await prisma.guest.update({
    where: { id },
    data: req.body
  });

  res.json({ success: true, data });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.guest.delete({
    where: { id }
  });

  res.json({ success: true });
}));

export default router;