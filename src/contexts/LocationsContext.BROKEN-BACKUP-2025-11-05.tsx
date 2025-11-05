/**
 * LocationsContext
 * Manages location data and operations (cabins, common areas, etc.)
 * Uses React Query hooks for server-side state management
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { useLocations as useLocationsHook } from '../hooks/useLocations';
import { Location } from '../domain/locations';
import { YachtLocation } from '../types/yacht-locations';

interface LocationsContextType {
  // Modern Location management (from domain/locations)
  locations: Location[];
  isLoading: boolean;

  // Deprecated YachtLocation management - kept for backward compatibility
  // TODO: Remove once all components are migrated to use Location
  yachtLocations: YachtLocation[];
  addLocation: (location: Omit<YachtLocation, 'id' | 'createdAt' | 'createdBy' | 'isCustom'>) => void;
  updateLocation: (id: string, updates: Partial<YachtLocation>) => void;
  deleteLocation: (id: string) => void;
  updateLocationDeviceStatus: (
    id: string,
    deviceStatus: 'online' | 'offline' | 'alert',
    activeRequests?: number
  ) => void;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export function LocationsProvider({ children }: { children: ReactNode }) {
  // Fetch locations from API using React Query
  const { locations: apiLocations, isLoading } = useLocationsHook();

  // Deprecated YachtLocation state - empty array, kept for backward compatibility
  // TODO: Remove once all components use Location instead
  const [yachtLocations, setYachtLocations] = useState<YachtLocation[]>([]);

  // Deprecated functions - kept for backward compatibility
  // TODO: Remove once all components are migrated
  const addLocation = (location: Omit<YachtLocation, 'id' | 'createdAt' | 'createdBy' | 'isCustom'>) => {
    console.warn('addLocation (YachtLocation) is deprecated. Use Location API instead.');
  };

  const updateLocation = (id: string, updates: Partial<YachtLocation>) => {
    console.warn('updateLocation (YachtLocation) is deprecated. Use Location API instead.');
  };

  const deleteLocation = (id: string) => {
    console.warn('deleteLocation (YachtLocation) is deprecated. Use Location API instead.');
  };

  const updateLocationDeviceStatus = (
    id: string,
    deviceStatus: 'online' | 'offline' | 'alert',
    activeRequests?: number
  ) => {
    console.warn('updateLocationDeviceStatus is deprecated. Use Location API instead.');
  };

  const value: LocationsContextType = {
    locations: apiLocations,
    isLoading,
    yachtLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    updateLocationDeviceStatus,
  };

  return (
    <LocationsContext.Provider value={value}>
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocationsContext() {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error('useLocationsContext must be used within a LocationsProvider');
  }
  return context;
}
