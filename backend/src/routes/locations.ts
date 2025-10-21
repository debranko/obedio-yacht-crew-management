import { Router } from 'express';
import { prisma } from '../services/db';

const r = Router();

// GET all locations
r.get('/', async (_, res) => {
  try {
    const data = await prisma.location.findMany({ 
      orderBy: { name: 'asc' },
      include: {
        guests: true,
        serviceRequests: true
      }
    });
    res.json({ success: true, data, count: data.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single location by ID
r.get('/:id', async (req, res) => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new location
r.post('/', async (req, res) => {
  try {
    const { name, type, floor, description, status } = req.body;
    
    // Validation
    if (!name || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and type are required' 
      });
    }
    
    const data = await prisma.location.create({
      data: {
        name,
        type,
        floor,
        description,
      }
    });
    
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        message: 'Location with this name already exists' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update location
r.put('/:id', async (req, res) => {
  try {
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
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        message: 'Location not found' 
      });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        message: 'Location with this name already exists' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE location
r.delete('/:id', async (req, res) => {
  try {
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
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        message: 'Location not found' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST toggle DND
r.post('/:id/toggle-dnd', async (req, res) => {
  try {
    const { enabled } = req.body;
    
    const location = await prisma.location.update({
      where: { id: req.params.id },
      data: {
        // Note: doNotDisturb field not in schema yet, add if needed
      }
    });
    
    res.json({ success: true, data: { location } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET DND locations
r.get('/dnd/active', async (_, res) => {
  try {
    // Note: doNotDisturb field not in schema, returning empty for now
    const data: any[] = [];
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default r;