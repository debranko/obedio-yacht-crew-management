/**
 * Guests API Routes
 * CRUD operations for yacht guests
 */

import { Router } from 'express';
import { asyncHandler, createValidationError, createNotFoundError } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { DatabaseService } from '../services/database';
import { Logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const logger = new Logger();

/**
 * GET /api/guests
 * Get all guests with filtering and pagination
 */
router.get('/', requirePermission('guests.view'), asyncHandler(async (req, res) => {
  const { status, type, search, page, limit } = req.query;
  
  const filters = {
    status: status as string,
    type: type as string,
    search: search as string,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 25
  };

  const result = await dbService.getGuests(filters);

  res.json({
    success: true,
    data: result.items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
}));

/**
 * POST /api/guests
 * Create new guest
 */
router.post('/', requirePermission('guests.add'), asyncHandler(async (req, res) => {
  const guestData = {
    ...req.body,
    createdBy: req.user?.username || 'System'
  };

  const guest = await dbService.createGuest(guestData);

  logger.info('Guest created', { guestId: guest.id, name: `${guest.firstName} ${guest.lastName}`, createdBy: req.user?.username });

  res.status(201).json({
    success: true,
    message: 'Guest created successfully',
    data: guest
  });
}));

/**
 * PUT /api/guests/:id
 * Update existing guest
 */
router.put('/:id', requirePermission('guests.edit'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const guest = await dbService.updateGuest(id, updates);

  logger.info('Guest updated', { guestId: guest.id, name: `${guest.firstName} ${guest.lastName}`, updatedBy: req.user?.username });

  res.json({
    success: true,
    message: 'Guest updated successfully',
    data: guest
  });
}));

/**
 * DELETE /api/guests/:id
 * Delete guest
 */
router.delete('/:id', requirePermission('guests.delete'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  await dbService.deleteGuest(id);

  logger.info('Guest deleted', { guestId: id, deletedBy: req.user?.username });

  res.json({
    success: true,
    message: 'Guest deleted successfully'
  });
}));

export default router;