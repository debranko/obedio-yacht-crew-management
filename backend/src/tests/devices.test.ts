/**
 * Devices API Tests
 * Comprehensive tests for device management endpoints
 * NOTE: All device routes require authentication
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import { DatabaseService } from '../services/database';

const dbService = new DatabaseService();
let authToken: string;
let testDeviceId: string;
let testLocationId: string;
let testCrewId: string;

beforeAll(async () => {
  await dbService.connect();

  // Authenticate to get token (all device routes require auth)
  const authResult = await dbService.authenticateUser('admin', 'admin123');
  authToken = authResult.token;

  // Get test location
  const locations = await dbService.getLocations();
  testLocationId = locations[0]?.id || '';

  // Get test crew member
  const crew = await dbService.getCrewMembers();
  testCrewId = crew[0]?.id || '';
});

afterAll(async () => {
  // Cleanup test devices
  try {
    if (testDeviceId) {
      await dbService.prisma.device.delete({ where: { id: testDeviceId } }).catch(() => {});
    }
  } catch (error) {
    // Ignore cleanup errors
  }
  await dbService.disconnect();
});

describe('Devices API', () => {
  // ============================================================================
  // Authentication Tests
  // ============================================================================

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      await request(app)
        .get('/api/devices')
        .expect(401);
    });

    it('should reject requests with invalid auth token', async () => {
      await request(app)
        .get('/api/devices')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });

    it('should accept requests with valid auth token', async () => {
      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ============================================================================
  // GET /api/devices - List All Devices
  // ============================================================================

  describe('GET /api/devices', () => {
    it('should return all devices', async () => {
      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      if (response.body.data.length > 0) {
        const device = response.body.data[0];
        expect(device).toHaveProperty('id');
        expect(device).toHaveProperty('deviceId');
        expect(device).toHaveProperty('name');
        expect(device).toHaveProperty('type');
        expect(device).toHaveProperty('status');
      }
    });

    it('should filter devices by type', async () => {
      const response = await request(app)
        .get('/api/devices?type=smart_button')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((device: any) => {
        expect(device.type).toBe('smart_button');
      });
    });

    it('should filter devices by status', async () => {
      const response = await request(app)
        .get('/api/devices?status=online')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((device: any) => {
        expect(device.status).toBe('online');
      });
    });

    it('should filter devices by location', async () => {
      const response = await request(app)
        .get(`/api/devices?locationId=${testLocationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((device: any) => {
        expect(device.locationId).toBe(testLocationId);
      });
    });
  });

  // ============================================================================
  // POST /api/devices - Create Device
  // ============================================================================

  describe('POST /api/devices', () => {
    it('should create a new device', async () => {
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'BTN-TEST-001',
          name: 'Test Smart Button',
          type: 'smart_button',
          subType: 'esp32',
          status: 'online',
          locationId: testLocationId,
          batteryLevel: 85,
          signalStrength: -45,
          connectionType: 'wifi',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deviceId).toBe('BTN-TEST-001');
      expect(response.body.data.name).toBe('Test Smart Button');
      expect(response.body.data.type).toBe('smart_button');
      expect(response.body.data.status).toBe('online');
      expect(response.body.data.batteryLevel).toBe(85);

      testDeviceId = response.body.data.id;
    });

    it('should create device log on creation', async () => {
      const logs = await dbService.prisma.deviceLog.findMany({
        where: {
          deviceId: testDeviceId,
          eventType: 'device_added',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].severity).toBe('info');
    });

    it('should reject duplicate deviceId', async () => {
      await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId: 'BTN-TEST-001', // Duplicate
          name: 'Another Device',
          type: 'smart_button',
        })
        .expect(400);
    });
  });

  // ============================================================================
  // GET /api/devices/:id - Get Single Device
  // ============================================================================

  describe('GET /api/devices/:id', () => {
    it('should return single device with details', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testDeviceId);
      expect(response.body.data.deviceId).toBe('BTN-TEST-001');
      expect(response.body.data).toHaveProperty('location');
      expect(response.body.data).toHaveProperty('logs');
    });

    it('should return 404 for non-existent device', async () => {
      const response = await request(app)
        .get('/api/devices/invalid-id-12345')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  // ============================================================================
  // PUT /api/devices/:id - Update Device
  // ============================================================================

  describe('PUT /api/devices/:id', () => {
    it('should update device details', async () => {
      const response = await request(app)
        .put(`/api/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Button',
          status: 'offline',
          batteryLevel: 75,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Button');
      expect(response.body.data.status).toBe('offline');
      expect(response.body.data.batteryLevel).toBe(75);
    });

    it('should update device configuration', async () => {
      const response = await request(app)
        .put(`/api/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          config: {
            buttonAction: 'call',
            ledColor: 'blue',
            soundEnabled: true,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.config).toHaveProperty('buttonAction');
      expect(response.body.data.config.buttonAction).toBe('call');
    });

    it('should create log entry on config change', async () => {
      await request(app)
        .put(`/api/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          config: { ledColor: 'red' },
        })
        .expect(200);

      const logs = await dbService.prisma.deviceLog.findMany({
        where: {
          deviceId: testDeviceId,
          eventType: 'config_change',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('should assign device to crew member', async () => {
      const response = await request(app)
        .put(`/api/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          crewMemberId: testCrewId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.crewMemberId).toBe(testCrewId);
      expect(response.body.data.crewMember).toBeDefined();
    });
  });

  // ============================================================================
  // GET /api/devices/:id/config - Get Device Configuration
  // ============================================================================

  describe('GET /api/devices/:id/config', () => {
    it('should return device configuration', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDeviceId}/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('config');
      expect(response.body.data.id).toBe(testDeviceId);
    });

    it('should return 404 for non-existent device', async () => {
      await request(app)
        .get('/api/devices/invalid-id-12345/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  // ============================================================================
  // PUT /api/devices/:id/config - Update Device Configuration
  // ============================================================================

  describe('PUT /api/devices/:id/config', () => {
    it('should update device configuration', async () => {
      const response = await request(app)
        .put(`/api/devices/${testDeviceId}/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          config: {
            buttonAction: 'service',
            ledColor: 'green',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.config.buttonAction).toBe('service');
      expect(response.body.data.config.ledColor).toBe('green');
    });

    it('should update device name via config endpoint', async () => {
      const response = await request(app)
        .put(`/api/devices/${testDeviceId}/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Renamed via Config',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Renamed via Config');
    });
  });

  // ============================================================================
  // POST /api/devices/:id/test - Test Device
  // ============================================================================

  describe('POST /api/devices/:id/test', () => {
    it('should send test signal to device', async () => {
      const response = await request(app)
        .post(`/api/devices/${testDeviceId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Test signal sent');
      expect(response.body.data.deviceId).toBe('BTN-TEST-001');
    });

    it('should create test signal log', async () => {
      await request(app)
        .post(`/api/devices/${testDeviceId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const logs = await dbService.prisma.deviceLog.findMany({
        where: {
          deviceId: testDeviceId,
          eventType: 'test_signal',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent device', async () => {
      await request(app)
        .post('/api/devices/invalid-id-12345/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  // ============================================================================
  // GET /api/devices/:id/logs - Get Device Logs
  // ============================================================================

  describe('GET /api/devices/:id/logs', () => {
    it('should return device logs', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDeviceId}/logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);

      const log = response.body.data[0];
      expect(log).toHaveProperty('eventType');
      expect(log).toHaveProperty('createdAt');
    });

    it('should filter logs by event type', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDeviceId}/logs?eventType=test_signal`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((log: any) => {
        expect(log.eventType).toBe('test_signal');
      });
    });

    it('should limit number of logs returned', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDeviceId}/logs?limit=2`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  // ============================================================================
  // GET /api/devices/logs - Get All Device Logs
  // ============================================================================

  describe('GET /api/devices/logs', () => {
    it('should return all device logs with pagination', async () => {
      const response = await request(app)
        .get('/api/devices/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter logs by device', async () => {
      const response = await request(app)
        .get(`/api/devices/logs?deviceId=${testDeviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((log: any) => {
        expect(log.deviceId).toBe('BTN-TEST-001');
      });
    });

    it('should filter logs by event type', async () => {
      const response = await request(app)
        .get('/api/devices/logs?eventType=test_signal')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((log: any) => {
        expect(log.event).toBe('test_signal');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/devices/logs?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  // ============================================================================
  // GET /api/devices/stats/summary - Get Device Statistics
  // ============================================================================

  describe('GET /api/devices/stats/summary', () => {
    it('should return device statistics', async () => {
      const response = await request(app)
        .get('/api/devices/stats/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('online');
      expect(response.body.data).toHaveProperty('offline');
      expect(response.body.data).toHaveProperty('lowBattery');
      expect(response.body.data).toHaveProperty('byType');

      expect(typeof response.body.data.total).toBe('number');
      expect(typeof response.body.data.online).toBe('number');
      expect(typeof response.body.data.offline).toBe('number');
    });

    it('should include device counts by type', async () => {
      const response = await request(app)
        .get('/api/devices/stats/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.byType).toBeDefined();
      expect(typeof response.body.data.byType).toBe('object');
    });
  });

  // ============================================================================
  // DELETE /api/devices/:id - Delete Device
  // ============================================================================

  describe('DELETE /api/devices/:id', () => {
    it('should delete device', async () => {
      // Create a temporary device for deletion
      const tempDevice = await dbService.prisma.device.create({
        data: {
          deviceId: 'BTN-TEMP-DELETE',
          name: 'Temp Device for Deletion',
          type: 'smart_button',
          status: 'offline',
        },
      });

      const response = await request(app)
        .delete(`/api/devices/${tempDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify deletion
      const deleted = await dbService.prisma.device.findUnique({
        where: { id: tempDevice.id },
      });
      expect(deleted).toBeNull();
    });

    it('should cascade delete device logs', async () => {
      // Create a device with logs
      const tempDevice = await dbService.prisma.device.create({
        data: {
          deviceId: 'BTN-TEMP-CASCADE',
          name: 'Temp Device for Cascade Test',
          type: 'smart_button',
          status: 'online',
        },
      });

      // Create a log
      await dbService.prisma.deviceLog.create({
        data: {
          deviceId: tempDevice.id,
          eventType: 'test_event',
          severity: 'info',
        },
      });

      // Delete device
      await request(app)
        .delete(`/api/devices/${tempDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify logs are also deleted (cascade)
      const logs = await dbService.prisma.deviceLog.findMany({
        where: { deviceId: tempDevice.id },
      });
      expect(logs.length).toBe(0);
    });

    it('should return 404 for non-existent device', async () => {
      await request(app)
        .delete('/api/devices/invalid-id-12345')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  // ============================================================================
  // Data Integrity Tests
  // ============================================================================

  describe('Data Integrity', () => {
    it('should enforce unique constraint on deviceId', async () => {
      await expect(
        dbService.prisma.device.create({
          data: {
            deviceId: 'BTN-TEST-001', // Duplicate
            name: 'Duplicate Device',
            type: 'smart_button',
          },
        })
      ).rejects.toThrow();
    });

    it('should validate device type values', async () => {
      const validTypes = ['smart_button', 'watch', 'repeater', 'mobile_app'];

      // Valid type should work
      const device = await dbService.prisma.device.create({
        data: {
          deviceId: 'BTN-TYPE-TEST',
          name: 'Type Test Device',
          type: validTypes[0],
        },
      });

      expect(device.type).toBe(validTypes[0]);

      // Cleanup
      await dbService.prisma.device.delete({ where: { id: device.id } });
    });
  });
});
