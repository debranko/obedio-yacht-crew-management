import { Router } from 'express';
import { prisma } from '../services/db';
import bcrypt from 'bcryptjs';
import { generatePassword, generateUniqueUsername } from '../utils/password-generator';
import { asyncHandler, validate } from '../middleware/error-handler';
import { CreateCrewMemberSchema, UpdateCrewMemberSchema } from '../validators/schemas';
import { websocketService } from '../services/websocket';
import { apiSuccess, apiError } from '../utils/api-response';

const r = Router();

r.get('/', asyncHandler(async (_, res) => {
  const data = await prisma.crewMember.findMany({
    orderBy: { name: 'asc' },
    include: { user: true } // Include linked user account
  });
  res.json(apiSuccess(data));
}));

/**
 * Get filtered crew members (for Wear OS app)
 * Supports filtering by status and department
 */
r.get('/members', asyncHandler(async (req, res) => {
  const { status, department } = req.query;

  const where: any = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (department && department !== 'all') {
    where.department = department;
  }

  const data = await prisma.crewMember.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { user: true }
  });

  res.json(apiSuccess(data));
}));

/**
 * Create new crew member WITH user account
 * Automatically generates username and password
 */
r.post('/', validate(CreateCrewMemberSchema), asyncHandler(async (req, res) => {
  const {
    name,
    nickname,
    position,
    department,
    status,
    contact,
    email,
    joinDate,
    leaveStart,
    leaveEnd,
    languages,
    skills,
    role, // Role from frontend (e.g., "chief-stewardess", "stewardess", "crew", "eto")
    avatar
  } = req.body;

  // Split name into firstName and lastName
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // If no last name, use first name

  // Always create User account for login credentials (even without email)
  // Generate unique username using nickname if provided, otherwise use firstName
  const usernameBase = nickname || firstName;
  const username = await generateUniqueUsername(usernameBase, lastName, prisma);

  // Generate temporary password
  const temporaryPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  // Use provided email or generate placeholder email (for crew without email)
  const userEmail = email || `${username}@obedio.local`;

  // Create User account
  const user = await prisma.user.create({
    data: {
      username,
      email: userEmail,
      password: hashedPassword,
      role: role!, // Use role from request (chief-stewardess, stewardess, crew, eto)
      firstName,
      lastName,
    }
  });

  // Create CrewMember linked to User account
  const crewMemberResult = await prisma.$queryRaw`
    INSERT INTO "CrewMember" (
      id, name, nickname, position, department, status, contact, email,
      "joinDate", "leaveStart", "leaveEnd", languages, skills, role, "userId", avatar,
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      ${name},
      ${nickname || null},
      ${position},
      ${department},
      ${status ?? 'active'},
      ${contact ?? null},
      ${email || null},
      ${joinDate ? new Date(joinDate) : null},
      ${leaveStart ? new Date(leaveStart) : null},
      ${leaveEnd ? new Date(leaveEnd) : null},
      ${languages || []}::text[],
      ${skills || []}::text[],
      ${role},
      ${user.id},
      ${avatar || null},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `;

  const crewMember: any = (crewMemberResult as any[])[0];

  // Return crew member data WITH credentials (always included now)
  const responseData: any = {
    ...crewMember,
    credentials: {
      username,
      password: temporaryPassword, // Send plain password (only shown once!)
      message: 'Save these credentials! Password will not be shown again.'
    }
  };

  res.json(apiSuccess(responseData));
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

  res.json(apiSuccess(crewMember));
}));

/**
 * Delete crew member
 */
r.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.crewMember.delete({
    where: { id: req.params.id }
  });

  res.json(apiSuccess({ deleted: true, id: req.params.id }));
}));

export default r;