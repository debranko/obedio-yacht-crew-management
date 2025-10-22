import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission, authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Apply auth middleware to ALL device routes
router.use(authMiddleware);

/**
 * GET /api/devices
 * List all devices with optional filters
 */
router.get('/', requirePermission('devices.view'), asyncHandler(async (req, res) => {
  console.log('📱 GET /api/devices - Handler called');
  console.log('   Query params:', req.query);
  console.log('   User:', (req as any).user);
  
  const { type, status, locationId, crewMemberId } = req.query;

  const where: any = {};
  if (type) where.type = type as string;
  if (status) where.status = status as string;
  if (locationId) where.locationId = locationId as string;
  if (crewMemberId) where.crewMemberId = crewMemberId as string;

  const devices = await prisma.device.findMany({
    where,
    include: {
      location: { select: { id: true, name: true, type: true, floor: true } },
      crewMember: { select: { id: true, name: true, position: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`✅ Returning ${devices.length} devices`);
  res.json({ success: true, data: devices });
}));

/**
 * GET /api/devices/:id
 * Get single device with details
 */
router.get('/:id', requirePermission('devices.view'), asyncHandler(async (req, res) => {
  const device = await prisma.device.findUnique({
    where: { id: req.params.id },
    include: {
      location: true,
      crewMember: true,
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 50
      }
    }
  });

  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }

  res.json({ success: true, data: device });
}));

/**
 * POST /api/devices
 * Create new device
 */
router.post('/', requirePermission('devices.add'), asyncHandler(async (req, res) => {
  const device = await prisma.device.create({
    data: req.body,
    include: {
      location: true,
      crewMember: true
    }
  });

  // Log device creation
  await prisma.deviceLog.create({
    data: {
      deviceId: device.id,
      eventType: 'device_added',
      eventData: { deviceId: device.deviceId, name: device.name },
      severity: 'info'
    }
  });

  res.status(201).json({ success: true, data: device });
}));

/**
 * PUT /api/devices/:id
 * Update device
 */
router.put('/:id', requirePermission('devices.edit'), asyncHandler(async (req, res) => {
  const device = await prisma.device.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      location: true,
      crewMember: true
    }
  });

  // Log config change
  if (req.body.config) {
    await prisma.deviceLog.create({
      data: {
        deviceId: device.id,
        eventType: 'config_change',
        eventData: { changes: req.body },
        severity: 'info'
      }
    });
  }

  res.json({ success: true, data: device });
}));

/**
 * DELETE /api/devices/:id
 * Delete device
 */
router.delete('/:id', requirePermission('devices.delete'), asyncHandler(async (req, res) => {
  await prisma.device.delete({
    where: { id: req.params.id }
  });

  res.json({ success: true, message: 'Device deleted' });
}));

/**
 * GET /api/devices/:id/config
 * Get device configuration
 */
router.get('/:id/config', requirePermission('devices.view'), asyncHandler(async (req, res) => {
  const device = await prisma.device.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      deviceId: true,
      name: true,
      type: true,
      config: true,
      locationId: true,
      location: { select: { name: true } }
    }
  });

  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }

  res.json({ success: true, data: device });
}));

/**
 * PUT /api/devices/:id/config
 * Update device configuration
 */
router.put('/:id/config', requirePermission('devices.edit'), asyncHandler(async (req, res) => {
  const device = await prisma.device.update({
    where: { id: req.params.id },
    data: { config: req.body.config },
    select: { id: true, deviceId: true, config: true }
  });

  // Log config change
  await prisma.deviceLog.create({
    data: {
      deviceId: device.id,
      eventType: 'config_change',
      eventData: req.body.config,
      severity: 'info'
    }
  });

  res.json({ success: true, data: device });
}));

/**
 * POST /api/devices/:id/test
 * Send test signal to device (LED blink, beep, etc.)
 */
router.post('/:id/test', requirePermission('devices.edit'), asyncHandler(async (req, res) => {
  const device = await prisma.device.findUnique({
    where: { id: req.params.id }
  });

  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }

  // Log test signal
  await prisma.deviceLog.create({
    data: {
      deviceId: device.id,
      eventType: 'test_signal',
      eventData: { action: 'test_blink' },
      severity: 'info'
    }
  });

  // TODO: Send actual MQTT message to device
  // For now, just return success

  res.json({ 
    success: true, 
    message: 'Test signal sent to device',
    data: { deviceId: device.deviceId, testType: 'led_blink' }
  });
}));

/**
 * GET /api/devices/:id/logs
 * Get device event logs
 */
router.get('/:id/logs', requirePermission('devices.view'), asyncHandler(async (req, res) => {
  const { limit = 100, eventType } = req.query;

  const where: any = { deviceId: req.params.id };
  if (eventType) where.eventType = eventType as string;

  const logs = await prisma.deviceLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Number(limit)
  });

  res.json({ success: true, data: logs });
}));

/**
 * GET /api/devices/stats
 * Get device statistics
 */
router.get('/stats/summary', requirePermission('devices.view'), asyncHandler(async (req, res) => {
  const [total, online, offline, lowBattery, byType] = await Promise.all([
    prisma.device.count(),
    prisma.device.count({ where: { status: 'online' } }),
    prisma.device.count({ where: { status: 'offline' } }),
    prisma.device.count({ where: { status: 'low_battery' } }),
    prisma.device.groupBy({
      by: ['type'],
      _count: true
    })
  ]);

  res.json({
    success: true,
    data: {
      total,
      online,
      offline,
      lowBattery,
      byType: byType.reduce((acc: any, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {})
    }
  });
}));

export default router;