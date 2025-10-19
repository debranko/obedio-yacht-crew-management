// Type definitions for Obedio Yacht Crew Management System
// Centralized export for all type definitions

// Crew Management
export * from './crew';

// Guest Management  
export * from './guests';

// Service Requests & Messaging
export * from './service-requests';

// Activity Logs & Monitoring
export * from './activity-logs';

// Yacht Locations (deprecated - use domain/locations.ts)
export * from './yacht-locations';

// Re-export location types from domain
export type { Location, LocationType } from '../domain/locations';

// Re-export duty roster types
export type { Assignment, CrewMember, ShiftConfig } from '../components/duty-roster/types';