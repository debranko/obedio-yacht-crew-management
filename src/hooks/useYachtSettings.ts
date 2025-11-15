/**
 * useYachtSettings Hook
 * Manages yacht settings with backend API sync (replaced localStorage)
 * Uses React Query for server-side state management with WebSocket updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { useWebSocket } from './useWebSocket';

const QUERY_KEY = ['yachtSettings'];

export interface YachtCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  lastUpdated: string;
}

export interface YachtSettings {
  name: string;
  type: string;
  timezone: string;
  floors: string[];
  dateFormat: string;
  timeFormat: string;
  weatherUnits: string;
  windSpeedUnits: string;
  weatherUpdateInterval: number; // Weather update interval in seconds (default: 30)

  // GPS Location fields
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  locationName?: string | null;
  locationUpdatedAt?: string | null;
}

export interface YachtSettingsUpdate {
  name?: string;
  type?: string;
  timezone?: string;
  floors?: string[];
  dateFormat?: string;
  timeFormat?: string;
  weatherUnits?: string;
  windSpeedUnits?: string;
  weatherUpdateInterval?: number;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  locationName?: string | null;
  locationUpdatedAt?: string | null;
}

/**
 * Fetch yacht settings from backend API with WebSocket real-time updates
 */
export function useYachtSettings() {
  const queryClient = useQueryClient();
  const { on, off } = useWebSocket();

  // Default yacht settings fallback
  const DEFAULT_SETTINGS: YachtSettings = {
    name: 'My Yacht',
    type: 'motor-yacht',
    timezone: 'Europe/Monaco',
    floors: [],
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    weatherUnits: 'metric',
    windSpeedUnits: 'knots',
    weatherUpdateInterval: 30,
    latitude: null,
    longitude: null,
    accuracy: null,
    locationName: null,
    locationUpdatedAt: null,
  };

  // Fetch settings
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: YachtSettings }>('/yacht-settings');
      // Response structure is { success: boolean, data: YachtSettings }
      const data = response.data?.data || response.data;
      // Never return undefined - use default settings as fallback
      return data || DEFAULT_SETTINGS;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Listen for WebSocket updates
  useEffect(() => {
    if (!on || !off) return;

    const handleSettingsUpdate = (updatedSettings: YachtSettings) => {
      console.log('📡 Yacht settings updated via WebSocket:', updatedSettings);

      // Update React Query cache
      queryClient.setQueryData(QUERY_KEY, updatedSettings);

      toast.success('Settings updated', {
        description: 'Yacht settings have been updated',
      });
    };

    const unsubscribe = on('settings:updated', handleSettingsUpdate);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [on, off, queryClient]);

  // Update settings mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: async (updates: YachtSettingsUpdate) => {
      const response = await api.put<{ success: boolean; data: YachtSettings }>('/yacht-settings', updates);
      // Extract data from nested response structure
      return response.data?.data || response.data;
    },
    // Optimistic update
    onMutate: async (updates: YachtSettingsUpdate) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      // Snapshot current value
      const previousSettings = queryClient.getQueryData<YachtSettings>(QUERY_KEY);

      // Optimistically update cache
      if (previousSettings) {
        queryClient.setQueryData<YachtSettings>(QUERY_KEY, {
          ...previousSettings,
          ...updates,
        });
      }

      // Return context with previous value
      return { previousSettings };
    },
    onSuccess: (data) => {
      // Update with actual server data
      queryClient.setQueryData(QUERY_KEY, data);
      console.log('✅ Yacht settings saved');
      toast.success('Settings saved successfully');
    },
    onError: (error: any, _updates, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(QUERY_KEY, context.previousSettings);
      }

      console.error('❌ Failed to save yacht settings:', error);
      toast.error('Failed to save yacht settings', {
        description: error.message || 'Please try again',
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Helper: Update yacht location
  const updateLocation = (coords: YachtCoordinates, locationName?: string) => {
    updateMutation.mutate({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      locationName: locationName || null,
      locationUpdatedAt: coords.lastUpdated,
    });
  };

  // Helper: Update full settings
  const updateSettings = (updates: YachtSettingsUpdate) => {
    updateMutation.mutate(updates);
  };

  // Helper: Get current coordinates
  const getCurrentCoordinates = (): YachtCoordinates | null => {
    if (!settings || !settings.latitude || !settings.longitude) {
      return null;
    }
    return {
      latitude: settings.latitude,
      longitude: settings.longitude,
      accuracy: settings.accuracy || undefined,
      lastUpdated: settings.locationUpdatedAt || new Date().toISOString(),
    };
  };

  // Helper: Use browser geolocation
  const useCurrentPosition = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not available');
      toast.error('Geolocation not available in your browser');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            lastUpdated: new Date().toISOString(),
          }, 'Current Position');
          toast.success('Location updated');
          resolve(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Failed to get current location');
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  return {
    settings,
    isLoading,
    error,
    refetch,

    // Mutations
    updateLocation,
    updateSettings,
    updateSettingsAsync: updateMutation.mutateAsync,

    // Helpers
    getCurrentCoordinates,
    useCurrentPosition,

    // Loading states
    isUpdating: updateMutation.isPending,
  };
}
