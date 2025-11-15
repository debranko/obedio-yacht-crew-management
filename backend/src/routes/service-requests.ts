/**
 * Service Requests API Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { DatabaseService } from '../services/database';
import { websocketService } from '../services/websocket';
import { apiSuccess, apiError } from '../utils/api-response';

// Try to import MQTT service if available
let mqttService: any = null;
try {
  const mqttModule = require('../services/mqtt.service');
  mqttService = mqttModule.mqttService;
} catch (e) {
  console.warn('⚠️ MQTT service not available - notifications to watches disabled');
}

const router = Router();
const dbService = new DatabaseService();

router.get('/', requirePermission('service-requests.view'), asyncHandler(async (req, res) => {
  const { status, priority, page, limit } = req.query;
  const filters = { status: status as string, priority: priority as string, page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 25 };
  const result = await dbService.getServiceRequests(filters);
  res.json(apiSuccess(result.items, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }));
}));

router.post('/', requirePermission('service-requests.create'), asyncHandler(async (req, res) => {
  const request = await dbService.createServiceRequest(req.body);

  // Broadcast new service request to all connected clients
  websocketService.emitServiceRequestCreated(request);

  res.status(201).json(apiSuccess(request));
}));

router.put('/:id/accept', requirePermission('service-requests.accept'), asyncHandler(async (req, res) => {
  const { crewMemberId, confirmed = false } = req.body;
  const request = await dbService.acceptServiceRequest(req.params.id, crewMemberId, confirmed);

  // Broadcast service request assignment to all connected clients
  websocketService.emitServiceRequestAssigned(request);
  websocketService.emitServiceRequestStatusChanged(request);
  websocketService.emitServiceRequestUpdated(request);

  // Send MQTT notification to assigned crew member's watch (if they have one)
  // Only send MQTT notification if not yet confirmed (i.e., web app delegation)
  // If confirmed=true (from watch), notification already received
  if (!confirmed && mqttService) {
    try {
      await mqttService.notifyAssignedCrewWatch(
        request,
        request.location?.name || request.guestCabin || 'Unknown',
        request.guest
      );
    } catch (error) {
      console.warn('⚠️ Failed to send MQTT notification:', error);
    }
  }

  res.json(apiSuccess(request));
}));

router.put('/:id/complete', requirePermission('service-requests.complete'), asyncHandler(async (req, res) => {
  const request = await dbService.completeServiceRequest(req.params.id);

  // Broadcast service request completion to all connected clients
  websocketService.emitServiceRequestCompleted(request);
  websocketService.emitServiceRequestStatusChanged(request);

  // Publish MQTT update for watches to clear "Serving now"
  if (mqttService) {
    try {
      mqttService.publish('obedio/service/update', {
        requestId: request.id,
        status: 'completed',
        assignedTo: request.assignedToId,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn('⚠️ Failed to publish MQTT update:', error);
    }
  }

  res.json(apiSuccess(request));
}));

router.delete('/clear-all', requirePermission('service-requests.delete'), asyncHandler(async (req, res) => {
  await dbService.deleteAllServiceRequests();
  res.json(apiSuccess({ message: 'All service requests deleted' }));
}));

export default router;