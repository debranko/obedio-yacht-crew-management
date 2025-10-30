/**
 * Service Requests API Hook
 * React Query hooks for service request data from backend API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ServiceRequestDTO } from '../services/api';
import { toast } from 'sonner';

const QUERY_KEY = ['service-requests-api'];

/**
 * Get all service requests from backend API
 */
export function useServiceRequestsApi() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.serviceRequests.getAll(),
    staleTime: 1000 * 5, // 5 seconds - data is fresh for 5 seconds
    refetchInterval: 1000 * 10, // Refetch every 10 seconds for near real-time updates
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
  });

  return {
    serviceRequests: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Get single service request by ID
 */
export function useServiceRequestApi(id: string | null) {
  const query = useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => api.serviceRequests.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });

  return {
    serviceRequest: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Create service request
 */
export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ServiceRequestDTO>) => api.serviceRequests.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Service request created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create service request');
    },
  });
}

/**
 * Update service request
 */
export function useUpdateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceRequestDTO> }) =>
      api.serviceRequests.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Service request updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update service request');
    },
  });
}

/**
 * Accept service request (assign to crew member)
 * Must provide crewMemberId to assign the request
 */
export function useAcceptServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, crewMemberId }: { id: string; crewMemberId: string }) =>
      api.serviceRequests.accept(id, crewMemberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Service request accepted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept service request');
    },
  });
}

/**
 * Complete service request
 */
export function useCompleteServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.serviceRequests.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Service request completed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete service request');
    },
  });
}

/**
 * Cancel service request
 */
export function useCancelServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.serviceRequests.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Service request cancelled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel service request');
    },
  });
}
