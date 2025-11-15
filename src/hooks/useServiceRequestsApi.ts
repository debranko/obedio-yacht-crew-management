/**
 * Service Requests API Hook
 * React Query hooks for service request data from backend API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api, ServiceRequestDTO } from '../services/api';
import { ServiceRequest } from '../types/service-requests';
import { toast } from 'sonner';
import { websocketService } from '../services/websocket';

const QUERY_KEY = ['service-requests-api'];

// Extend ServiceRequestDTO to include populated data
interface ServiceRequestDTOWithRelations extends ServiceRequestDTO {
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  location?: {
    id: string;
    name: string;
    image?: string;
  };
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    description?: string;
    order: number;
    isActive: boolean;
  };
}

/**
 * Transform ServiceRequestDTO from backend to frontend ServiceRequest format
 */
function transformServiceRequest(dto: ServiceRequestDTOWithRelations): ServiceRequest {
  // Use populated data from backend relations when available
  const guestName = dto.guest
    ? `${dto.guest.firstName} ${dto.guest.lastName}`.trim()
    : 'Guest'; // Fallback if guest relation not populated

  const guestCabin = dto.location?.name || 'Location';

  // Map location name to existing yacht interior images in /public/images/locations/
  const cabinImage = dto.location?.image ||
    (dto.location?.name ? `/images/locations/${dto.location.name}.jpg` : undefined);

  const frontendStatus = mapBackendStatusToFrontend(dto.status);

  // Create timestamp with validation - ensure it's a valid Date
  const timestamp = new Date(dto.createdAt);
  if (isNaN(timestamp.getTime())) {
    console.error('⚠️ Invalid createdAt timestamp for request:', dto.id, dto.createdAt);
    // Use current time as fallback for invalid dates
    timestamp.setTime(Date.now());
  }

  return {
    id: dto.id,
    guestName,
    guestCabin,
    cabinId: dto.locationId || '',
    requestType: dto.requestType,
    priority: dto.priority as 'normal' | 'urgent' | 'emergency',
    timestamp, // Validated Date object
    voiceTranscript: dto.voiceTranscript || undefined,
    voiceAudioUrl: dto.voiceAudioUrl || undefined,
    cabinImage,
    status: frontendStatus,
    assignedTo: dto.assignedTo || undefined,
    categoryId: dto.categoryId || undefined,
    category: dto.category || undefined,
    forwardedToTeam: undefined, // Not in backend yet
    acceptedAt: dto.acceptedAt ? new Date(dto.acceptedAt) : undefined,
    completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
    forwardedAt: undefined, // Not in backend yet
    notes: dto.message || undefined,
  };
}

/**
 * Map backend status to frontend status
 */
function mapBackendStatusToFrontend(backendStatus: string): ServiceRequest['status'] {
  const statusMap: Record<string, ServiceRequest['status']> = {
    'pending': 'pending',
    'in-progress': 'accepted',
    'in_progress': 'accepted',  // Backend uses underscore format
    'completed': 'completed',
    'cancelled': 'completed', // Map cancelled to completed for now
    'serving': 'accepted',
    'accepted': 'accepted',
    'delegated': 'delegated'
  };

  return statusMap[backendStatus.toLowerCase()] || 'pending';
}

/**
 * Get all service requests from backend API
 * Includes WebSocket integration for real-time updates
 */
export function useServiceRequestsApi() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const dtos = await api.serviceRequests.getAll();
      // Transform each DTO to frontend format
      return dtos.map(transformServiceRequest);
    },
    staleTime: 1000 * 30, // 30 seconds (more frequent for real-time data)
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  // WebSocket integration - single subscription for all service request events
  useEffect(() => {
    console.log('🔌 Setting up WebSocket subscription for service requests');

    const unsubscribe = websocketService.subscribe('service-request', (event) => {
      console.log('📞 Service request WebSocket event:', event.type);

      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    });

    return () => {
      console.log('🔌 Cleaning up WebSocket subscription for service requests');
      unsubscribe();
    };
  }, [queryClient]);

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
  return useMutation({
    mutationFn: (data: Partial<ServiceRequestDTO>) => api.serviceRequests.create(data),
    onSuccess: () => {
      // NOTE: No invalidation needed - WebSocket will handle sync automatically
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
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceRequestDTO> }) =>
      api.serviceRequests.update(id, data),
    onSuccess: () => {
      // NOTE: No invalidation needed - WebSocket will handle sync automatically
      toast.success('Service request updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update service request');
    },
  });
}

/**
 * Accept service request (assign to crew member)
 */
export function useAcceptServiceRequest() {
  return useMutation({
    mutationFn: ({ id, crewId }: { id: string; crewId: string }) =>
      api.serviceRequests.accept(id, crewId),
    onSuccess: () => {
      // NOTE: No invalidation needed - WebSocket will handle sync automatically
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
  return useMutation({
    mutationFn: (id: string) => api.serviceRequests.complete(id),
    onSuccess: () => {
      // NOTE: No invalidation needed - WebSocket will handle sync automatically
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
  return useMutation({
    mutationFn: (id: string) => api.serviceRequests.cancel(id),
    onSuccess: () => {
      // NOTE: No invalidation needed - WebSocket will handle sync automatically
      toast.success('Service request cancelled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel service request');
    },
  });
}
