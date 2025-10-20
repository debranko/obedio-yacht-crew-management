/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines permissions for each role in the system
 */

import { Role } from '../types/crew';

export type Permission =
  // Crew Management
  | 'crew:view'
  | 'crew:create'
  | 'crew:edit'
  | 'crew:delete'
  | 'crew:assign-devices'
  
  // Guest Management
  | 'guests:view'
  | 'guests:create'
  | 'guests:edit'
  | 'guests:delete'
  | 'guests:view-details'
  
  // Service Requests
  | 'requests:view'
  | 'requests:create'
  | 'requests:accept'
  | 'requests:complete'
  | 'requests:cancel'
  | 'requests:delete'
  | 'requests:assign'
  
  // Locations
  | 'locations:view'
  | 'locations:create'
  | 'locations:edit'
  | 'locations:delete'
  
  // Devices & Buttons
  | 'devices:view'
  | 'devices:manage'
  | 'devices:configure'
  | 'buttons:view'
  | 'buttons:manage'
  
  // Settings
  | 'settings:view'
  | 'settings:edit-general'
  | 'settings:edit-roles'
  | 'settings:edit-system'
  | 'settings:edit-integrations'
  
  // Activity Logs
  | 'logs:view'
  | 'logs:export'
  
  // Dashboard
  | 'dashboard:view'
  | 'dashboard:customize'
  
  // System
  | 'system:admin'
  | 'system:backup'
  | 'system:users-manage';

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
    // All permissions
    'crew:view', 'crew:create', 'crew:edit', 'crew:delete', 'crew:assign-devices',
    'guests:view', 'guests:create', 'guests:edit', 'guests:delete', 'guests:view-details',
    'requests:view', 'requests:create', 'requests:accept', 'requests:complete', 'requests:cancel', 'requests:delete', 'requests:assign',
    'locations:view', 'locations:create', 'locations:edit', 'locations:delete',
    'devices:view', 'devices:manage', 'devices:configure',
    'buttons:view', 'buttons:manage',
    'settings:view', 'settings:edit-general', 'settings:edit-roles', 'settings:edit-system', 'settings:edit-integrations',
    'logs:view', 'logs:export',
    'dashboard:view', 'dashboard:customize',
    'system:admin', 'system:backup', 'system:users-manage',
  ],

  /**
   * CHIEF STEWARDESS - Interior Department Manager
   * Manages crew, guests, service requests, and interior operations
   */
  'chief-stewardess': [
    // Crew Management (view, edit, assign)
    'crew:view', 'crew:edit', 'crew:assign-devices',
    
    // Guest Management (full access)
    'guests:view', 'guests:create', 'guests:edit', 'guests:delete', 'guests:view-details',
    
    // Service Requests (full access)
    'requests:view', 'requests:create', 'requests:accept', 'requests:complete', 'requests:cancel', 'requests:assign',
    
    // Locations (view and edit cabin assignments)
    'locations:view', 'locations:edit',
    
    // Devices (view and manage crew devices)
    'devices:view', 'devices:manage',
    
    // Buttons (view only)
    'buttons:view',
    
    // Settings (view and edit general settings)
    'settings:view', 'settings:edit-general',
    
    // Activity Logs (view)
    'logs:view',
    
    // Dashboard
    'dashboard:view', 'dashboard:customize',
  ],

  /**
   * STEWARDESS - Interior Department Staff
   * Can manage guests, handle service requests, view crew
   */
  'stewardess': [
    // Crew Management (view only)
    'crew:view',
    
    // Guest Management (view, create, edit)
    'guests:view', 'guests:create', 'guests:edit', 'guests:view-details',
    
    // Service Requests (create, accept, complete own requests)
    'requests:view', 'requests:create', 'requests:accept', 'requests:complete',
    
    // Locations (view only)
    'locations:view',
    
    // Devices (view only)
    'devices:view',
    
    // Buttons (view only)
    'buttons:view',
    
    // Settings (view only)
    'settings:view',
    
    // Activity Logs (view own logs)
    'logs:view',
    
    // Dashboard
    'dashboard:view', 'dashboard:customize',
  ],

  /**
   * CREW - General Crew Member
   * Can view information, accept and complete service requests
   */
  'crew': [
    // Crew Management (view only)
    'crew:view',
    
    // Guest Management (view only)
    'guests:view',
    
    // Service Requests (view, accept, complete own requests)
    'requests:view', 'requests:accept', 'requests:complete',
    
    // Locations (view only)
    'locations:view',
    
    // Devices (view only)
    'devices:view',
    
    // Buttons (view only)
    'buttons:view',
    
    // Settings (view only)
    'settings:view',
    
    // Dashboard
    'dashboard:view',
  ],

  /**
   * ETO - Electrical/Technical Officer
   * Manages technical systems, devices, buttons, and configurations
   */
  'eto': [
    // Crew Management (view only)
    'crew:view',
    
    // Guest Management (view only)
    'guests:view',
    
    // Service Requests (view only, technical monitoring)
    'requests:view',
    
    // Locations (view and edit for device installation)
    'locations:view', 'locations:edit',
    
    // Devices (full access - manage all technical devices)
    'devices:view', 'devices:manage', 'devices:configure',
    
    // Buttons (full access - manage butler buttons)
    'buttons:view', 'buttons:manage',
    
    // Settings (view all, edit integrations and system)
    'settings:view', 'settings:edit-system', 'settings:edit-integrations',
    
    // Activity Logs (view all, export for diagnostics)
    'logs:view', 'logs:export',
    
    // Dashboard
    'dashboard:view', 'dashboard:customize',
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
