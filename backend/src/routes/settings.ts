import { Router } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { apiSuccess, apiError } from '../utils/api-response';

const router = Router();

// Get all settings (yacht + notification + system)
router.get('/all', authMiddleware, asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId || req.user?.sub;

    // Get yacht settings
    let yachtSettings = await prisma.yachtSettings.findFirst();
    if (!yachtSettings) {
      yachtSettings = await prisma.yachtSettings.create({
        data: {
          name: 'M/Y Serenity',
          type: 'motor',
          timezone: 'Europe/Monaco',
          floors: ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
        },
      });
    }

    // Get notification settings for user
    let notificationSettings = null;
    if (userId) {
      notificationSettings = await prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (!notificationSettings) {
        notificationSettings = await prisma.notificationSettings.create({
          data: {
            userId,
            pushEnabled: true,
            serviceRequests: true,
            emergencyAlerts: true,
            systemMessages: true,
            guestMessages: true,
            crewMessages: true,
            quietHoursEnabled: false,
          },
        });
      }
    }

    // Get user preferences
    let userPreferences = null;
    if (userId) {
      userPreferences = await prisma.userPreferences.findUnique({
        where: { userId },
      });

      if (!userPreferences) {
        userPreferences = await prisma.userPreferences.create({
          data: {
            userId,
            theme: 'light',
            language: 'en',
          },
        });
      }
    }

  res.json(apiSuccess({
    yacht: {
      name: yachtSettings.name,
      type: yachtSettings.type,
      timezone: yachtSettings.timezone,
      floors: yachtSettings.floors,
      dateFormat: yachtSettings.dateFormat,
      timeFormat: yachtSettings.timeFormat,
      weatherUnits: yachtSettings.weatherUnits,
      windSpeedUnits: yachtSettings.windSpeedUnits,
    },
    notifications: notificationSettings ? {
      pushEnabled: notificationSettings.pushEnabled,
      serviceRequests: notificationSettings.serviceRequests,
      emergencyAlerts: notificationSettings.emergencyAlerts,
      systemMessages: notificationSettings.systemMessages,
      guestMessages: notificationSettings.guestMessages,
      crewMessages: notificationSettings.crewMessages,
      quietHoursEnabled: notificationSettings.quietHoursEnabled,
      quietHoursStart: notificationSettings.quietHoursStart,
      quietHoursEnd: notificationSettings.quietHoursEnd,
    } : null,
    userPreferences: userPreferences ? {
      theme: userPreferences.theme,
      language: userPreferences.language,
      dashboardLayout: userPreferences.dashboardLayout,
      activeWidgets: userPreferences.activeWidgets,
    } : null,
  }));
}));

// Get system status (uptime, version, etc.)
router.get('/system-status', authMiddleware, asyncHandler(async (req, res) => {
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  res.json(apiSuccess({
    version: '1.0.0',
    uptime: `${days}d ${hours}h ${minutes}m`,
    uptimeSeconds: uptime,
    status: 'online',
    database: 'connected',
    lastBackup: null, // TODO: Implement backup tracking
  }));
}));

export default router;