import { Router } from 'express';
import { prisma } from '../services/db';
import type { Prisma } from '@prisma/client';
import { asyncHandler, validate } from '../middleware/error-handler';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { CreateGuestSchema, UpdateGuestSchema } from '../validators/schemas';
import { websocketService } from '../services/websocket';
import { apiSuccess, apiError } from '../utils/api-response';
import { calculatePagination, buildPaginationMeta } from '../utils/pagination';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// GUEST STATUS CALCULATION (computed from dates, not stored)
// ═══════════════════════════════════════════════════════════════════════════

type GuestStatus = 'expected' | 'onboard' | 'departed';

/**
 * Calculate guest status based on check-in/check-out dates
 * - today < checkInDate → 'expected'
 * - checkInDate <= today <= checkOutDate → 'onboard'
 * - today > checkOutDate → 'departed'
 */
function calculateGuestStatus(checkInDate: Date | null, checkOutDate: Date | null): GuestStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!checkInDate || !checkOutDate) {
    return 'expected'; // Default if no dates
  }

  const checkIn = new Date(checkInDate);
  checkIn.setHours(0, 0, 0, 0);

  const checkOut = new Date(checkOutDate);
  checkOut.setHours(0, 0, 0, 0);

  if (today < checkIn) {
    return 'expected';
  } else if (today <= checkOut) {
    return 'onboard';
  } else {
    return 'departed';
  }
}

/**
 * Build Prisma WHERE clause for status filtering based on dates
 */
function buildStatusDateFilter(status: string): any {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  switch (status) {
    case 'expected':
      return { checkInDate: { gt: todayISO } };
    case 'onboard':
      return {
        AND: [
          { checkInDate: { lte: todayISO } },
          { checkOutDate: { gte: todayISO } }
        ]
      };
    case 'departed':
      return { checkOutDate: { lt: todayISO } };
    default:
      return {};
  }
}

// Apply auth middleware to ALL guest routes
router.use(authMiddleware);

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

    // Build WHERE conditions using Prisma (secure, no SQL injection)
    const where: any = {
      AND: []
    };

    // Search query - case insensitive search across multiple fields
    if (q) {
      where.AND.push({
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { preferredName: { contains: q, mode: 'insensitive' } },
          { nationality: { contains: q, mode: 'insensitive' } },
          { notes: { contains: q, mode: 'insensitive' } }
        ]
      });
    }

    // Status filter (computed from dates, not stored value)
    if (status && status !== 'All') {
      where.AND.push(buildStatusDateFilter(status));
    }

    // Type filter
    if (type && type !== 'All') {
      where.AND.push({ type: type as any });
    }

    // VIP filter
    if (vip && vip === 'vip') {
      where.AND.push({
        OR: [
          { type: 'vip' },
          { type: 'owner' }
        ]
      });
    }

    // Dietary restrictions filter
    if (diet && diet !== 'All') {
      if (diet === 'has-dietary') {
        where.AND.push({ NOT: { dietaryRestrictions: { isEmpty: true } } });
      } else {
        where.AND.push({ dietaryRestrictions: { has: diet } });
      }
    }

    // Allergy filter
    if (allergy && allergy !== 'All') {
      if (allergy === 'has-allergies') {
        where.AND.push({ NOT: { allergies: { isEmpty: true } } });
      } else {
        where.AND.push({ allergies: { has: allergy } });
      }
    }

    // Cabin/Location filter
    if (cabin && cabin !== 'All') {
      where.AND.push({ locationId: cabin });
    }

    // Clean up empty AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Parse sort parameter
    const [sortField, sortDirection] = sort.split(':');
    let orderBy: any = {};

    switch (sortField) {
      case 'name':
        orderBy = { firstName: sortDirection === 'desc' ? 'desc' : 'asc' };
        break;
      case 'checkinAt':
      case 'checkInDate':
        orderBy = { checkInDate: sortDirection === 'desc' ? 'desc' : 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Parse pagination using utility function
    const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(parseInt(page), parseInt(limit));

    // Execute queries using Prisma (secure and type-safe)
    const [rawData, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        orderBy,
        skip,
        take
      }),
      prisma.guest.count({ where })
    ]);

    // Add computed status to each guest
    const data = rawData.map(guest => ({
      ...guest,
      status: calculateGuestStatus(guest.checkInDate, guest.checkOutDate)
    }));

    // Return paginated response using apiSuccess
    res.json(apiSuccess(data, buildPaginationMeta(total, pageNum, limitNum)));
}));

// GET /api/guests/stats - Get guest statistics (computed from dates)
router.get('/stats', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [onboard, expected, vip, dietaryAlerts] = await Promise.all([
    // Onboard: checkInDate <= today <= checkOutDate
    prisma.guest.count({
      where: {
        AND: [
          { checkInDate: { lte: todayISO } },
          { checkOutDate: { gte: todayISO } }
        ]
      }
    }),
    // Expected: checkInDate > today
    prisma.guest.count({
      where: { checkInDate: { gt: todayISO } }
    }),
    // VIP count (unchanged)
    prisma.guest.count({ where: { OR: [{ type: 'vip' }, { type: 'owner' }] } }),
    // Dietary alerts for onboard guests (using date-based onboard check)
    prisma.guest.count({
      where: {
        AND: [
          { checkInDate: { lte: todayISO } },
          { checkOutDate: { gte: todayISO } },
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

  res.json(apiSuccess({
    onboard,
    expected,
    vip,
    dietaryAlerts
  }));
}));

// GET /api/guests/meta - Get metadata for filters
router.get('/meta', asyncHandler(async (req, res) => {
  // Use Prisma to fetch data securely
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
      },
      where: {
        type: 'cabin'  // Only fetch cabins for guest assignment
      },
      orderBy: {
        name: 'asc'
      }
    })
  ]);

  // Extract unique values
  const statuses = Array.from(new Set(guests.map(g => g.status)));
  const types = Array.from(new Set(guests.map(g => g.type)));
  const allergies = Array.from(new Set(guests.flatMap(g => g.allergies || [])));
  const diets = Array.from(new Set(guests.flatMap(g => g.dietaryRestrictions || [])));
  const cabins = locations.map(l => ({ id: l.id, name: l.name }));

  res.json(apiSuccess({
    statuses,
    types,
    allergies,
    diets,
    cabins
  }));
}));

router.post('/', requirePermission('guests.create'), validate(CreateGuestSchema), asyncHandler(async (req, res) => {
  const item = await prisma.guest.create({
    data: req.body
  });

  // Emit WebSocket event for real-time updates
  websocketService.emitGuestEvent('created', item);

  res.json(apiSuccess(item));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rawData = await prisma.guest.findUnique({
    where: { id },
    include: {
      servicerequests: true
    }
  });

  if (!rawData) {
    return res.status(404).json(apiError('Guest not found', 'NOT_FOUND'));
  }

  // Add computed status
  const data = {
    ...rawData,
    status: calculateGuestStatus(rawData.checkInDate, rawData.checkOutDate)
  };

  res.json(apiSuccess(data));
}));

router.put('/:id', requirePermission('guests.update'), validate(UpdateGuestSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const data = await prisma.guest.update({
    where: { id },
    data: req.body
  });

  // Emit WebSocket event for real-time updates
  websocketService.emitGuestEvent('updated', data);

  // If status changed, emit specific status change event
  if (req.body.status) {
    console.log(`📢 Guest status changed: ${data.firstName} ${data.lastName} → ${data.status}`);
  }

  res.json(apiSuccess(data));
}));

router.delete('/:id', requirePermission('guests.delete'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const data = await prisma.guest.delete({
    where: { id }
  });

  // Emit WebSocket event for real-time updates
  websocketService.emitGuestEvent('deleted', data);

  res.json(apiSuccess({ deleted: true, id }));
}));

export default router;