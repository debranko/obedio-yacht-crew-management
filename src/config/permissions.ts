/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines permissions for each role in the system
 * 
 * INTEGRATED WITH SETTINGS UI MATRIX
 * Format: category.action (matches Settings page format)
 */

import { Role } from '../types/crew';

export type Permission =
  // Crew Management (matches Settings: crew.*)
  | 'crew.view'
  | 'crew.add'
  | 'crew.edit'
  | 'crew.delete'
  | 'crew.create-account'
  | 'crew.assign-devices'
  | 'crew.reset-password'
  
  // Guest Management (matches Settings: guests.*)
  | 'guests.view'
  | 'guests.add'
  | 'guests.edit'
  | 'guests.delete'
  
  // Duty Roster (matches Settings: duty.*)
  | 'duty.view'
  | 'duty.manage'
  | 'duty.configure'
  
  // Device Management (matches Settings: devices.*)
  | 'devices.view'
  | 'devices.add'
  | 'devices.edit'
  | 'devices.delete'
  | 'devices.assign'
  
  // Location Management (matches Settings: locations.*)
  | 'locations.view'
  | 'locations.add'
  | 'locations.edit'
  | 'locations.delete'
  
  // Communication (matches Settings: communication.*)
  | 'communication.send'
  | 'communication.broadcast'
  | 'communication.emergency'
  
  // System (matches Settings: system.*)
  | 'system.view-logs'
  | 'system.settings'
  | 'system.roles'
  | 'system.backup';

/**
 * Role Permissions Matrix
 * Defines what each role can do
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  /**
   * ADMIN - Full System Access
   * Can do everything
   */
  'admin': [
    // All permissions (admin has everything)
    'crew.view', 'crew.add', 'crew.edit', 'crew.delete', 'crew.create-account', 'crew.assign-devices', 'crew.reset-password',
    'guests.view', 'guests.add', 'guests.edit', 'guests.delete',
    'duty.view', 'duty.manage', 'duty.configure',
    'devices.view', 'devices.add', 'devices.edit', 'devices.delete', 'devices.assign',
    'locations.view', 'locations.add', 'locations.edit', 'locations.delete',
    'communication.send', 'communication.broadcast', 'communication.emergency',
    'system.view-logs', 'system.settings', 'system.roles', 'system.backup',
  ],

  /**
   * CHIEF STEWARDESS - Interior Department Manager
   * Manages crew, guests, service requests, and interior operations
   * Can create new crew members (with user accounts)
   */
  'chief-stewardess': [
    // Crew Management (can create accounts, edit, but not delete)
    'crew.view', 'crew.add', 'crew.edit', 'crew.create-account', 'crew.assign-devices',
    
    // Guest Management (full access)
    'guests.view', 'guests.add', 'guests.edit', 'guests.delete',
    
    // Duty Roster (full management)
    'duty.view', 'duty.manage',
    
    // Devices (view and manage)
    'devices.view', 'devices.assign',
    
    // Locations (view and edit)
    'locations.view', 'locations.edit',
    
    // Communication
    'communication.send', 'communication.broadcast',
    
    // System (view logs only)
    'system.view-logs',
  ],

  /**
   * STEWARDESS - Interior Department Staff
   * Can manage guests, handle service requests, view crew
   */
  'stewardess': [
    // Crew Management (view only)
    'crew.view',
    
    // Guest Management (view, add, edit - no delete)
    'guests.view', 'guests.add', 'guests.edit',
    
    // Duty Roster (view only)
    'duty.view',
    
    // Devices (view only)
    'devices.view',
    
    // Locations (view only)
    'locations.view',
    
    // Communication (send messages)
    'communication.send',
    
    // System (view logs)
    'system.view-logs',
  ],

  /**
   * CREW - General Crew Member
   * Can view information, accept and complete service requests
   */
  'crew': [
    // Crew Management (view only)
    'crew.view',
    
    // Guest Management (view only)
    'guests.view',
    
    // Duty Roster (view only)
    'duty.view',
    
    // Devices (view only)
    'devices.view',
    
    // Locations (view only)
    'locations.view',
    
    // Communication (send messages only)
    'communication.send',
  ],

  /**
   * ETO - Electrical/Technical Officer
   * Manages technical systems, devices, buttons, and configurations
   */
  'eto': [
    // Crew Management (view only)
    'crew.view',
    
    // Guest Management (view only)
    'guests.view',
    
    // Duty Roster (view only)
    'duty.view',
    
    // Devices (full access - technical officer)
    'devices.view', 'devices.add', 'devices.edit', 'devices.delete', 'devices.assign',
    
    // Locations (view, edit, and DELETE - for technical maintenance)
    'locations.view', 'locations.edit', 'locations.delete',
    
    // Communication (all except emergency)
    'communication.send', 'communication.broadcast',
    
    // System (all system access)
    'system.view-logs', 'system.settings', 'system.backup',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: Role | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: Role | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Role descriptions for UI display
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  'admin': 'Full system access - Can manage all aspects of the system',
  'chief-stewardess': 'Interior department manager - Manages crew, guests, and service operations',
  'stewardess': 'Interior staff - Handles guest services and cabin management',
  'crew': 'General crew member - Can view information and handle assigned tasks',
  'eto': 'Technical officer - Manages devices, buttons, and technical systems',
};

/**
 * Role display names
 */
export const ROLE_NAMES: Record<Role, string> = {
  'admin': 'Administrator',
  'chief-stewardess': 'Chief Stewardess',
  'stewardess': 'Stewardess',
  'crew': 'Crew Member',
  'eto': 'ETO (Technical Officer)',
};
