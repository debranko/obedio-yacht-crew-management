/**
 * System-wide Settings Types
 * Global configuration for the yacht management system
 */

export interface YachtSettings {
  // Vessel Information
  name: string;
  type: 'motor' | 'sailing' | 'expedition' | 'catamaran';
  
  // Location Settings
  timezone: string;
  
  // Layout Configuration
  floors: string[]; // Array of deck/floor names
  
  // System Preferences
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '12h' | '24h';
  
  // Weather & Navigation
  weatherUnits?: 'metric' | 'imperial';
  windSpeedUnits?: 'knots' | 'km/h' | 'm/s' | 'mph';
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemSettings {
  yacht: YachtSettings;
  // Future: Add more system-wide settings here
}

// Default yacht settings
export const DEFAULT_YACHT_SETTINGS: YachtSettings = {
  name: 'My Yacht',
  type: 'motor',
  timezone: 'UTC',
  floors: ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '24h',
  weatherUnits: 'metric',
  windSpeedUnits: 'knots',
};

// Common timezones for yacht locations
export const YACHT_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Universal Time)' },
  { value: 'Europe/Monaco', label: 'Monaco' },
  { value: 'Europe/Paris', label: 'France (Côte d\'Azur)' },
  { value: 'Europe/Rome', label: 'Italy' },
  { value: 'Europe/Athens', label: 'Greece' },
  { value: 'Europe/Istanbul', label: 'Turkey' },
  { value: 'Europe/Madrid', label: 'Spain (Balearics)' },
  { value: 'Europe/London', label: 'United Kingdom' },
  { value: 'America/New_York', label: 'US East Coast' },
  { value: 'America/Chicago', label: 'US Central' },
  { value: 'America/Los_Angeles', label: 'US West Coast' },
  { value: 'America/Antigua', label: 'Caribbean (AST)' },
  { value: 'America/Barbados', label: 'Caribbean (Barbados)' },
  { value: 'Pacific/Auckland', label: 'New Zealand' },
  { value: 'Australia/Sydney', label: 'Australia (Sydney)' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Indian/Maldives', label: 'Maldives' },
  { value: 'Indian/Seychelles', label: 'Seychelles' },
];

// Vessel types
export const VESSEL_TYPES = [
  { value: 'motor', label: 'Motor Yacht' },
  { value: 'sailing', label: 'Sailing Yacht' },
  { value: 'expedition', label: 'Expedition Yacht' },
  { value: 'catamaran', label: 'Catamaran' },
] as const;