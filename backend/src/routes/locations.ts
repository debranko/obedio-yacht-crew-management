/**
 * Locations API Routes
 * CRUD operations for yacht locations/areas
 */

import { Router } from 'express';
import { asyncHandler, createValidationError, createNotFoundError } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { DatabaseService } from '../services/database';
import { RealtimeService } from '../services/realtime';
import { Logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const logger = new Logger();

/**
 * GET /api/locations
 * Get all locations with optional filtering
 */
router.get('/', requirePermission('locations.view'), asyncHandler(async (req, res) => {
  const { search, type, status, floor } = req.query;
  
  const locations = await dbService.getLocations();
  
  // Apply client-side filtering for now (can be moved to database later)
  let filtered = locations;
  
  if (search) {
    const searchTerm = (search as string).toLowerCase();
    filtered = filtered.filter(loc => 
      loc.name.toLowerCase().includes(searchTerm) ||
      loc.description?.toLowerCase().includes(searchTerm) ||
      loc.floor?.toLowerCase().includes(searchTerm)
    );
  }
  
  if (type && type !== 'All') {
    filtered = filtered.filter(loc => loc.type === (type as string).toUpperCase());
  }
  
  if (status && status !== 'All') {
    filtered = filtered.filter(loc => loc.status === (status as string).toUpperCase());
  }
  
  if (floor && floor !== 'All') {
    filtered = filtered.filter(loc => loc.floor === floor);
  }

  res.json({
    success: true,
    data: filtered,
    count: filtered.length
  });
}));

/**
 * GET /api/locations/:id
 * Get specific location by ID
 */
router.get('/:id', requirePermission('locations.view'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const location = await dbService.getLocationById(id);

  if (!location) {
    throw createNotFoundError('Location');
  }

  res.json({
    success: true,
    data: location
  });
}));

/**
 * POST /api/locations
 * Create new location
 */
router.post('/', requirePermission('locations.add'), asyncHandler(async (req, res) => {
  const { name, type, description, floor, capacity, status, smartButtonId, image, notes } = req.body;

  // Validation
  if (!name || !type) {
    throw createValidationError('Name and type are required');
  }

  const locationData = {
    name: name.trim(),
    type: type.toUpperCase(),
    description: description?.trim() || null,
    floor: floor?.trim() || null,
    capacity: capacity ? parseInt(capacity) : null,
    status: status?.toUpperCase() || 'ACTIVE',
    smartButtonId: smartButtonId?.trim() || null,
    image: image?.trim() || null,
    notes: notes?.trim() || null,
    createdBy: req.user?.username || 'System'
  };

  const location = await dbService.createLocation(locationData);

  // Log activity
  await dbService.createActivityLog({
    type: 'SYSTEM',
    action: 'Location Created',
    locationId: location.id,
    userId: req.user?.id,
    details: `Location "${location.name}" created by ${req.user?.username}`
  });

  logger.info('Location created', { locationId: location.id, name: location.name, createdBy: req.user?.username });

  res.status(201).json({
    success: true,
    message: 'Location created successfully',
    data: location
  });
}));

/**
 * PUT /api/locations/:id
 * Update existing location
 */
router.put('/:id', requirePermission('locations.edit'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if location exists
  const existingLocation = await dbService.getLocationById(id);

  if (!existingLocation) {
    throw createNotFoundError('Location');
  }

  // Prepare update data
  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.type !== undefined) updateData.type = updates.type.toUpperCase();
  if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
  if (updates.floor !== undefined) updateData.floor = updates.floor?.trim() || null;
  if (updates.capacity !== undefined) updateData.capacity = updates.capacity ? parseInt(updates.capacity) : null;
  if (updates.status !== undefined) updateData.status = updates.status.toUpperCase();
  if (updates.doNotDisturb !== undefined) updateData.doNotDisturb = Boolean(updates.doNotDisturb);
  if (updates.smartButtonId !== undefined) updateData.smartButtonId = updates.smartButtonId?.trim() || null;
  if (updates.image !== undefined) updateData.image = updates.image?.trim() || null;
  if (updates.notes !== undefined) updateData.notes = updates.notes?.trim() || null;

  const location = await dbService.updateLocation(id, updateData);

  // Log activity for important changes
  if (updates.doNotDisturb !== undefined) {
    await dbService.createActivityLog({
      type: 'DND',
      action: updates.doNotDisturb ? 'DND Enabled' : 'DND Disabled',
      locationId: location.id,
      userId: req.user?.id,
      details: `DND ${updates.doNotDisturb ? 'enabled' : 'disabled'} for ${location.name} by ${req.user?.username}`
    });
  }

  logger.info('Location updated', { locationId: location.id, name: location.name, updatedBy: req.user?.username });

  res.json({
    success: true,
    message: 'Location updated successfully',
    data: location
  });
}));

/**
 * DELETE /api/locations/:id
 * Delete location (admin/ETO only)
 */
router.delete('/:id', requirePermission('locations.delete'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if location exists
  const existingLocation = await dbService.getLocationById(id);

  if (!existingLocation) {
    throw createNotFoundError('Location');
  }

  // Check for dependencies
  if (existingLocation.guests.length > 0) {
    throw createValidationError('Cannot delete location with active guests');
  }

  if (existingLocation.serviceRequests.length > 0) {
    throw createValidationError('Cannot delete location with pending service requests');
  }

  await dbService.deleteLocation(id);

  // Log activity
  await dbService.createActivityLog({
    type: 'SYSTEM',
    action: 'Location Deleted',
    userId: req.user?.id,
    details: `Location "${existingLocation.name}" deleted by ${req.user?.username}`
  });

  logger.info('Location deleted', { locationId: id, name: existingLocation.name, deletedBy: req.user?.username });

  res.json({
    success: true,
    message: 'Location deleted successfully'
  });
}));

/**
 * POST /api/locations/:id/toggle-dnd
 * Toggle Do Not Disturb status for location (atomic operation)
 */
router.post('/:id/toggle-dnd', requirePermission('locations.edit'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { enabled, guestId } = req.body;

  if (typeof enabled !== 'boolean') {
    throw createValidationError('enabled field must be a boolean');
  }

  const result = await dbService.toggleDND(id, enabled, guestId);

  logger.info('DND toggled', { 
    locationId: id, 
    enabled, 
    guestId, 
    toggledBy: req.user?.username 
  });

  res.json({
    success: true,
    message: `DND ${enabled ? 'enabled' : 'disabled'} successfully`,
    data: result
  });
}));

/**
 * GET /api/locations/dnd/active
 * Get all locations with DND active
 */
router.get('/dnd/active', requirePermission('locations.view'), asyncHandler(async (req, res) => {
  const dndLocations = await dbService.getDNDLocations();

  res.json({
    success: true,
    data: dndLocations,
    count: dndLocations.length
  });
}));

export default router;