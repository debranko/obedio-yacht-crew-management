/**
 * usePermissions Hook
 * Easy permission checking in React components
 */

import { useAuth } from '../contexts/AuthContext';
import { 
  Permission, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  getRolePermissions 
} from '../config/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const userRole = user?.role;

  return {
    /**
     * Check if user has a specific permission
     * @example can('crew:edit')
     */
    can: (permission: Permission): boolean => {
      return hasPermission(userRole, permission);
    },

    /**
     * Check if user has ANY of the permissions
     * @example canAny(['crew:edit', 'crew:delete'])
     */
    canAny: (permissions: Permission[]): boolean => {
      return hasAnyPermission(userRole, permissions);
    },

    /**
     * Check if user has ALL of the permissions
     * @example canAll(['crew:view', 'crew:edit'])
     */
    canAll: (permissions: Permission[]): boolean => {
      return hasAllPermissions(userRole, permissions);
    },

    /**
     * Get all permissions for current user's role
     */
    getPermissions: (): Permission[] => {
      return userRole ? getRolePermissions(userRole) : [];
    },

    /**
     * Get current user's role
     */
    role: userRole,

    /**
     * Check if user is admin
     */
    isAdmin: userRole === 'admin',

    /**
     * Check if user is chief stewardess
     */
    isChiefStewardess: userRole === 'chief-stewardess',

    /**
     * Check if user is stewardess
     */
    isStewardess: userRole === 'stewardess',

    /**
     * Check if user is crew
     */
    isCrew: userRole === 'crew',

    /**
     * Check if user is ETO
     */
    isETO: userRole === 'eto',
  };
}
