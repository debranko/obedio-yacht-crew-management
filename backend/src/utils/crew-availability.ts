/**
 * Crew Availability Checking
 * Validates crew member availability for duty roster assignments
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CrewAvailability {
  isAvailable: boolean;
  reason?: string;
  conflictingAssignments?: any[];
}

/**
 * Check if a crew member is available for assignment on a given date
 */
export async function checkCrewAvailability(
  crewMemberId: string,
  date: string,
  shiftId: string
): Promise<CrewAvailability> {
  // 1. Check if crew member exists and is active
  const crewMember = await prisma.crewMember.findUnique({
    where: { id: crewMemberId },
    select: { status: true, name: true }
  });

  if (!crewMember) {
    return {
      isAvailable: false,
      reason: 'Crew member not found'
    };
  }

  if (crewMember.status === 'on_leave' || crewMember.status === 'on-leave') {
    return {
      isAvailable: false,
      reason: `${crewMember.name} is currently on leave`
    };
  }

  // 2. Check for existing assignments on the same date and shift
  const existingAssignments = await prisma.assignment.findMany({
    where: {
      crewMemberId,
      date,
      shiftId
    },
    include: {
      shift: {
        select: { name: true }
      }
    }
  });

  if (existingAssignments.length > 0) {
    return {
      isAvailable: false,
      reason: `${crewMember.name} is already assigned to ${existingAssignments[0].shift.name} shift on this date`,
      conflictingAssignments: existingAssignments
    };
  }

  // 3. Check for overlapping shifts (if crew is assigned to different shift on same date)
  const dateAssignments = await prisma.assignment.findMany({
    where: {
      crewMemberId,
      date,
      shiftId: { not: shiftId }
    },
    include: {
      shift: {
        select: { name: true, startTime: true, endTime: true }
      }
    }
  });

  if (dateAssignments.length > 0) {
    return {
      isAvailable: false,
      reason: `${crewMember.name} has conflicting assignment on ${dateAssignments[0].shift.name} shift`,
      conflictingAssignments: dateAssignments
    };
  }

  // 4. All checks passed - crew member is available
  return {
    isAvailable: true
  };
}

/**
 * Check if multiple crew members are available
 */
export async function checkMultipleCrewAvailability(
  assignments: Array<{ crewMemberId: string; date: string; shiftId: string }>
): Promise<Map<string, CrewAvailability>> {
  const results = new Map<string, CrewAvailability>();

  for (const assignment of assignments) {
    const key = `${assignment.crewMemberId}-${assignment.date}-${assignment.shiftId}`;
    const availability = await checkCrewAvailability(
      assignment.crewMemberId,
      assignment.date,
      assignment.shiftId
    );
    results.set(key, availability);
  }

  return results;
}

/**
 * Get crew member workload for a date range
 */
export async function getCrewWorkload(
  crewMemberId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalAssignments: number;
  primaryAssignments: number;
  backupAssignments: number;
  dates: string[];
}> {
  const assignments = await prisma.assignment.findMany({
    where: {
      crewMemberId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      date: true,
      type: true
    }
  });

  const primaryCount = assignments.filter(a => a.type === 'primary').length;
  const backupCount = assignments.filter(a => a.type === 'backup').length;
  const uniqueDates = [...new Set(assignments.map(a => a.date))];

  return {
    totalAssignments: assignments.length,
    primaryAssignments: primaryCount,
    backupAssignments: backupCount,
    dates: uniqueDates
  };
}

/**
 * Validate crew assignment before creation
 * Throws an error if assignment is invalid
 */
export async function validateCrewAssignment(
  crewMemberId: string,
  date: string,
  shiftId: string
): Promise<void> {
  const availability = await checkCrewAvailability(crewMemberId, date, shiftId);

  if (!availability.isAvailable) {
    throw new Error(availability.reason || 'Crew member is not available for this assignment');
  }
}
