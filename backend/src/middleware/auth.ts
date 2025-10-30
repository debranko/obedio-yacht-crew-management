import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  console.log('🔐 Auth middleware:', { 
    hasHeader: !!h, 
    headerPrefix: h?.substring(0, 20),
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET?.length 
  });
  
  if (!h?.startsWith('Bearer ')) {
    console.log('❌ No Bearer token found');
    return res.status(401).json({ error: 'Auth required' });
  }
  
  try {
    const token = h.slice(7);
    console.log('🔑 Verifying token...');
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    console.log('✅ Token verified:', { userId: payload.sub || payload.userId, role: payload.role });
    
    // Support both 'sub' (standard) and 'userId' (legacy)
    (req as any).user = { 
      id: payload.sub || payload.userId, 
      role: payload.role, 
      username: payload.username 
    };
    return next();
  } catch (error) {
    console.log('❌ Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Permission-based authorization middleware
 * For now: ADMIN has all permissions, others need specific permissions
 */
// Alias for backward compatibility
export const authenticate = authMiddleware;

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Admin role has all permissions
    const adminRoles = ['admin', 'ADMIN'];
    if (adminRoles.includes(user.role)) {
      return next();
    }

    // Permission mapping for different roles
    const rolePermissions: Record<string, string[]> = {
      'chief-stewardess': [
        'service-requests.view',
        'service-requests.create',
        'service-requests.accept',
        'service-requests.complete',
        'guests.view',
        'crew.view',
        'devices.view',
        'system.view-logs'
      ],
      'stewardess': [
        'service-requests.view',
        'service-requests.accept',
        'service-requests.complete',
        'guests.view'
      ],
      'eto': [
        'devices.view',
        'devices.add',
        'devices.edit',
        'system.view-logs'
      ],
      'crew': [
        'service-requests.view',
        'guests.view'
      ]
    };

    const userPermissions = rolePermissions[user.role] || [];

    if (userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  };
}

/**
 * ESP32/Device API Key Authentication Middleware
 * Validates API keys sent by hardware devices (ESP32, smart buttons, watches)
 * Header: X-Device-API-Key: <api_key>
 */
export function esp32AuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-device-api-key'] as string;

  console.log('🔐 ESP32 Auth:', {
    hasApiKey: !!apiKey,
    deviceId: req.params.deviceId || req.body.deviceId
  });

  if (!apiKey) {
    console.log('❌ No API key provided');
    return res.status(401).json({
      success: false,
      error: 'Device API key required. Please include X-Device-API-Key header.'
    });
  }

  // For now, use a simple API key validation
  // In production, this should validate against database
  const validApiKey = process.env.ESP32_API_KEY || 'esp32-default-key-change-in-production';

  if (apiKey !== validApiKey) {
    console.log('❌ Invalid API key');
    return res.status(403).json({
      success: false,
      error: 'Invalid device API key'
    });
  }

  console.log('✅ ESP32 auth successful');

  // Attach device info to request
  (req as any).device = {
    authenticated: true,
    deviceId: req.params.deviceId || req.body.deviceId
  };

  return next();
}