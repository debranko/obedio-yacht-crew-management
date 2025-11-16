import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';
import { calculatePagination, buildPaginationMeta } from '../utils/pagination';
import { asyncHandler } from '../middleware/error-handler';
import { apiSuccess, apiError } from '../utils/api-response';

const router = Router();

// Get service request history with filters
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 50,
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

    const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(Number(page), Number(limit));

    const [history, total] = await Promise.all([
      prisma.serviceRequestHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      prisma.serviceRequestHistory.count({ where })
    ]);

  res.json(apiSuccess(history, buildPaginationMeta(total, pageNum, limitNum)));
}));

// Create service request history entry
router.post('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const {
    serviceRequestId,
    action,
    newStatus,
    notes,
    metadata
  } = req.body;

  if (!serviceRequestId || !action || !newStatus) {
    return res.status(400).json(apiError(
      'serviceRequestId, action, and newStatus are required',
      'VALIDATION_ERROR'
    ));
  }

  const historyEntry = await prisma.serviceRequestHistory.create({
    data: {
      serviceRequestId,
      action,
      newStatus,
      notes,
      userId,
      metadata: metadata || {}
    }
  });

  res.status(201).json(apiSuccess(historyEntry));
}));

// Get history for a specific service request
router.get('/request/:serviceRequestId', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { serviceRequestId } = req.params;

  const history = await prisma.serviceRequestHistory.findMany({
    where: { serviceRequestId },
    orderBy: { createdAt: 'desc' }
  });

  res.json(apiSuccess(history));
}));

// Get completed service requests for activity log
router.get('/completed', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 50, search } = req.query;

    const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(Number(page), Number(limit));

    // Get completed service requests with full relations
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
        location: true,
        category: true,
        crewmember: true  // Include crew member who completed the request
      },
      orderBy: { updatedAt: 'desc' },
      take,
      skip
    });
    
    // Transform to match frontend expectations
    const transformedData = completedRequests.map(req => {
      // Calculate duration
      const completedAt = req.completedAt || req.updatedAt;
      const createdAt = new Date(req.createdAt);
      const acceptedAt = req.acceptedAt ? new Date(req.acceptedAt) : createdAt;

      // Duration from accepted to completed (or from created if not accepted)
      const duration = Math.floor((completedAt.getTime() - acceptedAt.getTime()) / 1000);

      // Get crew member name
      const crewMemberName = req.crewmember?.name || req.assignedTo || 'Staff';

      // Map location name to cabin image
      const cabinImage = req.location?.name ? `/images/locations/${req.location.name}.jpg` : undefined;

      return {
        id: req.id,
        originalRequest: {
          id: req.id,
          guestName: req.guest ? `${req.guest.firstName} ${req.guest.lastName}` : 'Unknown Guest',
          guestCabin: req.location?.name || 'Unknown Location',
          cabinId: req.locationId || '',
          cabinImage,
          requestType: req.requestType,
          priority: req.priority,
          timestamp: createdAt,
          voiceTranscript: req.voiceTranscript,
          // voiceAudioUrl: req.voiceAudioUrl,
          status: req.status,
          assignedTo: crewMemberName,
          categoryId: req.categoryId,
          category: req.category ? {
            id: req.category.id,
            name: req.category.name,
            icon: req.category.icon,
            color: req.category.color,
            description: req.category.description,
            order: req.category.order,
            isActive: req.category.isActive
          } : undefined,
          acceptedAt: req.acceptedAt,
          completedAt: req.completedAt,
          notes: req.notes
        },
        completedBy: crewMemberName,
        completedAt,
        duration
      };
    });
    
    const total = await prisma.serviceRequest.count({
      where: { status: 'completed' }
    });

  res.json(apiSuccess(transformedData, buildPaginationMeta(total, pageNum, limitNum)));
}));

export default router;