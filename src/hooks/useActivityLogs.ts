/**
 * React Query hook for Activity Logs
 * Fetches comprehensive activity logs from the ActivityLog table
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface ActivityLog {
  id: string;
  type: string;
  action: string;
  details?: string;
  userId?: string;
  locationId?: string;
  guestId?: string;
  deviceId?: string;
  metadata?: string;
  timestamp: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    name?: string;
  };
  location?: {
    id: string;
    name: string;
    type: string;
  };
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  device?: {
    id: string;
    deviceId: string;
    name: string;
    type: string;
  };
}

export interface ActivityLogFilters {
  type?: string;
  userId?: string;
  locationId?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch activity logs with optional filters
 */
export function useActivityLogs(filters?: ActivityLogFilters) {
  return useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.locationId) params.append('locationId', filters.locationId);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = `/activity-logs?${params.toString()}`;
      console.log('🔍 useActivityLogs: Fetching activity logs...', url);

      const response = await api.get(url);
      console.log('✅ useActivityLogs: Got response:', response);

      // api.get() already extracts data from { success: true, data: [...] }
      // So response is already the array!
      const logs = Array.isArray(response) ? response : [];
      console.log(`📋 useActivityLogs: Returning ${logs.length} logs`);

      return logs as ActivityLog[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
}
