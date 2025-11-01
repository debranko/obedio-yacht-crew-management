/**
 * User Preferences Hook
 * Manages user-specific dashboard layout and preferences
 * Uses typed API with backend sync and WebSocket support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, UserPreferencesDTO } from '../services/api';
import { toast } from 'sonner';

const QUERY_KEY = ['userPreferences'];

/**
 * Hook to manage user preferences with backend sync
 */
export function useUserPreferences() {
  const queryClient = useQueryClient();

  // Fetch preferences
  const {
    data: preferences,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.userPreferences.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once if backend fails
    throwOnError: false, // Don't throw on error, just return undefined
  });

  // Update dashboard mutation
  const updateDashboardMutation = useMutation({
    mutationFn: (data: { dashboardLayout?: any; activeWidgets?: string[] }) =>
      api.userPreferences.updateDashboard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      console.log('✅ Dashboard preferences saved');
    },
    onError: (error: any) => {
      console.error('❌ Failed to save dashboard preferences:', error);
      toast.error('Failed to save dashboard preferences', {
        description: error.message || 'Please try again',
      });
    },
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: (theme: 'light' | 'dark' | 'auto') =>
      api.userPreferences.updateTheme(theme),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Theme updated');
    },
    onError: (error: any) => {
      console.error('❌ Failed to update theme:', error);
      toast.error('Failed to update theme');
    },
  });

  // Reset dashboard mutation
  const resetDashboardMutation = useMutation({
    mutationFn: () => api.userPreferences.resetDashboard(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Dashboard reset to defaults');
    },
    onError: (error: any) => {
      console.error('❌ Failed to reset dashboard:', error);
      toast.error('Failed to reset dashboard');
    },
  });

  return {
    preferences,
    isLoading,
    error,
    refetch,

    // Mutations
    updateDashboard: updateDashboardMutation.mutate,
    updateDashboardAsync: updateDashboardMutation.mutateAsync,
    updateTheme: updateThemeMutation.mutate,
    updateThemeAsync: updateThemeMutation.mutateAsync,
    resetDashboard: resetDashboardMutation.mutate,
    resetDashboardAsync: resetDashboardMutation.mutateAsync,

    // Loading states
    isUpdatingDashboard: updateDashboardMutation.isPending,
    isUpdatingTheme: updateThemeMutation.isPending,
    isResetting: resetDashboardMutation.isPending,
  };
}
