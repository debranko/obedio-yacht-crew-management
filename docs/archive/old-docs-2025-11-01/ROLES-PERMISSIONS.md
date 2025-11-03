# 🔐 Role-Based Access Control (RBAC) System

## 📋 Demo Users

All users have password: **`password`**

| Username | Role | Full Name | Description |
|----------|------|-----------|-------------|
| `admin` | Administrator | System Administrator | Full system access |
| `chief` | Chief Stewardess | Sophie Anderson | Interior department manager |
| `stewardess` | Stewardess | Emma Johnson | Interior staff |
| `crew` | Crew Member | James Wilson | General crew member |
| `eto` | ETO | Michael Davis | Technical officer |

---

## 🎭 Roles & Permissions Matrix

### 👑 Administrator
**Full System Access** - Can do everything

- ✅ All crew management operations
- ✅ All guest management operations
- ✅ All service request operations
- ✅ All location management
- ✅ Device & button management
- ✅ All settings & configurations
- ✅ Activity logs & exports
- ✅ User management

---

### 👔 Chief Stewardess (Interior Manager)
**Manages crew, guests, and service operations**

**Can Do:**
- ✅ View and edit crew members
- ✅ Assign devices to crew
- ✅ Full guest management (create, edit, delete, view details)
- ✅ Full service request management (create, assign, accept, complete, cancel)
- ✅ View and edit locations (cabin assignments)
- ✅ View and manage crew devices
- ✅ View butler buttons
- ✅ View and edit general settings
- ✅ View activity logs
- ✅ Customize dashboard

**Cannot Do:**
- ❌ Delete crew members
- ❌ Create/delete locations
- ❌ Configure technical systems
- ❌ Manage smart buttons
- ❌ Edit role permissions
- ❌ System administration

---

### 👗 Stewardess (Interior Staff)
**Handles guest services and cabin management**

**Can Do:**
- ✅ View crew members
- ✅ Create, edit, and view guests
- ✅ View guest details
- ✅ Create and handle service requests
- ✅ Accept and complete service requests
- ✅ View locations
- ✅ View devices and buttons
- ✅ View settings
- ✅ View own activity logs
- ✅ Customize own dashboard

**Cannot Do:**
- ❌ Delete guests
- ❌ Edit crew members
- ❌ Assign service requests to others
- ❌ Delete or cancel service requests (except own)
- ❌ Edit locations
- ❌ Manage devices
- ❌ Edit settings

---

### 👤 Crew Member
**General crew - View information and handle assigned tasks**

**Can Do:**
- ✅ View crew members
- ✅ View guests (limited info)
- ✅ View service requests
- ✅ Accept service requests
- ✅ Complete own service requests
- ✅ View locations
- ✅ View devices and buttons
- ✅ View settings
- ✅ View dashboard

**Cannot Do:**
- ❌ Create or edit guests
- ❌ Create service requests
- ❌ Assign service requests
- ❌ Edit anything
- ❌ Customize dashboard
- ❌ Access settings

---

### ⚡ ETO (Electrical/Technical Officer)
**Manages technical systems, devices, and configurations**

**Can Do:**
- ✅ View crew and guests
- ✅ View service requests (for monitoring)
- ✅ View and edit locations (for device installation)
- ✅ Full device management (configure, manage all devices)
- ✅ Full butler button management (register, configure, monitor)
- ✅ View all settings
- ✅ Edit system and integration settings
- ✅ View and export activity logs (diagnostics)
- ✅ Customize dashboard

**Cannot Do:**
- ❌ Manage crew or guests
- ❌ Create or handle service requests
- ❌ Edit general settings
- ❌ Edit role permissions

---

## 💻 Usage in Code

### Using PermissionGuard Component

```tsx
import { PermissionGuard } from '../components/PermissionGuard';

// Hide edit button from users without permission
<PermissionGuard permission="crew:edit">
  <Button>Edit Crew Member</Button>
</PermissionGuard>

// Show delete button only to admins or chief stewardess
<PermissionGuard anyOf={['crew:delete', 'system:admin']}>
  <Button>Delete</Button>
</PermissionGuard>

// Require multiple permissions
<PermissionGuard allOf={['crew:view', 'crew:edit']}>
  <AdvancedEditor />
</PermissionGuard>

// Show fallback content when no permission
<PermissionGuard 
  permission="settings:edit-system"
  fallback={<p>You don't have permission to edit system settings</p>}
>
  <SystemSettings />
</PermissionGuard>
```

### Using usePermissions Hook

```tsx
import { usePermissions } from '../hooks/usePermissions';

function CrewList() {
  const { can, isAdmin, isChiefStewardess } = usePermissions();

  return (
    <div>
      {can('crew:create') && (
        <Button>Add New Crew Member</Button>
      )}

      {(isAdmin || isChiefStewardess) && (
        <Button>Manage Team</Button>
      )}

      {can('crew:edit') ? (
        <EditForm />
      ) : (
        <ViewOnlyMode />
      )}
    </div>
  );
}
```

### Checking Permissions Programmatically

```tsx
const { can, canAny, canAll, role } = usePermissions();

// Single permission
if (can('crew:delete')) {
  // Show delete option
}

// Any of multiple permissions
if (canAny(['crew:edit', 'crew:delete'])) {
  // Show action menu
}

// All permissions required
if (canAll(['crew:view', 'crew:edit', 'crew:delete'])) {
  // Show full management interface
}

// Check role directly
if (role === 'admin') {
  // Admin-only features
}
```

---

## 🎬 Demo Scenarios

### Scenario 1: Admin Login
1. Login as: `admin / password`
2. Can see and do everything
3. All buttons visible
4. All pages accessible

### Scenario 2: Chief Stewardess
1. Login as: `chief / password`
2. Can manage interior operations
3. Cannot access system settings
4. Cannot delete locations

### Scenario 3: Stewardess
1. Login as: `stewardess / password`
2. Can handle guests and requests
3. Cannot delete guests
4. Cannot assign requests to others

### Scenario 4: Crew Member
1. Login as: `crew / password`
2. View-only for most things
3. Can accept and complete own requests
4. Cannot customize dashboard

### Scenario 5: ETO
1. Login as: `eto / password`
2. Can manage all technical systems
3. Can configure devices and buttons
4. Cannot manage guests or crew

---

## 🔧 Extending Permissions

To add new permissions:

1. Add permission type to `src/config/permissions.ts`
2. Update `ROLE_PERMISSIONS` matrix for each role
3. Use `PermissionGuard` or `usePermissions` in components

Example:
```typescript
// Add new permission
export type Permission =
  | 'crew:view'
  // ... existing permissions
  | 'reports:view'
  | 'reports:export';

// Update role permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  'admin': [
    // ... existing permissions
    'reports:view',
    'reports:export',
  ],
  // ... other roles
};
```

---

## 📊 Permission Categories

**Crew Management:**
- `crew:view`, `crew:create`, `crew:edit`, `crew:delete`, `crew:assign-devices`

**Guest Management:**
- `guests:view`, `guests:create`, `guests:edit`, `guests:delete`, `guests:view-details`

**Service Requests:**
- `requests:view`, `requests:create`, `requests:accept`, `requests:complete`, `requests:cancel`, `requests:delete`, `requests:assign`

**Locations:**
- `locations:view`, `locations:create`, `locations:edit`, `locations:delete`

**Devices & Buttons:**
- `devices:view`, `devices:manage`, `devices:configure`, `buttons:view`, `buttons:manage`

**Settings:**
- `settings:view`, `settings:edit-general`, `settings:edit-roles`, `settings:edit-system`, `settings:edit-integrations`

**Activity Logs:**
- `logs:view`, `logs:export`

**Dashboard:**
- `dashboard:view`, `dashboard:customize`

**System:**
- `system:admin`, `system:backup`, `system:users-manage`

---

**Status:** ✅ Production-ready role-based access control system
**Demo:** Ready with 5 test users representing all roles
**Security:** Permissions enforced in UI components
