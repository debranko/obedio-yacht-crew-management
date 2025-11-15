/**
 * Shifts Routes
 * API endpoints for duty roster shift management
 */

import { Router } from 'express';
import { prisma } from '../services/db';
import { asyncHandler, validate } from '../middleware/error-handler';
import { CreateShiftSchema, UpdateShiftSchema } from '../validators/schemas';
import { authMiddleware } from '../middleware/auth';
import { websocketService } from '../services/websocket';
import { apiSuccess, apiError } from '../utils/api-response';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/shifts
 * Get all shifts, ordered by order field
 */
router.get('/', asyncHandler(async (_, res) => {
  // Using raw SQL to include primaryCount and backupCount fields
  const shifts = await prisma.$queryRaw`
    SELECT
      s.*,
      COUNT(a.id)::int as "assignmentCount"
    FROM "Shift" s
    LEFT JOIN "Assignment" a ON a."shiftId" = s.id
    GROUP BY s.id
    ORDER BY s."order" ASC
  `;

  res.json(apiSuccess(shifts));
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

  res.json(apiSuccess(shifts));
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
    return res.status(404).json(apiError('Shift not found', 'NOT_FOUND'));
  }

  res.json(apiSuccess(shift));
}));

/**
 * POST /api/shifts
 * Create a new shift
 */
router.post('/', validate(CreateShiftSchema), asyncHandler(async (req, res) => {
  const shift = await prisma.shift.create({
    data: req.body
  });

  // Broadcast shift creation to all connected clients
  websocketService.emitShiftCreated(shift);

  res.status(201).json(apiSuccess(shift));
}));

/**
 * PUT /api/shifts/:id
 * Update an existing shift
 */
router.put('/:id', validate(UpdateShiftSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  // Build dynamic UPDATE query
  const fields = Object.keys(data);
  const values = Object.values(data);

  if (fields.length === 0) {
    return res.status(400).json(apiError('No fields to update', 'VALIDATION_ERROR'));
  }

  const setClause = fields.map((f, i) => `"${f}" = $${i + 2}`).join(', ');

  const shift = await prisma.$queryRawUnsafe(
    `UPDATE "Shift" SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    id,
    ...values
  );

  const updatedShift = (shift as any[])[0];

  // Broadcast shift update to all connected clients
  websocketService.emitShiftUpdated(updatedShift);

  res.json(apiSuccess(updatedShift));
}));

/**
 * DELETE /api/shifts/:id
 * Delete a shift (cascades to assignments)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const shift = await prisma.shift.findUnique({
    where: { id: req.params.id }
  });

  await prisma.shift.delete({
    where: { id: req.params.id }
  });

  // Broadcast shift deletion to all connected clients
  if (shift) {
    websocketService.emitShiftDeleted(shift);
  }

  res.json(apiSuccess({ deleted: true, id: req.params.id }));
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

  // Broadcast shift toggle to all connected clients
  websocketService.emitShiftUpdated(shift);

  res.json(apiSuccess(shift));
}));

/**
 * POST /api/shifts/reorder
 * Update order of multiple shifts
 */
router.post('/reorder', asyncHandler(async (req, res) => {
  const { shifts } = req.body; // Array of { id, order }

  if (!Array.isArray(shifts)) {
    return res.status(400).json(apiError('Shifts must be an array', 'VALIDATION_ERROR'));
  }

  // Update each shift's order in a transaction
  const updatedShifts = await prisma.$transaction(
    shifts.map(({ id, order }) =>
      prisma.shift.update({
        where: { id },
        data: { order }
      })
    )
  );

  // Broadcast shift reorder to all connected clients
  updatedShifts.forEach(shift => {
    websocketService.emitShiftUpdated(shift);
  });

  res.json(apiSuccess({ reordered: true, count: updatedShifts.length }));
}));

export default router;
