/**
 * Service Requests API Tests
 * Critical endpoint tests for service request management
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import { DatabaseService } from '../services/database';

const dbService = new DatabaseService();
let authToken: string;
let testGuestId: string;
let testLocationId: string;
let testServiceRequestId: string;
let testCrewId: string;

beforeAll(async () => {
  await dbService.connect();

  // Create test user and get auth token
  const authResult = await dbService.authenticateUser('admin', 'admin123');
  authToken = authResult.token;

  // Create test guest
  const testGuest = await dbService.createGuest({
    firstName: 'Test',
    lastName: 'Guest',
    type: 'guest',
    status: 'onboard',
  });
  testGuestId = testGuest.id;

  // Get test location
  const locations = await dbService.getLocations();
  testLocationId = locations[0]?.id || '';

  // Get test crew member
  const crew = await dbService.getCrewMembers();
  testCrewId = crew[0]?.id || '';
});

afterAll(async () => {
  // Cleanup test data
  if (testServiceRequestId) {
    // Delete test service request (if not cascaded)
  }
  if (testGuestId) {
    await dbService.deleteGuest(testGuestId);
  }
  await dbService.disconnect();
});

describe('Service Requests API', () => {
  describe('POST /api/service-requests', () => {
    it('should create a new service request with valid data', async () => {
      const response = await request(app)
        .post('/api/service-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          guestId: testGuestId,
          locationId: testLocationId,
          requestType: 'call',
          priority: 'normal',
          message: 'Test service request',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.priority).toBe('normal');
      expect(response.body.data.requestType).toBe('call');

      testServiceRequestId = response.body.data.id;
    });

    it('should validate enum values for status', async () => {
      const response = await request(app)
        .post('/api/service-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          guestId: testGuestId,
          status: 'INVALID_STATUS', // Should fail validation
        });

      expect(response.status).toBe(400);
    });

    it('should validate enum values for priority', async () => {
      const response = await request(app)
        .post('/api/service-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          guestId: testGuestId,
          priority: 'CRITICAL', // Invalid priority
        });

      expect(response.status).toBe(400);
    });

    it('should validate enum values for requestType', async () => {
      const response = await request(app)
        .post('/api/service-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          guestId: testGuestId,
          requestType: 'HELP', // Invalid requestType
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/service-requests', () => {
    it('should retrieve all service requests', async () => {
      const response = await request(app)
        .get('/api/service-requests')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/service-requests?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((req: any) => req.status === 'pending')).toBe(true);
    });

    it('should filter by priority', async () => {
      const response = await request(app)
        .get('/api/service-requests?priority=urgent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((req: any) => req.priority === 'urgent')).toBe(true);
    });
  });

  describe('POST /api/service-requests/:id/accept', () => {
    it('should accept a service request', async () => {
      const response = await request(app)
        .post(`/api/service-requests/${testServiceRequestId}/accept`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          crewId: testCrewId,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('accepted');
      expect(response.body.data.assignedToId).toBe(testCrewId);
      expect(response.body.data.acceptedAt).toBeTruthy();
    });

    it('should return 404 for non-existent request', async () => {
      const response = await request(app)
        .post('/api/service-requests/non-existent-id/accept')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          crewId: testCrewId,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/service-requests/:id/complete', () => {
    it('should complete a service request', async () => {
      const response = await request(app)
        .post(`/api/service-requests/${testServiceRequestId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.completedAt).toBeTruthy();
    });

    it('should create history record on completion', async () => {
      // Verify history was created in ServiceRequestHistory table
      const history = await dbService.prisma.serviceRequestHistory.findMany({
        where: { originalRequestId: testServiceRequestId },
      });

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].action).toBe('completed');
      expect(history[0].newStatus).toBe('completed');
    });
  });

  describe('POST /api/service-requests/:id/cancel', () => {
    it('should cancel a service request', async () => {
      // Create a new request to cancel
      const createResponse = await request(app)
        .post('/api/service-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          guestId: testGuestId,
          requestType: 'service',
          priority: 'low',
        });

      const requestId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/service-requests/${requestId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('cancelled');
    });
  });

  describe('Authorization', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .get('/api/service-requests');

      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/service-requests')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
