import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ServiceRequestHistory } from '@/types/service-requests';

interface ServiceRequestHistoryResponse {
  data: ServiceRequestHistory[];
  total: number;
  page: number;
  limit: number;
}

export function useServiceRequestHistory(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['service-request-history', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      
      const response = await api.get<ServiceRequestHistoryResponse>(
        `/service-request-history/completed${searchParams.toString() ? '?' + searchParams.toString() : ''}`
      );
      return response;
    }
  });
}

export function useCreateServiceRequestHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<ServiceRequestHistory, 'id' | 'timestamp' | 'completedAt'>) => {
      return await api.post<ServiceRequestHistory>('/service-request-history', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-request-history'] });
    }
  });
}