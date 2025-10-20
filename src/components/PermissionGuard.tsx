/**
 * PermissionGuard Component
 * Conditionally renders children based on user permissions
 */

import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Permission } from '../config/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  /** Single permission required */
  permission?: Permission;
  /** Any of these permissions required (OR logic) */
  anyOf?: Permission[];
  /** All of these permissions required (AND logic) */
  allOf?: Permission[];
  /** Fallback content when user doesn't have permission */
  fallback?: ReactNode;
}

/**
 * Renders children only if user has required permission(s)
 * 
 * @example Single permission
 * <PermissionGuard permission="crew:edit">
 *   <EditButton />
 * </PermissionGuard>
 * 
 * @example Any of multiple permissions
 * <PermissionGuard anyOf={['crew:edit', 'crew:delete']}>
 *   <ActionButtons />
 * </PermissionGuard>
 * 
 * @example All permissions required
 * <PermissionGuard allOf={['crew:view', 'crew:edit']}>
 *   <AdvancedEditor />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  anyOf,
  allOf,
  fallback = null,
}: PermissionGuardProps) {
  const { can, canAny, canAll } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (anyOf) {
    hasAccess = canAny(anyOf);
  } else if (allOf) {
    hasAccess = canAll(allOf);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook-based permission check
 * Returns true/false for inline conditional rendering
 * 
 * @example
 * const canEdit = useHasPermission('crew:edit');
 * if (canEdit) { ... }
 */
export function useHasPermission(permission: Permission): boolean {
  const { can } = usePermissions();
  return can(permission);
}
