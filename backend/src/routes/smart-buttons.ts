import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission, esp32AuthMiddleware } from '../middleware/auth';
import { DatabaseService } from '../services/database';
import { mqttService } from '../services/mqtt.service';
import { websocketService } from '../services/websocket';

const router = Router();
const dbService = new DatabaseService();

/**
 * Handle smart button press from ESP32 devices
 * Requires ESP32 API key authentication
 * Header: X-Device-API-Key: <api_key>
 */
router.post('/press', esp32AuthMiddleware, asyncHandler(async (req, res) => {
  const { deviceId, locationId, guestId, priority, type, notes } = req.body;
  
  // Simulate MQTT message for testing
  const mqttMessage = {
    deviceId,
    locationId,
    guestId,
    priority: priority || 'normal',
    type: type || 'call',
    notes: notes || 'Simulated button press',
    timestamp: new Date().toISOString()
  };
  
  // Publish to MQTT for other devices to see
  mqttService.publish(`obedio/button/${deviceId}/press`, mqttMessage);
  
  // Also handle it directly for immediate response
  const result = await dbService.handleSmartButtonPress(req.body);
  
  // Send acknowledgment via MQTT
  mqttService.sendDeviceCommand(deviceId, {
    command: 'ack',
    requestId: result.id,
    status: 'received'
  });
  
  res.json({ success: true, data: result });
}));

/**
 * Update device status (battery, signal, etc)
 * Requires ESP32 API key authentication
 */
router.post('/status/:deviceId', esp32AuthMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const status = req.body;
  
  // Publish status to MQTT
  mqttService.publish(`obedio/button/${deviceId}/status`, status);
  
  res.json({ success: true, message: 'Status updated' });
}));

/**
 * Send telemetry data
 * Requires ESP32 API key authentication
 */
router.post('/telemetry/:deviceId', esp32AuthMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const telemetry = req.body;
  
  // Publish telemetry to MQTT
  mqttService.publish(`obedio/device/${deviceId}/telemetry`, telemetry);
  
  res.json({ success: true, message: 'Telemetry received' });
}));

/**
 * Test device connection
 * Requires ESP32 API key authentication
 */
router.post('/test/:deviceId', esp32AuthMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  
  // Send test command via MQTT
  mqttService.sendDeviceCommand(deviceId, {
    command: 'test',
    led: true,
    sound: true,
    vibration: true
  });
  
  res.json({ success: true, message: 'Test command sent' });
}));

/**
 * Get MQTT connection status
 */
router.get('/mqtt-status', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    connected: mqttService.getConnectionStatus(),
    broker: process.env.MQTT_BROKER || 'mqtt://localhost:1883'
  });
}));

export default router;