import { useQuery } from '@tanstack/react-query';

export interface DeviceLogParams {
  deviceId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface DeviceLogsResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useDeviceLogs(params?: DeviceLogParams) {
  const queryParams = new URLSearchParams();
  
  if (params?.deviceId) queryParams.append('deviceId', params.deviceId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/devices/logs?${queryString}` : '/devices/logs';
  
  return useQuery({
    queryKey: ['device-logs', params],
    queryFn: async () => {
      // Auth handled by HTTP-only cookies (server runs 24/7)
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send HTTP-only cookie automatically
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch device logs');
      }
      
      // Return just the data array for compatibility with the activity log component
      return result.data || [];
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute for real-time updates
  });
}