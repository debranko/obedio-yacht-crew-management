/**
 * ServiceRequestsContext
 * Manages service request data and operations
 * Uses React Query hooks for server-side state management
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServiceRequestsApi } from '../hooks/useServiceRequestsApi';
import { ServiceRequest, ServiceRequestHistory } from '../types/service-requests';

interface ServiceRequestsContextType {
  // Service Request data
  serviceRequests: ServiceRequest[];
  isLoading: boolean;

  // Service Request operations
  addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'timestamp'>) => ServiceRequest;
  acceptServiceRequest: (requestId: string, crewMemberName: string) => void;
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

  // Service Request History - will be fetched from backend via useServiceRequestHistory hook
  // For now keeping local state for backward compatibility
  const [serviceRequestHistory, setServiceRequestHistory] = useState<ServiceRequestHistory[]>([]);

  // Add service request - returns the created request
  const addServiceRequest = useCallback((request: Omit<ServiceRequest, 'id' | 'timestamp'>): ServiceRequest => {
    const newRequest: ServiceRequest = {
      ...request,
      id: `sr-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Add to history
    setServiceRequestHistory(prev => [...prev, {
      id: newRequest.id,
      request: newRequest,
      timestamp: newRequest.timestamp,
      action: 'created',
      by: 'System',
    }]);

    // Invalidate cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });

    return newRequest;
  }, [queryClient]);

  // Accept service request
  const acceptServiceRequest = useCallback((requestId: string, crewMemberName: string) => {
    const request = apiServiceRequests.find(r => r.id === requestId);
    if (!request) return;

    // Add to history
    setServiceRequestHistory(prev => [...prev, {
      id: `history-${Date.now()}`,
      request: request,
      timestamp: new Date().toISOString(),
      action: 'accepted',
      by: crewMemberName,
    }]);

    // Invalidate cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });
  }, [apiServiceRequests, queryClient]);

  // Delegate service request
  const delegateServiceRequest = useCallback((requestId: string, toCrewMember: string) => {
    const request = apiServiceRequests.find(r => r.id === requestId);
    if (!request) return;

    // Add to history
    setServiceRequestHistory(prev => [...prev, {
      id: `history-${Date.now()}`,
      request: request,
      timestamp: new Date().toISOString(),
      action: 'delegated',
      by: toCrewMember,
    }]);

    // Invalidate cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });
  }, [apiServiceRequests, queryClient]);

  // Complete service request
  const completeServiceRequest = useCallback((requestId: string, crewMemberName?: string) => {
    const request = apiServiceRequests.find(r => r.id === requestId);
    if (!request) return;

    // Add to history
    setServiceRequestHistory(prev => [...prev, {
      id: `history-${Date.now()}`,
      request: request,
      timestamp: new Date().toISOString(),
      action: 'completed',
      by: crewMemberName || 'System',
    }]);

    // Invalidate cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });
  }, [apiServiceRequests, queryClient]);

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
