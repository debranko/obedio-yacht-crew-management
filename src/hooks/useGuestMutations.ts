/**
 * Guest Mutations Hook - TanStack Query Mutations for Backend API
 * Handles Create, Update, Delete operations with PostgreSQL backend
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GuestsService } from '../services/guests';
import type { Guest } from '../contexts/AppDataContext';
import { toast } from 'sonner';

export function useGuestMutations() {
  const queryClient = useQueryClient();

  /**
   * Create Guest Mutation
   */
  const createMutation = useMutation({
    mutationFn: (guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => {
      return GuestsService.create(guestData);
    },
    onSuccess: (newGuest) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      // Also invalidate locations if guest is assigned to a location
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      
      toast.success('Guest created successfully', {
        description: `${newGuest.firstName} ${newGuest.lastName} has been added`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create guest', {
        description: error.message || 'Please try again',
      });
    },
  });

  /**
   * Update Guest Mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Guest> }) => {
      return GuestsService.update(id, data);
    },
    onSuccess: (updatedGuest) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests', updatedGuest.id] });
      // Also invalidate locations query when guest location changes
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      
      toast.success('Guest updated successfully', {
        description: `${updatedGuest.firstName} ${updatedGuest.lastName} has been updated`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update guest', {
        description: error.message || 'Please try again',
      });
    },
  });

  /**
   * Delete Guest Mutation
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return GuestsService.delete(id);
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      // Also invalidate locations to remove guest from location display
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      
      toast.success('Guest deleted successfully', {
        description: 'Guest has been removed from the system',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete guest', {
        description: error.message || 'Please try again',
      });
    },
  });

  return {
    createGuest: createMutation.mutate,
    updateGuest: updateMutation.mutate,
    deleteGuest: deleteMutation.mutate,
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Async versions for awaiting results
    createGuestAsync: createMutation.mutateAsync,
    updateGuestAsync: updateMutation.mutateAsync,
    deleteGuestAsync: deleteMutation.mutateAsync,
  };
}
