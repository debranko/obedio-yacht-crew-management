import { Router } from 'express';
import { prisma } from '../services/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/error-handler';
import { apiSuccess, apiError } from '../utils/api-response';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  console.log('🔐 Login attempt:', { username, passwordLength: password?.length });

  if (!username || !password) {
    return res.status(400).json(apiError('Username and password are required', 'VALIDATION_ERROR'));
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email: username }
      ]
    }
  });

  console.log('👤 User found:', user ? { id: user.id, username: user.username } : 'NOT FOUND');

  if (!user) {
    return res.status(401).json(apiError('Invalid credentials', 'UNAUTHORIZED'));
  }

  // Check password
  console.log('🔑 Checking password...');
  const isValidPassword = await bcrypt.compare(password, user.password);
  console.log('✅ Password valid:', isValidPassword);

  if (!isValidPassword) {
    return res.status(401).json(apiError('Invalid credentials', 'UNAUTHORIZED'));
  }

  // Generate JWT token
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET not configured!');
    return res.status(500).json(apiError('Server configuration error', 'SERVER_ERROR'));
  }

  const token = jwt.sign(
    {
      sub: user.id,        // Standard JWT field
      userId: user.id,     // Legacy compatibility
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Set HTTP-only cookie for token (server-side storage, 24/7 operation)
  res.cookie('obedio-auth-token', token, {
    httpOnly: true,      // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',     // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/'
  });

  res.json(apiSuccess({
    user: {
      id: user.id,
      username: user.username,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      email: user.email,
      role: user.role,
      avatar: null,
      department: null,
    },
    token // Still send token in response for backward compatibility during transition
  }));
}));

// Token refresh endpoint
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json(apiError('Refresh token is required', 'VALIDATION_ERROR'));
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET not configured!');
    return res.status(500).json(apiError('Server configuration error', 'SERVER_ERROR'));
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.sub }
    });

    if (!user) {
      return res.status(401).json(apiError('Invalid refresh token', 'UNAUTHORIZED'));
    }

    // Generate new access token
    const newToken = jwt.sign(
      {
        sub: user.id,
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie for refreshed token
    res.cookie('obedio-auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json(apiSuccess({
      token: newToken, // Still send token in response for backward compatibility
      user: {
        id: user.id,
        username: user.username,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        email: user.email,
        role: user.role,
        avatar: null,
        department: null,
      }
    }));
  } catch (err) {
    console.error('Token refresh error:', err);
    return res.status(401).json(apiError('Invalid or expired refresh token', 'UNAUTHORIZED'));
  }
}));

// Verify token endpoint
router.get('/verify', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(apiError('No token provided', 'UNAUTHORIZED'));
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET not configured!');
    return res.status(500).json(apiError('Server configuration error', 'SERVER_ERROR'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.sub }
    });

    if (!user) {
      return res.status(401).json(apiError('Invalid token', 'UNAUTHORIZED'));
    }

    res.json(apiSuccess({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        email: user.email,
        role: user.role,
        avatar: null,
        department: null,
      }
    }));
  } catch (err) {
    return res.status(401).json(apiError('Invalid or expired token', 'UNAUTHORIZED', { valid: false }));
  }
}));

router.post('/logout', (req, res) => {
  // Clear HTTP-only cookie
  res.clearCookie('obedio-auth-token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  res.json(apiSuccess({ message: 'Logged out successfully' }));
});

export default router;