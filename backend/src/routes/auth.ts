import { Router } from 'express';
import { prisma } from '../services/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for login endpoint (prevent brute force attacks)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { 
    success: false, 
    message: 'Too many login attempts. Please try again in 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
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

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
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
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    });
  } catch (error) {
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