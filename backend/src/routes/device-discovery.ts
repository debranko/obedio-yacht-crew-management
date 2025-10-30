/**
 * Device Discovery & Pairing API
 * Handles ESP32 device discovery and pairing process
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../services/db';
import { mqttService } from '../services/mqtt.service';
import { websocketService } from '../services/websocket';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory store for devices in pairing mode
const pairingDevices = new Map<string, any>();

/**
 * Start device discovery
 * Broadcasts discovery message and waits for devices to respond
 */
router.post('/discover', authMiddleware, asyncHandler(async (req, res) => {
  // Broadcast discovery request via MQTT
  mqttService.publish('obedio/discover/request', {
    timestamp: new Date().toISOString(),
    sessionId: uuidv4()
  });
  
  res.json({
    success: true,
    message: 'Discovery started. Devices will appear as they respond.',
    timeout: 30000 // 30 seconds discovery window
  });
}));

/**
 * Get devices currently in pairing mode
 */
router.get('/pairing', authMiddleware, asyncHandler(async (req, res) => {
  // Clean up old entries (older than 60 seconds)
  const now = Date.now();
  for (const [deviceId, device] of pairingDevices.entries()) {
    if (now - device.timestamp > 60000) {
      pairingDevices.delete(deviceId);
    }
  }
  
  res.json({
    success: true,
    devices: Array.from(pairingDevices.values())
  });
}));

/**
 * Pair a discovered device
 */
router.post('/pair/:deviceId', authMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { name, locationId, crewMemberId } = req.body;
  
  const pairingDevice = pairingDevices.get(deviceId);
  if (!pairingDevice) {
    return res.status(404).json({
      success: false,
      error: 'Device not found or pairing window expired'
    });
  }
  
  // Check if device already exists
  const existingDevice = await prisma.device.findUnique({
    where: { deviceId }
  });
  
  if (existingDevice) {
    return res.status(400).json({
      success: false,
      error: 'Device already paired'
    });
  }
  
  // Create device in database
  const device = await prisma.device.create({
    data: {
      deviceId,
      name: name || `Device ${deviceId}`,
      type: pairingDevice.type || 'smart_button',
      subType: pairingDevice.subType || 'esp32',
      status: 'online',
      locationId,
      crewMemberId,
      firmwareVersion: pairingDevice.firmware || '1.0.0',
      hardwareVersion: pairingDevice.hardware || '1.0',
      macAddress: pairingDevice.mac,
      ipAddress: pairingDevice.ip,
      config: {
        ledEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        shakeThreshold: 3,
        buttonActions: {
          single: 'call',
          double: 'urgent',
          long: 'emergency'
        }
      }
    }
  });
  
  // Send pairing confirmation to device
  mqttService.sendDeviceCommand(deviceId, {
    command: 'paired',
    name: device.name,
    locationId: device.locationId,
    config: device.config
  });
  
  // Remove from pairing list
  pairingDevices.delete(deviceId);
  
  // Notify via WebSocket
  websocketService.broadcast('device:paired', device);
  
  res.json({
    success: true,
    device
  });
}));

/**
 * Handle device announcement (called internally when device announces itself)
 */
export function handleDeviceAnnouncement(deviceId: string, data: any) {
  pairingDevices.set(deviceId, {
    deviceId,
    ...data,
    timestamp: Date.now(),
    discovered: new Date().toISOString()
  });
  
  // Notify UI about new device
  websocketService.broadcast('device:discovered', {
    deviceId,
    ...data
  });
}

/**
 * Test endpoint to simulate device announcement
 * Protected endpoint - requires admin authentication
 */
router.post('/simulate-announce', authMiddleware, asyncHandler(async (req, res) => {
  const deviceId = `BTN-TEST-${Math.floor(Math.random() * 1000)}`;
  
  handleDeviceAnnouncement(deviceId, {
    type: 'smart_button',
    subType: 'esp32', 
    firmware: '1.0.0',
    hardware: 'v1.2',
    mac: `AA:BB:CC:DD:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)}`,
    ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
    rssi: -50 - Math.floor(Math.random() * 40),
    battery: 80 + Math.floor(Math.random() * 20)
  });
  
  res.json({
    success: true,
    message: `Simulated device ${deviceId} announcement`
  });
}));

/**
 * Cancel pairing for a device
 */
router.delete('/pairing/:deviceId', authMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  
  if (pairingDevices.has(deviceId)) {
    pairingDevices.delete(deviceId);
    
    // Notify device that pairing was cancelled
    mqttService.sendDeviceCommand(deviceId, {
      command: 'pairing_cancelled'
    });
  }
  
  res.json({
    success: true,
    message: 'Pairing cancelled'
  });
}));

export default router;