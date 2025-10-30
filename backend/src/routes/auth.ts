import { Router } from 'express';
import { prisma } from '../services/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { strictRateLimiter } from '../middleware/rate-limiter';

const router = Router();

// Rate limiting for login endpoint (prevent brute force attacks)
// Only applied in production environment
const loginLimiter = process.env.NODE_ENV === 'production'
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 attempts per window
      message: {
        success: false,
        message: 'Too many login attempts. Please try again in 15 minutes.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful logins
    })
  : (req: any, res: any, next: any) => next(); // No rate limiting in development

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔐 Login attempt:', { username, passwordLength: password?.length });
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
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
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    console.log('🔑 Checking password...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('✅ Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET not configured!');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
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

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          email: user.email,
          role: user.role,
          avatar: null,
          department: null,
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Token refresh endpoint - with strict rate limiting to prevent abuse
router.post('/refresh', strictRateLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET not configured!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    try {
      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
      
      // Find the user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId || decoded.sub }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
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

      res.json({
        success: true,
        data: {
          token: newToken,
          user: {
            id: user.id,
            username: user.username,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
            email: user.email,
            role: user.role,
            avatar: null,
            department: null,
          }
        }
      });
    } catch (err) {
      console.error('Token refresh error:', err);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token endpoint - with general rate limiting
router.get('/verify', strictRateLimiter, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET not configured!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId || decoded.sub }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      res.json({
        success: true,
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
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Password setup endpoint (for new crew members) - with strict rate limiting
router.post('/setup-password', strictRateLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET not configured!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    try {
      // Verify setup token
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Check token type
      if (decoded.type !== 'password-setup') {
        return res.status(401).json({
          success: false,
          message: 'Invalid setup token'
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          password: hashedPassword,
          lastLogin: new Date() // Mark as activated
        }
      });

      res.json({
        success: true,
        message: 'Password set successfully. You can now login with your credentials.',
        username: decoded.username
      });
    } catch (err) {
      console.error('Setup token error:', err);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired setup token'
      });
    }
  } catch (error) {
    console.error('Setup password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;