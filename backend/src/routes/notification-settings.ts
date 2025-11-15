import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { apiSuccess, apiError } from '../utils/api-response';

const router = Router();

// Get notification settings for the authenticated user
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
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

  res.json(apiSuccess(settings));
}));

// Update notification settings
router.put('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
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

  res.json(apiSuccess(settings));
}));

// Update push token only
router.post('/push-token', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { pushToken } = req.body;

  if (!pushToken) {
    return res.status(400).json(apiError('Push token is required', 'VALIDATION_ERROR'));
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

  res.json(apiSuccess(settings));
}));

// Test notification endpoint
router.post('/test', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { type = 'test', message = 'This is a test notification' } = req.body;

  // Get user's notification settings
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId }
  });

  if (!settings || !settings.pushEnabled || !settings.pushToken) {
    return res.status(400).json(apiError(
      'Push notifications not enabled or no push token registered',
      'VALIDATION_ERROR'
    ));
  }

  // TODO: Implement actual push notification sending
  // For now, just return success
  res.json(apiSuccess({
    message: 'Test notification queued',
    details: {
      type,
      message,
      recipient: userId
    }
  }));
}));

export default router;