/**
 * User Preferences API Routes
 * Saves dashboard layout, active widgets, and other user preferences
 */

import express, { Request, Response } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { apiSuccess, apiError } from '../utils/api-response';

const router = express.Router();

/**
 * GET /api/user-preferences
 * Get current user's preferences
 */
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json(apiError('Unauthorized', 'UNAUTHORIZED'));
  }

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId }
  });

  // If no preferences exist, return defaults
  if (!preferences) {
    return res.json(apiSuccess({
      dashboardLayout: null,
      activeWidgets: null,
      theme: 'light',
      language: 'en',
      emailNotifications: false,
      notificationEmail: null,
      emergencyContacts: null,
      // Service Requests defaults
      serviceRequestDisplayMode: 'location',
      serviceRequestViewStyle: 'expanded',
      serviceRequestSortOrder: 'newest',
      serviceRequestShowGuestPhotos: true,
      serviceRequestServingTimeout: 5,
      serviceRequestSoundAlerts: true,
      serviceRequestVisualFlash: false,
      serviceRequestResponseWarning: 5,
      serviceRequestAutoArchive: 30,
      serviceRequestAutoPriorityVIP: true,
      serviceRequestAutoPriorityMaster: false,
      requestDialogRepeatInterval: 60,
    }));
  }

  res.json(apiSuccess({
    dashboardLayout: preferences.dashboardLayout,
    activeWidgets: preferences.activeWidgets,
    theme: preferences.theme,
    language: preferences.language,
    emailNotifications: preferences.emailNotifications,
    notificationEmail: preferences.notificationEmail,
    emergencyContacts: preferences.emergencyContacts,
    // Service Requests preferences
    serviceRequestDisplayMode: preferences.serviceRequestDisplayMode,
    serviceRequestViewStyle: preferences.serviceRequestViewStyle,
    serviceRequestSortOrder: preferences.serviceRequestSortOrder,
    serviceRequestShowGuestPhotos: preferences.serviceRequestShowGuestPhotos,
    serviceRequestServingTimeout: preferences.serviceRequestServingTimeout,
    serviceRequestSoundAlerts: preferences.serviceRequestSoundAlerts,
    serviceRequestVisualFlash: preferences.serviceRequestVisualFlash,
    serviceRequestResponseWarning: preferences.serviceRequestResponseWarning,
    serviceRequestAutoArchive: preferences.serviceRequestAutoArchive,
    serviceRequestAutoPriorityVIP: preferences.serviceRequestAutoPriorityVIP,
    serviceRequestAutoPriorityMaster: preferences.serviceRequestAutoPriorityMaster,
    requestDialogRepeatInterval: preferences.requestDialogRepeatInterval,
    updatedAt: preferences.updatedAt
  }));
}));

/**
 * PUT /api/user-preferences/dashboard
 * Update dashboard layout and active widgets
 */
router.put('/dashboard', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json(apiError('Unauthorized', 'UNAUTHORIZED'));
  }

  const { dashboardLayout, activeWidgets } = req.body;

  // Upsert preferences (create if doesn't exist, update if exists)
  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    update: {
      dashboardLayout,
      activeWidgets,
      updatedAt: new Date()
    },
    create: {
      userId,
      dashboardLayout,
      activeWidgets
    }
  });

  res.json(apiSuccess({
    dashboardLayout: preferences.dashboardLayout,
    activeWidgets: preferences.activeWidgets,
    updatedAt: preferences.updatedAt
  }));
}));

/**
 * PUT /api/user-preferences/theme
 * Update theme preference
 */
router.put('/theme', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json(apiError('Unauthorized', 'UNAUTHORIZED'));
  }

  const { theme } = req.body;

  if (!['light', 'dark', 'auto'].includes(theme)) {
    return res.status(400).json(apiError('Invalid theme value', 'VALIDATION_ERROR'));
  }

  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    update: { theme },
    create: { userId, theme }
  });

  res.json(apiSuccess({
    theme: preferences.theme
  }));
}));

/**
 * PUT /api/user-preferences/notifications
 * Update notification preferences (email, emergency contacts)
 */
router.put('/notifications', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json(apiError('Unauthorized', 'UNAUTHORIZED'));
  }

  const { emailNotifications, notificationEmail, emergencyContacts } = req.body;

  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    update: {
      emailNotifications: emailNotifications !== undefined ? emailNotifications : undefined,
      notificationEmail: notificationEmail !== undefined ? notificationEmail : undefined,
      emergencyContacts: emergencyContacts !== undefined ? emergencyContacts : undefined,
    },
    create: {
      userId,
      emailNotifications: emailNotifications ?? false,
      notificationEmail,
      emergencyContacts,
    }
  });

  res.json(apiSuccess({
    emailNotifications: preferences.emailNotifications,
    notificationEmail: preferences.notificationEmail,
    emergencyContacts: preferences.emergencyContacts,
    updatedAt: preferences.updatedAt
  }));
}));

/**
 * PUT /api/user-preferences/service-requests
 * Update Service Requests preferences
 */
router.put('/service-requests', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json(apiError('Unauthorized', 'UNAUTHORIZED'));
  }

  const {
    serviceRequestDisplayMode,
    serviceRequestViewStyle,
    serviceRequestSortOrder,
    serviceRequestShowGuestPhotos,
    serviceRequestServingTimeout,
    serviceRequestSoundAlerts,
    serviceRequestVisualFlash,
    serviceRequestResponseWarning,
    serviceRequestAutoArchive,
    serviceRequestAutoPriorityVIP,
    serviceRequestAutoPriorityMaster,
    requestDialogRepeatInterval,
  } = req.body;

  const updateData: any = {};
  if (serviceRequestDisplayMode !== undefined) updateData.serviceRequestDisplayMode = serviceRequestDisplayMode;
  if (serviceRequestViewStyle !== undefined) updateData.serviceRequestViewStyle = serviceRequestViewStyle;
  if (serviceRequestSortOrder !== undefined) updateData.serviceRequestSortOrder = serviceRequestSortOrder;
  if (serviceRequestShowGuestPhotos !== undefined) updateData.serviceRequestShowGuestPhotos = serviceRequestShowGuestPhotos;
  if (serviceRequestServingTimeout !== undefined) updateData.serviceRequestServingTimeout = serviceRequestServingTimeout;
  if (serviceRequestSoundAlerts !== undefined) updateData.serviceRequestSoundAlerts = serviceRequestSoundAlerts;
  if (serviceRequestVisualFlash !== undefined) updateData.serviceRequestVisualFlash = serviceRequestVisualFlash;
  if (serviceRequestResponseWarning !== undefined) updateData.serviceRequestResponseWarning = serviceRequestResponseWarning;
  if (serviceRequestAutoArchive !== undefined) updateData.serviceRequestAutoArchive = serviceRequestAutoArchive;
  if (serviceRequestAutoPriorityVIP !== undefined) updateData.serviceRequestAutoPriorityVIP = serviceRequestAutoPriorityVIP;
  if (serviceRequestAutoPriorityMaster !== undefined) updateData.serviceRequestAutoPriorityMaster = serviceRequestAutoPriorityMaster;
  if (requestDialogRepeatInterval !== undefined) updateData.requestDialogRepeatInterval = requestDialogRepeatInterval;

  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      ...updateData
    }
  });

  res.json(apiSuccess({
    serviceRequestDisplayMode: preferences.serviceRequestDisplayMode,
    serviceRequestViewStyle: preferences.serviceRequestViewStyle,
    serviceRequestSortOrder: preferences.serviceRequestSortOrder,
    serviceRequestShowGuestPhotos: preferences.serviceRequestShowGuestPhotos,
    serviceRequestServingTimeout: preferences.serviceRequestServingTimeout,
    serviceRequestSoundAlerts: preferences.serviceRequestSoundAlerts,
    serviceRequestVisualFlash: preferences.serviceRequestVisualFlash,
    serviceRequestResponseWarning: preferences.serviceRequestResponseWarning,
    serviceRequestAutoArchive: preferences.serviceRequestAutoArchive,
    serviceRequestAutoPriorityVIP: preferences.serviceRequestAutoPriorityVIP,
    serviceRequestAutoPriorityMaster: preferences.serviceRequestAutoPriorityMaster,
    requestDialogRepeatInterval: preferences.requestDialogRepeatInterval,
    updatedAt: preferences.updatedAt
  }));
}));

/**
 * DELETE /api/user-preferences/dashboard
 * Reset dashboard to defaults
 */
router.delete('/dashboard', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json(apiError('Unauthorized', 'UNAUTHORIZED'));
  }

  await prisma.userPreferences.update({
    where: { userId },
    data: {
      dashboardLayout: null,
      activeWidgets: null
    }
  });

  res.json(apiSuccess({
    message: 'Dashboard reset to defaults'
  }));
}));

export default router;
