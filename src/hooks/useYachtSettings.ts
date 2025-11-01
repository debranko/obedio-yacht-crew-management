/**
 * useYachtSettings Hook
 * Manages yacht settings with backend API sync (replaced localStorage)
 * Uses React Query for server-side state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  locationName?: string | null;
  locationUpdatedAt?: string | null;
}

/**
 * Fetch yacht settings from backend API
 */
export function useYachtSettings() {
  const queryClient = useQueryClient();

  // Fetch settings
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const token = localStorage.getItem('obedio-auth-token');
      const response = await fetch('/api/yacht-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch yacht settings');
      }

      const result = await response.json();
      return result.data as YachtSettings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: YachtSettingsUpdate) => {
      const token = localStorage.getItem('obedio-auth-token');
      const response = await fetch('/api/yacht-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update yacht settings');
      }

      const result = await response.json();
      return result.data as YachtSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      console.log('✅ Yacht settings saved');
    },
    onError: (error: any) => {
      console.error('❌ Failed to save yacht settings:', error);
      toast.error('Failed to save yacht settings', {
        description: error.message || 'Please try again',
      });
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
