/**
 * Guests API Hook
 * React Query hooks for guest data from backend API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, GuestDTO } from '../services/api';
import { toast } from 'sonner';

const QUERY_KEY = ['guests-api'];

/**
 * Hook to fetch all guests from backend API
 */
export function useGuestsApi() {
  const queryClient = useQueryClient();

  // Fetch all guests
  const { data: guests = [], isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.guests.getAll(),
  });

  // Create guest mutation
  const createGuestMutation = useMutation({
    mutationFn: (data: Partial<GuestDTO>) => api.guests.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Guest added successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create guest:', error);
      toast.error('Failed to add guest', {
        description: error.message || 'Please try again',
      });
    },
  });

  // Update guest mutation
  const updateGuestMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GuestDTO> }) =>
      api.guests.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Guest updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update guest:', error);
      toast.error('Failed to update guest', {
        description: error.message || 'Please try again',
      });
    },
  });

  // Delete guest mutation
  const deleteGuestMutation = useMutation({
    mutationFn: (id: string) => api.guests.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Guest removed successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete guest:', error);
      toast.error('Failed to remove guest', {
        description: error.message || 'Please try again',
      });
    },
  });

  return {
    guests,
    isLoading,
    error,
    refetch,
    createGuest: createGuestMutation.mutate,
    updateGuest: (id: string, data: Partial<GuestDTO>) =>
      updateGuestMutation.mutate({ id, data }),
    deleteGuest: deleteGuestMutation.mutate,
    isCreating: createGuestMutation.isPending,
    isUpdating: updateGuestMutation.isPending,
    isDeleting: deleteGuestMutation.isPending,
  };
}
