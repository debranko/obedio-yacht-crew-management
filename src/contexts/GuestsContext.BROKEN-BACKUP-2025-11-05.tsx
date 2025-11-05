/**
 * GuestsContext
 * Manages guest data and operations
 * Uses React Query hooks for server-side state management
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGuestsApi } from '../hooks/useGuestsApi';
import { useLocations } from '../hooks/useLocations';
import { Guest } from '../types/guests';
import { Location } from '../domain/locations';
import { GuestDTO } from '../services/api';

interface GuestsContextType {
  // Guest data
  guests: Guest[];
  isLoading: boolean;

  // Guest CRUD operations
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGuest: (id: string, guest: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  getGuest: (id: string) => Guest | undefined;

  // Guest-Location relationship helpers
  getGuestByLocationId: (locationId: string) => Guest | undefined;
  getLocationByGuestId: (guestId: string) => Location | undefined;
}

const GuestsContext = createContext<GuestsContextType | undefined>(undefined);

export function GuestsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch guests from API using React Query
  const { guests: apiGuests, isLoading } = useGuestsApi();

  // Fetch locations for relationships
  const { locations } = useLocations();

  // Local guest state mapped from API
  const [guests, setGuests] = useState<Guest[]>([]);

  // Sync guests from API when data arrives
  useEffect(() => {
    if (apiGuests.length > 0) {
      // Map API DTO to app Guest type with all required fields
      const mappedGuests: Guest[] = apiGuests.map((apiGuest: GuestDTO) => ({
        id: apiGuest.id,
        firstName: apiGuest.firstName,
        lastName: apiGuest.lastName,
        preferredName: apiGuest.preferredName || undefined,
        email: apiGuest.email || undefined,
        phone: apiGuest.phone || undefined,
        type: apiGuest.type,
        status: apiGuest.status,
        locationId: apiGuest.locationId || undefined,
        checkInDate: apiGuest.checkInDate,
        checkInTime: apiGuest.checkInTime || undefined,
        checkOutDate: apiGuest.checkOutDate || undefined,
        checkOutTime: apiGuest.checkOutTime || undefined,
        nationality: apiGuest.nationality || undefined,
        passportNumber: apiGuest.passportNumber || undefined,
        dateOfBirth: apiGuest.dateOfBirth || undefined,
        allergies: apiGuest.allergies || [],
        dietaryRestrictions: apiGuest.dietaryRestrictions || [],
        specialRequests: apiGuest.specialRequests || undefined,
        doNotDisturb: apiGuest.doNotDisturb || false,
        photo: apiGuest.photo || undefined,
        notes: apiGuest.notes || undefined,
        createdAt: apiGuest.createdAt,
        updatedAt: apiGuest.updatedAt,
        // Legacy fields for backward compatibility
        cabin: apiGuest.locationId ? locations.find(l => l.id === apiGuest.locationId)?.name : undefined,
      }));
      setGuests(mappedGuests);
    } else if (apiGuests.length === 0 && !isLoading) {
      // Clear guests if API returns empty array (not loading)
      setGuests([]);
    }
  }, [apiGuests, locations, isLoading]);

  // Add guest - invalidates cache to trigger refetch
  const addGuest = useCallback((guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => {
    // This will be handled by useGuestMutations hook in components
    // Just invalidate cache here
    queryClient.invalidateQueries({ queryKey: ['guests'] });
  }, [queryClient]);

  // Update guest - invalidates cache to trigger refetch
  const updateGuest = useCallback((id: string, updates: Partial<Guest>) => {
    // Optimistically update local state
    setGuests(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));

    // Invalidate cache to trigger refetch from server
    queryClient.invalidateQueries({ queryKey: ['guests'] });
  }, [queryClient]);

  // Delete guest - invalidates cache to trigger refetch
  const deleteGuest = useCallback((id: string) => {
    // Optimistically update local state
    setGuests(prev => prev.filter(g => g.id !== id));

    // Invalidate cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['guests'] });
  }, [queryClient]);

  // Get guest by ID
  const getGuest = useCallback((id: string): Guest | undefined => {
    return guests.find(g => g.id === id);
  }, [guests]);

  // Get guest by location ID (foreign key relationship)
  const getGuestByLocationId = useCallback((locationId: string): Guest | undefined => {
    return guests.find(g => g.locationId === locationId && g.status === 'onboard');
  }, [guests]);

  // Get location by guest ID (reverse foreign key lookup)
  const getLocationByGuestId = useCallback((guestId: string): Location | undefined => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest?.locationId) return undefined;

    return locations.find(l => l.id === guest.locationId);
  }, [guests, locations]);

  const value: GuestsContextType = {
    guests,
    isLoading,
    addGuest,
    updateGuest,
    deleteGuest,
    getGuest,
    getGuestByLocationId,
    getLocationByGuestId,
  };

  return (
    <GuestsContext.Provider value={value}>
      {children}
    </GuestsContext.Provider>
  );
}

export function useGuests() {
  const context = useContext(GuestsContext);
  if (context === undefined) {
    throw new Error('useGuests must be used within a GuestsProvider');
  }
  return context;
}
