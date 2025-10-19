/**
 * useDND Hook
 * Central source of truth for Do Not Disturb locations
 * Returns filtered DND locations and status flag
 */

import { useMemo } from "react";
import { useLocations } from "./useLocations";

export function useDND() {
  const { locations = [] } = useLocations();
  
  const dndLocations = useMemo(
    () => locations.filter(l => l.doNotDisturb), 
    [locations]
  );
  
  return { 
    dndLocations, 
    hasDND: dndLocations.length > 0,
    count: dndLocations.length
  };
}
