import { Router } from 'express';
import { prisma } from '../services/db';
import { asyncHandler, validate } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { CreateLocationSchema, UpdateLocationSchema } from '../validators/schemas';
import { websocketService } from '../services/websocket';
import { apiSuccess, apiError } from '../utils/api-response';

const r = Router();

// Require authentication for all location routes
r.use(requirePermission('locations.view'));

// GET all locations
r.get('/', asyncHandler(async (_, res) => {
  // Use raw SQL to avoid Prisma client type confusion with Guest.type vs Location.type
  const data = await prisma.$queryRaw`
    SELECT * FROM "Location"
    ORDER BY name ASC
  ` as any[];
  res.json(apiSuccess(data));
}));

// GET single location by ID
r.get('/:id', asyncHandler(async (req, res) => {
  const data = await prisma.location.findUnique({
    where: { id: req.params.id },
    include: {
      guests: true,
      serviceRequests: true
    }
  });

  if (!data) {
    return res.status(404).json(apiError('Location not found', 'NOT_FOUND'));
  }

  res.json(apiSuccess(data));
}));

// POST create new location
r.post('/', requirePermission('locations.create'), validate(CreateLocationSchema), asyncHandler(async (req, res) => {
  const { name, type, floor, description, image, smartButtonId, doNotDisturb } = req.body;

  const data = await prisma.location.create({
    data: {
      name,
      type,
      floor,
      description,
      image,
      smartButtonId,
      doNotDisturb,
    }
  });

  // Emit WebSocket event for real-time updates
  websocketService.emitLocationEvent('created', data);

  res.status(201).json(apiSuccess(data));
}));

// PUT update location
r.put('/:id', requirePermission('locations.update'), validate(UpdateLocationSchema), asyncHandler(async (req, res) => {
  const { name, type, floor, description, image, smartButtonId, doNotDisturb } = req.body;

  const data = await prisma.location.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      ...(floor !== undefined && { floor }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
      ...(smartButtonId !== undefined && { smartButtonId }),
      ...(doNotDisturb !== undefined && { doNotDisturb }),
    }
  });

  // Emit WebSocket event for real-time updates
  websocketService.emitLocationEvent('updated', data);

  // If DND status changed, emit specific DND toggle event
  if (doNotDisturb !== undefined) {
    websocketService.emitLocationDndToggled(data);
    console.log(`🚪 DND toggled: ${data.name} → ${data.doNotDisturb ? 'ON' : 'OFF'}`);
  }

  res.json(apiSuccess(data));
}));

// DELETE location
r.delete('/:id', requirePermission('locations.delete'), asyncHandler(async (req, res) => {
  // Check if location has guests or service requests
  const location = await prisma.location.findUnique({
    where: { id: req.params.id },
    include: {
      guests: true,
      serviceRequests: true
    }
  });

  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'Location not found'
    });
  }

  if (location.guests.length > 0 || location.serviceRequests.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete location with assigned guests or service requests'
    });
  }

  await prisma.location.delete({
    where: { id: req.params.id }
  });

  // Emit WebSocket event for real-time updates
  websocketService.emitLocationEvent('deleted', location);

  res.json({ success: true, message: 'Location deleted successfully' });
}));

// POST toggle DND
r.post('/:id/toggle-dnd', asyncHandler(async (req, res) => {
  const { enabled } = req.body;

  const location = await prisma.location.update({
    where: { id: req.params.id },
    data: {
      doNotDisturb: enabled
    },
    include: {
      guests: true,
      serviceRequests: true
    }
  });

  // Broadcast DND toggle to all connected clients
  websocketService.emitLocationDndToggled(location);

  res.json(apiSuccess({ location }));
}));

// GET DND locations
r.get('/dnd/active', asyncHandler(async (_, res) => {
  const data = await prisma.location.findMany({
    where: { doNotDisturb: true }
  });
  res.json(apiSuccess(data));
}));

export default r;