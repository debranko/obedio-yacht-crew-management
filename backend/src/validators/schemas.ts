/**
 * Zod Validation Schemas
 * Input validation for all API endpoints
 */

import { z } from 'zod';

// =====================
// GUEST SCHEMAS
// =====================

export const CreateGuestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  preferredName: z.string().max(50).optional().nullable(),
  photo: z.string().optional().nullable(), // Base64 or URL
  type: z.enum(['owner', 'vip', 'guest', 'partner', 'family'], {
    errorMap: () => ({ message: 'Invalid guest type' })
  }).default('guest'),
  status: z.enum(['expected', 'onboard', 'ashore', 'departed'], {
    errorMap: () => ({ message: 'Invalid status' })
  }).default('onboard'),
  nationality: z.string().max(50).optional().nullable(),
  languages: z.array(z.string()).optional().default([]),
  passportNumber: z.string().max(50).optional().nullable(),
  locationId: z.string().optional().nullable(),
  cabin: z.string().max(50).optional().nullable(), // Legacy field
  doNotDisturb: z.boolean().optional().default(false),

  // Accommodation & Check-in Info
  checkInDate: z.string().datetime().optional().nullable(),
  checkInTime: z.string().max(5).optional().nullable(), // HH:mm format
  checkOutDate: z.string().datetime().optional().nullable(),
  checkOutTime: z.string().max(5).optional().nullable(), // HH:mm format

  // Special Occasions
  specialOccasion: z.string().max(100).optional().nullable(),
  specialOccasionDate: z.string().datetime().optional().nullable(),

  // Dietary & Medical Arrays
  allergies: z.array(z.string()).optional().default([]),
  dietaryRestrictions: z.array(z.string()).optional().default([]),
  medicalConditions: z.array(z.string()).optional().default([]),
  foodDislikes: z.array(z.string()).optional().default([]),
  favoriteFoods: z.array(z.string()).optional().default([]),
  favoriteDrinks: z.array(z.string()).optional().default([]),

  // Notes & Preferences (categorized)
  preferences: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  specialRequests: z.string().max(2000).optional().nullable(),
  vipNotes: z.string().max(2000).optional().nullable(),
  crewNotes: z.string().max(2000).optional().nullable(),

  // Contact Person (Family Office, Manager, Agent)
  contactPerson: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email().optional().nullable(),
    role: z.string(), // e.g., "Family Office", "Manager", "Agent"
  }).optional().nullable(),

  // Emergency Contact
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  emergencyContactRelation: z.string().max(50).optional().nullable(),

  // Guest Contact Info
  email: z.string().email().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),

  // Metadata
  createdBy: z.string().optional().nullable(), // User ID
});

export const UpdateGuestSchema = CreateGuestSchema.partial();

// =====================
// CREW MEMBER SCHEMAS
// =====================

export const CreateCrewMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  nickname: z.string().max(100).optional().nullable(),
  position: z.string().min(1, 'Position is required').max(100, 'Position too long'),
  department: z.string().min(1, 'Department is required').max(100, 'Department too long'),
  status: z.enum(['active', 'on-duty', 'off-duty', 'on-leave']).default('active'),
  contact: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email').max(100).optional().nullable(),
  joinDate: z.string().datetime().optional().nullable(),
  leaveStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional().nullable(),
  leaveEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional().nullable(),
  languages: z.array(z.string()).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  role: z.string().max(50).optional().nullable(),
  userId: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
});

export const UpdateCrewMemberSchema = CreateCrewMemberSchema.partial();

// =====================
// SERVICE REQUEST SCHEMAS
// =====================

export const CreateServiceRequestSchema = z.object({
  requestType: z.string().max(50).optional().default('call'),
  guestId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  cabinId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  priority: z.enum(['low', 'normal', 'urgent', 'emergency']).default('normal'),
  status: z.enum(['open', 'pending', 'in-progress', 'completed', 'cancelled']).default('open'),
  notes: z.string().max(2000).optional().nullable(),
  voiceTranscript: z.string().max(5000).optional().nullable(),
  assignedTo: z.string().max(100).optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  guestName: z.string().max(100).optional().nullable(),
  guestCabin: z.string().max(100).optional().nullable(),
});

export const UpdateServiceRequestSchema = CreateServiceRequestSchema.partial();

// =====================
// LOCATION SCHEMAS
// =====================

export const CreateLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.string().min(1, 'Type is required').max(50, 'Type too long'),
  floor: z.string().max(50).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  image: z.string().max(500).optional().nullable(),
  smartButtonId: z.string().max(50).optional().nullable(),
  doNotDisturb: z.boolean().optional().default(false),
});

export const UpdateLocationSchema = CreateLocationSchema.partial();

// =====================
// SHIFT SCHEMAS
// =====================

export const CreateShiftSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (hex)').default('#3B82F6'),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional().default(0),
  primaryCount: z.number().int().min(0).optional().default(2),
  backupCount: z.number().int().min(0).optional().default(1),
});

export const UpdateShiftSchema = CreateShiftSchema.partial();

// =====================
// ASSIGNMENT SCHEMAS
// =====================

export const CreateAssignmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  shiftId: z.string().min(1, 'Shift ID is required'),
  crewMemberId: z.string().min(1, 'Crew member ID is required'),
  type: z.enum(['primary', 'backup'], {
    errorMap: () => ({ message: 'Type must be either "primary" or "backup"' })
  }),
  notes: z.string().max(500).optional().nullable(),
});

export const UpdateAssignmentSchema = CreateAssignmentSchema.partial();

export type CreateGuestInput = z.infer<typeof CreateGuestSchema>;
export type UpdateGuestInput = z.infer<typeof UpdateGuestSchema>;
