/**
 * Hook for yacht settings API integration
 */

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface YachtSettingsData {
  vesselName: string;
  vesselType: string;
  timezone: string;
  floors: string[];
}

interface YachtSettingsResponse {
  success: boolean;
  data: YachtSettingsData;
}

export function useYachtSettingsApi() {
  const [settings, setSettings] = useState<YachtSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch yacht settings
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<YachtSettingsResponse>('/yacht-settings');
      setSettings(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch yacht settings:', err);
      setError('Failed to load yacht settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Update yacht settings
  const updateSettings = async (data: YachtSettingsData) => {
    try {
      const response = await api.put<YachtSettingsResponse>('/yacht-settings', data);
      setSettings(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to update yacht settings:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}