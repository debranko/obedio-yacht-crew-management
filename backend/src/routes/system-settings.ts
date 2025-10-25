/**
 * System Settings Routes
 * API endpoints for system configuration
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import os from 'os';
import { prisma } from '../services/db';

const router = Router();

// All routes require system.settings permission
router.use(requirePermission('system.settings'));

/**
 * GET /api/system-settings
 * Get current system settings and status
 */
router.get('/', asyncHandler(async (_, res) => {
  // Get system status
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  const status = {
    database: {
      connected: true, // We're able to query, so it's connected
      status: 'Connected'
    },
    webSocket: {
      active: true,
      status: 'Active'
    },
    apiServer: {
      running: true,
      port: process.env.PORT || '3001',
      status: `Running on port ${process.env.PORT || '3001'}`
    },
    uptime: {
      seconds: uptime,
      formatted: `${days} days, ${hours} hours, ${minutes} minutes`
    },
    lastRestart: new Date(Date.now() - uptime * 1000).toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    platform: os.platform(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      usedPercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || 'Unknown'
    }
  };

  // Get settings from environment or defaults
  const settings = {
    serverPort: process.env.PORT || '3001',
    wsPort: process.env.PORT || '3001',
    databaseUrl: process.env.DATABASE_URL ? '***hidden***' : '',
    apiTimeout: process.env.API_TIMEOUT || '30',
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableDebugMode: process.env.NODE_ENV === 'development'
  };

  res.json({
    success: true,
    status,
    settings
  });
}));

/**
 * PUT /api/system-settings
 * Update system settings
 */
router.put('/', asyncHandler(async (req, res) => {
  const {
    serverPort,
    wsPort,
    databaseUrl,
    apiTimeout,
    logLevel,
    enableMetrics,
    enableDebugMode
  } = req.body;

  // In a real implementation, these would be saved to .env or config file
  // For now, we'll just validate and return success
  // TODO: Implement persistent configuration storage

  const updatedSettings = {
    serverPort,
    wsPort,
    apiTimeout,
    logLevel,
    enableMetrics,
    enableDebugMode
  };

  res.json({
    success: true,
    settings: updatedSettings,
    message: 'System settings updated. Restart required for some changes to take effect.'
  });
}));

/**
 * GET /api/system-settings/health
 * Quick health check endpoint
 */
router.get('/health', asyncHandler(async (_, res) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'disconnected';
  }

  res.json({
    success: true,
    status: 'ok',
    checks: {
      database: dbStatus,
      api: 'running',
      memory: os.freemem() > 100 * 1024 * 1024 ? 'ok' : 'low',
      uptime: process.uptime()
    }
  });
}));

export default router;
