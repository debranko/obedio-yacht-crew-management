import { Router } from 'express';
import { prisma } from '../services/db';

const router = Router();

router.get('/', async (_, res) => {
  try {
    const data = await prisma.guest.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: {
        serviceRequests: {
          select: { id: true, status: true }
        }
      }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch guests' });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body ?? {};
    const { 
      firstName, 
      lastName, 
      preferredName, 
      photo,
      type, 
      status, 
      nationality, 
      languages,
      passportNumber
    } = body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        error: 'First name and last name are required' 
      });
    }

    // Create with only fields that exist in Prisma schema
    const item = await prisma.guest.create({ 
      data: { 
        firstName, 
        lastName, 
        preferredName: preferredName || null,
        photo: photo || null,
        type: type ?? 'guest',
        status: status ?? 'expected',
        nationality: nationality || null,
        languages: Array.isArray(languages) ? languages : [],
        passportNumber: passportNumber || null
      } 
    });
    
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Create guest error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create guest' 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.guest.findUnique({
      where: { id },
      include: {
        serviceRequests: true
      }
    });
    
    if (!data) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch guest' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};
    const {
      firstName,
      lastName,
      preferredName,
      photo,
      type,
      status,
      nationality,
      languages,
      passportNumber
    } = body;
    
    // Update with only fields that exist in Prisma schema
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (preferredName !== undefined) updateData.preferredName = preferredName;
    if (photo !== undefined) updateData.photo = photo;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (languages !== undefined) updateData.languages = Array.isArray(languages) ? languages : [];
    if (passportNumber !== undefined) updateData.passportNumber = passportNumber;
    
    const data = await prisma.guest.update({
      where: { id },
      data: updateData
    });
    
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Update guest error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update guest' 
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.guest.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete guest' });
  }
});

export default router;