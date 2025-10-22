/**
 * User Preferences API Routes
 * Saves dashboard layout, active widgets, and other user preferences
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/user-preferences
 * Get current user's preferences
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    // If no preferences exist, return defaults
    if (!preferences) {
      return res.json({
        dashboardLayout: null,
        activeWidgets: null,
        theme: 'light',
        language: 'en'
      });
    }

    res.json({
      dashboardLayout: preferences.dashboardLayout,
      activeWidgets: preferences.activeWidgets,
      theme: preferences.theme,
      language: preferences.language,
      updatedAt: preferences.updatedAt
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/user-preferences/dashboard
 * Update dashboard layout and active widgets
 */
router.put('/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
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

    res.json({
      success: true,
      dashboardLayout: preferences.dashboardLayout,
      activeWidgets: preferences.activeWidgets,
      updatedAt: preferences.updatedAt
    });
  } catch (error) {
    console.error('Error updating dashboard preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * PUT /api/user-preferences/theme
 * Update theme preference
 */
router.put('/theme', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { theme } = req.body;

    if (!['light', 'dark', 'auto'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme value' });
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: { theme },
      create: { userId, theme }
    });

    res.json({
      success: true,
      theme: preferences.theme
    });
  } catch (error) {
    console.error('Error updating theme preference:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

/**
 * DELETE /api/user-preferences/dashboard
 * Reset dashboard to defaults
 */
router.delete('/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.userPreferences.update({
      where: { userId },
      data: {
        dashboardLayout: null,
        activeWidgets: null
      }
    });

    res.json({
      success: true,
      message: 'Dashboard reset to defaults'
    });
  } catch (error) {
    console.error('Error resetting dashboard:', error);
    res.status(500).json({ error: 'Failed to reset dashboard' });
  }
});

export default router;
