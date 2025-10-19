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
    const { firstName, lastName, preferredName, type, status, nationality, languages } = req.body ?? {};
    
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        error: 'First name and last name are required' 
      });
    }

    const item = await prisma.guest.create({ 
      data: { 
        firstName, 
        lastName, 
        preferredName,
        type: type ?? 'guest',
        status: status ?? 'onboard',
        nationality,
        languages: languages ?? []
      } 
    });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create guest' });
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
    const { firstName, lastName, preferredName, type, status, nationality, languages } = req.body;
    
    const data = await prisma.guest.update({
      where: { id },
      data: { firstName, lastName, preferredName, type, status, nationality, languages }
    });
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update guest' });
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