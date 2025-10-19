import { useQuery } from "@tanstack/react-query";
import { useAppData } from "../contexts/AppDataContext";
import { GuestsService } from "../services/guests";
import type { GuestListParams } from "../services/guests";
import { useEffect } from "react";

/**
 * Hook to fetch guests list with server-side filtering, sorting, and pagination
 */
export function useGuests(params: GuestListParams) {
  const { guests } = useAppData();
  
  // Keep service in sync with context data
  useEffect(() => {
    GuestsService.setGuestsData(guests);
  }, [guests]);

  return useQuery({
    queryKey: ["guests", params],
    queryFn: () => GuestsService.list(params),
    staleTime: 30000, // 30 seconds
    keepPreviousData: true,
  });
}

/**
 * Hook to fetch guest KPI statistics
 */
export function useGuestsStats() {
  const { guests } = useAppData();
  
  useEffect(() => {
    GuestsService.setGuestsData(guests);
  }, [guests]);

  return useQuery({
    queryKey: ["guests", "stats"],
    queryFn: () => GuestsService.stats(),
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Hook to fetch guest metadata (for filter dropdowns)
 */
export function useGuestsMeta() {
  const { guests } = useAppData();
  
  useEffect(() => {
    GuestsService.setGuestsData(guests);
  }, [guests]);

  return useQuery({
    queryKey: ["guests", "meta"],
    queryFn: () => GuestsService.meta(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch single guest
 */
export function useGuest(id: string | null) {
  const { guests } = useAppData();
  
  useEffect(() => {
    GuestsService.setGuestsData(guests);
  }, [guests]);

  return useQuery({
    queryKey: ["guests", id],
    queryFn: () => GuestsService.get(id!),
    enabled: !!id,
    staleTime: 30000,
  });
}
