import { useQuery } from "@tanstack/react-query";
import { GuestsService } from "../services/guests";
import type { GuestListParams } from "../services/guests";

/**
 * Hook to fetch guests list with server-side filtering, sorting, and pagination
 */
export function useGuests(params: GuestListParams) {
  return useQuery({
    queryKey: ["guests", params],
    queryFn: () => GuestsService.list(params),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch guest KPI statistics
 */
export function useGuestsStats() {
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
  return useQuery({
    queryKey: ["guests", id],
    queryFn: () => GuestsService.get(id!),
    enabled: !!id,
    staleTime: 30000,
  });
}
