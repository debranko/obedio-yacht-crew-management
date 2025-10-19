/**
 * Domain types for property locations/zones
 * Represents different areas within a single yacht or villa
 */

export type LocationType = 
  | "deck" 
  | "cabin" 
  | "common" 
  | "service" 
  | "outdoor" 
  | "technical";

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description?: string;
  floor?: string; // e.g., "Main Deck", "Upper Deck", "Ground Floor"
  responsibleCrewIds?: string[]; // Crew members assigned to this area
  deviceCount?: number; // Number of devices in this location
  capacity?: number; // Guest capacity for the area
  status: "active" | "maintenance" | "restricted";
  image?: string; // URL to location image (yacht room render)
  notes?: string;
  doNotDisturb?: boolean; // DND mode - location not accepting requests
  smartButtonId?: string; // ESP32 smart button device ID
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLocationInput {
  name: string;
  type: LocationType;
  description?: string;
  floor?: string;
  responsibleCrewIds?: string[];
  capacity?: number;
  status: "active" | "maintenance" | "restricted";
  notes?: string;
}

export interface UpdateLocationInput extends Partial<CreateLocationInput> {
  id: string;
  doNotDisturb?: boolean;
  smartButtonId?: string;
  image?: string;
  deviceCount?: number;
}

export const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: "deck", label: "Deck/Floor" },
  { value: "cabin", label: "Cabin/Bedroom" },
  { value: "common", label: "Common Area" },
  { value: "service", label: "Service Area" },
  { value: "outdoor", label: "Outdoor Area" },
  { value: "technical", label: "Technical Area" }
];

export const LOCATION_STATUS_LABELS = {
  active: "Active",
  maintenance: "Maintenance",
  restricted: "Restricted"
} as const;
