import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get notification settings for the authenticated user
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          userId,
          pushEnabled: true,
          serviceRequests: true,
          emergencyAlerts: true,
          systemMessages: true,
          guestMessages: true,
          crewMessages: true,
          quietHoursEnabled: false
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update notification settings
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      pushEnabled,
      pushToken,
      serviceRequests,
      emergencyAlerts,
      systemMessages,
      guestMessages,
      crewMessages,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd
    } = req.body;
    
    // Check if settings exist
    const existing = await prisma.notificationSettings.findUnique({
      where: { userId }
    });
    
    let settings;
    if (existing) {
      // Update existing settings
      settings = await prisma.notificationSettings.update({
        where: { userId },
        data: {
          pushEnabled,
          pushToken,
          serviceRequests,
          emergencyAlerts,
          systemMessages,
          guestMessages,
          crewMessages,
          quietHoursEnabled,
          quietHoursStart,
          quietHoursEnd
        }
      });
    } else {
      // Create new settings
      settings = await prisma.notificationSettings.create({
        data: {
          userId,
          pushEnabled: pushEnabled ?? true,
          pushToken,
          serviceRequests: serviceRequests ?? true,
          emergencyAlerts: emergencyAlerts ?? true,
          systemMessages: systemMessages ?? true,
          guestMessages: guestMessages ?? true,
          crewMessages: crewMessages ?? true,
          quietHoursEnabled: quietHoursEnabled ?? false,
          quietHoursStart,
          quietHoursEnd
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update push token only
router.post('/push-token', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { pushToken } = req.body;
    
    if (!pushToken) {
      return res.status(400).json({ error: 'Push token is required' });
    }
    
    // Update or create settings with push token
    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: { pushToken },
      create: {
        userId,
        pushToken,
        pushEnabled: true,
        serviceRequests: true,
        emergencyAlerts: true,
        systemMessages: true,
        guestMessages: true,
        crewMessages: true,
        quietHoursEnabled: false
      }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test notification endpoint
router.post('/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { type = 'test', message = 'This is a test notification' } = req.body;
    
    // Get user's notification settings
    const settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });
    
    if (!settings || !settings.pushEnabled || !settings.pushToken) {
      return res.status(400).json({ 
        error: 'Push notifications not enabled or no push token registered' 
      });
    }
    
    // TODO: Implement actual push notification sending
    // For now, just return success
    res.json({ 
      success: true, 
      message: 'Test notification queued',
      details: {
        type,
        message,
        recipient: userId
      }
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;