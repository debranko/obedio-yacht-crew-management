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
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

// CrewChange type for bulk creation (roster change detection format)
interface CrewChange {
  crewMember: string;
  changeType: 'added' | 'removed' | 'moved_to_backup' | 'moved_to_primary';
  date: string;
  shift: string;
  details?: string;
}

export function useBulkCreateCrewChangeLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changes: CrewChange[]) => {
      // Backend expects { changes: [...] }, not array directly
      return await api.post<{ count: number }>('/crew-change-logs/bulk', { changes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew-change-logs'] });
    }
  });
}