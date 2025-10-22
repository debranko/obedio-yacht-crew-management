import express from 'express';
import { prisma } from '../services/db';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const widgetSchema = z.object({
  id: z.string(),
  type: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  minW: z.number().optional(),
  minH: z.number().optional(),
  maxW: z.number().optional(),
  maxH: z.number().optional(),
});

const dashboardLayoutSchema = z.object({
  layouts: z.record(z.array(widgetSchema)),
  activeWidgets: z.array(z.string()),
});

/**
 * GET /api/dashboard/layout
 * Get current user's dashboard layout and active widgets
 */
router.get('/layout', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;

  // Get user preferences
  let preferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  // If no preferences exist, create default
  if (!preferences) {
    preferences = await prisma.userPreferences.create({
      data: {
        userId,
        dashboardLayout: getDefaultLayout((req as any).user.role),
        activeWidgets: getDefaultWidgets((req as any).user.role),
      },
    });
  }

  res.json({
    layout: preferences.dashboardLayout || getDefaultLayout((req as any).user.role),
    activeWidgets: preferences.activeWidgets || getDefaultWidgets((req as any).user.role),
  });
}));

/**
 * PUT /api/dashboard/layout
 * Save user's dashboard layout and active widgets
 */
router.put('/layout', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  
  // Validate request body
  const validation = dashboardLayoutSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ 
      error: 'Invalid layout data', 
      details: validation.error.errors 
    });
    return;
  }

  const { layouts, activeWidgets } = validation.data;

  // Update or create user preferences
  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    update: {
      dashboardLayout: layouts,
      activeWidgets: activeWidgets,
      updatedAt: new Date(),
    },
    create: {
      userId,
      dashboardLayout: layouts,
      activeWidgets: activeWidgets,
    },
  });

  res.json({
    message: 'Dashboard layout saved successfully',
    layout: preferences.dashboardLayout,
    activeWidgets: preferences.activeWidgets,
  });
}));

/**
 * POST /api/dashboard/reset
 * Reset dashboard to default layout for user's role
 */
router.post('/reset', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const role = (req as any).user.role;

  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    update: {
      dashboardLayout: getDefaultLayout(role),
      activeWidgets: getDefaultWidgets(role),
      updatedAt: new Date(),
    },
    create: {
      userId,
      dashboardLayout: getDefaultLayout(role),
      activeWidgets: getDefaultWidgets(role),
    },
  });

  res.json({
    message: 'Dashboard reset to default layout',
    layout: preferences.dashboardLayout,
    activeWidgets: preferences.activeWidgets,
  });
}));

/**
 * GET /api/dashboard/defaults/:role
 * Get default layout for a specific role (admin only)
 */
router.get('/defaults/:role', requirePermission('settings.manage'), asyncHandler(async (req, res) => {
  const { role } = req.params;
  
  res.json({
    role,
    layout: getDefaultLayout(role),
    activeWidgets: getDefaultWidgets(role),
  });
}));

// Helper functions for default layouts
function getDefaultLayout(role: string): any {
  const baseLayout = {
    lg: [
      { i: "weather", x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: "clock", x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: "guestStatus", x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: "serviceRequests", x: 0, y: 2, w: 6, h: 6, minW: 4, minH: 4 },
      { i: "dndStatus", x: 6, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
    ],
    md: [
      { i: "weather", x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
      { i: "clock", x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
      { i: "guestStatus", x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
      { i: "serviceRequests", x: 0, y: 6, w: 8, h: 6, minW: 4, minH: 4 },
      { i: "dndStatus", x: 0, y: 12, w: 8, h: 4, minW: 4, minH: 3 },
    ],
    sm: [
      { i: "weather", x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "clock", x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "guestStatus", x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      { i: "serviceRequests", x: 0, y: 8, w: 6, h: 6, minW: 4, minH: 4 },
      { i: "dndStatus", x: 0, y: 14, w: 6, h: 4, minW: 4, minH: 3 },
    ],
  };

  // Add role-specific widgets
  if (role === 'admin' || role === 'chief-stewardess') {
    baseLayout.lg.push({ i: "crewStatus", x: 0, y: 8, w: 12, h: 4, minW: 6, minH: 3 });
    baseLayout.md.push({ i: "crewStatus", x: 0, y: 16, w: 8, h: 4, minW: 4, minH: 3 });
    baseLayout.sm.push({ i: "crewStatus", x: 0, y: 18, w: 6, h: 4, minW: 4, minH: 3 });
  }

  return baseLayout;
}

function getDefaultWidgets(role: string): string[] {
  const baseWidgets = ["weather", "clock", "guestStatus", "serviceRequests", "dndStatus"];
  
  if (role === 'admin' || role === 'chief-stewardess') {
    baseWidgets.push("crewStatus");
  }
  
  if (role === 'admin' || role === 'eto') {
    baseWidgets.push("deviceStatus");
  }
  
  return baseWidgets;
}

export default router;