import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { DatabaseService } from '../services/database';
import { mqttService } from '../services/mqtt.service';
import { websocketService } from '../services/websocket';
import { apiSuccess, apiError } from '../utils/api-response';

const router = Router();
const dbService = new DatabaseService();

/**
 * Handle smart button press from web simulator or direct API
 * This endpoint can be used for testing without actual ESP32 hardware
 */
router.post('/press', asyncHandler(async (req, res) => {
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
  
  res.json(apiSuccess(result));
}));

/**
 * Update device status (battery, signal, etc)
 */
router.post('/status/:deviceId', asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const status = req.body;
  
  // Publish status to MQTT
  mqttService.publish(`obedio/button/${deviceId}/status`, status);
  
  res.json(apiSuccess({ message: 'Status updated' }));
}));

/**
 * Send telemetry data
 */
router.post('/telemetry/:deviceId', asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const telemetry = req.body;
  
  // Publish telemetry to MQTT
  mqttService.publish(`obedio/device/${deviceId}/telemetry`, telemetry);
  
  res.json(apiSuccess({ message: 'Telemetry received' }));
}));

/**
 * Test device connection
 */
router.post('/test/:deviceId', asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  
  // Send test command via MQTT
  mqttService.sendDeviceCommand(deviceId, {
    command: 'test',
    led: true,
    sound: true,
    vibration: true
  });
  
  res.json(apiSuccess({ message: 'Test command sent' }));
}));

/**
 * Get MQTT connection status
 */
router.get('/mqtt-status', asyncHandler(async (req, res) => {
  res.json(apiSuccess({
    connected: mqttService.getConnectionStatus(),
    broker: process.env.MQTT_BROKER || 'mqtt://mosquitto:1883'
  }));
}));

export default router;