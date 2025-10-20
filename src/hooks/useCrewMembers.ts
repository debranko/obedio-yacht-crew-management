/**
 * Crew Members Hook
 * React Query hooks for crew member data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, CrewMemberDTO } from '../services/api';
import { toast } from 'sonner';

const QUERY_KEY = ['crew-members'];

/**
 * Get all crew members
 */
export function useCrewMembers() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.crew.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    crewMembers: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Create crew member
 */
export function useCreateCrewMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CrewMemberDTO>) => api.crew.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Crew member added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add crew member');
    },
  });
}

/**
 * Update crew member
 */
export function useUpdateCrewMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CrewMemberDTO> }) =>
      api.crew.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Crew member updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update crew member');
    },
  });
}

/**
 * Delete crew member
 */
export function useDeleteCrewMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.crew.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Crew member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove crew member');
    },
  });
}
