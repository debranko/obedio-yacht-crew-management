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
      const response = await api.get<any>('/yacht-settings');

      // Map backend response fields to frontend format
      const data = response.data;
      const mappedSettings: YachtSettingsData = {
        vesselName: data.name || '',
        vesselType: data.type || 'motor-yacht',
        timezone: data.timezone || 'Europe/Monaco',
        floors: data.floors || [],
      };

      setSettings(mappedSettings);
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
      // Map frontend format to backend format
      const backendData = {
        name: data.vesselName,
        type: data.vesselType,
        timezone: data.timezone,
        floors: data.floors,
      };

      const response = await api.put<any>('/yacht-settings', backendData);

      // Map response back to frontend format
      const responseData = response.data;
      const mappedSettings: YachtSettingsData = {
        vesselName: responseData.name || data.vesselName,
        vesselType: responseData.type || data.vesselType,
        timezone: responseData.timezone || data.timezone,
        floors: responseData.floors || data.floors,
      };

      setSettings(mappedSettings);
      return mappedSettings;
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