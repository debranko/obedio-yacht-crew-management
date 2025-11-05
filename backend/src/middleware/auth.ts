import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Try to get token from Authorization header OR HTTP-only cookie
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.['obedio-auth-token'];

  let token: string | null = null;

  // Priority 1: Authorization header (for backward compatibility)
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }
  // Priority 2: HTTP-only cookie (new approach - server runs 24/7)
  else if (cookieToken) {
    token = cookieToken;
  }

  console.log('🔐 Auth middleware:', {
    hasAuthHeader: !!authHeader,
    hasCookie: !!cookieToken,
    tokenSource: token ? (authHeader ? 'header' : 'cookie') : 'none',
    hasJwtSecret: !!process.env.JWT_SECRET
  });

  if (!token) {
    console.log('❌ No auth token found in header or cookie');
    return res.status(401).json({ error: 'Auth required' });
  }

  try {
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
        'service-requests.view', // ✅ ETO can see service requests (all roles should see calls)
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