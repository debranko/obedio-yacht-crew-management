import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ShiftConfig } from '../components/duty-roster/types';

export function useShifts() {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const response = await api.get('/shifts');
      // If no shifts exist in backend, return default shifts
      if (!response || response.length === 0) {
        return [
          {
            id: 'morning',
            name: 'Morning',
            startTime: '06:00',
            endTime: '14:00',
            primaryCount: 2,
            backupCount: 1,
            color: '#D4B877',
          },
          {
            id: 'afternoon',
            name: 'Afternoon',
            startTime: '14:00',
            endTime: '22:00',
            primaryCount: 2,
            backupCount: 1,
            color: '#06B6D4',
          },
          {
            id: 'night',
            name: 'Night',
            startTime: '22:00',
            endTime: '06:00',
            primaryCount: 1,
            backupCount: 1,
            color: '#7C3AED',
          },
        ] as ShiftConfig[];
      }
      return response as ShiftConfig[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (shift: Omit<ShiftConfig, 'id'>) => 
      api.post('/shifts', shift),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: ShiftConfig) => 
      api.put(`/shifts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/shifts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

/**
 * Bulk save shifts - handles create, update, and delete operations
 */
export function useBulkSaveShifts() {
  const queryClient = useQueryClient();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  return useMutation({
    mutationFn: async ({ newShifts, existingShifts }: { newShifts: ShiftConfig[], existingShifts: ShiftConfig[] }) => {
      const results = [];

      // Determine which shifts to create, update, or delete
      const existingIds = new Set(existingShifts.map(s => s.id));
      const newIds = new Set(newShifts.map(s => s.id));

      // Update or create shifts
      for (const shift of newShifts) {
        // If shift ID starts with 'shift-' or 'cmh', it's a temporary ID (new shift)
        const isNewShift = shift.id.startsWith('shift-');

        if (isNewShift) {
          // Create new shift (backend will generate proper CUID)
          const { id, ...shiftData } = shift;
          results.push(await createShift.mutateAsync(shiftData));
        } else if (existingIds.has(shift.id)) {
          // Update existing shift
          results.push(await updateShift.mutateAsync(shift));
        }
      }

      // Delete shifts that are no longer in the new list
      for (const shift of existingShifts) {
        if (!newIds.has(shift.id) && !shift.id.startsWith('shift-')) {
          await deleteShift.mutateAsync(shift.id);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}