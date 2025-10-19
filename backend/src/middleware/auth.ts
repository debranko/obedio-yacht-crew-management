/**
 * Authentication Middleware
 * JWT token verification and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/database';
import { Logger } from '../utils/logger';

const logger = new Logger();
const dbService = new DatabaseService();

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        role: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

/**
 * JWT Authentication middleware
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database to ensure it's still active
    const user = await dbService.verifyToken(token);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token is valid but user not found or inactive'
      });
    }

    // Attach user to request
    req.user = user;
    
    logger.authEvent('token_verified', user.id, user.username, req.ip);
    next();
    
  } catch (error) {
    logger.authEvent('token_verification_failed', undefined, undefined, req.ip);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is malformed or invalid.'
      });
    }
    
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Unable to verify authentication token'
    });
  }
}

/**
 * Role-based authorization middleware factory
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.authEvent('role_access_denied', req.user.id, req.user.username, req.ip);
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    logger.authEvent('role_access_granted', req.user.id, req.user.username, req.ip);
    next();
  };
}

/**
 * Permission-based authorization middleware factory
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource'
      });
    }

    try {
      // TODO: Implement permission checking against database
      // For now, use role-based simple mapping
      const rolePermissions: Record<string, string[]> = {
        'ADMIN': ['*'], // Admin has all permissions
        'CHIEF_STEWARDESS': ['crew.view', 'crew.edit', 'guests.*', 'service-requests.*', 'locations.view'],
        'STEWARDESS': ['crew.view', 'guests.view', 'guests.edit', 'service-requests.*'],
        'ETO': ['devices.*', 'locations.*', 'crew.view'],
        'CREW': ['crew.view', 'service-requests.view']
      };

      const userPermissions = rolePermissions[req.user.role] || [];
      
      // Check if user has required permissions
      const hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes('*') || 
        userPermissions.includes(permission) ||
        userPermissions.some(userPerm => userPerm.endsWith('.*') && permission.startsWith(userPerm.slice(0, -1)))
      );

      if (!hasPermission) {
        logger.authEvent('permission_denied', req.user.id, req.user.username, req.ip);
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `This action requires permissions: ${requiredPermissions.join(', ')}`
        });
      }

      logger.authEvent('permission_granted', req.user.id, req.user.username, req.ip);
      next();
      
    } catch (error) {
      logger.error('Permission check failed', error);
      return res.status(500).json({ 
        error: 'Permission check failed',
        message: 'Unable to verify user permissions'
      });
    }
  };
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await dbService.verifyToken(token);
      req.user = user;
      logger.authEvent('optional_auth_success', user.id, user.username, req.ip);
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth errors, just continue without user
    logger.authEvent('optional_auth_failed', undefined, undefined, req.ip);
    next();
  }
}