/**
 * Shifts Routes
 * API endpoints for duty roster shift management
 */

import { Router } from 'express';
import { prisma } from '../services/db';
import { asyncHandler, validate } from '../middleware/error-handler';
import { CreateShiftSchema, UpdateShiftSchema } from '../validators/schemas';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/shifts
 * Get all shifts, ordered by order field
 */
router.get('/', asyncHandler(async (_, res) => {
  const shifts = await prisma.shift.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { assignments: true }
      }
    }
  });

  res.json({
    success: true,
    data: shifts,
    count: shifts.length
  });
}));

/**
 * GET /api/shifts/active
 * Get only active shifts
 */
router.get('/active', asyncHandler(async (_, res) => {
  const shifts = await prisma.shift.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { assignments: true }
      }
    }
  });

  res.json({
    success: true,
    data: shifts,
    count: shifts.length
  });
}));

/**
 * GET /api/shifts/:id
 * Get a single shift by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const shift = await prisma.shift.findUnique({
    where: { id: req.params.id },
    include: {
      assignments: {
        orderBy: { date: 'desc' },
        take: 10 // Last 10 assignments
      },
      _count: {
        select: { assignments: true }
      }
    }
  });

  if (!shift) {
    return res.status(404).json({
      success: false,
      error: 'Shift not found'
    });
  }

  res.json({ success: true, data: shift });
}));

/**
 * POST /api/shifts
 * Create a new shift
 */
router.post('/', validate(CreateShiftSchema), asyncHandler(async (req, res) => {
  const shift = await prisma.shift.create({
    data: req.body
  });

  res.status(201).json({
    success: true,
    data: shift,
    message: 'Shift created successfully'
  });
}));

/**
 * PUT /api/shifts/:id
 * Update an existing shift
 */
router.put('/:id', validate(UpdateShiftSchema), asyncHandler(async (req, res) => {
  const shift = await prisma.shift.update({
    where: { id: req.params.id },
    data: req.body
  });

  res.json({
    success: true,
    data: shift,
    message: 'Shift updated successfully'
  });
}));

/**
 * DELETE /api/shifts/:id
 * Delete a shift (cascades to assignments)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.shift.delete({
    where: { id: req.params.id }
  });

  res.json({
    success: true,
    message: 'Shift deleted successfully'
  });
}));

/**
 * POST /api/shifts/:id/toggle-active
 * Toggle shift active status
 */
router.post('/:id/toggle-active', asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const shift = await prisma.shift.update({
    where: { id: req.params.id },
    data: { isActive }
  });

  res.json({
    success: true,
    data: shift,
    message: `Shift ${isActive ? 'activated' : 'deactivated'} successfully`
  });
}));

/**
 * POST /api/shifts/reorder
 * Update order of multiple shifts
 */
router.post('/reorder', asyncHandler(async (req, res) => {
  const { shifts } = req.body; // Array of { id, order }

  if (!Array.isArray(shifts)) {
    return res.status(400).json({
      success: false,
      error: 'Shifts must be an array'
    });
  }

  // Update each shift's order in a transaction
  await prisma.$transaction(
    shifts.map(({ id, order }) =>
      prisma.shift.update({
        where: { id },
        data: { order }
      })
    )
  );

  res.json({
    success: true,
    message: 'Shift order updated successfully'
  });
}));

export default router;
