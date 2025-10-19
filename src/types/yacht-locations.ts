// Yacht Location Types (deprecated - migrating to domain/locations.ts)
export type LocationCategory = 'cabin' | 'public' | 'service' | 'operational' | 'exterior' | 'entertainment';
export type DeckType = 'main' | 'upper' | 'lower' | 'sun';

export interface YachtLocation {
  id: string;
  name: string;
  category: LocationCategory;
  deck: DeckType;
  capacity?: number;
  hasDevice: boolean;
  deviceStatus?: 'online' | 'offline' | 'alert';
  deviceId?: string;
  lastActivity?: string;
  activeRequests?: number;
  allowedAccess?: string[]; // guest types or crew roles
  isCustom?: boolean; // Added by ETO
  createdBy?: string;
  createdAt?: string;
  doNotDisturb?: boolean; // DND mode
  floor?: string; // Floor/deck name
}