import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AssignmentDTO } from '../services/api';
import { Assignment } from '../components/duty-roster/types';

/**
 * Convert AssignmentDTO to Assignment type
 */
function dtoToAssignment(dto: AssignmentDTO): Assignment {
  return {
    id: dto.id,
    date: dto.date,
    shiftId: dto.shiftId,
    crewId: dto.crewMemberId,
    type: dto.type,
    notes: dto.notes || undefined,
  };
}

/**
 * Convert Assignment to AssignmentDTO
 */
function assignmentToDto(assignment: Partial<Assignment>): Partial<Omit<AssignmentDTO, 'id' | 'createdAt' | 'updatedAt' | 'shift'>> {
  return {
    date: assignment.date,
    shiftId: assignment.shiftId,
    crewMemberId: assignment.crewId,
    type: assignment.type,
    notes: assignment.notes || null,
  };
}

/**
 * Get all assignments with optional filters
 */
export function useAssignments(params?: {
  date?: string;
  shiftId?: string;
  crewMemberId?: string;
  type?: 'primary' | 'backup';
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: async () => {
      const dtos = await api.assignments.getAll(params);
      return dtos.map(dtoToAssignment);
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get assignments for a specific date
 */
export function useAssignmentsByDate(date: string) {
  return useQuery({
    queryKey: ['assignments', 'by-date', date],
    queryFn: async () => {
      const dtos = await api.assignments.getByDate(date);
      return dtos.map(dtoToAssignment);
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get assignments for a week
 */
export function useAssignmentsByWeek(startDate: string) {
  return useQuery({
    queryKey: ['assignments', 'by-week', startDate],
    queryFn: async () => {
      const dtos = await api.assignments.getByWeek(startDate);
      return dtos.map(dtoToAssignment);
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get assignments for a crew member
 */
export function useAssignmentsByCrew(
  crewMemberId: string,
  params?: { startDate?: string; endDate?: string }
) {
  return useQuery({
    queryKey: ['assignments', 'by-crew', crewMemberId, params],
    queryFn: async () => {
      const dtos = await api.assignments.getByCrew(crewMemberId, params);
      return dtos.map(dtoToAssignment);
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Create a new assignment
 */
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignment: Omit<Assignment, 'id'>) => {
      const dto = assignmentToDto(assignment);
      return api.assignments.create(dto as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

/**
 * Create multiple assignments at once
 */
export function useCreateBulkAssignments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignments: Omit<Assignment, 'id'>[]) => {
      const dtos = assignments.map(a => assignmentToDto(a));
      return api.assignments.createBulk(dtos as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

/**
 * Update an assignment
 */
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Assignment) => {
      const dto = assignmentToDto(data);
      return api.assignments.update(id, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

/**
 * Delete an assignment
 */
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.assignments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

/**
 * Delete all assignments for a date
 */
export function useDeleteAssignmentsByDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => api.assignments.deleteByDate(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

/**
 * Delete assignments for a crew member
 */
export function useDeleteAssignmentsByCrew() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      crewMemberId,
      params,
    }: {
      crewMemberId: string;
      params?: { startDate?: string; endDate?: string };
    }) => api.assignments.deleteByCrew(crewMemberId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}
