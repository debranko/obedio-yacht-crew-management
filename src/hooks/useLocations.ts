/**
 * Hook for locations management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsService } from '../services/locations';
import { CreateLocationInput, UpdateLocationInput } from '../domain/locations';

export function useLocations() {
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsService.getAll()
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateLocationInput) => locationsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateLocationInput) => locationsService.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      // Also invalidate guests query when location guest assignment changes
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => locationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    }
  });

  return {
    locations: locationsQuery.data || [],
    isLoading: locationsQuery.isLoading,
    error: locationsQuery.error,
    createLocation: createMutation.mutateAsync,
    updateLocation: updateMutation.mutateAsync,
    deleteLocation: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
