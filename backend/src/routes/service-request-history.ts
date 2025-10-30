import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get service request history with filters
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      userId, 
      serviceRequestId,
      startDate,
      endDate,
      action
    } = req.query;
    
    const where: any = {};
    
    if (userId) {
      where.userId = userId as string;
    }
    
    if (serviceRequestId) {
      where.serviceRequestId = serviceRequestId as string;
    }
    
    if (action) {
      where.action = action as string;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }
    
    const [history, total] = await Promise.all([
      prisma.serviceRequestHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.serviceRequestHistory.count({ where })
    ]);
    
    res.json({
      data: history,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching service request history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create service request history entry
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      serviceRequestId,
      action,
      previousStatus,
      newStatus,
      notes,
      metadata
    } = req.body;
    
    if (!serviceRequestId || !action || !newStatus) {
      return res.status(400).json({ 
        error: 'serviceRequestId, action, and newStatus are required' 
      });
    }
    
    const historyEntry = await prisma.serviceRequestHistory.create({
      data: {
        serviceRequestId,
        action,
        previousStatus,
        newStatus,
        notes,
        userId,
        metadata: metadata || {}
      }
    });
    
    res.status(201).json(historyEntry);
  } catch (error) {
    console.error('Error creating service request history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get history for a specific service request
router.get('/request/:serviceRequestId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { serviceRequestId } = req.params;
    
    const history = await prisma.serviceRequestHistory.findMany({
      where: { serviceRequestId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching service request history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get completed service requests for activity log
router.get('/completed', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    // Get completed service requests
    const completedRequests = await prisma.serviceRequest.findMany({
      where: { 
        status: 'completed',
        OR: search ? [
          { notes: { contains: search as string, mode: 'insensitive' } },
          { guest: { firstName: { contains: search as string, mode: 'insensitive' } } },
          { guest: { lastName: { contains: search as string, mode: 'insensitive' } } },
          { location: { name: { contains: search as string, mode: 'insensitive' } } }
        ] : undefined
      },
      include: {
        guest: true,
        location: true
      },
      orderBy: { updatedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });
    
    // Transform to match frontend expectations
    const transformedData = completedRequests.map(req => {
      // Get completion time from history or use updatedAt
      const completedAt = req.updatedAt;
      const createdAt = new Date(req.createdAt);
      const duration = Math.floor((completedAt.getTime() - createdAt.getTime()) / 1000);

      return {
        id: req.id,
        originalRequest: {
          id: req.id,
          guestName: req.guest ? `${req.guest.firstName} ${req.guest.lastName}` : 'Unknown Guest',
          guestCabin: req.location?.name || 'Unknown Location',
          cabinId: req.locationId || '',
          requestType: req.requestType,
          priority: req.priority,
          timestamp: createdAt,
          voiceTranscript: req.notes,
          status: req.status,
          assignedTo: req.assignedTo || 'Staff', // Use actual assigned crew member
          notes: req.notes
        },
        completedBy: req.assignedTo || 'Staff', // Use actual assigned crew member who completed it
        completedAt,
        duration
      };
    });
    
    const total = await prisma.serviceRequest.count({
      where: { status: 'completed' }
    });
    
    res.json({
      data: transformedData,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching completed service requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;