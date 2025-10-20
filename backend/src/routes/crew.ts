import { Router } from 'express';
import { prisma } from '../services/db';
import bcrypt from 'bcryptjs';
import { generatePassword, generateUniqueUsername } from '../utils/password-generator';

const r = Router();

r.get('/', async (_, res) => {
  const data = await prisma.crewMember.findMany({ 
    orderBy: { name: 'asc' },
    include: { user: true } // Include linked user account
  });
  res.json({ success: true, data });
});

/**
 * Create new crew member WITH user account
 * Automatically generates username and password
 */
r.post('/', async (req, res) => {
  try {
    const { 
      name, 
      position, 
      department, 
      status, 
      contact, 
      email, 
      joinDate, 
      role // Role from frontend (e.g., "chief-stewardess", "stewardess", "crew", "eto")
    } = req.body ?? {};

    // Validate required fields
    if (!name || !position || !department || !role || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, position, department, role, and email are required' 
      });
    }

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // If no last name, use first name

    // Generate unique username
    const username = await generateUniqueUsername(firstName, lastName, prisma);

    // Generate temporary password
    const temporaryPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create User account first
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role, // Use role from request (chief-stewardess, stewardess, crew, eto)
        firstName,
        lastName,
      }
    });

    // Create CrewMember linked to User
    const crewMember = await prisma.crewMember.create({
      data: {
        name,
        position,
        department,
        status: status ?? 'active',
        contact: contact ?? null,
        email,
        joinDate: joinDate ? new Date(joinDate) : null,
        role, // Store role in crew member too for quick access
        userId: user.id, // Link to user account
      },
      include: {
        user: true, // Include user in response
      }
    });

    // Return crew member data WITH credentials
    res.json({ 
      success: true, 
      data: {
        ...crewMember,
        credentials: {
          username,
          password: temporaryPassword, // Send plain password (only shown once!)
          message: 'Save these credentials! Password will not be shown again.'
        }
      }
    });

  } catch (error: any) {
    console.error('Error creating crew member:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create crew member' 
    });
  }
});

export default r;