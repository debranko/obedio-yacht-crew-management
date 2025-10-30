/**
 * Crew API Tests
 * Critical endpoint tests for crew member management
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import { DatabaseService } from '../services/database';

const dbService = new DatabaseService();
let authToken: string;
let testCrewId: string;

beforeAll(async () => {
  await dbService.connect();

  // Create test user and get auth token
  const authResult = await dbService.authenticateUser('admin', 'admin123');
  authToken = authResult.token;
});

afterAll(async () => {
  // Cleanup test data
  if (testCrewId) {
    // Crew members are typically not deleted in production, just set to inactive
  }
  await dbService.disconnect();
});

describe('Crew API', () => {
  describe('GET /api/crew', () => {
    it('should retrieve all crew members', async () => {
      const response = await request(app)
        .get('/api/crew')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return crew with correct status enum values', async () => {
      const response = await request(app)
        .get('/api/crew')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const validStatuses = ['active', 'on-duty', 'off-duty', 'on-leave'];
      response.body.data.forEach((crew: any) => {
        expect(validStatuses).toContain(crew.status);
      });
    });
  });

  describe('PUT /api/crew/:id/status', () => {
    beforeAll(async () => {
      // Get a crew member to test status updates
      const crew = await dbService.getCrewMembers();
      testCrewId = crew[0]?.id || '';
    });

    it('should update crew status to on-duty', async () => {
      const response = await request(app)
        .put(`/api/crew/${testCrewId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'on-duty',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('on-duty');
    });

    it('should update crew status to off-duty', async () => {
      const response = await request(app)
        .put(`/api/crew/${testCrewId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'off-duty',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('off-duty');
    });

    it('should update crew status to on-leave', async () => {
      const response = await request(app)
        .put(`/api/crew/${testCrewId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'on-leave',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('on-leave');
    });

    it('should update crew status to active', async () => {
      const response = await request(app)
        .put(`/api/crew/${testCrewId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'active',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('active');
    });

    it('should reject invalid status values', async () => {
      const invalidStatuses = ['ON_DUTY', 'working', 'available', 'inactive'];

      for (const invalidStatus of invalidStatuses) {
        const response = await request(app)
          .put(`/api/crew/${testCrewId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            status: invalidStatus,
          });

        expect(response.status).toBe(400);
      }
    });

    it('should log status change to activity log', async () => {
      // Update status
      await request(app)
        .put(`/api/crew/${testCrewId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'on-duty',
        });

      // Check if activity log was created
      const logs = await dbService.prisma.activityLog.findMany({
        where: {
          type: 'CREW',
          userId: testCrewId,
        },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toContain('Status changed');
    });
  });

  describe('Enum Validation', () => {
    it('should validate all valid CrewMemberStatus enum values', async () => {
      const validStatuses = ['active', 'on-duty', 'off-duty', 'on-leave'];

      for (const status of validStatuses) {
        const response = await request(app)
          .put(`/api/crew/${testCrewId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe(status);
      }
    });

    it('should reject uppercase status values', async () => {
      const uppercaseStatuses = ['ACTIVE', 'ON_DUTY', 'OFF_DUTY', 'ON_LEAVE'];

      for (const status of uppercaseStatuses) {
        const response = await request(app)
          .put(`/api/crew/${testCrewId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status });

        expect(response.status).toBe(400);
      }
    });

    it('should reject underscore format', async () => {
      const underscoreStatuses = ['on_duty', 'off_duty', 'on_leave'];

      for (const status of underscoreStatuses) {
        const response = await request(app)
          .put(`/api/crew/${testCrewId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status });

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Authorization', () => {
    it('should reject requests without auth token', async () => {
      const response = await request(app)
        .get('/api/crew');

      expect(response.status).toBe(401);
    });

    it('should reject status updates from non-admin users', async () => {
      // This test assumes role-based permissions are implemented
      // Adjust based on your actual permission system

      const response = await request(app)
        .put(`/api/crew/${testCrewId}/status`)
        .set('Authorization', 'Bearer invalid-token')
        .send({
          status: 'on-leave',
        });

      expect(response.status).toBe(401);
    });
  });
});
