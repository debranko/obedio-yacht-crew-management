/**
 * Service Requests API Routes
 */

import { Router } from 'express';
import { asyncHandler, validate } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { DatabaseService } from '../services/database';
import { CreateServiceRequestSchema, UpdateServiceRequestSchema } from '../validators/schemas';
import { websocketService } from '../services/websocket';
import { mqttService } from '../services/mqtt.service';
import { apiSuccess, apiError } from '../utils/api-response';

const router = Router();
const dbService = new DatabaseService();

router.get('/', requirePermission('service-requests.view'), asyncHandler(async (req, res) => {
  const { status, priority, page, limit } = req.query;
  const filters = { status: status as string, priority: priority as string, page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 25 };
  const result = await dbService.getServiceRequests(filters);
  res.json(apiSuccess(result.items, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }));
}));

router.post('/', requirePermission('service-requests.create'), validate(CreateServiceRequestSchema), asyncHandler(async (req, res) => {
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
  if (!confirmed) {
    await mqttService.notifyAssignedCrewWatch(
      request,
      request.location?.name || request.guestCabin || 'Unknown',
      request.guest
    );
  }

  // CRITICAL: Publish MQTT update for ALL watches to dismiss this request
  // This allows cross-device sync - when one watch accepts, others dismiss
  mqttService.publish('obedio/service/update', {
    requestId: request.id,
    status: 'serving',
    assignedTo: request.assignedTo,
    assignedToId: request.assignedToId,
    acknowledgedAt: new Date().toISOString()
  });

  res.json(apiSuccess(request));
}));

router.put('/:id/delegate', requirePermission('service-requests.update'), asyncHandler(async (req, res) => {
  const { toCrewMemberId, fromCrewMemberId, reason } = req.body;
  const requestId = req.params.id;

  if (!toCrewMemberId) {
    res.status(400).json(apiError('toCrewMemberId is required'));
    return;
  }

  // Get current request
  const currentRequest = await dbService.getServiceRequestById(requestId);
  if (!currentRequest) {
    res.status(404).json(apiError('Service request not found'));
    return;
  }

  // Update request - reassign to new crew member, keep status as pending
  const noteAddition = `[Delegated${fromCrewMemberId ? ` from ${fromCrewMemberId}` : ''}: ${reason || 'via watch'}]`;
  const updatedRequest = await dbService.updateServiceRequest(requestId, {
    assignedToId: toCrewMemberId,
    notes: currentRequest.notes ? `${currentRequest.notes}\n${noteAddition}` : noteAddition
  });

  // Broadcast via WebSocket
  websocketService.emitServiceRequestUpdated(updatedRequest);

  // Send MQTT notification to new crew member's watch
  await mqttService.notifyAssignedCrewWatch(
    updatedRequest,
    updatedRequest.location?.name || updatedRequest.guestCabin || 'Unknown',
    updatedRequest.guest
  );

  // Publish MQTT update for cross-device sync (original watch should dismiss)
  mqttService.publish('obedio/service/update', {
    requestId: requestId,
    status: 'delegated',
    delegatedTo: toCrewMemberId,
    delegatedFrom: fromCrewMemberId,
    timestamp: new Date().toISOString()
  });

  res.json(apiSuccess(updatedRequest));
}));

router.put('/:id/complete', requirePermission('service-requests.complete'), asyncHandler(async (req, res) => {
  const request = await dbService.completeServiceRequest(req.params.id);

  // Broadcast service request completion to all connected clients
  websocketService.emitServiceRequestCompleted(request);
  websocketService.emitServiceRequestStatusChanged(request);

  // Publish MQTT update for watches to clear "Serving now"
  mqttService.publish('obedio/service/update', {
    requestId: request.id,
    status: 'completed',
    assignedTo: request.assignedToId,
    completedAt: new Date().toISOString()
  });

  res.json(apiSuccess(request));
}));

router.put('/:id', requirePermission('service-requests.update'), validate(UpdateServiceRequestSchema), asyncHandler(async (req, res) => {
  const request = await dbService.updateServiceRequest(req.params.id, req.body);

  // Broadcast service request update to all connected clients
  websocketService.emitServiceRequestUpdated(request);

  res.json(apiSuccess(request));
}));

router.delete('/clear-all', requirePermission('service-requests.delete'), asyncHandler(async (req, res) => {
  await dbService.deleteAllServiceRequests();

  // Publish MQTT update for watches to clear all pending requests
  mqttService.publish('obedio/service/update', {
    action: 'clear-all',
    status: 'deleted',
    timestamp: new Date().toISOString()
  });

  res.json(apiSuccess({ message: 'All service requests deleted' }));
}));

router.delete('/:id', requirePermission('service-requests.delete'), asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  await dbService.deleteServiceRequest(requestId);

  // Publish MQTT update for watches to remove this request
  mqttService.publish('obedio/service/update', {
    requestId: requestId,
    status: 'deleted',
    timestamp: new Date().toISOString()
  });

  // Broadcast via WebSocket
  websocketService.emitServiceRequestDeleted(requestId);

  res.json(apiSuccess({ message: 'Service request deleted', id: requestId }));
}));

export default router;