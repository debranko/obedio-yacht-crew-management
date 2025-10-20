/**
 * useYachtSettings Hook
 * Manages yacht location and settings with localStorage persistence
 */

import { useState, useEffect } from 'react';
import { YachtSettings, YachtCoordinates, DEFAULT_YACHT_LOCATION } from '../types/yacht-settings';

const STORAGE_KEY = 'obedio-yacht-settings';

export function useYachtSettings() {
  const [settings, setSettings] = useState<YachtSettings>(() => {
    // Load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse yacht settings:', e);
      }
    }
    
    // Default settings
    return {
      currentLocation: DEFAULT_YACHT_LOCATION,
      locationName: 'Monaco',
      weatherUnits: 'metric',
      windUnits: 'knots',
    };
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Update yacht location
  const updateLocation = (coords: YachtCoordinates, locationName?: string) => {
    setSettings(prev => ({
      ...prev,
      currentLocation: {
        ...coords,
        lastUpdated: new Date().toISOString(),
      },
      locationName,
    }));
  };

  // Update full settings
  const updateSettings = (updates: Partial<YachtSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  };

  // Get current coordinates
  const getCurrentCoordinates = (): YachtCoordinates => {
    return settings.currentLocation;
  };

  // Use browser geolocation (if available)
  const useCurrentPosition = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not available');
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
          resolve(true);
        },
        (error) => {
          console.error('Geolocation error:', error);
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
    updateLocation,
    updateSettings,
    getCurrentCoordinates,
    useCurrentPosition,
  };
}
