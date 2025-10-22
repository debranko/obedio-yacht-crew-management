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