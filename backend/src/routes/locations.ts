import { Router } from 'express';
import { prisma } from '../services/db';
import { asyncHandler, validate } from '../middleware/error-handler';
import { CreateLocationSchema, UpdateLocationSchema } from '../validators/schemas';
import { websocketService } from '../services/websocket';

const r = Router();

// GET all locations
r.get('/', asyncHandler(async (_, res) => {
  const data = await prisma.location.findMany({
    orderBy: { name: 'asc' },
    include: {
      guests: true,
      serviceRequests: true
    }
  });
  res.json({ success: true, data, count: data.length });
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
    return res.status(404).json({ success: false, message: 'Location not found' });
  }

  res.json({ success: true, data });
}));

// POST create new location
r.post('/', validate(CreateLocationSchema), asyncHandler(async (req, res) => {
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

  res.status(201).json({ success: true, data });
}));

// PUT update location
r.put('/:id', validate(UpdateLocationSchema), asyncHandler(async (req, res) => {
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

  res.json({ success: true, data });
}));

// DELETE location
r.delete('/:id', asyncHandler(async (req, res) => {
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

  res.json({ success: true, data: { location } });
}));

// GET DND locations
r.get('/dnd/active', asyncHandler(async (_, res) => {
  const data = await prisma.location.findMany({
    where: { doNotDisturb: true }
  });
  res.json({ success: true, data });
}));

export default r;