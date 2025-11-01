/**
 * DutyRosterContext
 * Manages duty roster data (assignments and shifts)
 * Uses React Query hooks for server-side state management
 */

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useShifts as useShiftsApi } from '../hooks/useShifts';
import { useAssignments as useAssignmentsApi, useCreateBulkAssignments, useDeleteAssignmentsByDate } from '../hooks/useAssignments';
import { useCrewMembers as useCrewMembersApi } from '../hooks/useCrewMembers';
import { Assignment, ShiftConfig, CrewMember } from '../components/duty-roster/types';
import { CrewMemberExtended, CrewChange } from '../types/crew';

interface DutyRosterContextType {
  // Assignments data
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;

  // Shifts data
  shifts: ShiftConfig[];
  setShifts: (shifts: ShiftConfig[]) => void;

  // Save functionality
  saveAssignments: (assignmentsToSave?: Assignment[]) => Promise<void>;
  lastSaved: Date | null;
  isSaving: boolean;

  // Get current duty status
  getCurrentDutyStatus: () => {
    onDuty: CrewMemberExtended[];
    nextShift: CrewMemberExtended[];
    backup: CrewMemberExtended[];
    nextBackup: CrewMemberExtended[];
  };

  // Change tracking for notifications
  detectRosterChanges: () => CrewChange[];
  markChangesAsNotified: (changes: CrewChange[]) => void;
}

const DutyRosterContext = createContext<DutyRosterContextType | undefined>(undefined);

export function DutyRosterProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch shifts from API
  const { data: apiShifts = [], isLoading: isLoadingShifts } = useShiftsApi();

  // Fetch assignments from API (get current week)
  const today = new Date().toISOString().split('T')[0];
  const { data: apiAssignments = [], isLoading: isLoadingAssignments } = useAssignmentsApi({
    startDate: today,
  });

  // Fetch crew members for duty status calculation
  const { crewMembers: apiCrewMembers } = useCrewMembersApi();

  // Map crew members to extended format
  const crewMembers: CrewMemberExtended[] = useMemo(() => {
    return apiCrewMembers.map(member => ({
      id: member.id,
      name: member.name,
      position: member.position,
      department: member.department,
      role: member.role ?? undefined,
      status: member.status as any,
      contact: member.contact ?? undefined,
      email: member.email ?? undefined,
      joinDate: member.joinDate ?? undefined,
      leaveStart: member.leaveStart ?? undefined,
      leaveEnd: member.leaveEnd ?? undefined,
      languages: member.languages,
      skills: member.skills,
      avatar: member.avatar,
      nickname: member.nickname,
      color: member.color,
      onBoardContact: member.onBoardContact,
      phone: member.phone ?? member.contact,
      notes: member.notes,
      shift: member.shift ?? undefined,
    }));
  }, [apiCrewMembers]);

  // Mutations for bulk operations
  const createBulkAssignments = useCreateBulkAssignments();
  const deleteAssignmentsByDate = useDeleteAssignmentsByDate();

  // Use API data directly (no duplicate state)
  const assignments: Assignment[] = apiAssignments;
  const shifts: ShiftConfig[] = apiShifts;

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previousAssignments, setPreviousAssignments] = useState<Assignment[]>([]);

  // Setter functions that invalidate React Query cache
  const setAssignments = useCallback((assignments: Assignment[]) => {
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
  }, [queryClient]);

  const setShifts = useCallback((shifts: ShiftConfig[]) => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
  }, [queryClient]);

  // Save assignments to backend
  const saveAssignments = useCallback(async (assignmentsToSave?: Assignment[]) => {
    const toSave = assignmentsToSave || assignments;

    setIsSaving(true);
    try {
      // Group assignments by date for bulk operations
      const assignmentsByDate = toSave.reduce((acc, assignment) => {
        if (!acc[assignment.date]) {
          acc[assignment.date] = [];
        }
        acc[assignment.date].push(assignment);
        return acc;
      }, {} as Record<string, Assignment[]>);

      // Process each date
      for (const [date, dateAssignments] of Object.entries(assignmentsByDate)) {
        // Delete existing assignments for this date
        await deleteAssignmentsByDate.mutateAsync(date);

        // Create new assignments
        if (dateAssignments.length > 0) {
          await createBulkAssignments.mutateAsync(dateAssignments);
        }
      }

      setLastSaved(new Date());
      setPreviousAssignments(toSave);

      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    } catch (error) {
      console.error('Failed to save assignments:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [assignments, createBulkAssignments, deleteAssignmentsByDate, queryClient]);

  // Get current duty status
  const getCurrentDutyStatus = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAssignments = assignments.filter(a => a.date === today);

    const onDuty = crewMembers.filter(member =>
      todayAssignments.some(a => a.crewMemberId === member.id && a.shift === 'on-duty')
    );

    const nextShift = crewMembers.filter(member =>
      todayAssignments.some(a => a.crewMemberId === member.id && a.shift === 'next-shift')
    );

    const backup = crewMembers.filter(member =>
      todayAssignments.some(a => a.crewMemberId === member.id && a.shift === 'backup')
    );

    const nextBackup = crewMembers.filter(member =>
      todayAssignments.some(a => a.crewMemberId === member.id && a.shift === 'next-backup')
    );

    return { onDuty, nextShift, backup, nextBackup };
  }, [assignments, crewMembers]);

  // Detect roster changes for notifications
  const detectRosterChanges = useCallback((): CrewChange[] => {
    const changes: CrewChange[] = [];

    // Compare current assignments with previous ones
    assignments.forEach(current => {
      const previous = previousAssignments.find(p =>
        p.crewMemberId === current.crewMemberId && p.date === current.date
      );

      if (!previous) {
        // New assignment
        const member = crewMembers.find(m => m.id === current.crewMemberId);
        if (member) {
          changes.push({
            id: `change-${Date.now()}-${current.id}`,
            crewMember: member,
            changeType: 'added',
            date: current.date,
            shift: current.shift,
            timestamp: new Date().toISOString(),
            notified: false,
          });
        }
      } else if (previous.shift !== current.shift) {
        // Shift changed
        const member = crewMembers.find(m => m.id === current.crewMemberId);
        if (member) {
          changes.push({
            id: `change-${Date.now()}-${current.id}`,
            crewMember: member,
            changeType: 'modified',
            date: current.date,
            shift: current.shift,
            previousShift: previous.shift,
            timestamp: new Date().toISOString(),
            notified: false,
          });
        }
      }
    });

    // Check for removed assignments
    previousAssignments.forEach(previous => {
      const current = assignments.find(c =>
        c.crewMemberId === previous.crewMemberId && c.date === previous.date
      );

      if (!current) {
        const member = crewMembers.find(m => m.id === previous.crewMemberId);
        if (member) {
          changes.push({
            id: `change-${Date.now()}-${previous.id}`,
            crewMember: member,
            changeType: 'removed',
            date: previous.date,
            shift: previous.shift,
            timestamp: new Date().toISOString(),
            notified: false,
          });
        }
      }
    });

    return changes;
  }, [assignments, previousAssignments, crewMembers]);

  // Mark changes as notified
  const markChangesAsNotified = useCallback((changes: CrewChange[]) => {
    // This would typically update backend to mark notifications as sent
    // For now just log
    console.log('Marked changes as notified:', changes);
  }, []);

  const value: DutyRosterContextType = {
    assignments,
    setAssignments,
    shifts,
    setShifts,
    saveAssignments,
    lastSaved,
    isSaving,
    getCurrentDutyStatus,
    detectRosterChanges,
    markChangesAsNotified,
  };

  return (
    <DutyRosterContext.Provider value={value}>
      {children}
    </DutyRosterContext.Provider>
  );
}

export function useDutyRoster() {
  const context = useContext(DutyRosterContext);
  if (context === undefined) {
    throw new Error('useDutyRoster must be used within a DutyRosterProvider');
  }
  return context;
}
