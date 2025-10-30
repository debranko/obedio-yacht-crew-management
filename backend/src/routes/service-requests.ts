/**
 * Service Requests API Routes
 */

import { Router } from 'express';
import { asyncHandler, validate } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { generalRateLimiter } from '../middleware/rate-limiter';
import { DatabaseService } from '../services/database';
import { CreateServiceRequestSchema, UpdateServiceRequestSchema } from '../validators/schemas';
import { websocketService } from '../services/websocket';

const router = Router();
const dbService = new DatabaseService();

router.get('/', requirePermission('service-requests.view'), asyncHandler(async (req, res) => {
  const { status, priority, page, limit } = req.query;
  const filters = { status: status as string, priority: priority as string, page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 25 };
  const result = await dbService.getServiceRequests(filters);
  res.json({ success: true, data: result.items, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
}));

router.post('/', generalRateLimiter, requirePermission('service-requests.create'), validate(CreateServiceRequestSchema), asyncHandler(async (req, res) => {
  const request = await dbService.createServiceRequest(req.body);

  // Broadcast new service request to all connected clients
  websocketService.emitServiceRequestCreated(request);

  res.status(201).json({ success: true, data: request });
}));

router.post('/:id/accept', requirePermission('service-requests.accept'), asyncHandler(async (req, res) => {
  const { crewMemberId } = req.body;

  if (!crewMemberId) {
    return res.status(400).json({
      success: false,
      error: 'crewMemberId is required. Please select a crew member to assign the request.'
    });
  }

  const request = await dbService.acceptServiceRequest(req.params.id, crewMemberId);

  // Broadcast service request update to all connected clients
  websocketService.emitServiceRequestUpdated(request);

  res.json({ success: true, data: request });
}));

router.post('/:id/delegate', requirePermission('service-requests.delegate'), asyncHandler(async (req, res) => {
  const { newCrewMemberId } = req.body;

  if (!newCrewMemberId) {
    return res.status(400).json({
      success: false,
      error: 'newCrewMemberId is required. Please select a crew member to delegate the request to.'
    });
  }

  const request = await dbService.delegateServiceRequest(req.params.id, newCrewMemberId);

  // Broadcast service request update to all connected clients (for Wear OS, ESP32, smart buttons)
  websocketService.emitServiceRequestUpdated(request);

  res.json({ success: true, data: request, message: 'Service request delegated successfully' });
}));

router.post('/:id/complete', requirePermission('service-requests.complete'), asyncHandler(async (req, res) => {
  console.log('🎯 Complete service request endpoint called:', {
    requestId: req.params.id,
    userId: (req as any).user?.id,
    userRole: (req as any).user?.role
  });

  const request = await dbService.completeServiceRequest(req.params.id);
  console.log('✅ Service request completed successfully:', {
    requestId: request.id,
    status: request.status,
    completedAt: request.completedAt
  });

  // Broadcast service request completion to all connected clients
  websocketService.emitServiceRequestCompleted(request);

  res.json({ success: true, data: request });
}));

// GET single service request by ID
router.get('/:id', requirePermission('service-requests.view'), asyncHandler(async (req, res) => {
  const request = await dbService.getServiceRequestById(req.params.id);
  res.json({ success: true, data: request });
}));

// PUT general update for service request
router.put('/:id', requirePermission('service-requests.edit'), validate(UpdateServiceRequestSchema), asyncHandler(async (req, res) => {
  const request = await dbService.updateServiceRequest(req.params.id, req.body);

  // Broadcast service request update to all connected clients
  websocketService.emitServiceRequestUpdated(request);

  res.json({ success: true, data: request });
}));

// POST cancel service request
router.post('/:id/cancel', requirePermission('service-requests.cancel'), asyncHandler(async (req, res) => {
  const { cancelledBy } = req.body;
  const request = await dbService.cancelServiceRequest(req.params.id, cancelledBy);

  // Broadcast service request update to all connected clients
  websocketService.emitServiceRequestUpdated(request);

  res.json({ success: true, data: request });
}));

export default router;