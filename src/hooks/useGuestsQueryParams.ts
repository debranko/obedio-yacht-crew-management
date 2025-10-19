import { useState, useEffect } from "react";

export interface GuestsQueryParams {
  q: string;
  status: string;
  type: string;
  diet: string;
  allergy: string;
  cabin: string;
  vip: string;
  page: number;
  limit: number;
  sort: string;
}

/**
 * Hook to manage URL query parameters for server-side filtering
 * Simulates URLSearchParams without requiring react-router-dom
 */
export function useGuestsQueryParams() {
  const [qp, setQp] = useState<GuestsQueryParams>({
    q: "",
    status: "All",
    type: "All",
    diet: "All",
    allergy: "All",
    cabin: "All",
    vip: "All",
    page: 1,
    limit: 25,
    sort: "checkinAt:desc",
  });

  const set = (patch: Partial<GuestsQueryParams>) => {
    setQp(prev => {
      const next = { ...prev, ...patch };
      
      // Reset page when filters change (unless page itself is being updated)
      if (patch.page === undefined && Object.keys(patch).length > 0) {
        next.page = 1;
      }
      
      return next;
    });
  };

  const reset = () => {
    setQp({
      q: "",
      status: "All",
      type: "All",
      diet: "All",
      allergy: "All",
      cabin: "All",
      vip: "All",
      page: 1,
      limit: 25,
      sort: "checkinAt:desc",
    });
  };

  return { qp, set, reset };
}
