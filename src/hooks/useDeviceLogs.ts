import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface DeviceLogParams {
  deviceId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
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
    queryFn: () => api.get(endpoint),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute for real-time updates
  });
}