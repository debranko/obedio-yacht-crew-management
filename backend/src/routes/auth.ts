/**
 * Authentication Routes
 * Login, logout, token refresh, user registration
 */

import { Router } from 'express';
import { asyncHandler, createValidationError, createUnauthorizedError } from '../middleware/error-handler';
import { DatabaseService } from '../services/database';
import { Logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const logger = new Logger();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    throw createValidationError('Username and password are required');
  }

  try {
    const result = await dbService.authenticateUser(username, password);
    
    logger.authEvent('login_success', result.user.id, result.user.username, req.ip);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    logger.authEvent('login_failed', undefined, username, req.ip);
    throw createUnauthorizedError('Invalid username or password');
  }
}));

/**
 * POST /api/auth/register
 * Register new user (admin only in production)
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password, role, firstName, lastName } = req.body;

  // Validation
  if (!username || !email || !password) {
    throw createValidationError('Username, email, and password are required');
  }

  if (password.length < 8) {
    throw createValidationError('Password must be at least 8 characters long');
  }

  try {
    const user = await dbService.createUser({
      username,
      email,
      password,
      role: role || 'CREW',
      firstName,
      lastName
    });

    logger.authEvent('user_registered', user.id, user.username, req.ip);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw createValidationError('Username or email already exists');
    }
    throw error;
  }
}));

/**
 * POST /api/auth/verify
 * Verify JWT token and return user info
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw createValidationError('Token is required');
  }

  try {
    const user = await dbService.verifyToken(token);
    
    res.json({
      success: true,
      user,
      valid: true
    });
  } catch (error) {
    throw createUnauthorizedError('Invalid or expired token');
  }
}));

/**
 * POST /api/auth/logout
 * Logout user (for future session management)
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // For now, just log the logout event
  // In the future, this could invalidate refresh tokens
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const user = await dbService.verifyToken(token);
      logger.authEvent('logout', user.id, user.username, req.ip);
    } catch (error) {
      // Token invalid, but that's OK for logout
    }
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createUnauthorizedError('Authentication token required');
  }

  try {
    const token = authHeader.substring(7);
    const user = await dbService.verifyToken(token);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    throw createUnauthorizedError('Invalid or expired token');
  }
}));

export default router;