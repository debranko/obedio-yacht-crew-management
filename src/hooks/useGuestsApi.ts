/**
 * Guests API Hook
 * React Query hooks for guest data from backend API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, GuestDTO } from '../services/api';
import { toast } from 'sonner';

const QUERY_KEY = ['guests-api'];

/**
 * Get all guests from backend API
 */
export function useGuestsApi() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.guests.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    guests: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Get single guest by ID
 */
export function useGuestApi(id: string | null) {
  const query = useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => api.guests.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  return {
    guest: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Create guest
 */
export function useCreateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<GuestDTO>) => api.guests.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Guest added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add guest');
    },
  });
}

/**
 * Update guest
 */
export function useUpdateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GuestDTO> }) =>
      api.guests.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Guest updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update guest');
    },
  });
}

/**
 * Delete guest
 */
export function useDeleteGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.guests.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Guest removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove guest');
    },
  });
}
