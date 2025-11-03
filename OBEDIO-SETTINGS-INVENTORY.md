# OBEDIO Settings - Comprehensive Inventory

**Analysis Date**: 2025-11-03
**Purpose**: Document ALL existing settings, their locations, storage methods, and APIs before implementing any changes

---

## 1. MAIN SETTINGS PAGE

**Location**: [src/components/pages/settings.tsx](src/components/pages/settings.tsx)
**Lines**: 1-1917 (complete centralized settings interface)

### Tab 1: General Settings
**Lines**: 717-937

| Setting | Type | Storage | API Endpoint | Status |
|---------|------|---------|--------------|--------|
| Vessel Name | String | Backend | PUT /api/yacht-settings | Working |
| Vessel Type | Select | Backend | PUT /api/yacht-settings | Working |
| Timezone | Select | Backend | PUT /api/yacht-settings | Working |
| Floors/Decks | Array | Backend | PUT /api/yacht-settings | Working |
| Date Format | Select | Backend | PUT /api/yacht-settings | Working |
| Time Format | Select | Backend | PUT /api/yacht-settings | Working |
| Weather Units | Select | Backend | PUT /api/yacht-settings | Working |
| Wind Speed Units | Select | Backend | PUT /api/yacht-settings | Working |
| Weather Update Interval | Number | Backend | PUT /api/yacht-settings | Working |
| Service Request Display Mode | Select | localStorage + Backend | Mixed | ISSUE: Inconsistent storage |
| Serving Now Timeout | Number | localStorage | None | ISSUE: No backend API |
| Request Dialog Repeat Interval | Number | localStorage | None | ISSUE: No backend API |

**Backend Integration**:
- Hook: `useYachtSettings()` - [src/hooks/useYachtSettings.ts:61](src/hooks/useYachtSettings.ts#L61)
- API: GET/PUT /api/yacht-settings
- WebSocket: Real-time updates via 'settings:updated' event
- Database: YachtSettings model (single row)

### Tab 2: Service Request Categories
**Lines**: 939-1160

| Setting | Type | Storage | API Endpoint | Status |
|---------|------|---------|--------------|--------|
| Category List | Array | Backend | GET /api/service-categories | Working |
| Add Category | Form | Backend | POST /api/service-categories | Working |
| Edit Category | Form | Backend | PUT /api/service-categories/:id | Working |
| Delete Category | Action | Backend | DELETE /api/service-categories/:id | Working |

**Backend Integration**:
- Hook: `useServiceCategories()` - [src/hooks/useServiceCategories.ts](src/hooks/useServiceCategories.ts)
- API: Full CRUD for /api/service-categories
- Database: ServiceCategory model

### Tab 3: Notifications
**Lines**: 1162-1432

| Setting | Type | Storage | API Endpoint | Status |
|---------|------|---------|--------------|--------|
| Email Notifications | Boolean | Backend | PUT /api/user-preferences/notifications | Working |
| Notification Email | String | Backend | PUT /api/user-preferences/notifications | Working |
| Emergency Contacts | Array | Backend | PUT /api/user-preferences/notifications | Working |
| Service Requests Alerts | Boolean | Not Connected | Should use /api/notification-settings | ISSUE: Not integrated |
| Emergency Alerts | Boolean | Not Connected | Should use /api/notification-settings | ISSUE: Not integrated |
| System Messages | Boolean | Not Connected | Should use /api/notification-settings | ISSUE: Not integrated |
| Guest Messages | Boolean | Not Connected | Should use /api/notification-settings | ISSUE: Not integrated |
| Crew Messages | Boolean | Not Connected | Should use /api/notification-settings | ISSUE: Not integrated |
| Quiet Hours | Boolean + Time | Not Connected | Should use /api/notification-settings | ISSUE: Not integrated |

**Backend Integration**:
- Hook: `useUserPreferences()` - [src/hooks/useUserPreferences.ts:16](src/hooks/useUserPreferences.ts#L16)
- API: PUT /api/user-preferences/notifications (partial - only email settings)
- Database: UserPreferences model + NotificationSettings model
- **CRITICAL ISSUE**: UI shows push notification settings but they don't call the backend API!

### Tab 4: Roles & Permissions
**Lines**: 1434-1530

| Setting | Type | Storage | API Endpoint | Status |
|---------|------|---------|--------------|--------|
| Role Permissions Matrix | Grid | Backend | GET/PUT /api/role-permissions | Working |

**Backend Integration**:
- API: /api/role-permissions
- Database: Stored in role-based permission system

### Tab 5: System Settings
**Lines**: 1532-1738

| Setting | Type | Storage | API Endpoint | Status |
|---------|------|---------|--------------|--------|
| Server Port | Number | Environment | GET /api/system-settings | Read-only |
| WebSocket Port | Number | Environment | GET /api/system-settings | Read-only |
| Database URL | String | Environment | GET /api/system-settings | Hidden |
| API Timeout | Number | Environment | PUT /api/system-settings | TODO |
| Log Level | Select | Environment | PUT /api/system-settings | TODO |
| Enable Metrics | Boolean | Environment | PUT /api/system-settings | TODO |
| Debug Mode | Boolean | Environment | GET /api/system-settings | Read-only |

**Backend Integration**:
- API: GET/PUT /api/system-settings
- Route: [backend/src/routes/system-settings.ts](backend/src/routes/system-settings.ts)
- NOTE: Settings shown but persistence not implemented (requires .env update)

### Tab 6: Backup & Restore
**Lines**: 1740-1912

| Setting | Type | Storage | API Endpoint | Status |
|---------|------|---------|--------------|--------|
| Backup Schedule | Select | Backend | GET/PUT /api/backup | Working |
| Storage Location | String | Backend | GET/PUT /api/backup | Working |
| Retention Period | Number | Backend | GET/PUT /api/backup | Working |
| Auto Backup | Boolean | Backend | GET/PUT /api/backup | Working |

**Backend Integration**:
- API: /api/backup (full backup management)

---

## 2. SERVICE REQUESTS SETTINGS (BURIED)

**Location**: [src/components/service-requests-settings-dialog.tsx](src/components/service-requests-settings-dialog.tsx)
**Lines**: 1-446
**Where Used**: Service Requests page - gear icon button
**CRITICAL ISSUE**: All settings stored in localStorage, NO backend API integration!

### Display Tab Settings
**Lines**: 164-283

| Setting | Type | Current Storage | Should Use API | Status |
|---------|------|----------------|----------------|--------|
| Display Mode | Select (guest-name/location) | localStorage | PUT /api/user-preferences | NEEDS MIGRATION |
| View Style | Select (expanded/compact) | localStorage | PUT /api/user-preferences | NEEDS MIGRATION |
| Sort Order | Select (newest/priority/location) | localStorage | PUT /api/user-preferences | NEEDS MIGRATION |
| Show Guest Photos | Boolean | localStorage | PUT /api/user-preferences | NEEDS MIGRATION |
| Serving Now Timeout | Number (minutes) | localStorage | PUT /api/user-preferences | NEEDS MIGRATION |

### Notifications Tab Settings
**Lines**: 285-344

| Setting | Type | Current Storage | Should Use API | Status |
|---------|------|----------------|----------------|--------|
| Sound Alerts | Boolean | localStorage | PUT /api/notification-settings | NEEDS MIGRATION |
| Visual Flash | Boolean | localStorage | PUT /api/user-preferences | NEEDS MIGRATION |
| Response Time Warning | Number (minutes) | localStorage | PUT /api/user-preferences | NEEDS MIGRATION |

### Automation Tab Settings
**Lines**: 346-426

| Setting | Type | Current Storage | Should Use API | Status |
|---------|------|----------------|----------------|--------|
| Auto Archive Time | Number (minutes) | localStorage | PUT /api/user-preferences | NEEDS MIGRATION |
| Auto Priority VIP | Boolean | localStorage | PUT /api/user-preferences | NEEDS MIGRATION |
| Auto Priority Master Suite | Boolean | localStorage | PUT /api/user-preferences | NEEDS MIGRATION |

**localStorage Keys Used**:
- `obedio-user-preferences` (merged with existing prefs)
- `obedio-service-requests-settings` (additional settings)

**Save Function**: [service-requests-settings-dialog.tsx:97-129](src/components/service-requests-settings-dialog.tsx#L97-L129)

```typescript
// CURRENT (WRONG - localStorage only):
const handleSave = () => {
  localStorage.setItem('obedio-user-preferences', JSON.stringify(merged));
  localStorage.setItem('obedio-service-requests-settings', JSON.stringify(additionalPrefs));
  toast.success('Settings saved successfully');
};
```

**REQUIRED CHANGES**:
1. Add these fields to UserPreferences database model
2. Create API endpoints to save/retrieve these settings
3. Replace localStorage with React Query mutations
4. Keep the dialog in Service Requests page (as requested)
5. Make it call the same backend API as main Settings page

---

## 3. DUTY ROSTER SETTINGS (BURIED)

**Location**: [src/components/duty-roster/calendar-settings-dialog.tsx](src/components/duty-roster/calendar-settings-dialog.tsx)
**Lines**: 1-159
**Where Used**: Duty Roster page - settings gear icon

### Shift Configuration Settings

| Setting | Type | Current Storage | Should Use API | Status |
|---------|------|----------------|----------------|--------|
| Shift Definitions | Array of Shifts | Parent Component State | GET/PUT /api/shifts/config | NEEDS BACKEND |
| Shift Name | String | Component State | Backend | NEEDS BACKEND |
| Start Time | Time | Component State | Backend | NEEDS BACKEND |
| End Time | Time | Component State | Backend | NEEDS BACKEND |
| Primary Count | Number | Component State | Backend | NEEDS BACKEND |
| Backup Count | Number | Component State | Backend | NEEDS BACKEND |

**Save Function**: [calendar-settings-dialog.tsx:54](src/components/duty-roster/calendar-settings-dialog.tsx#L54)

```typescript
const handleSave = () => {
  onSave(localShifts);  // Passed to parent component
  onOpenChange(false);
};
```

**CURRENT FLOW**:
- Dialog → Parent Component State → (probably not persisted?)
- NO backend API integration found

**REQUIRED CHANGES**:
1. Create backend API endpoint for shift configurations
2. Add database model for shift templates
3. Integrate with React Query
4. Keep dialog in Duty Roster page
5. Ensure same API is used if shift config appears elsewhere

---

## 4. CREW NOTIFICATION SETTINGS (BURIED)

**Location**: [src/components/notification-settings-dialog.tsx](src/components/notification-settings-dialog.tsx)
**Lines**: 1-197
**Where Used**: Crew List page or Duty Roster

### Shift Notification Settings

| Setting | Type | Current Storage | Should Use API | Status |
|---------|------|----------------|----------------|--------|
| Notifications Enabled | Boolean | Parent Component | Backend | NEEDS VERIFICATION |
| Shift Start Advance Time | Select | Parent Component | Backend | NEEDS VERIFICATION |
| Shift End Advance Time | Select | Parent Component | Backend | NEEDS VERIFICATION |
| Shift Start Enabled | Boolean | Parent Component | Backend | NEEDS VERIFICATION |
| Shift End Enabled | Boolean | Parent Component | Backend | NEEDS VERIFICATION |

**Save Function**: [notification-settings-dialog.tsx:66](src/components/notification-settings-dialog.tsx#L66)

```typescript
const handleSave = () => {
  onSave(settings);  // Passed to parent
  toast.success('Notification settings saved');
  onOpenChange(false);
};
```

**CURRENT FLOW**: Dialog → Parent Component → (backend API call in parent?)

**NEEDS VERIFICATION**: Check where this dialog is used and if parent saves to backend

---

## 5. BACKEND API ROUTES

### User Preferences API
**File**: [backend/src/routes/user-preferences.ts](backend/src/routes/user-preferences.ts)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| /api/user-preferences | GET | Get user preferences | Working |
| /api/user-preferences/dashboard | PUT | Update dashboard layout/widgets | Working |
| /api/user-preferences/theme | PUT | Update theme (light/dark/auto) | Working |
| /api/user-preferences/notifications | PUT | Update notification email settings | Working |
| /api/user-preferences/dashboard | DELETE | Reset dashboard to defaults | Working |

**Database Model**: [backend/prisma/schema.prisma:30-46](backend/prisma/schema.prisma#L30-L46)

```prisma
model UserPreferences {
  id                  String   @id @default(cuid())
  userId              String   @unique
  dashboardLayout     Json?
  activeWidgets       Json?
  theme               String   @default("light")
  language            String   @default("en")
  emailNotifications  Boolean  @default(false)
  notificationEmail   String?
  emergencyContacts   Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**MISSING FIELDS** (needed for Service Requests settings):
- serviceRequestDisplayMode (guest-name or location)
- serviceRequestViewStyle (expanded or compact)
- serviceRequestSortOrder (newest, priority, or location)
- serviceRequestShowGuestPhotos (boolean)
- serviceRequestServingTimeout (number - minutes)
- serviceRequestSoundAlerts (boolean)
- serviceRequestVisualFlash (boolean)
- serviceRequestResponseWarning (number - minutes)
- serviceRequestAutoArchive (number - minutes)
- serviceRequestAutoPriorityVIP (boolean)
- serviceRequestAutoPriorityMasterSuite (boolean)

### Notification Settings API
**File**: [backend/src/routes/notification-settings.ts](backend/src/routes/notification-settings.ts)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| /api/notification-settings | GET | Get notification settings | Working |
| /api/notification-settings | PUT | Update notification settings | Working |
| /api/notification-settings/push-token | POST | Update push token | Working |
| /api/notification-settings/test | POST | Test notification | Working |

**Database Model**: [backend/prisma/schema.prisma:391-407](backend/prisma/schema.prisma#L391-L407)

```prisma
model NotificationSettings {
  id                String   @id @default(cuid())
  userId            String   @unique
  pushEnabled       Boolean  @default(true)
  pushToken         String?
  serviceRequests   Boolean  @default(true)
  emergencyAlerts   Boolean  @default(true)
  systemMessages    Boolean  @default(true)
  guestMessages     Boolean  @default(true)
  crewMessages      Boolean  @default(true)
  quietHoursEnabled Boolean  @default(false)
  quietHoursStart   String?
  quietHoursEnd     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**STATUS**: Model exists with all necessary fields, BUT main Settings page doesn't use this API!

### Yacht Settings API
**File**: [backend/src/routes/yacht-settings.ts](backend/src/routes/yacht-settings.ts)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| /api/yacht-settings | GET | Get yacht settings | Working |
| /api/yacht-settings | PUT | Update yacht settings | Working |

**Database Model**: [backend/prisma/schema.prisma:350-371](backend/prisma/schema.prisma#L350-L371)

```prisma
model YachtSettings {
  id                    String    @id @default(cuid())
  name                  String    @default("Serenity")
  type                  String    @default("motor")
  timezone              String    @default("Europe/Monaco")
  floors                String[]  @default(["Lower Deck", "Main Deck", "Upper Deck", "Sun Deck"])
  dateFormat            String    @default("DD/MM/YYYY")
  timeFormat            String    @default("24h")
  weatherUnits          String    @default("metric")
  windSpeedUnits        String    @default("knots")
  weatherUpdateInterval Int       @default(30)
  latitude              Float?
  longitude             Float?
  accuracy              Float?
  locationName          String?
  locationUpdatedAt     DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

**STATUS**: Fully working with WebSocket real-time updates

### System Settings API
**File**: [backend/src/routes/system-settings.ts](backend/src/routes/system-settings.ts)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| /api/system-settings | GET | Get system settings & status | Working |
| /api/system-settings | PUT | Update system settings | Partial (no persistence) |
| /api/system-settings/health | GET | Health check | Working |

**STATUS**: Read-only from environment variables, write functionality not implemented

---

## 6. REACT QUERY HOOKS

### useUserPreferences Hook
**File**: [src/hooks/useUserPreferences.ts](src/hooks/useUserPreferences.ts)

**Functionality**:
- `preferences` - Get all user preferences
- `updateDashboard()` - Update dashboard layout/widgets
- `updateTheme()` - Update theme preference
- `resetDashboard()` - Reset dashboard to defaults
- `updateNotifications()` - Update email notification settings

**Backend Integration**: Full React Query with mutations and optimistic updates

### useYachtSettings Hook
**File**: [src/hooks/useYachtSettings.ts](src/hooks/useYachtSettings.ts)

**Functionality**:
- `settings` - Get yacht settings
- `updateSettings()` - Update yacht settings
- `updateLocation()` - Update GPS coordinates
- `getCurrentCoordinates()` - Get current location
- `useCurrentPosition()` - Use browser geolocation

**Backend Integration**:
- Full React Query with mutations and optimistic updates
- WebSocket integration for real-time updates
- Geographic location helpers

### useYachtSettingsApi Hook (Older Version)
**File**: [src/hooks/useYachtSettingsApi.ts](src/hooks/useYachtSettingsApi.ts)

**STATUS**: Appears to be an older version, may be deprecated. Uses useState instead of React Query.

---

## 7. HARDCODED VALUES (STRICT VIOLATIONS)

### Service Requests Page Hardcoded Values
**File**: [src/components/pages/service-requests.tsx](src/components/pages/service-requests.tsx)

**Line 234**: HARDCODED Crew ID
```typescript
const currentCrewId = 'clw3xyz123'; // Temporary hardcoded crew ID
```
**FIX**: Use authenticated user's crew member ID from auth context

**Lines 76-82**: HARDCODED User Preferences
```typescript
const userPreferences = {
  serviceRequestDisplayMode: 'location' as 'guest-name' | 'location',
  servingNowTimeout: 5,
  requestDialogRepeatInterval: 60,
  soundEnabled: true,
};
```
**FIX**: Load from backend API via useUserPreferences hook

---

## 8. SUMMARY OF ISSUES

### Critical Issues

1. **Service Requests Settings Dialog** - ALL settings use localStorage instead of backend
   - Location: [service-requests-settings-dialog.tsx](src/components/service-requests-settings-dialog.tsx)
   - Impact: Settings not synced across devices/platforms
   - Fix Required: Migrate all 11 settings to backend API

2. **Hardcoded Values in Service Requests**
   - Location: [service-requests.tsx:234, 76-82](src/components/pages/service-requests.tsx#L234)
   - Impact: Cannot support multiple crew members, settings not configurable
   - Fix Required: Remove hardcoded values, use auth context + backend API

3. **Notification Settings Disconnect**
   - Location: [settings.tsx:1162-1432](src/components/pages/settings.tsx#L1162-L1432)
   - Impact: UI shows notification settings but doesn't save them to backend
   - Fix Required: Connect to /api/notification-settings API

4. **Duty Roster Shift Configuration**
   - Location: [calendar-settings-dialog.tsx](src/components/duty-roster/calendar-settings-dialog.tsx)
   - Impact: Shift configurations may not persist
   - Fix Required: Create backend API for shift templates

### Database Schema Updates Needed

**UserPreferences Model** - Add fields:
```prisma
// Service Requests Preferences
serviceRequestDisplayMode       String?   @default("location")
serviceRequestViewStyle         String?   @default("expanded")
serviceRequestSortOrder         String?   @default("newest")
serviceRequestShowGuestPhotos   Boolean   @default(true)
serviceRequestServingTimeout    Int       @default(5)
serviceRequestSoundAlerts       Boolean   @default(true)
serviceRequestVisualFlash       Boolean   @default(false)
serviceRequestResponseWarning   Int       @default(5)
serviceRequestAutoArchive       Int       @default(30)
serviceRequestAutoPriorityVIP   Boolean   @default(true)
serviceRequestAutoPriorityMaster Boolean  @default(false)
```

**New Model Needed** - ShiftTemplate:
```prisma
model ShiftTemplate {
  id           String   @id @default(cuid())
  name         String
  startTime    String
  endTime      String
  primaryCount Int
  backupCount  Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## 9. ARCHITECTURE RECOMMENDATIONS

### Unified Settings Strategy

**User's Requirements**:
1. Settings must stay in their original locations (buried in pages)
2. Settings dialogs must call the same backend APIs
3. Functionality over appearance
4. No duplicate code/functionality
5. All settings must use backend (no localStorage for preferences)

**Proposed Architecture**:

1. **Expand UserPreferences Backend API**
   - Add all Service Requests settings fields to database
   - Create granular PUT endpoints for each settings category
   - Keep existing dashboard/theme/notifications endpoints

2. **Create Shift Configuration API**
   - New routes: GET/POST/PUT/DELETE /api/shift-templates
   - Store shift configurations in database
   - Used by both Duty Roster and Settings page

3. **Fix Notification Settings Integration**
   - Connect main Settings page to /api/notification-settings
   - Ensure push notification settings are saved/loaded correctly
   - Consolidate with email notification settings

4. **Migrate Service Requests Dialog**
   - Remove ALL localStorage usage
   - Use useUserPreferences hook with expanded fields
   - Keep dialog in Service Requests page (as requested)
   - Ensure settings sync across all pages

5. **Remove All Hardcoded Values**
   - Service Requests: Use auth context for current user
   - Service Requests: Load preferences from backend
   - Any other hardcoded configs should use backend

### API Endpoint Organization

**Current**:
- /api/user-preferences (dashboard, theme, email notifications)
- /api/notification-settings (push notifications)
- /api/yacht-settings (vessel-wide)
- /api/system-settings (system config)

**Expanded**:
- /api/user-preferences/service-requests (new - SR-specific settings)
- /api/shift-templates (new - shift configurations)

**Or Alternative** (RESTful):
- Expand PUT /api/user-preferences to accept all new fields
- Use partial updates (only send changed fields)

---

## 10. NEXT STEPS

1. Review this inventory with user
2. Confirm proposed architecture aligns with requirements
3. Create migration plan for localStorage → Backend
4. Implement database schema changes
5. Create/expand backend API endpoints
6. Update React Query hooks
7. Migrate Service Requests settings dialog
8. Remove hardcoded values
9. Connect notification settings in main Settings page
10. Test cross-device/platform synchronization

---

**Document Purpose**: This inventory serves as the foundation for all settings-related work. No changes should be made until this document is reviewed and approved to ensure we don't duplicate existing functionality or break working features.
