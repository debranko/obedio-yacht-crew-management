/**
 * Assignments Routes
 * API endpoints for duty roster assignment management
 */

import { Router } from 'express';
import { prisma } from '../services/db';
import { asyncHandler, validate } from '../middleware/error-handler';
import { CreateAssignmentSchema, UpdateAssignmentSchema } from '../validators/schemas';
import { authMiddleware } from '../middleware/auth';
import { websocketService } from '../services/websocket';
import { apiSuccess, apiError } from '../utils/api-response';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/assignments
 * Get all assignments with optional filtering
 * Query params: date, shiftId, crewMemberId, type, startDate, endDate
 */
router.get('/', asyncHandler(async (req, res) => {
  const { date, shiftId, crewMemberId, type, startDate, endDate } = req.query;

  const where: any = {};

  if (date) where.date = date;
  if (shiftId) where.shiftId = shiftId;
  if (crewMemberId) where.crewMemberId = crewMemberId;
  if (type) where.type = type;

  // Date range filter
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: [
      { date: 'desc' },
      { shift: { order: 'asc' } }
    ],
    include: {
      shift: true
    }
  });

  res.json(apiSuccess(assignments));
}));

/**
 * GET /api/assignments/by-date/:date
 * Get all assignments for a specific date
 */
router.get('/by-date/:date', asyncHandler(async (req, res) => {
  const { date } = req.params;

  const assignments = await prisma.assignment.findMany({
    where: { date },
    orderBy: { shift: { order: 'asc' } },
    include: {
      shift: true
    }
  });

  res.json(apiSuccess(assignments));
}));

/**
 * GET /api/assignments/by-week/:startDate
 * Get all assignments for a week starting from startDate
 */
router.get('/by-week/:startDate', asyncHandler(async (req, res) => {
  const startDate = req.params.startDate;

  // Calculate end date (7 days later)
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endDate = end.toISOString().split('T')[0];

  const assignments = await prisma.assignment.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: [
      { date: 'asc' },
      { shift: { order: 'asc' } }
    ],
    include: {
      shift: true
    }
  });

  res.json(apiSuccess(assignments));
}));

/**
 * GET /api/assignments/crew/:crewMemberId
 * Get all assignments for a specific crew member
 */
router.get('/crew/:crewMemberId', asyncHandler(async (req, res) => {
  const { crewMemberId } = req.params;
  const { startDate, endDate } = req.query;

  const where: any = { crewMemberId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      shift: true
    }
  });

  res.json(apiSuccess(assignments));
}));

/**
 * GET /api/assignments/:id
 * Get a single assignment by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: req.params.id },
    include: {
      shift: true
    }
  });

  if (!assignment) {
    return res.status(404).json(apiError('Assignment not found', 'NOT_FOUND'));
  }

  res.json(apiSuccess(assignment));
}));

/**
 * POST /api/assignments
 * Create a new assignment
 */
router.post('/', validate(CreateAssignmentSchema), asyncHandler(async (req, res) => {
  // Check if assignment already exists (unique constraint)
  const existing = await prisma.assignment.findFirst({
    where: {
      date: req.body.date,
      shiftId: req.body.shiftId,
      crewMemberId: req.body.crewMemberId,
      type: req.body.type
    }
  });

  if (existing) {
    return res.status(409).json(apiError('Assignment already exists for this date, shift, crew member, and type', 'CONFLICT'));
  }

  const assignment = await prisma.assignment.create({
    data: req.body,
    include: {
      shift: true
    }
  });

  // Broadcast assignment creation to all connected clients
  websocketService.emitAssignmentCreated(assignment);

  res.status(201).json(apiSuccess(assignment));
}));

/**
 * POST /api/assignments/bulk
 * Create multiple assignments at once
 */
router.post('/bulk', asyncHandler(async (req, res) => {
  const { assignments } = req.body;

  if (!Array.isArray(assignments)) {
    return res.status(400).json(apiError('Assignments must be an array', 'VALIDATION_ERROR'));
  }

  // Validate each assignment
  const validatedAssignments = assignments.map(a =>
    CreateAssignmentSchema.parse(a)
  ) as Array<{
    date: string;
    shiftId: string;
    crewMemberId: string;
    type: 'primary' | 'backup';
    notes?: string | null;
  }>;

  // Use createMany with skipDuplicates to handle unique constraint violations gracefully
  const result = await prisma.assignment.createMany({
    data: validatedAssignments,
    skipDuplicates: true, // Skip assignments that already exist (unique constraint)
  });

  // Fetch the created assignments to return with shift data and broadcast
  // Get all assignments for the dates in the validated assignments
  const dates = Array.from(new Set(validatedAssignments.map(a => a.date)));
  const created = await prisma.assignment.findMany({
    where: {
      date: { in: dates },
      OR: validatedAssignments.map(a => ({
        date: a.date,
        shiftId: a.shiftId,
        crewMemberId: a.crewMemberId,
        type: a.type
      }))
    },
    include: { shift: true }
  });

  // Broadcast bulk assignment creation to all connected clients
  created.forEach(assignment => {
    websocketService.emitAssignmentCreated(assignment);
  });

  res.status(201).json(apiSuccess({ count: result.count, assignments: created }));
}));

/**
 * PUT /api/assignments/:id
 * Update an existing assignment
 */
router.put('/:id', validate(UpdateAssignmentSchema), asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      shift: true
    }
  });

  // Broadcast assignment update to all connected clients
  websocketService.emitAssignmentUpdated(assignment);

  res.json(apiSuccess(assignment));
}));

/**
 * DELETE /api/assignments/:id
 * Delete a single assignment
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: req.params.id }
  });

  await prisma.assignment.delete({
    where: { id: req.params.id }
  });

  // Broadcast assignment deletion to all connected clients
  if (assignment) {
    websocketService.emitAssignmentDeleted(assignment);
  }

  res.json(apiSuccess({ deleted: true, id: req.params.id }));
}));

/**
 * DELETE /api/assignments/by-date/:date
 * Delete all assignments for a specific date
 */
router.delete('/by-date/:date', asyncHandler(async (req, res) => {
  const { date } = req.params;

  const result = await prisma.assignment.deleteMany({
    where: { date }
  });

  // Note: WebSocket broadcast for bulk delete not implemented (too many events)
  // Consider implementing a bulk delete event in websocketService if needed

  res.json(apiSuccess({ deleted: true, count: result.count, date }));
}));

/**
 * DELETE /api/assignments/crew/:crewMemberId
 * Delete all assignments for a specific crew member
 */
router.delete('/crew/:crewMemberId', asyncHandler(async (req, res) => {
  const { crewMemberId } = req.params;
  const { startDate, endDate } = req.query;

  const where: any = { crewMemberId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const result = await prisma.assignment.deleteMany({ where });

  // Note: WebSocket broadcast for bulk delete not implemented (too many events)
  // Consider implementing a bulk delete event in websocketService if needed

  res.json(apiSuccess({ deleted: true, count: result.count, crewMemberId }));
}));

export default router;
