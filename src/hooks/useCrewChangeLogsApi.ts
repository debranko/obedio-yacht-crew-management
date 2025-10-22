import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CrewChangeLog {
  id: string;
  crewMemberId: string;
  crewMemberName: string;
  action: 'added' | 'removed' | 'status_changed' | 'duty_started' | 'duty_ended';
  details: string;
  performedBy: string;
  timestamp: string;
}

interface CrewChangeLogsResponse {
  data: CrewChangeLog[];
  total: number;
  page: number;
  limit: number;
}

export function useCrewChangeLogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
}) {
  return useQuery({
    queryKey: ['crew-change-logs', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.action) searchParams.append('action', params.action);
      
      const response = await api.get<CrewChangeLogsResponse>(
        `/crew-change-logs${searchParams.toString() ? '?' + searchParams.toString() : ''}`
      );
      return response;
    }
  });
}

export function useCreateCrewChangeLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<CrewChangeLog, 'id' | 'timestamp'>) => {
      return await api.post<CrewChangeLog>('/crew-change-logs', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew-change-logs'] });
    }
  });
}

export function useBulkCreateCrewChangeLogs() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Array<Omit<CrewChangeLog, 'id' | 'timestamp'>>) => {
      return await api.post<{ count: number }>('/crew-change-logs/bulk', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew-change-logs'] });
    }
  });
}