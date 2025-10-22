/**
 * User Preferences Hook
 * Manages user-specific dashboard layout and preferences
 * Syncs with backend and falls back to localStorage
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface DashboardPreferences {
  dashboardLayout: any;
  activeWidgets: string[];
  theme?: string;
  language?: string;
  updatedAt?: string;
}

/**
 * Fetch user preferences from backend
 */
const fetchPreferences = async (): Promise<DashboardPreferences> => {
  const response = await api.get('/user-preferences');
  return response.data;
};

/**
 * Update dashboard preferences on backend
 */
const updateDashboardPreferences = async (data: {
  dashboardLayout?: any;
  activeWidgets?: string[];
}) => {
  const response = await api.put('/user-preferences/dashboard', data);
  return response;
};

/**
 * Reset dashboard to defaults
 */
const resetDashboard = async () => {
  const response = await api.delete('/user-preferences/dashboard');
  return response;
};

/**
 * Hook to manage user preferences
 */
export function useUserPreferences() {
  const queryClient = useQueryClient();

  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: fetchPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once if backend fails
    // Don't throw on error, just return undefined
    throwOnError: false,
  });

  const updateMutation = useMutation({
    mutationFn: updateDashboardPreferences,
    onSuccess: (data) => {
      console.log('✅ Dashboard preferences saved successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      return data;
    },
    onError: (error) => {
      console.error('❌ Failed to save dashboard preferences:', error);
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updateDashboard: updateMutation.mutate,
    resetDashboard: resetMutation.mutate,
    isUpdating: updateMutation.isPending,
    isResetting: resetMutation.isPending,
  };
}
