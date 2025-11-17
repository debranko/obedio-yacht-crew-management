/**
 * React Query hook for Activity Logs
 * Unified activity feed with WebSocket real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ActivityLogDTO } from '../services/api';
import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { toast } from 'sonner';

const QUERY_KEY = ['activity-logs'];

// Re-export types for backward compatibility
export type ActivityLog = ActivityLogDTO;

export interface ActivityLogFilters {
  type?: string;
  userId?: string;
  locationId?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch activity logs with optional filters and pagination
 */
export function useActivityLogs(filters?: ActivityLogFilters) {
  const query = useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => api.activityLogs.getAll(filters),
    staleTime: 1000 * 60, // 1 minute
    // Removed polling - using WebSocket instead
  });

  return {
    logs: query.data?.items || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Create activity log mutation
 */
export function useCreateActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<ActivityLogDTO, 'id' | 'createdAt'>) =>
      api.activityLogs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: any) => {
      console.error('Failed to create activity log:', error);
      toast.error('Failed to create activity log');
    },
  });
}

/**
 * WebSocket real-time activity log updates
 * Subscribe to activity-log events for unified feed
 */
export function useActivityLogsWebSocket() {
  const queryClient = useQueryClient();
  const { on, off, isConnected } = useWebSocket();

  useEffect(() => {
    if (!on || !off) return;

    // Handle new activity log
    const handleActivityLog = (log: ActivityLogDTO) => {
      console.log('📊 New activity log:', log);

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    };

    const unsubscribe = on('activity-log:created', handleActivityLog);

    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [on, off, queryClient]);

  return { isConnected };
}
