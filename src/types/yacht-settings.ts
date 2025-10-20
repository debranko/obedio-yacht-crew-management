/**
 * Yacht Settings & Geographic Location
 * Stores vessel information and current position
 */

export interface YachtCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // GPS accuracy in meters
  lastUpdated?: string;
}

export interface YachtSettings {
  // Vessel Information
  vesselName?: string;
  vesselType?: 'motor' | 'sailing' | 'catamaran' | 'expedition';
  
  // Current Location
  currentLocation: YachtCoordinates;
  locationName?: string; // e.g., "Monaco", "Saint-Tropez"
  marina?: string; // Current marina/port
  
  // Preferences
  weatherUnits?: 'metric' | 'imperial';
  windUnits?: 'knots' | 'km/h' | 'm/s';
  timeZone?: string;
}

// Default location (fallback only)
export const DEFAULT_YACHT_LOCATION: YachtCoordinates = {
  latitude: 43.7384, // Monaco (Mediterranean)
  longitude: 7.4246,
  accuracy: 100,
};

// Popular marina locations for quick selection
export const POPULAR_MARINAS = [
  { name: 'Monaco', coords: { latitude: 43.7384, longitude: 7.4246 } },
  { name: 'Saint-Tropez', coords: { latitude: 43.2677, longitude: 6.6407 } },
  { name: 'Cannes', coords: { latitude: 43.5513, longitude: 7.0128 } },
  { name: 'Porto Cervo', coords: { latitude: 41.1356, longitude: 9.5355 } },
  { name: 'Ibiza', coords: { latitude: 38.9067, longitude: 1.4206 } },
  { name: 'Marbella', coords: { latitude: 36.5101, longitude: -4.8824 } },
  { name: 'Capri', coords: { latitude: 40.5509, longitude: 14.2263 } },
  { name: 'Santorini', coords: { latitude: 36.3932, longitude: 25.4615 } },
  { name: 'Mykonos', coords: { latitude: 37.4467, longitude: 25.3289 } },
  { name: 'Dubai Marina', coords: { latitude: 25.0806, longitude: 55.1391 } },
] as const;
