import { Router } from 'express';
import { prisma } from '../services/db';
import type { Prisma } from '@prisma/client';
import { asyncHandler, validate } from '../middleware/error-handler';
import { CreateGuestSchema, UpdateGuestSchema } from '../validators/schemas';
import { requirePermission } from '../middleware/auth';
import { generalRateLimiter } from '../middleware/rate-limiter';
import { validateGuestStatusTransition, validateCheckIn, validateCheckOut, type GuestStatus } from '../utils/guest-state-machine';

const router = Router();

// GET /api/guests - List guests with filtering, sorting, and pagination
router.get('/', requirePermission('guests.view'), asyncHandler(async (req, res) => {
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
            select: {
              id: true,
              status: true,
              priority: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5 // Limit to recent 5 requests per guest to avoid loading too much data
          },
          location: {
            select: {
              id: true,
              name: true,
              type: true,
              floor: true
            }
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
router.get('/stats', requirePermission('guests.view'), asyncHandler(async (req, res) => {
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

  const stats = {
    onboard,
    expected,
    vip,
    dietaryAlerts
  };

  res.json({
    success: true,
    data: stats
  });
  } catch (error) {
    console.error('Error fetching guest stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guest statistics'
    });
  }
}));

// GET /api/guests/meta - Get metadata for filters
router.get('/meta', requirePermission('guests.view'), asyncHandler(async (req, res) => {
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
}));

router.post('/', generalRateLimiter, requirePermission('guests.create'), validate(CreateGuestSchema), asyncHandler(async (req, res) => {
  const item = await prisma.guest.create({
    data: req.body
  });

  res.json({ success: true, data: item });
}));

router.get('/:id', requirePermission('guests.view'), asyncHandler(async (req, res) => {
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
}));

router.put('/:id', requirePermission('guests.edit'), validate(UpdateGuestSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // If status is being updated, validate the transition
  if (req.body.status) {
    const currentGuest = await prisma.guest.findUnique({
      where: { id },
      select: { status: true, firstName: true, lastName: true, checkInDate: true, checkOutDate: true }
    });

    if (!currentGuest) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }

    const guestName = `${currentGuest.firstName} ${currentGuest.lastName}`;

    // Validate state transition
    validateGuestStatusTransition(
      currentGuest.status as GuestStatus,
      req.body.status as GuestStatus,
      guestName
    );

    // Additional validation for check-in
    if (req.body.status === 'onboard' && currentGuest.status === 'expected') {
      validateCheckIn(
        new Date(req.body.checkInDate || currentGuest.checkInDate),
        new Date(req.body.checkOutDate || currentGuest.checkOutDate)
      );
    }

    // Additional validation for check-out
    if (req.body.status === 'departed' && currentGuest.status === 'onboard') {
      validateCheckOut(
        new Date(currentGuest.checkInDate),
        new Date(currentGuest.checkOutDate)
      );
    }
  }

  const data = await prisma.guest.update({
    where: { id },
    data: req.body
  });

  res.json({ success: true, data });
}));

router.delete('/:id', requirePermission('guests.delete'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.guest.delete({
    where: { id }
  });

  res.json({ success: true });
}));

export default router;