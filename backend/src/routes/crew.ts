import { Router } from 'express';
import { prisma } from '../services/db';
import bcrypt from 'bcryptjs';
import { generatePassword, generateUniqueUsername } from '../utils/password-generator';
import { asyncHandler, validate } from '../middleware/error-handler';
import { CreateCrewMemberSchema, UpdateCrewMemberSchema } from '../validators/schemas';
import { websocketService } from '../services/websocket';

const r = Router();

r.get('/', asyncHandler(async (_, res) => {
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
r.post('/', validate(CreateCrewMemberSchema), asyncHandler(async (req, res) => {
  const {
    name,
    position,
    department,
    status,
    contact,
    email,
    joinDate,
    role // Role from frontend (e.g., "chief-stewardess", "stewardess", "crew", "eto")
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
      position,
      department,
      status: status ?? 'active',
      contact: contact ?? null,
      email: email!,
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
}));

/**
 * Update crew member (including status changes)
 */
r.put('/:id', validate(UpdateCrewMemberSchema), asyncHandler(async (req, res) => {
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
r.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.crewMember.delete({
    where: { id: req.params.id }
  });

  res.json({ success: true, message: 'Crew member deleted successfully' });
}));

export default r;