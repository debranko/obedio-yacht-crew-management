/**
 * Crew Utility Functions
 * Centralized utilities for crew member display and formatting
 * IMPORTANT: These functions work with REAL DATA from backend API, not mock data
 */

import { Badge } from '../components/ui/badge';
import { CrewMember } from '../types/crew';
import { Assignment } from '../components/duty-roster/types';
import { ShiftConfig } from '../components/duty-roster/types';

/**
 * Get status badge component for crew member status
 */
export function getStatusBadge(status?: string) {
  switch (status) {
    case 'on-leave':
      return <Badge variant="destructive" className="text-xs">On Leave</Badge>;
    case 'on-duty':
      return <Badge className="bg-success text-white text-xs">On Duty</Badge>;
    case 'off-duty':
    default:
      return <Badge variant="secondary" className="text-xs">Off Duty</Badge>;
  }
}

export interface OnDutyStatus {
  onDuty: CrewMember[];
  backup: CrewMember[];
  nextShift: CrewMember[];
}

/**
 * Get crew members who are currently on duty based on REAL assignments from database
 * @param crewMembers - Crew members from API (useCrewMembers hook)
 * @param assignments - Assignments from API (useAssignments hook)
 * @param shifts - Shifts from API (useShifts hook)
 * @returns Object with onDuty, backup, and nextShift crew arrays
 */
export function getOnDutyCrew(
  crewMembers: CrewMember[],
  assignments: Assignment[],
  shifts: ShiftConfig[]
): OnDutyStatus {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinutes;

  // Find current shift based on current time
  const currentShift = shifts.find(shift => {
    const [startHour, startMin] = shift.startTime.split(':').map(Number);
    const [endHour, endMin] = shift.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    let endTime = endHour * 60 + endMin;

    // Handle overnight shifts
    if (endTime < startTime) {
      endTime += 24 * 60;
    }

    let adjustedCurrentTime = currentTime;
    if (currentTime < startTime && endTime > 24 * 60) {
      adjustedCurrentTime += 24 * 60;
    }

    return adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime;
  });

  // Find next shift
  const sortedShifts = [...shifts].sort((a, b) => {
    const aStart = parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1]);
    const bStart = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1]);
    return aStart - bStart;
  });

  let nextShift: ShiftConfig | undefined;
  if (currentShift) {
    const currentIndex = sortedShifts.findIndex(s => s.id === currentShift.id);
    nextShift = sortedShifts[(currentIndex + 1) % sortedShifts.length];
  } else {
    // If no current shift, find next upcoming shift
    for (const shift of sortedShifts) {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      if (startTime > currentTime) {
        nextShift = shift;
        break;
      }
    }
    if (!nextShift) nextShift = sortedShifts[0]; // Wrap to first shift
  }

  // Get today's assignments
  const todayAssignments = assignments.filter(a => a.date === today);

  let onDuty: CrewMember[] = [];
  let backup: CrewMember[] = [];
  let nextShiftCrew: CrewMember[] = [];

  // Get crew assigned to current shift (PRIMARY)
  if (currentShift) {
    const currentPrimaryAssignments = todayAssignments.filter(
      a => a.shiftId === currentShift.id && a.type === 'primary'
    );

    currentPrimaryAssignments.forEach(assignment => {
      const member = crewMembers.find(c => c.id === assignment.crewId);
      if (member && member.status !== 'on-leave') {
        onDuty.push(member);
      }
    });

    // Get backup crew for current shift
    const currentBackupAssignments = todayAssignments.filter(
      a => a.shiftId === currentShift.id && a.type === 'backup'
    );

    currentBackupAssignments.forEach(assignment => {
      const member = crewMembers.find(c => c.id === assignment.crewId);
      if (member && member.status !== 'on-leave') {
        backup.push(member);
      }
    });
  }

  // Get crew assigned to next shift
  if (nextShift) {
    const nextShiftAssignments = todayAssignments.filter(
      a => a.shiftId === nextShift.id && a.type === 'primary'
    );

    nextShiftAssignments.forEach(assignment => {
      const member = crewMembers.find(c => c.id === assignment.crewId);
      if (member && member.status !== 'on-leave' && !onDuty.find(m => m.id === member.id)) {
        nextShiftCrew.push(member);
      }
    });
  }

  console.log('📊 On Duty Status (from REAL database):', {
    today,
    currentTime: `${currentHour}:${String(currentMinutes).padStart(2, '0')}`,
    currentShift: currentShift?.name,
    nextShift: nextShift?.name,
    onDutyCount: onDuty.length,
    backupCount: backup.length,
    nextShiftCount: nextShiftCrew.length,
    onDutyNames: onDuty.map(c => c.name),
    backupNames: backup.map(c => c.name),
    nextShiftNames: nextShiftCrew.map(c => c.name)
  });

  return {
    onDuty,
    backup,
    nextShift: nextShiftCrew
  };
}

/**
 * Get all available crew members (not on leave, active)
 */
export function getAvailableCrew(crewMembers: CrewMember[]): CrewMember[] {
  return crewMembers.filter(c => c.status !== 'on-leave');
}

/**
 * Get crew members filtered by department
 */
export function getCrewByDepartment(crewMembers: CrewMember[], department: string): CrewMember[] {
  return crewMembers.filter(c => c.department === department);
}
