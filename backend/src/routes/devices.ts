import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission, authMiddleware } from '../middleware/auth';
import { prisma } from '../services/db';
import { websocketService } from '../services/websocket';
import { calculatePagination, buildPaginationMeta } from '../utils/pagination';
import { apiSuccess, apiError } from '../utils/api-response';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * GET /api/devices/discover
 * Public endpoint for watch devices to discover their device ID and crew assignment
 * No authentication required - uses MAC address as identifier
 * NOTE: This MUST be before authMiddleware to remain public
 */
router.get('/discover', asyncHandler(async (req, res) => {
  const { macAddress } = req.query;

  if (!macAddress) {
    return res.status(400).json(apiError('macAddress query parameter is required', 'BAD_REQUEST'));
  }

  const device = await prisma.device.findFirst({
    where: { macAddress: macAddress as string },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          type: true,
          floor: true
        }
      },
      crewmember: {
        select: {
          id: true,
          name: true,
          position: true,
          userId: true
        }
      }
    }
  });

  if (!device) {
    return res.status(404).json(apiError('Device not found', 'NOT_FOUND'));
  }

  console.log(`📱 Device discovery: ${device.name} (MAC: ${macAddress}) assigned to ${device.crewmember?.name || 'nobody'}`);

  // Generate JWT token if device has an assigned crew member
  let authToken: string | null = null;
  if (device.crewmember) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (JWT_SECRET) {
      // If crew member has a linked user account, use that
      // Otherwise, create a watch-specific token for the crew member
      const userId = device.crewmember.userId;

      if (userId) {
        // Get user details for proper token
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (user) {
          authToken = jwt.sign(
            {
              sub: user.id,
              userId: user.id,
              username: user.username,
              role: user.role,
              crewMemberId: device.crewmember.id,
              deviceId: device.id,
              type: 'watch-auth'
            },
            JWT_SECRET,
            { expiresIn: '365d' }  // Long-lived token for watch devices
          );
          console.log(`🔑 Generated auth token for user: ${user.username}`);
        }
      } else {
        // No user linked - create a crew-member-only token
        authToken = jwt.sign(
          {
            sub: device.crewmember.id,
            crewMemberId: device.crewmember.id,
            crewMemberName: device.crewmember.name,
            role: device.crewmember.position || 'crew',
            deviceId: device.id,
            type: 'watch-auth'
          },
          JWT_SECRET,
          { expiresIn: '365d' }
        );
        console.log(`🔑 Generated crew-only auth token for: ${device.crewmember.name}`);
      }
    } else {
      console.warn('⚠️ JWT_SECRET not configured - cannot generate auth token');
    }
  }

  // Return device info along with auth token
  res.json(apiSuccess({
    ...device,
    authToken
  }));
}));

/**
 * PUT /api/devices/heartbeat
 * Public endpoint for watch devices to send telemetry (battery, signal, GPS)
 * No authentication required - uses MAC address as identifier
 * NOTE: This MUST be before authMiddleware to remain public
 */
router.put('/heartbeat', asyncHandler(async (req, res) => {
  const { macAddress, batteryLevel, signalStrength, status, lastSeen } = req.body;

  if (!macAddress) {
    return res.status(400).json(apiError('macAddress is required', 'BAD_REQUEST'));
  }

  // Find device by MAC address
  const device = await prisma.device.findFirst({
    where: { macAddress: macAddress as string }
  });

  if (!device) {
    return res.status(404).json(apiError('Device not found', 'NOT_FOUND'));
  }

  // Update device telemetry
  const updateData: any = {};
  if (batteryLevel !== undefined) updateData.batteryLevel = batteryLevel;
  if (signalStrength !== undefined) updateData.signalStrength = signalStrength;
  if (status !== undefined) updateData.status = status;
  if (lastSeen !== undefined) updateData.lastSeen = lastSeen;

  const updatedDevice = await prisma.device.update({
    where: { id: device.id },
    data: updateData
  });

  console.log(`💓 Device heartbeat: ${device.name} (Battery: ${batteryLevel}%, Signal: ${signalStrength}dBm)`);

  // Broadcast device update via WebSocket
  websocketService.emitDeviceEvent('updated', updatedDevice);

  res.json(apiSuccess(updatedDevice));
}));

// Apply auth middleware to ALL device routes (except /discover and /heartbeat above)
router.use(authMiddleware);

/**
 * GET /api/devices/logs
 * Get all device logs with optional filters
 * NOTE: This MUST be before /:id routes to avoid "logs" being treated as an ID
 */
router.get('/logs', requirePermission('devices.view'), asyncHandler(async (req, res) => {
  console.log('📱 GET /api/devices/logs - Handler called');
  console.log('   Query params:', req.query);

  const {
    deviceId,
    status,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 50,
    eventType
  } = req.query;

  const where: any = {};

  if (deviceId) where.deviceId = deviceId as string;
  if (eventType) where.eventType = eventType as string;

  // Handle status filter - map status to eventType
  if (status) {
    switch (status) {
      case 'online':
        where.eventType = 'device_online';
        break;
      case 'offline':
        where.eventType = 'device_offline';
        break;
      case 'alert':
        where.eventType = { in: ['battery_low', 'error'] };
        break;
      case 'maintenance':
        where.eventType = 'maintenance';
        break;
    }
  }

  // Date range filter
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  // Search in eventData
  if (search) {
    where.OR = [
      { eventType: { contains: search as string, mode: 'insensitive' } },
      { severity: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(Number(page), Number(limit));

  const [logs, total] = await Promise.all([
    prisma.deviceLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        device: {
          select: {
            id: true,
            deviceId: true,
            name: true,
            type: true,
            location: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.deviceLog.count({ where })
  ]);

  // Transform logs to match frontend expectations (BACKEND TRANSFORMATION)
  const transformedLogs = logs.map(log => ({
    id: log.id,
    timestamp: log.createdAt,
    createdAt: log.createdAt,
    deviceId: log.device.deviceId,
    deviceName: log.device.name,
    device: log.device.name,  // Alias for compatibility
    location: log.device.location?.name || null,
    status: mapEventTypeToStatus(log.eventType),
    message: formatEventMessage(log.eventType, log.eventData),
    event: log.eventType,
    eventType: log.eventType,  // Alias for compatibility
    user: (log.eventData as any)?.user || null,
    severity: log.severity
  }));

  console.log(`✅ Returning ${transformedLogs.length} device logs`);
  res.json(apiSuccess(transformedLogs, buildPaginationMeta(total, pageNum, limitNum)));
}));

/**
 * GET /api/devices/stats/summary
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

  res.json(apiSuccess({
    total,
    online,
    offline,
    lowBattery,
    byType: byType.reduce((acc: any, item: any) => {
      acc[item.type] = item._count;
      return acc;
    }, {})
  }));
}));

/**
 * GET /api/devices
 * List all devices with optional filters
 */
router.get('/', requirePermission('devices.view'), asyncHandler(async (req, res) => {
  console.log('📱 GET /api/devices - Handler called');
  console.log('   Query params:', req.query);
  console.log('   User:', (req as any).user);

  const { type, status, locationId, crewMemberId, macAddress } = req.query;

  // Build WHERE conditions using Prisma (secure, no SQL injection)
  const where: any = {};

  if (type) where.type = type as string;
  if (status) where.status = status as string;
  if (locationId) where.locationId = locationId as string;
  if (crewMemberId) where.crewMemberId = crewMemberId as string;
  if (macAddress) where.macAddress = macAddress as string;

  // Execute query using Prisma (secure and type-safe)
  const devices = await prisma.device.findMany({
    where,
    include: {
      location: {
        select: {
          id: true,
          name: true,
          type: true,
          floor: true
        }
      },
      crewmember: {
        select: {
          id: true,
          name: true,
          position: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`✅ Returning ${devices.length} devices`);
  res.json(apiSuccess(devices));
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
      crewmember: true,
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 50
      }
    }
  });

  if (!device) {
    return res.status(404).json(apiError('Device not found', 'NOT_FOUND'));
  }

  res.json(apiSuccess(device));
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
      crewmember: true
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

  // Broadcast device creation to all connected clients
  websocketService.emitDeviceEvent('created', device);

  res.status(201).json(apiSuccess(device));
}));

/**
 * PUT /api/devices/:id
 * Update device
 */
router.put('/:id', requirePermission('devices.edit'), asyncHandler(async (req, res) => {
  // Extract valid Prisma fields from req.body
  const {
    deviceId, name, type, subType, status,
    locationId, crewMemberId,
    batteryLevel, signalStrength, connectionType, lastSeen,
    config,
    firmwareVersion, hardwareVersion, macAddress, ipAddress,
    ...buttonActions // Everything else goes into config
  } = req.body;

  // Build update data object with only valid Prisma fields
  const updateData: any = {};
  if (deviceId !== undefined) updateData.deviceId = deviceId;
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (subType !== undefined) updateData.subType = subType;
  if (status !== undefined) updateData.status = status;
  if (locationId !== undefined) updateData.locationId = locationId;
  if (crewMemberId !== undefined) updateData.crewMemberId = crewMemberId;
  if (batteryLevel !== undefined) updateData.batteryLevel = batteryLevel;
  if (signalStrength !== undefined) updateData.signalStrength = signalStrength;
  if (connectionType !== undefined) updateData.connectionType = connectionType;
  if (lastSeen !== undefined) updateData.lastSeen = lastSeen;
  if (firmwareVersion !== undefined) updateData.firmwareVersion = firmwareVersion;
  if (hardwareVersion !== undefined) updateData.hardwareVersion = hardwareVersion;
  if (macAddress !== undefined) updateData.macAddress = macAddress;
  if (ipAddress !== undefined) updateData.ipAddress = ipAddress;

  // Merge button actions into config
  if (config !== undefined || Object.keys(buttonActions).length > 0) {
    updateData.config = {
      ...config,
      ...buttonActions
    };
  }

  const device = await prisma.device.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      location: true,
      crewmember: true
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

  // Broadcast device update to all connected clients
  websocketService.emitDeviceEvent('updated', device);

  // If status changed, also broadcast status change event
  if (req.body.status) {
    websocketService.emitDeviceStatusChanged(device);
  }

  res.json(apiSuccess(device));
}));

/**
 * DELETE /api/devices/:id
 * Delete device
 */
router.delete('/:id', requirePermission('devices.delete'), asyncHandler(async (req, res) => {
  await prisma.device.delete({
    where: { id: req.params.id }
  });

  res.json(apiSuccess({ deleted: true, id: req.params.id }));
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
    return res.status(404).json(apiError('Device not found', 'NOT_FOUND'));
  }

  res.json(apiSuccess(device));
}));

/**
 * PUT /api/devices/:id/config
 * Update device configuration and name
 */
router.put('/:id/config', requirePermission('devices.edit'), asyncHandler(async (req, res) => {
  const updateData: any = {};
  
  // Handle both config and name updates
  if (req.body.config !== undefined) {
    updateData.config = req.body.config;
  }
  if (req.body.name !== undefined) {
    updateData.name = req.body.name;
  }
  
  const device = await prisma.device.update({
    where: { id: req.params.id },
    data: updateData,
    select: { id: true, deviceId: true, name: true, config: true }
  });

  // Log config change
  await prisma.deviceLog.create({
    data: {
      deviceId: device.id,
      eventType: 'config_change',
      eventData: { ...req.body },
      severity: 'info'
    }
  });

  res.json(apiSuccess(device));
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
    return res.status(404).json(apiError('Device not found', 'NOT_FOUND'));
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

  // Send MQTT message to device if it's a smart button
  if (device.type === 'smart_button' && device.status === 'online') {
    try {
      const mqttService = require('../services/mqtt.service').mqttService;
      await mqttService.sendCommand(device.deviceId, {
        action: 'test',
        payload: {
          led: 'blink',
          sound: 'beep',
          duration: 3000
        }
      });
    } catch (error) {
      console.error('Failed to send MQTT test command:', error);
    }
  }

  res.json(apiSuccess({
    message: 'Test signal sent to device',
    deviceId: device.deviceId,
    testType: 'led_blink'
  }));
}));

/**
 * GET /api/devices/:id/logs
 * Get device event logs with transformation
 */
router.get('/:id/logs', requirePermission('devices.view'), asyncHandler(async (req, res) => {
  const { limit = 100, eventType } = req.query;

  const where: any = { deviceId: req.params.id };
  if (eventType) where.eventType = eventType as string;

  const logs = await prisma.deviceLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    include: {
      device: {
        select: {
          deviceId: true,
          name: true,
          location: { select: { name: true } }
        }
      }
    }
  });

  // Transform logs on BACKEND before sending to frontend
  const transformedLogs = logs.map(log => ({
    id: log.id,
    deviceId: log.device.deviceId,
    deviceName: log.device.name,
    device: log.device.name,  // Alias for compatibility
    location: log.device.location?.name || null,
    eventType: log.eventType,
    event: log.eventType,  // Alias for compatibility
    eventData: log.eventData,
    status: mapEventTypeToStatus(log.eventType),
    message: formatEventMessage(log.eventType, log.eventData),
    timestamp: log.createdAt,
    createdAt: log.createdAt,
    severity: log.severity
  }));

  res.json(apiSuccess(transformedLogs));
}));

// Helper functions for device logs (moved to top of file where /logs endpoint is defined)
function mapEventTypeToStatus(eventType: string): string {
  switch (eventType) {
    case 'device_online':
    case 'button_press':
      return 'online';
    case 'device_offline':
      return 'offline';
    case 'battery_low':
    case 'error':
      return 'alert';
    case 'maintenance':
    case 'config_change':
      return 'maintenance';
    default:
      return 'unknown';
  }
}

function formatEventMessage(eventType: string, eventData: any): string {
  switch (eventType) {
    case 'button_press':
      return `Button pressed${eventData?.location ? ` at ${eventData.location}` : ''}`;
    case 'device_online':
      return 'Device came online';
    case 'device_offline':
      return 'Device went offline';
    case 'battery_low':
      return `Battery low: ${eventData?.level || 'N/A'}%`;
    case 'config_change':
      return 'Configuration updated';
    case 'test_signal':
      return 'Test signal sent';
    case 'device_added':
      return 'Device registered';
    default:
      return eventType.replace(/_/g, ' ');
  }
}

/**
 * GET /api/devices/me
 * Get current user's assigned device (watch)
 * Used by watch app to discover its device ID on first launch
 */
router.get('/me', asyncHandler(async (req, res) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json(apiError('Unauthorized', 'UNAUTHORIZED'));
  }

  // Find crew member for this user
  const crewMember = await prisma.crewMember.findUnique({
    where: { userId: user.id },
    include: {
      devices: {
        where: { type: 'watch' },
        include: {
          location: true,
          crewmember: true
        }
      }
    }
  });

  if (!crewMember || crewMember.devices.length === 0) {
    return res.status(404).json(apiError('Watch device not found for this user', 'NOT_FOUND'));
  }

  const watchDevice = crewMember.devices[0]; // Return first watch

  res.json(apiSuccess(watchDevice));
}));

export default router;