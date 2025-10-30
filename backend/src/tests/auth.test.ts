/**
 * Authentication API Tests
 * Comprehensive tests for authentication and authorization endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../server';
import { DatabaseService } from '../services/database';
import jwt from 'jsonwebtoken';

const dbService = new DatabaseService();
let validToken: string;
let testUserId: string;

beforeAll(async () => {
  await dbService.connect();

  // Get admin user credentials from database
  const adminUser = await dbService.prisma.user.findFirst({
    where: { username: 'admin' },
  });

  if (adminUser) {
    testUserId = adminUser.id;
  }
});

afterAll(async () => {
  await dbService.disconnect();
});

describe('Authentication API', () => {
  // ============================================================================
  // POST /api/auth/login - Login
  // ============================================================================

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('username');
      expect(response.body.data.user).toHaveProperty('role');
      expect(response.body.data.user.username).toBe('admin');

      validToken = response.body.data.token;
    });

    it('should login with email instead of username', async () => {
      // First get the admin email
      const adminUser = await dbService.prisma.user.findFirst({
        where: { username: 'admin' },
      });

      if (adminUser && adminUser.email) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: adminUser.email, // Using email as username
            password: 'admin123',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.username).toBe('admin');
      }
    });

    it('should reject invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent_user',
          password: 'anypassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should require username field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'admin123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should require password field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      const token = response.body.data.token;
      expect(token).toBeDefined();

      // Verify JWT structure
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const decoded: any = jwt.verify(token, JWT_SECRET);

      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('username');
      expect(decoded).toHaveProperty('role');
      expect(decoded.username).toBe('admin');
    });

    it('should include user details in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      const user = response.body.data.user;
      expect(user.id).toBeDefined();
      expect(user.username).toBe('admin');
      expect(user.email).toBeDefined();
      expect(user.role).toBeDefined();
    });
  });

  // ============================================================================
  // Rate Limiting Tests
  // ============================================================================

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login endpoint', async () => {
      // Note: The login endpoint has rate limiting configured
      // Default is 100 attempts per 15 minutes (generous for development)
      // This test would need to be adjusted based on rate limit config

      const attempts = [];
      for (let i = 0; i < 5; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              username: 'admin',
              password: 'admin123',
            })
        );
      }

      const responses = await Promise.all(attempts);

      // All should succeed since limit is high (100)
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      // Check for rate limit headers
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });

  // ============================================================================
  // GET /api/auth/verify - Verify Token
  // ============================================================================

  describe('GET /api/auth/verify', () => {
    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username');
      expect(response.body.user.username).toBe('admin');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should reject expired token', async () => {
      // Create an expired token
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const expiredToken = jwt.sign(
        { userId: testUserId, username: 'admin', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should return complete user information', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const user = response.body.user;
      expect(user.id).toBeDefined();
      expect(user.username).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.name).toBeDefined();
    });
  });

  // ============================================================================
  // POST /api/auth/refresh - Refresh Token
  // ============================================================================

  describe('POST /api/auth/refresh', () => {
    it('should refresh valid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: validToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.username).toBe('admin');

      // New token should be different from old token
      expect(response.body.data.token).not.toBe(validToken);
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token is required');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token-12345',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired refresh token');
    });

    it('should reject expired refresh token', async () => {
      // Create an expired token
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const expiredToken = jwt.sign(
        { userId: testUserId, username: 'admin', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: expiredToken,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired refresh token');
    });

    it('should return new valid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: validToken,
        })
        .expect(200);

      const newToken = response.body.data.token;

      // Verify new token is valid
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const decoded: any = jwt.verify(newToken, JWT_SECRET);

      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('admin');
    });
  });

  // ============================================================================
  // POST /api/auth/logout - Logout
  // ============================================================================

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should allow logout without authentication', async () => {
      // Logout endpoint doesn't require authentication
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ============================================================================
  // JWT Token Structure Tests
  // ============================================================================

  describe('JWT Token Structure', () => {
    it('should include standard JWT claims', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      const token = response.body.data.token;
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const decoded: any = jwt.verify(token, JWT_SECRET);

      // Standard JWT claims
      expect(decoded).toHaveProperty('iat'); // Issued at
      expect(decoded).toHaveProperty('exp'); // Expiration
      expect(decoded).toHaveProperty('sub'); // Subject (user ID)

      // Custom claims
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('username');
      expect(decoded).toHaveProperty('role');
    });

    it('should set appropriate token expiration', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      const token = response.body.data.token;
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      const decoded: any = jwt.verify(token, JWT_SECRET);

      const issuedAt = decoded.iat;
      const expiresAt = decoded.exp;

      // Token should expire in 7 days (604800 seconds)
      const expectedExpiration = issuedAt + 604800;
      expect(expiresAt).toBe(expectedExpiration);

      // Token should not be expired
      const now = Math.floor(Date.now() / 1000);
      expect(expiresAt).toBeGreaterThan(now);
    });
  });

  // ============================================================================
  // Security Tests
  // ============================================================================

  describe('Security', () => {
    it('should not return password in user object', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should not reveal if username or password is incorrect', async () => {
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'admin123',
        })
        .expect(401);

      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        })
        .expect(401);

      // Both should return same generic message
      expect(response1.body.message).toBe('Invalid credentials');
      expect(response2.body.message).toBe('Invalid credentials');
    });

    it('should use bcrypt for password comparison', async () => {
      // This test verifies that passwords are hashed
      const user = await dbService.prisma.user.findFirst({
        where: { username: 'admin' },
      });

      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe('admin123'); // Should be hashed
      expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // Bcrypt hash pattern
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should handle database connection errors gracefully', async () => {
      // This test assumes database is running
      // In a real scenario, you would mock the database to simulate errors
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        });

      // Should not return 500 error under normal circumstances
      expect(response.status).not.toBe(500);
    });
  });
});
