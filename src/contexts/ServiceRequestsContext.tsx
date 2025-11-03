/**
 * ServiceRequestsContext
 * Manages service request data and operations
 * Uses React Query hooks for server-side state management
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServiceRequestsApi, useAcceptServiceRequest, useCompleteServiceRequest } from '../hooks/useServiceRequestsApi';
import { ServiceRequest, ServiceRequestHistory } from '../types/service-requests';

interface ServiceRequestsContextType {
  // Service Request data
  serviceRequests: ServiceRequest[];
  isLoading: boolean;

  // Service Request operations
  addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'timestamp'>) => ServiceRequest;
  acceptServiceRequest: (requestId: string, crewMemberId: string) => void;
  delegateServiceRequest: (requestId: string, toCrewMember: string) => void;
  completeServiceRequest: (requestId: string, crewMemberName?: string) => void;

  // Service Request history
  serviceRequestHistory: ServiceRequestHistory[];
  clearServiceRequestHistory: () => void;
}

const ServiceRequestsContext = createContext<ServiceRequestsContextType | undefined>(undefined);

export function ServiceRequestsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch service requests from API using React Query
  const { serviceRequests: apiServiceRequests, isLoading } = useServiceRequestsApi();

  // React Query mutations for service request operations
  const acceptMutation = useAcceptServiceRequest();
  const completeMutation = useCompleteServiceRequest();

  // Service Request History - will be fetched from backend via useServiceRequestHistory hook
  // For now keeping local state for backward compatibility
  const [serviceRequestHistory, setServiceRequestHistory] = useState<ServiceRequestHistory[]>([]);

  // Add service request - returns the created request
  const addServiceRequest = useCallback((request: Omit<ServiceRequest, 'id' | 'timestamp'>): ServiceRequest => {
    const newRequest: ServiceRequest = {
      ...request,
      id: `sr-${Date.now()}`,
      timestamp: new Date(), // Should be Date object, not string
    };

    // Add to history
    setServiceRequestHistory(prev => [...prev, {
      id: `history-${Date.now()}`,
      originalRequest: newRequest,
      completedBy: 'System',
      completedAt: new Date(),
      duration: 0,
    } as ServiceRequestHistory]);

    // Invalidate cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });

    return newRequest;
  }, [queryClient]);

  // Accept service request
  const acceptServiceRequest = useCallback((requestId: string, crewMemberId: string) => {
    const request = apiServiceRequests.find(r => r.id === requestId);
    if (!request) return;

    // Call backend API to accept the request
    acceptMutation.mutate({ id: requestId, crewId: crewMemberId });
  }, [apiServiceRequests, acceptMutation]);

  // Delegate service request
  const delegateServiceRequest = useCallback((requestId: string, toCrewMember: string) => {
    const request = apiServiceRequests.find(r => r.id === requestId);
    if (!request) return;

    // TODO: Properly implement history tracking based on ServiceRequestHistory type

    // Invalidate cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });
  }, [apiServiceRequests, queryClient]);

  // Complete service request
  const completeServiceRequest = useCallback((requestId: string, crewMemberName?: string) => {
    const request = apiServiceRequests.find(r => r.id === requestId);
    if (!request) return;

    // Add completed request to history
    if (request.acceptedAt) {
      const duration = Math.floor((new Date().getTime() - new Date(request.acceptedAt).getTime()) / 1000);
      setServiceRequestHistory(prev => [...prev, {
        id: `history-${Date.now()}`,
        originalRequest: request,
        completedBy: crewMemberName || 'System',
        completedAt: new Date(),
        duration,
      }]);
    }

    // Call backend API to complete the request
    completeMutation.mutate(requestId);
  }, [apiServiceRequests, completeMutation]);

  // Clear service request history
  const clearServiceRequestHistory = useCallback(() => {
    setServiceRequestHistory([]);
  }, []);

  const value: ServiceRequestsContextType = {
    serviceRequests: apiServiceRequests,
    isLoading,
    addServiceRequest,
    acceptServiceRequest,
    delegateServiceRequest,
    completeServiceRequest,
    serviceRequestHistory,
    clearServiceRequestHistory,
  };

  return (
    <ServiceRequestsContext.Provider value={value}>
      {children}
    </ServiceRequestsContext.Provider>
  );
}

export function useServiceRequests() {
  const context = useContext(ServiceRequestsContext);
  if (context === undefined) {
    throw new Error('useServiceRequests must be used within a ServiceRequestsProvider');
  }
  return context;
}
