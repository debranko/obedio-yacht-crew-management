import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { websocketService } from '../services/websocket';

const router = Router();
const prisma = new PrismaClient();

// Get messages for the authenticated user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type, unreadOnly, limit = 50, offset = 0 } = req.query;
    
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
      take: Number(limit),
      skip: Number(offset)
    });
    
    const total = await prisma.message.count({ where });
    
    res.json({
      messages,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation between two users
router.get('/conversation/:otherUserId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { otherUserId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
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
      take: Number(limit),
      skip: Number(offset)
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
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.id;
    const { receiverId, content, type = 'text', priority = 'normal' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
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
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read
router.put('/:messageId/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { messageId } = req.params;
    
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        receiverId: userId
      }
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { 
        isRead: true, 
        readAt: new Date() 
      }
    });
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all messages as read
router.put('/mark-all-read', authMiddleware, async (req: Request, res: Response) => {
  try {
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
    
    res.json({ 
      success: true, 
      count: result.count 
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a message (soft delete - just removes from user's view)
router.delete('/:messageId', authMiddleware, async (req: Request, res: Response) => {
  try {
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
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // For now, actually delete the message
    // In production, you might want to implement soft delete
    await prisma.message.delete({
      where: { id: messageId }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count
router.get('/unread-count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;