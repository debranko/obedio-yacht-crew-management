import { Router } from 'express';
import { prisma } from '../services/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generatePassword, generateUniqueUsername } from '../utils/password-generator';
import { asyncHandler, validate } from '../middleware/error-handler';
import { CreateCrewMemberSchema, UpdateCrewMemberSchema } from '../validators/schemas';
import { websocketService } from '../services/websocket';
import { requirePermission } from '../middleware/auth';

const r = Router();

r.get('/', requirePermission('crew.view'), asyncHandler(async (_, res) => {
  const data = await prisma.crewMember.findMany({
    orderBy: { name: 'asc' },
    include: { user: true } // Include linked user account
  });
  res.json({ success: true, data });
}));

/**
 * Create new crew member WITH user account
 * Automatically generates username and password
 */
r.post('/', requirePermission('crew.create'), validate(CreateCrewMemberSchema), asyncHandler(async (req, res) => {
  const {
    name,
    nickname,
    position,
    department,
    status,
    contact,
    email,
    phone,
    onBoardContact,
    joinDate,
    role, // Role from frontend (e.g., "chief-stewardess", "stewardess", "crew", "eto")
    avatar,
    color,
    leaveStart,
    leaveEnd,
    languages,
    skills,
    notes
  } = req.body;

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
      email: email!,
      password: hashedPassword,
      role: role!, // Use role from request (chief-stewardess, stewardess, crew, eto)
      firstName,
      lastName,
    }
  });

  // Create CrewMember linked to User
  const crewMember = await prisma.crewMember.create({
    data: {
      name,
      nickname: nickname ?? null,
      position,
      department,
      status: status ?? 'active',
      contact: contact ?? null,
      email: email!,
      phone: phone ?? null,
      onBoardContact: onBoardContact ?? null,
      joinDate: joinDate ? new Date(joinDate) : null,
      role, // Store role in crew member too for quick access
      userId: user.id, // Link to user account
      avatar: avatar ?? null,
      color: color ?? '#C8A96B', // Default gold color
      leaveStart: leaveStart ?? null,
      leaveEnd: leaveEnd ?? null,
      languages: languages ?? [],
      skills: skills ?? [],
      notes: notes ?? null,
    },
    include: {
      user: true, // Include user in response
    }
  });

  // Generate secure setup token (expires in 24 hours)
  const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  const setupToken = jwt.sign(
    {
      userId: user.id,
      type: 'password-setup',
      username
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Create setup link
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const setupLink = `${FRONTEND_URL}/setup-password?token=${setupToken}`;

  // Return crew member data WITH secure setup link (NOT plain password!)
  res.status(201).json({
    success: true,
    data: {
      ...crewMember,
      setup: {
        username,
        setupLink,
        expiresIn: '24 hours',
        message: 'Share this link with the crew member to set their password. Link expires in 24 hours.'
      }
    }
  });
}));

/**
 * Update crew member (including status changes)
 */
r.put('/:id', requirePermission('crew.edit'), validate(UpdateCrewMemberSchema), asyncHandler(async (req, res) => {
  const crewMember = await prisma.crewMember.update({
    where: { id: req.params.id },
    data: req.body,
    include: { user: true }
  });

  // Broadcast crew member update to all connected clients
  // Especially important for status changes (on-duty, off-duty, on-leave)
  if (req.body.status) {
    websocketService.emitCrewStatusChanged(crewMember);
  }

  res.json({ success: true, data: crewMember });
}));

/**
 * Delete crew member
 */
r.delete('/:id', requirePermission('crew.delete'), asyncHandler(async (req, res) => {
  await prisma.crewMember.delete({
    where: { id: req.params.id }
  });

  res.json({ success: true, message: 'Crew member deleted successfully' });
}));

export default r;