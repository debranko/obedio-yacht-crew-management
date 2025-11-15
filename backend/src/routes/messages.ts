import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';
import { websocketService } from '../services/websocket';
import { calculatePagination, buildPaginationMeta } from '../utils/pagination';
import { asyncHandler } from '../middleware/error-handler';
import { apiSuccess, apiError } from '../utils/api-response';

const router = Router();

// Get messages for the authenticated user
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { type, unreadOnly, page = 1, limit = 50 } = req.query;

  const where: any = {
    OR: [
      { receiverId: userId },
      { receiverId: null }, // Broadcast messages
      { senderId: userId }
    ]
  };

  if (type) {
    where.type = type as string;
  }

  if (unreadOnly === 'true') {
    where.isRead = false;
    where.receiverId = userId;
  }

  const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(Number(page), Number(limit));

  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true
        }
      },
      receiver: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take,
    skip
  });

  const total = await prisma.message.count({ where });

  // Wrap messages + pagination in a single object so fetchApi returns both fields
  const response = {
    messages: messages,
    pagination: buildPaginationMeta(total, pageNum, limitNum)
  };
  res.json(apiSuccess(response));
}));

// Get conversation between two users
router.get('/conversation/:otherUserId', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { otherUserId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const { skip, take } = calculatePagination(Number(page), Number(limit));

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take,
    skip
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  res.json(apiSuccess(messages));
}));

// Send a message
router.post('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const senderId = (req as any).user.id;
  const { receiverId, content, type = 'text', priority = 'normal' } = req.body;

  if (!content) {
    return res.status(400).json(apiError('Message content is required', 'VALIDATION_ERROR'));
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      content,
      type,
      priority
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true
        }
      },
      receiver: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  });

  // Send real-time notification via WebSocket
  if (receiverId) {
    websocketService.sendToUser(receiverId, 'new_message', message);
  } else {
    // Broadcast message
    websocketService.broadcast('broadcast_message', message);
  }

  res.status(201).json(apiSuccess(message));
}));

// Mark message as read
router.put('/:messageId/read', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { messageId } = req.params;

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      receiverId: userId
    }
  });

  if (!message) {
    return res.status(404).json(apiError('Message not found', 'NOT_FOUND'));
  }

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  res.json(apiSuccess(updatedMessage));
}));

// Mark all messages as read
router.put('/mark-all-read', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const result = await prisma.message.updateMany({
    where: {
      receiverId: userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  res.json(apiSuccess({ count: result.count }));
}));

// Delete a message (soft delete - just removes from user's view)
router.delete('/:messageId', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { messageId } = req.params;

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }
  });

  if (!message) {
    return res.status(404).json(apiError('Message not found', 'NOT_FOUND'));
  }

  // For now, actually delete the message
  // In production, you might want to implement soft delete
  await prisma.message.delete({
    where: { id: messageId }
  });

  res.json(apiSuccess({ deleted: true, id: messageId }));
}));

// Get unread message count
router.get('/unread-count', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const count = await prisma.message.count({
    where: {
      receiverId: userId,
      isRead: false
    }
  });

  res.json(apiSuccess({ count }));
}));

export default router;