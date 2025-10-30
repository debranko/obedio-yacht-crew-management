/**
 * Locations API Tests
 * Comprehensive tests for location management endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import { DatabaseService } from '../services/database';

const dbService = new DatabaseService();
let testLocationId: string;
let testLocationWithSmartButton: string;

beforeAll(async () => {
  await dbService.connect();
});

afterAll(async () => {
  // Cleanup test locations
  try {
    if (testLocationId) {
      await dbService.prisma.location.delete({ where: { id: testLocationId } }).catch(() => {});
    }
    if (testLocationWithSmartButton) {
      await dbService.prisma.location.delete({ where: { id: testLocationWithSmartButton } }).catch(() => {});
    }
  } catch (error) {
    // Ignore cleanup errors
  }
  await dbService.disconnect();
});

describe('Locations API', () => {
  // ============================================================================
  // GET /api/locations - Get All Locations
  // ============================================================================

  describe('GET /api/locations', () => {
    it('should return all locations with guests and service requests', async () => {
      const response = await request(app)
        .get('/api/locations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThanOrEqual(0);

      if (response.body.data.length > 0) {
        const location = response.body.data[0];
        expect(location).toHaveProperty('id');
        expect(location).toHaveProperty('name');
        expect(location).toHaveProperty('type');
        expect(location).toHaveProperty('guests');
        expect(location).toHaveProperty('serviceRequests');
      }
    });

    it('should return locations ordered by name', async () => {
      const response = await request(app)
        .get('/api/locations')
        .expect(200);

      const names = response.body.data.map((loc: any) => loc.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  // ============================================================================
  // POST /api/locations - Create Location
  // ============================================================================

  describe('POST /api/locations', () => {
    it('should create a new location', async () => {
      const response = await request(app)
        .post('/api/locations')
        .send({
          name: 'Test Cabin A1',
          type: 'cabin',
          floor: 'Main Deck',
          description: 'Test cabin for API tests',
          doNotDisturb: false,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Cabin A1');
      expect(response.body.data.type).toBe('cabin');
      expect(response.body.data.floor).toBe('Main Deck');
      expect(response.body.data.doNotDisturb).toBe(false);

      testLocationId = response.body.data.id;
    });

    it('should create location with smart button ID', async () => {
      const response = await request(app)
        .post('/api/locations')
        .send({
          name: 'Test Cabin B2',
          type: 'cabin',
          floor: 'Upper Deck',
          smartButtonId: 'BTN-TEST-001',
          description: 'Cabin with smart button',
          doNotDisturb: false,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.smartButtonId).toBe('BTN-TEST-001');

      testLocationWithSmartButton = response.body.data.id;
    });

    it('should reject duplicate location name', async () => {
      await request(app)
        .post('/api/locations')
        .send({
          name: 'Test Cabin A1', // Duplicate name
          type: 'cabin',
          floor: 'Main Deck',
        })
        .expect(400);
    });

    it('should reject duplicate smart button ID', async () => {
      const response = await request(app)
        .post('/api/locations')
        .send({
          name: 'Another Cabin',
          type: 'cabin',
          smartButtonId: 'BTN-TEST-001', // Duplicate button
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already assigned');
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/locations')
        .send({
          // Missing name
          type: 'cabin',
        })
        .expect(400);
    });
  });

  // ============================================================================
  // GET /api/locations/:id - Get Single Location
  // ============================================================================

  describe('GET /api/locations/:id', () => {
    it('should return a single location by ID', async () => {
      const response = await request(app)
        .get(`/api/locations/${testLocationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testLocationId);
      expect(response.body.data.name).toBe('Test Cabin A1');
      expect(response.body.data).toHaveProperty('guests');
      expect(response.body.data).toHaveProperty('serviceRequests');
    });

    it('should return 404 for non-existent location', async () => {
      const response = await request(app)
        .get('/api/locations/invalid-id-12345')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  // ============================================================================
  // PUT /api/locations/:id - Update Location
  // ============================================================================

  describe('PUT /api/locations/:id', () => {
    it('should update location details', async () => {
      const response = await request(app)
        .put(`/api/locations/${testLocationId}`)
        .send({
          name: 'Updated Cabin A1',
          description: 'Updated description',
          floor: 'Lower Deck',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Cabin A1');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.floor).toBe('Lower Deck');
    });

    it('should update smart button assignment', async () => {
      const response = await request(app)
        .put(`/api/locations/${testLocationId}`)
        .send({
          smartButtonId: 'BTN-TEST-002',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.smartButtonId).toBe('BTN-TEST-002');
    });

    it('should reject duplicate smart button ID on update', async () => {
      const response = await request(app)
        .put(`/api/locations/${testLocationId}`)
        .send({
          smartButtonId: 'BTN-TEST-001', // Already assigned to another location
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already assigned');
    });

    it('should remove smart button by setting to null', async () => {
      const response = await request(app)
        .put(`/api/locations/${testLocationId}`)
        .send({
          smartButtonId: null,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.smartButtonId).toBeNull();
    });

    it('should return 404 for non-existent location', async () => {
      await request(app)
        .put('/api/locations/invalid-id-12345')
        .send({
          name: 'Some Name',
        })
        .expect(404);
    });
  });

  // ============================================================================
  // POST /api/locations/:id/toggle-dnd - Toggle Do Not Disturb
  // ============================================================================

  describe('POST /api/locations/:id/toggle-dnd', () => {
    it('should enable DND for location', async () => {
      const response = await request(app)
        .post(`/api/locations/${testLocationId}/toggle-dnd`)
        .send({ enabled: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.location.doNotDisturb).toBe(true);
    });

    it('should disable DND for location', async () => {
      const response = await request(app)
        .post(`/api/locations/${testLocationId}/toggle-dnd`)
        .send({ enabled: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.location.doNotDisturb).toBe(false);
    });

    it('should return 404 for non-existent location', async () => {
      await request(app)
        .post('/api/locations/invalid-id-12345/toggle-dnd')
        .send({ enabled: true })
        .expect(404);
    });
  });

  // ============================================================================
  // GET /api/locations/dnd/active - Get DND Locations
  // ============================================================================

  describe('GET /api/locations/dnd/active', () => {
    beforeAll(async () => {
      // Enable DND for test location
      await dbService.prisma.location.update({
        where: { id: testLocationId },
        data: { doNotDisturb: true },
      });
    });

    it('should return only locations with DND enabled', async () => {
      const response = await request(app)
        .get('/api/locations/dnd/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // All returned locations should have doNotDisturb: true
      response.body.data.forEach((loc: any) => {
        expect(loc.doNotDisturb).toBe(true);
      });

      // Should include our test location
      const testLoc = response.body.data.find((loc: any) => loc.id === testLocationId);
      expect(testLoc).toBeDefined();
    });

    afterAll(async () => {
      // Disable DND for cleanup
      await dbService.prisma.location.update({
        where: { id: testLocationId },
        data: { doNotDisturb: false },
      });
    });
  });

  // ============================================================================
  // DELETE /api/locations/:id - Delete Location
  // ============================================================================

  describe('DELETE /api/locations/:id', () => {
    it('should prevent deletion if location has guests', async () => {
      // Create a guest assigned to test location
      const guest = await dbService.createGuest({
        firstName: 'Test',
        lastName: 'Guest',
        type: 'guest',
        status: 'onboard',
        locationId: testLocationId,
      });

      const response = await request(app)
        .delete(`/api/locations/${testLocationId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('assigned guests');

      // Cleanup guest
      await dbService.deleteGuest(guest.id);
    });

    it('should prevent deletion if location has service requests', async () => {
      // Create a service request for test location
      const serviceRequest = await dbService.createServiceRequest({
        locationId: testLocationId,
        requestType: 'call',
        priority: 'normal',
        status: 'pending',
        notes: 'Test request',
      });

      const response = await request(app)
        .delete(`/api/locations/${testLocationId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('service requests');

      // Cleanup service request
      await dbService.prisma.serviceRequest.delete({
        where: { id: serviceRequest.id },
      });
    });

    it('should delete location without guests or requests', async () => {
      // Create a temporary location for deletion
      const tempLocation = await dbService.prisma.location.create({
        data: {
          name: 'Temp Location for Deletion',
          type: 'cabin',
        },
      });

      const response = await request(app)
        .delete(`/api/locations/${tempLocation.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify deletion
      const deleted = await dbService.prisma.location.findUnique({
        where: { id: tempLocation.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent location', async () => {
      const response = await request(app)
        .delete('/api/locations/invalid-id-12345')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  // ============================================================================
  // Data Integrity Tests
  // ============================================================================

  describe('Data Integrity', () => {
    it('should enforce unique constraint on location name', async () => {
      // Attempt to create duplicate via direct DB call should fail
      await expect(
        dbService.prisma.location.create({
          data: {
            name: 'Updated Cabin A1', // Duplicate of testLocationId
            type: 'cabin',
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on smartButtonId', async () => {
      // BTN-TEST-001 is assigned to testLocationWithSmartButton
      await expect(
        dbService.prisma.location.create({
          data: {
            name: 'Another Test Cabin',
            type: 'cabin',
            smartButtonId: 'BTN-TEST-001',
          },
        })
      ).rejects.toThrow();
    });
  });
});
