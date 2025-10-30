import { Router } from 'express';
import { prisma } from '../services/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for login endpoint (prevent brute force attacks)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 attempts per window (generous for development)
  message: { 
    success: false, 
    message: 'Too many login attempts. Please try again in 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

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

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
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

// Verify token endpoint
router.get('/verify', async (req, res) => {
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

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;