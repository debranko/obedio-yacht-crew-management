/**
 * Guests API Tests
 * Critical endpoint tests for guest management
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import { DatabaseService } from '../services/database';

const dbService = new DatabaseService();
let authToken: string;
let testGuestId: string;
let testLocationId: string;

beforeAll(async () => {
  await dbService.connect();

  // Create test user and get auth token
  const authResult = await dbService.authenticateUser('admin', 'admin123');
  authToken = authResult.token;

  // Get test location
  const locations = await dbService.getLocations();
  testLocationId = locations[0]?.id || '';
});

afterAll(async () => {
  // Cleanup test data
  if (testGuestId) {
    await dbService.deleteGuest(testGuestId).catch(() => {});
  }
  await dbService.disconnect();
});

describe('Guests API', () => {
  describe('POST /api/guests', () => {
    it('should create a new guest with valid data', async () => {
      const response = await request(app)
        .post('/api/guests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          type: 'guest',
          status: 'expected',
          locationId: testLocationId,
          checkInDate: new Date().toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.firstName).toBe('John');
      expect(response.body.data.lastName).toBe('Doe');
      expect(response.body.data.type).toBe('guest');
      expect(response.body.data.status).toBe('expected');

      testGuestId = response.body.data.id;
    });

    it('should validate GuestStatus enum values', async () => {
      const invalidStatuses = ['ONBOARD', 'Expected', 'boarding', 'checked-in'];

      for (const invalidStatus of invalidStatuses) {
        const response = await request(app)
          .post('/api/guests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'Test',
            lastName: 'Guest',
            status: invalidStatus, // Invalid status
          });

        expect(response.status).toBe(400);
      }
    });

    it('should validate GuestType enum values', async () => {
      const invalidTypes = ['OWNER', 'Charter', 'regular', 'member'];

      for (const invalidType of invalidTypes) {
        const response = await request(app)
          .post('/api/guests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'Test',
            lastName: 'Guest',
            type: invalidType, // Invalid type
          });

        expect(response.status).toBe(400);
      }
    });

    it('should accept all valid GuestStatus values', async () => {
      const validStatuses = ['expected', 'onboard', 'ashore', 'departed'];

      for (const status of validStatuses) {
        const response = await request(app)
          .post('/api/guests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'Test',
            lastName: `Status-${status}`,
            status,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.status).toBe(status);

        // Cleanup
        await dbService.deleteGuest(response.body.data.id);
      }
    });

    it('should accept all valid GuestType values', async () => {
      const validTypes = ['owner', 'vip', 'guest', 'partner', 'family'];

      for (const type of validTypes) {
        const response = await request(app)
          .post('/api/guests')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'Test',
            lastName: `Type-${type}`,
            type,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.type).toBe(type);

        // Cleanup
        await dbService.deleteGuest(response.body.data.id);
      }
    });
  });

  describe('GET /api/guests', () => {
    it('should retrieve all guests', async () => {
      const response = await request(app)
        .get('/api/guests')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/guests?status=onboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((guest: any) => guest.status === 'onboard')).toBe(true);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/guests?type=vip')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((guest: any) => guest.type === 'vip')).toBe(true);
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/api/guests?search=John')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/guests/:id', () => {
    it('should update guest status', async () => {
      const response = await request(app)
        .put(`/api/guests/${testGuestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'onboard',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('onboard');
    });

    it('should update guest type', async () => {
      const response = await request(app)
        .put(`/api/guests/${testGuestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'vip',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.type).toBe('vip');
    });

    it('should reject invalid status update', async () => {
      const response = await request(app)
        .put(`/api/guests/${testGuestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'checked-in', // Invalid status
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/guests/:id', () => {
    it('should delete a guest', async () => {
      // Create a guest to delete
      const createResponse = await request(app)
        .post('/api/guests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Delete',
          lastName: 'Me',
          type: 'guest',
          status: 'departed',
        });

      const guestId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/guests/${guestId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/guests/${guestId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
