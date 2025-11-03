# OBEDIO API MASTER REFERENCE
**Living Document - Updated: 2025-11-04 (Service Requests: Finish/Delegate/Forward Fixes)**
**Project**: Luxury Minimal Web App Design (Obedio Yacht Crew Management)

---

## 📋 TABLE OF CONTENTS

1. [How to Use This Document](#how-to-use-this-document)
2. [Backend API Endpoints (Complete List)](#backend-api-endpoints)
3. [Frontend API Services](#frontend-api-services)
4. [Component-to-API Mapping (What You Can See!)](#component-to-api-mapping)
5. [Authentication & Permissions](#authentication--permissions)
6. [WebSocket Events](#websocket-events)
7. [How to Update This Document](#how-to-update-this-document)

---

## 🎯 HOW TO USE THIS DOCUMENT

**THIS IS YOUR SAFETY NET TO PREVENT DUPLICATE APIs!**

### Before Creating ANY New API:
1. **Search this document** for the feature you need (Ctrl+F)
2. **Check if an endpoint already exists** in the Backend API section
3. **Check which frontend components already use it** in the Mapping section
4. **If it exists**: Use the existing API! Update if needed, but don't create duplicates
5. **If it doesn't exist**: Document it here immediately after creating it

### What You Can Verify (Frontend):
- Open the **page components** listed in Section 4 (Component-to-API Mapping)
- See which APIs each page calls
- Verify functionality by testing in the browser
- All pages are in `src/components/pages/`

---

## 🔌 BACKEND API ENDPOINTS

**Base URL**: `http://localhost:8080/api`
**Auth**: HTTP-only cookies (`obedio-auth-token`)

### 1. AUTHENTICATION API
**File**: `backend/src/routes/auth.ts`
**Base Path**: `/api/auth`

| Endpoint | Method | Auth Required | Description | Request Body | Response |
|----------|--------|---------------|-------------|--------------|----------|
| `/login` | POST | ❌ No | Login with username/password | `{ username, password }` | `{ user, token }` |
| `/refresh` | POST | ❌ No | Refresh JWT token | `{ refreshToken }` | `{ token, user }` |
| `/verify` | GET | ✅ Bearer | Verify JWT token validity | None | `{ valid, user }` |
| `/logout` | POST | ❌ No | Logout (clear cookie) | None | `{ message }` |

**Details**:
- JWT expiry: 7 days
- HTTP-only cookie: `obedio-auth-token`
- Password hashing: bcryptjs
- Supports both username and email login

---

### 2. GUESTS API
**File**: `backend/src/routes/guests.ts`
**Base Path**: `/api/guests`
**Permissions**: `guests.view`, `guests.create`, `guests.update`, `guests.delete`

| Endpoint | Method | Permission | Description | Query Params | Request Body |
|----------|--------|------------|-------------|--------------|--------------|
| `/` | GET | `guests.view` | List all guests with filters & pagination | `q`, `status`, `type`, `diet`, `allergy`, `cabin`, `vip`, `page`, `limit`, `sort` | None |
| `/stats` | GET | `guests.view` | Get guest statistics (onboard, expected, VIP, dietary alerts) | None | None |
| `/meta` | GET | `guests.view` | Get filter metadata (statuses, types, allergies, diets, cabins) | None | None |
| `/` | POST | `guests.create` | Create new guest | None | `GuestDTO` |
| `/:id` | GET | `guests.view` | Get single guest by ID (includes service requests) | None | None |
| `/:id` | PUT | `guests.update` | Update guest | None | `Partial<GuestDTO>` |
| `/:id` | DELETE | `guests.delete` | Delete guest | None | None |

**Pagination**: Returns `{ data, pagination: { total, page, limit, totalPages } }`
**WebSocket Events**: `guest:created`, `guest:updated`, `guest:deleted`
**Used By**: `guests-list.tsx`, `guest-form-dialog.tsx`, `guest-details-dialog.tsx`, `GuestsContext.tsx`

---

### 3. SERVICE REQUESTS API
**File**: `backend/src/routes/service-requests.ts`
**Base Path**: `/api/service-requests`
**Permissions**: `service-requests.view`, `service-requests.create`, `service-requests.accept`, `service-requests.complete`, `service-requests.delete`

| Endpoint | Method | Permission | Description | Query Params | Request Body |
|----------|--------|------------|-------------|--------------|--------------|
| `/` | GET | `service-requests.view` | List service requests with filters & pagination | `status`, `priority`, `page`, `limit` | None |
| `/` | POST | `service-requests.create` | Create new service request | None | `ServiceRequestDTO` |
| `/:id/accept` | PUT | `service-requests.accept` | Assign request to crew member | None | `{ crewMemberId }` |
| `/:id/complete` | PUT | `service-requests.complete` | Mark request as completed | None | None |
| `/clear-all` | DELETE | `service-requests.delete` | **Delete ALL service requests** (clears database) | None | None |

**Pagination**: Returns `{ items, page, limit, total, totalPages }`
**WebSocket Events**: `service-request:created`, `service-request:assigned`, `service-request:completed`, `service-request:status-changed`
**Used By**: `service-requests.tsx`, `ServiceRequestsContext.tsx`

**⚠️ IMPORTANT - Status Mapping**:
- Backend returns: `"IN_PROGRESS"` (with underscore, uppercase)
- Frontend maps: `in_progress` → `accepted` (after `.toLowerCase()`)
- Mapping also supports: `in-progress` (dash version for compatibility)
- **Bug Fixed 2025-11-03**: Added `in_progress` mapping to fix "Serving Now" widget not showing accepted requests

---

### 4. CREW MANAGEMENT API
**File**: `backend/src/routes/crew.ts`
**Base Path**: `/api/crew`
**Permissions**: None (all routes require auth only)

| Endpoint | Method | Permission | Description | Request Body | Response |
|----------|--------|------------|-------------|--------------|----------|
| `/` | GET | Auth only | Get all crew members (includes linked user accounts) | None | `CrewMemberDTO[]` |
| `/` | POST | Auth only | Create new crew member **+ auto-generate login credentials** | `{ name, position, department, status, email, role, ... }` | `{ ...crewMember, credentials: { username, password, message } }` |
| `/:id` | PUT | Auth only | Update crew member (status changes broadcast via WebSocket) | `Partial<CrewMemberDTO>` | `CrewMemberDTO` |
| `/:id` | DELETE | Auth only | Delete crew member | None | `{ deleted: true, id }` |

**Special Features**:
- **Auto-generates username and password** when creating crew (returned once in response!)
- Automatically creates User account linked to CrewMember
- Username format: `nickname` or `firstName.lastName` + number if duplicate
- WebSocket broadcast on status changes (on-duty, off-duty, on-leave)

**WebSocket Events**: `crew:status-changed`
**Used By**: `crew-management.tsx`, `crew-list.tsx`

---

### 5. DEVICES API
**File**: `backend/src/routes/devices.ts`
**Base Path**: `/api/devices`
**Permissions**: `devices.view`, `devices.add`, `devices.edit`, `devices.delete`

| Endpoint | Method | Permission | Description | Query Params | Request Body |
|----------|--------|------------|-------------|--------------|--------------|
| `/` | GET | `devices.view` | List all devices with filters | `type`, `status`, `locationId`, `crewMemberId` | None |
| `/logs` | GET | `devices.view` | Get all device logs with filters & pagination | `deviceId`, `status`, `startDate`, `endDate`, `search`, `page`, `limit`, `eventType` | None |
| `/stats/summary` | GET | `devices.view` | Get device statistics (total, online, offline, low battery, by type) | None | None |
| `/:id` | GET | `devices.view` | Get single device (includes location, crew, last 50 logs) | None | None |
| `/` | POST | `devices.add` | Create new device | None | `DeviceDTO` |
| `/:id` | PUT | `devices.edit` | Update device (broadcasts status changes) | None | `Partial<DeviceDTO>` |
| `/:id` | DELETE | `devices.delete` | Delete device | None | None |
| `/:id/config` | GET | `devices.view` | Get device configuration | None | None |
| `/:id/config` | PUT | `devices.edit` | Update device config and name | None | `{ config, name }` |
| `/:id/test` | POST | `devices.edit` | Send test signal to device (LED blink, beep) | None | None |
| `/:id/logs` | GET | `devices.view` | Get logs for specific device (last 100) | `limit`, `eventType` | None |

**Log Transformation**: Backend transforms logs before sending (includes device name, location, formatted message)
**MQTT Integration**: Test signal sends MQTT command to smart buttons
**WebSocket Events**: `device:created`, `device:updated`, `device:status-changed`
**Used By**: `device-manager.tsx`, `device-manager-full.tsx`

---

### 6. LOCATIONS API
**File**: `backend/src/routes/locations.ts`
**Base Path**: `/api/locations`
**Auth**: ✅ `authMiddleware` (server.ts:141)
**Permissions**: `locations.view`, `locations.create`, `locations.update`, `locations.delete`

| Endpoint | Method | Permission | Description | Request Body |
|----------|--------|------------|-------------|--------------|
| `/` | GET | `locations.view` | Get all locations (ordered by name) | None |
| `/:id` | GET | `locations.view` | Get single location (includes guests, service requests) | None |
| `/` | POST | `locations.create` | Create new location | `{ name, type, floor, description, image, smartButtonId, doNotDisturb }` |
| `/:id` | PUT | `locations.update` | Update location | `Partial<LocationDTO>` |
| `/:id` | DELETE | `locations.delete` | Delete location (prevents if guests/requests assigned) | None |
| `/:id/toggle-dnd` | POST | `locations.view` | Toggle Do Not Disturb for location | `{ enabled }` |
| `/dnd/active` | GET | `locations.view` | Get all locations with DND enabled | None |

**WebSocket Events**: `location:created`, `location:updated`, `location:deleted`, `location:dnd-toggled`
**Used By**: `locations.tsx`, `GuestsContext.tsx`
**Fixed**: 2025-11-03 - Added missing authMiddleware to enable authentication

---

### 7. DUTY ROSTER - SHIFTS API
**File**: `backend/src/routes/shifts.ts`
**Base Path**: `/api/shifts`
**Permissions**: Auth only

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/` | GET | Get all shifts (ordered by `order` field, includes assignment count) | None |
| `/active` | GET | Get only active shifts | None |
| `/:id` | GET | Get single shift (includes last 10 assignments) | None |
| `/` | POST | Create new shift | `{ name, startTime, endTime, order, primaryCount, backupCount, isActive }` |
| `/:id` | PUT | Update shift | `Partial<ShiftDTO>` |
| `/:id` | DELETE | Delete shift (cascades to assignments) | None |
| `/:id/toggle-active` | POST | Toggle shift active status | `{ isActive }` |
| `/reorder` | POST | Update order of multiple shifts (transaction) | `{ shifts: [{ id, order }, ...] }` |

**WebSocket Events**: `shift:created`, `shift:updated`, `shift:deleted`
**Used By**: `duty-roster-tab.tsx`

---

### 8. DUTY ROSTER - ASSIGNMENTS API
**File**: `backend/src/routes/assignments.ts`
**Base Path**: `/api/assignments`
**Permissions**: Auth only

| Endpoint | Method | Description | Query Params | Request Body |
|----------|--------|-------------|--------------|--------------|
| `/` | GET | Get all assignments with filters | `date`, `shiftId`, `crewMemberId`, `type`, `startDate`, `endDate` | None |
| `/by-date/:date` | GET | Get all assignments for specific date | None | None |
| `/by-week/:startDate` | GET | Get all assignments for week (7 days) | None | None |
| `/crew/:crewMemberId` | GET | Get assignments for crew member | `startDate`, `endDate` | None |
| `/:id` | GET | Get single assignment | None | None |
| `/` | POST | Create new assignment (checks for duplicates) | None | `{ date, shiftId, crewMemberId, type, notes }` |
| `/bulk` | POST | Create multiple assignments (skips duplicates) | None | `{ assignments: [...] }` |
| `/:id` | PUT | Update assignment | None | `Partial<AssignmentDTO>` |
| `/:id` | DELETE | Delete single assignment | None | None |
| `/by-date/:date` | DELETE | Delete all assignments for date | None | None |
| `/crew/:crewMemberId` | DELETE | Delete all assignments for crew member | `startDate`, `endDate` | None |

**WebSocket Events**: `assignment:created`, `assignment:updated`, `assignment:deleted`
**Used By**: `duty-roster-tab.tsx`

---

### 9. YACHT SETTINGS API
**File**: `backend/src/routes/yacht-settings.ts`
**Base Path**: `/api/yacht-settings`
**Permissions**: Auth only

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/` | GET | Get yacht settings (creates default if not exists) | None |
| `/` | PUT | Update yacht settings (broadcasts via WebSocket) | `{ name, type, timezone, floors, dateFormat, timeFormat, weatherUnits, windSpeedUnits, weatherUpdateInterval, latitude, longitude, accuracy, locationName, locationUpdatedAt }` |

**Default Values**:
- name: "M/Y Serenity"
- type: "motor"
- timezone: "Europe/Monaco"
- floors: ["Lower Deck", "Main Deck", "Upper Deck", "Sun Deck"]

**WebSocket Events**: `settings:updated`
**Used By**: `settings.tsx`, `useYachtSettingsApi.ts`

---

### 10. USER PREFERENCES API
**File**: `backend/src/routes/user-preferences.ts`
**Base Path**: `/api/user-preferences`
**Permissions**: Auth only (user-specific)

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/` | GET | Get current user's preferences (returns defaults if not exists) | None |
| `/dashboard` | PUT | Update dashboard layout and active widgets | `{ dashboardLayout, activeWidgets }` |
| `/dashboard` | DELETE | Reset dashboard to defaults | None |
| `/theme` | PUT | Update theme preference | `{ theme: 'light' \| 'dark' \| 'auto' }` |
| `/notifications` | PUT | Update notification preferences | `{ emailNotifications, notificationEmail, emergencyContacts }` |
| `/service-requests` | PUT | **Update Service Requests settings** (12 fields) | `{ serviceRequestDisplayMode, serviceRequestViewStyle, serviceRequestSortOrder, serviceRequestShowGuestPhotos, serviceRequestServingTimeout, serviceRequestSoundAlerts, serviceRequestVisualFlash, serviceRequestResponseWarning, serviceRequestAutoArchive, serviceRequestAutoPriorityVIP, serviceRequestAutoPriorityMaster, requestDialogRepeatInterval }` |

**Service Requests Settings Fields**:
- `serviceRequestDisplayMode`: "location" \| "category" \| "list"
- `serviceRequestViewStyle`: "compact" \| "expanded"
- `serviceRequestSortOrder`: "newest" \| "oldest" \| "priority"
- `serviceRequestShowGuestPhotos`: boolean
- `serviceRequestServingTimeout`: number (minutes)
- `serviceRequestSoundAlerts`: boolean
- `serviceRequestVisualFlash`: boolean
- `serviceRequestResponseWarning`: number (minutes)
- `serviceRequestAutoArchive`: number (days)
- `serviceRequestAutoPriorityVIP`: boolean
- `serviceRequestAutoPriorityMaster`: boolean
- `requestDialogRepeatInterval`: number (seconds)

**Used By**: `settings.tsx`, `service-requests-settings-dialog.tsx`

---

### 11. DASHBOARD LAYOUT API
**File**: `backend/src/routes/dashboard.ts`
**Base Path**: `/api/dashboard`
**Permissions**: Auth only

| Endpoint | Method | Permission | Description | Request Body |
|----------|--------|------------|-------------|--------------|
| `/layout` | GET | Auth only | Get user's dashboard layout (creates default if not exists) | None |
| `/layout` | PUT | Auth only | Save dashboard layout and active widgets (validated with Zod) | `{ layouts, activeWidgets }` |
| `/reset` | POST | Auth only | Reset dashboard to role-based defaults | None |
| `/defaults/:role` | GET | `settings.manage` | Get default layout for specific role (admin only) | None |

**Role-Based Defaults**:
- **Admin/Chief-Stewardess**: weather, clock, guestStatus, serviceRequests, dndStatus, crewStatus
- **Stewardess/Crew**: weather, clock, guestStatus, serviceRequests, dndStatus
- **ETO**: + deviceStatus widget

**Used By**: `dashboard.tsx`

---

### 12. ACTIVITY LOGS API
**File**: `backend/src/routes/activity-logs.ts`
**Base Path**: `/api/activity-logs`

| Endpoint | Method | Description | Query Params | Request Body |
|----------|--------|-------------|--------------|--------------|
| `/` | GET | Get activity logs with filters & pagination | `type`, `userId`, `startDate`, `endDate`, `page`, `limit` | None |
| `/` | POST | Create activity log entry | None | `{ type, userId, action, details }` |

**Used By**: `activity-log.tsx`

---

### 13. SERVICE CATEGORIES API
**File**: `backend/src/routes/service-categories.ts`
**Base Path**: `/api/service-categories`

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/` | GET | Get all service categories (ordered by `order` field) | None |
| `/` | POST | Create new category | `{ name, icon, color, description, order, isActive }` |
| `/:id` | PUT | Update category | `Partial<CategoryDTO>` |
| `/:id` | DELETE | Delete category | None |
| `/reorder` | PUT | Reorder categories | `{ categories: [{ id, order }, ...] }` |

**Used By**: Service requests components for categorization

---

### 14. SERVICE REQUEST HISTORY API
**File**: `backend/src/routes/service-request-history.ts`
**Base Path**: `/api/service-request-history`

| Endpoint | Method | Description | Query Params |
|----------|--------|-------------|--------------|
| `/` | GET | Get service request history with pagination | `page`, `limit` |
| `/` | POST | Create history entry | `ServiceRequestHistoryDTO` |
| `/request/:id` | GET | Get history for specific request | None |
| `/completed` | GET | Get completed request history | None |

**Used By**: Historical tracking and analytics

---

### 15. CREW CHANGE LOGS API
**File**: `backend/src/routes/crew-change-logs.ts`
**Base Path**: `/api/crew-change-logs`

| Endpoint | Method | Description | Query Params | Request Body |
|----------|--------|-------------|--------------|--------------|
| `/` | GET | Get crew change logs with pagination | `page`, `limit` | None |
| `/` | POST | Create change log entry | None | `CrewChangeLogDTO` |
| `/crew/:id` | GET | Get change logs for specific crew member | None | None |
| `/bulk` | POST | Create multiple change log entries | None | `{ logs: [...] }` |
| `/recent` | GET | Get recent change logs | None | None |

**Used By**: Audit trail for crew roster changes

---

### 16. MESSAGES API
**File**: `backend/src/routes/messages.ts`
**Base Path**: `/api/messages`

| Endpoint | Method | Description | Query Params | Request Body |
|----------|--------|-------------|--------------|--------------|
| `/` | GET | Get user's messages with pagination | `page`, `limit` | None |
| `/conversation/:id` | GET | Get conversation messages | None | None |
| `/` | POST | Send new message | None | `{ recipientId, subject, content }` |
| `/:id/read` | PUT | Mark message as read | None | None |
| `/mark-all-read` | PUT | Mark all messages as read | None | None |
| `/:id` | DELETE | Delete message | None | None |
| `/unread-count` | GET | Get unread message count | None | None |

**WebSocket Events**: `message:new_message`, `message:broadcast_message`
**Used By**: Inter-crew messaging system

---

### 17. DEVICE DISCOVERY API (ESP32 Pairing)
**File**: `backend/src/routes/device-discovery.ts`
**Base Path**: `/api/device-discovery`

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/discover` | POST | Start ESP32 device discovery process | None |
| `/pairing` | GET | Get devices in pairing mode | None |
| `/pair/:id` | POST | Pair discovered device | `{ name, locationId, config }` |
| `/pairing/:id` | DELETE | Remove device from pairing list | None |
| `/simulate-announce` | POST | Simulate ESP32 announce (testing) | `{ deviceId, macAddress, ipAddress }` |

**WebSocket Events**: `device:discovered`, `device:paired`
**Used By**: `device-manager.tsx`, ESP32 smart button setup

---

### 18. SMART BUTTONS API (MQTT)
**File**: `backend/src/routes/smart-buttons.ts`
**Base Path**: `/api/smart-buttons`

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/press` | POST | Simulate button press (testing) | `{ deviceId, buttonType }` |
| `/status/:id` | POST | Update button status | `{ status, batteryLevel }` |
| `/telemetry/:id` | POST | Send telemetry data | `{ ...telemetryData }` |
| `/test/:id` | POST | Send test signal to button | None |
| `/mqtt-status` | GET | Get MQTT broker status | None |

**MQTT Topics**:
- `obedio/button/+/press`
- `obedio/button/+/status`
- `obedio/device/register`
- `obedio/device/heartbeat`

**Used By**: `button-simulator.tsx`, ESP32 firmware integration

---

### 19. ROLE PERMISSIONS API
**File**: `backend/src/routes/role-permissions.ts`
**Base Path**: `/api/role-permissions`

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/roles/:role` | GET | Get permissions for specific role | None |
| `/roles` | GET | Get all role definitions | None |
| `/:id/config` | PUT | Update role permissions | `{ permissions: [...] }` |
| `/roles/:role/reset` | POST | Reset role to default permissions | None |

**Roles**:
- `admin`: Full access (all permissions)
- `chief-stewardess`: service-requests, guests, crew, devices, system.view-logs
- `stewardess`: service-requests (view/accept/complete), guests.view
- `eto`: devices.*, system.view-logs
- `crew`: service-requests.view, guests.view

**Used By**: Permission management system

---

### 20. SETTINGS & SYSTEM APIs

**File**: `backend/src/routes/settings.ts`
- `GET /api/settings/all` - Get all system settings
- `GET /api/settings/system-status` - Get system health status

**File**: `backend/src/routes/system-settings.ts`
- System-wide configuration management

**File**: `backend/src/routes/notification-settings.ts`
- Notification configuration

**File**: `backend/src/routes/upload.ts`
- File upload handling (images, avatars, documents)

**File**: `backend/src/routes/transcribe.ts`
- Audio transcription for voice service requests

**File**: `backend/src/routes/backup.ts`
- Database backup and restore operations

---

## 🎨 FRONTEND API SERVICES

### Frontend Architecture Overview
**3-Layer Pattern**:
1. **Base API Client** (`src/services/api.ts`) - Generic fetch wrapper with auth
2. **React Query Hooks** (`src/hooks/use*Api.ts`) - Specialized data fetching with caching
3. **Context Providers** (`src/contexts/`) - Global state + WebSocket sync

---

### Frontend API Services

#### 1. Base API Client
**File**: `src/services/api.ts`
**Purpose**: Centralized fetch wrapper with automatic auth (HTTP-only cookies)

**Exports**:
- `crewApi`: CRUD operations for crew members
- `guestsApi`: CRUD operations for guests (uses `src/hooks/useGuestsApi.ts`)
- `api.serviceRequests`: Service request operations
- All API calls use `credentials: 'include'` for cookie-based auth

---

#### 2. Guests API Hook
**File**: `src/hooks/useGuestsApi.ts`
**Query Key**: `['guests-api']`

**Exports**:
```typescript
useGuestsApi() => {
  guests: Guest[],
  isLoading: boolean,
  error: any,
  refetch: () => void,
  createGuest: (data) => void,
  updateGuest: (id, data) => void,
  deleteGuest: (id) => void,
  isCreating: boolean,
  isUpdating: boolean,
  isDeleting: boolean
}
```

**Used By**: `GuestsContext.tsx`, `guests-list.tsx`, `guest-form-dialog.tsx`

---

#### 3. Service Requests API Hook
**File**: `src/hooks/useServiceRequestsApi.ts`
**Query Key**: `['service-requests-api']`

**Exports**:
```typescript
useServiceRequestsApi() => {
  serviceRequests: ServiceRequest[],
  isLoading: boolean,
  isError: boolean,
  error: any,
  refetch: () => void
}

useCreateServiceRequest() => mutation
useUpdateServiceRequest() => mutation
useAcceptServiceRequest() => mutation
useCompleteServiceRequest() => mutation
useCancelServiceRequest() => mutation
```

**API Methods** (via `src/services/api.ts`):
```typescript
api.serviceRequests.clearAll() => Promise<{ message: string }>
```

**Special Features**:
- **Backend-to-Frontend transformation**: Maps `ServiceRequestDTO` to `ServiceRequest`
- **Status mapping**: `in-progress` → `accepted`, `in_progress` → `accepted`, `cancelled` → `completed`
- **Bug Fixed 2025-11-03**: Added `in_progress` (underscore) to status mapping
- Auto-refresh every 60 seconds
- Stale time: 30 seconds

**Used By**: `ServiceRequestsContext.tsx`, `service-requests.tsx`

---

#### 4. Yacht Settings API Hook
**File**: `src/hooks/useYachtSettingsApi.ts`

**Exports**:
```typescript
useYachtSettingsApi() => {
  settings: YachtSettingsData | null,
  isLoading: boolean,
  error: string | null,
  updateSettings: (data) => Promise<YachtSettingsData>,
  refetch: () => void
}
```

**Field Mapping** (Frontend ↔ Backend):
- `vesselName` ↔ `name`
- `vesselType` ↔ `type`
- `timezone` ↔ `timezone`
- `floors` ↔ `floors`

**Used By**: `settings.tsx`

---

#### 5. Service Request History API Hook
**File**: `src/hooks/useServiceRequestHistoryApi.ts`

**Exports**: History tracking hooks for completed service requests
**Used By**: Analytics and reporting features

---

#### 6. Crew Change Logs API Hook
**File**: `src/hooks/useCrewChangeLogsApi.ts`

**Exports**: Audit trail hooks for crew roster modifications
**Used By**: Crew management audit features

---

### Frontend Service Files

#### 7. Guests Service
**File**: `src/services/guests.ts`
**Purpose**: Server-side filtering, pagination, and CSV export

**Exports**:
```typescript
GuestsService.list(params: GuestListParams) => Promise<GuestListResponse>
GuestsService.stats() => Promise<GuestStatsResponse>
GuestsService.meta() => Promise<GuestMetaResponse>
GuestsService.create(data) => Promise<Guest>
GuestsService.update(id, data) => Promise<Guest>
GuestsService.delete(id) => Promise<void>
GuestsService.get(id) => Promise<Guest | undefined>
GuestsService.exportToCsv(guests) => string
```

**Used By**: `guests-list.tsx` (for server-side operations)

---

#### 8. Locations Service
**File**: `src/services/locations.ts`
**Purpose**: Location and DND management

**Used By**: Location management components

---

#### 9. Auth Service
**File**: `src/services/auth.ts`
**Purpose**: Authentication and session management

**Used By**: `login.tsx`, `AuthContext.tsx`

---

#### 10. WebSocket Service
**File**: `src/services/websocket.ts`
**Purpose**: Real-time event subscriptions

**Events Handled**:
- `guest:created`, `guest:updated`, `guest:deleted`
- `service-request:created`, `service-request:assigned`, `service-request:completed`, `service-request:status-changed`
- `crew:status-changed`
- `device:created`, `device:updated`, `device:status-changed`
- `location:created`, `location:updated`, `location:deleted`, `location:dnd-toggled`
- `shift:created`, `shift:updated`, `shift:deleted`
- `assignment:created`, `assignment:updated`, `assignment:deleted`
- `settings:updated`
- `message:new_message`

**Used By**: All contexts and real-time components

---

## 📱 COMPONENT-TO-API MAPPING
**What You Can See in the Browser!**

All page components are in: `src/components/pages/`

### 1. LOGIN PAGE
**File**: `src/components/pages/login.tsx`
**APIs Used**:
- `POST /api/auth/login` - User authentication
**Features**:
- Username/password login
- HTTP-only cookie authentication
- Redirects to dashboard on success

---

### 2. DASHBOARD
**File**: `src/components/pages/dashboard.tsx`
**APIs Used**:
- `GET /api/dashboard/layout` - Load user's dashboard layout
- `PUT /api/dashboard/layout` - Save layout changes
- `POST /api/dashboard/reset` - Reset to defaults
**Features**:
- Draggable widget grid (react-grid-layout)
- Role-based default layouts
- Real-time widget updates via WebSocket

**Widgets Available**:
- Weather
- Clock
- Guest Status
- Service Requests
- DND Status
- Crew Status (admin/chief-stewardess only)
- Device Status (admin/eto only)

---

### 3. GUESTS LIST PAGE
**File**: `src/components/pages/guests-list.tsx`
**APIs Used**:
- `GET /api/guests` - List guests with filters & pagination
- `GET /api/guests/stats` - Guest statistics (onboard, expected, VIP, dietary alerts)
- `GET /api/guests/meta` - Filter metadata
- `POST /api/guests` - Create new guest
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest
- `POST /api/locations/:id/toggle-dnd` - Toggle guest DND

**Features You Can See**:
- Guest list table with photos
- Filter by status, type, VIP, allergies, dietary restrictions, cabin
- Search by name, nationality, notes
- Sort by name, check-in date
- Pagination (25/50/100 per page)
- Guest statistics cards (onboard, expected, VIP, dietary alerts)
- DND alert widget at top (shows guests with DND enabled)
- Bulk export to CSV
- Real-time updates via WebSocket

**Backend Calls** (in order):
1. On page load: Fetch guests, stats, meta in parallel
2. On filter change: Re-fetch guests with new query params
3. On guest create: POST → invalidate queries → re-fetch
4. On guest update: PUT → WebSocket broadcast → auto-refresh
5. On WebSocket event: Invalidate queries → re-fetch

---

### 4. SERVICE REQUESTS PAGE
**File**: `src/components/pages/service-requests.tsx`
**APIs Used**:
- `GET /api/service-requests` - List service requests
- `POST /api/service-requests` - Create new request
- `PUT /api/service-requests/:id/accept` - Assign to crew member
- `PUT /api/service-requests/:id/complete` - Mark completed
- `DELETE /api/service-requests/clear-all` - **Clear all requests** (delete everything)
- `GET /api/user-preferences` - Load Service Requests settings
- `PUT /api/user-preferences/service-requests` - Save settings

**Features You Can See**:
- Service request cards grouped by location/category
- View modes: Location-based, Category-based, List view
- Request status: Pending, Accepted, Serving, Completed
- Guest photos (if enabled in settings)
- Timer for serving timeout
- Sound alerts on new requests
- **"Clear All Requests" button** - Deletes all service requests with confirmation dialog
- Settings dialog with 12 configurable options
- Real-time updates via WebSocket

**Settings Available** (12 fields):
1. Display mode (location/category/list)
2. View style (compact/expanded)
3. Sort order (newest/oldest/priority)
4. Show guest photos (yes/no)
5. Serving timeout (minutes)
6. Sound alerts (yes/no)
7. Visual flash (yes/no)
8. Response warning (minutes)
9. Auto-archive (days)
10. Auto-priority VIP (yes/no)
11. Auto-priority master cabin (yes/no)
12. Dialog repeat interval (seconds)

**⚠️ Bug Fixed 2025-11-03**:
- **Problem**: Accepted service requests not appearing in "Serving Now" widget
- **Root Cause**: Backend returns `IN_PROGRESS` (underscore), frontend mapping only had `in-progress` (dash)
- **Fix**: Added `in_progress` key to status mapping in `useServiceRequestsApi.ts`
- **Result**: Now correctly maps both `in-progress` and `in_progress` to `accepted` status

---

### 5. CREW MANAGEMENT PAGE
**File**: `src/components/pages/crew-management.tsx` and `crew-list.tsx`
**APIs Used**:
- `GET /api/crew` - List all crew members
- `POST /api/crew` - Create new crew member (gets auto-generated credentials!)
- `PUT /api/crew/:id` - Update crew member
- `DELETE /api/crew/:id` - Delete crew member

**Features You Can See**:
- Crew list with avatars
- Status badges (active, on-duty, off-duty, on-leave)
- Position and department labels
- Create crew dialog (automatically generates username & password)
- **Credentials Display**: When creating crew, shows generated username/password ONCE!
- Edit crew details
- Real-time status updates via WebSocket

**Important**: Crew creation automatically creates a User account for login!

---

### 6. DEVICE MANAGER PAGE
**File**: `src/components/pages/device-manager.tsx` and `device-manager-full.tsx`
**APIs Used**:
- `GET /api/devices` - List all devices
- `GET /api/devices/logs` - Device event logs with pagination
- `GET /api/devices/stats/summary` - Device statistics
- `POST /api/devices` - Add new device
- `PUT /api/devices/:id` - Update device
- `PUT /api/devices/:id/config` - Update device configuration
- `POST /api/devices/:id/test` - Send test signal
- `GET /api/devices/:id/logs` - Get logs for specific device
- `POST /api/device-discovery/discover` - Start ESP32 discovery
- `POST /api/device-discovery/pair/:id` - Pair discovered device

**Features You Can See**:
- Device list with status indicators (online/offline/low battery)
- Device statistics cards
- Event logs with filtering
- Test button (makes device blink/beep)
- Configuration editor
- ESP32 device pairing flow
- Real-time status updates via WebSocket & MQTT

---

### 7. LOCATIONS PAGE
**File**: `src/components/pages/locations.tsx`
**APIs Used**:
- `GET /api/locations` - List all locations
- `POST /api/locations` - Create new location
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location
- `POST /api/locations/:id/toggle-dnd` - Toggle Do Not Disturb
- `GET /api/locations/dnd/active` - Get DND locations

**Features You Can See**:
- Location cards with images
- Floor grouping (Lower Deck, Main Deck, Upper Deck, Sun Deck)
- Type badges (cabin, common, service, exterior)
- Smart button assignment
- DND toggle switches
- Real-time DND updates via WebSocket

---

### 8. DUTY ROSTER PAGE
**File**: `src/components/pages/duty-roster-tab.tsx`
**APIs Used**:
- `GET /api/shifts` - Get all shifts
- `GET /api/shifts/active` - Get active shifts only
- `POST /api/shifts` - Create new shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift
- `POST /api/shifts/reorder` - Reorder shifts
- `GET /api/assignments` - Get assignments with filters
- `GET /api/assignments/by-date/:date` - Get assignments for date
- `GET /api/assignments/by-week/:startDate` - Get week assignments
- `POST /api/assignments` - Create assignment
- `POST /api/assignments/bulk` - Create multiple assignments
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

**Features You Can See**:
- Weekly calendar grid
- Shift rows (Morning, Day, Evening, Night)
- Crew assignments (primary & backup)
- Drag-and-drop assignment
- Bulk assignment creation
- Print roster
- Real-time updates via WebSocket

---

### 9. SETTINGS PAGE
**File**: `src/components/pages/settings.tsx`
**APIs Used**:
- `GET /api/yacht-settings` - Load yacht settings
- `PUT /api/yacht-settings` - Update yacht settings
- `GET /api/user-preferences` - Load user preferences
- `PUT /api/user-preferences/theme` - Update theme
- `PUT /api/user-preferences/notifications` - Update notifications
- `PUT /api/user-preferences/service-requests` - Update Service Requests settings (12 fields)
- `POST /api/dashboard/reset` - Reset dashboard

**Features You Can See**:
- Yacht Settings section:
  - Vessel name
  - Vessel type
  - Timezone
  - Floors/decks
  - Date/time formats
  - Weather units
  - GPS location
- User Preferences section:
  - Theme (light/dark/auto)
  - Notifications
  - Emergency contacts
- Dashboard Settings:
  - Reset to defaults button
- Service Requests Settings:
  - 12 configurable options (opens dialog)

**Note**: Service Requests settings were recently migrated from localStorage to backend API!

---

### 10. ACTIVITY LOG PAGE
**File**: `src/components/pages/activity-log.tsx`
**APIs Used**:
- `GET /api/activity-logs` - Get activity logs with pagination
- `GET /api/devices/logs` - Device-specific logs

**Features You Can See**:
- Activity log table
- Filter by type, user, date range
- Pagination
- Search functionality

---

### 11. BUTTON SIMULATOR PAGE
**File**: `src/components/pages/button-simulator.tsx`
**APIs Used**:
- `POST /api/smart-buttons/press` - Simulate button press
- `GET /api/smart-buttons/mqtt-status` - MQTT broker status

**Features You Can See**:
- Visual button grid matching yacht layout
- Click to simulate button press
- MQTT status indicator
- Real-time service request creation

---

## 🔐 AUTHENTICATION & PERMISSIONS

### Authentication Method
- **Type**: JWT + HTTP-only Cookies
- **Cookie Name**: `obedio-auth-token`
- **Expiry**: 7 days
- **Security**: httpOnly, sameSite: 'lax', secure in production
- **Password Hashing**: bcryptjs

### Middleware Chain
```
Request → authMiddleware → requirePermission → Route Handler
```

1. **authMiddleware** (`backend/src/middleware/auth.ts:14-55`):
   - Checks HTTP-only cookie OR Authorization header
   - Verifies JWT token
   - Sets `req.user` with decoded token data

2. **requirePermission** (`backend/src/middleware/auth.ts:57-115`):
   - Checks if `req.user` exists (authentication)
   - Checks if user role has required permission (authorization)
   - Admin role has all permissions

### Permission System
**Permissions**:
- `guests.create`, `guests.update`, `guests.delete`, `guests.view`
- `service-requests.view`, `service-requests.create`, `service-requests.accept`, `service-requests.complete`
- `devices.view`, `devices.add`, `devices.edit`, `devices.delete`
- `locations.view`, `locations.create`, `locations.update`, `locations.delete`
- `settings.view`, `settings.edit`, `settings.manage`
- `system.view-logs`

**Roles & Permissions** (hardcoded in `auth.ts:75-102`):
```typescript
rolePermissions = {
  'admin': ['*'], // ALL permissions

  'chief-stewardess': [
    'service-requests.view', 'service-requests.create', 'service-requests.accept', 'service-requests.complete',
    'guests.view', 'crew.view', 'devices.view', 'system.view-logs'
  ],

  'stewardess': [
    'service-requests.view', 'service-requests.accept', 'service-requests.complete',
    'guests.view'
  ],

  'eto': [
    'devices.view', 'devices.add', 'devices.edit', 'system.view-logs'
  ],

  'crew': [
    'service-requests.view', 'guests.view'
  ]
}
```

---

## 🔄 WEBSOCKET EVENTS

**Connection**: `ws://localhost:8080`
**Service**: `backend/src/services/websocket.ts`

### Event Types
```typescript
// Guest Events
'guest:created' → { guest }
'guest:updated' → { guest }
'guest:deleted' → { guest }

// Service Request Events
'service-request:created' → { request }
'service-request:assigned' → { request }
'service-request:completed' → { request }
'service-request:status-changed' → { request }
'service-request:updated' → { request }

// Crew Events
'crew:status-changed' → { crewMember }

// Device Events
'device:created' → { device }
'device:updated' → { device }
'device:status-changed' → { device }
'device:discovered' → { device }
'device:paired' → { device }

// Location Events
'location:created' → { location }
'location:updated' → { location }
'location:deleted' → { location }
'location:dnd-toggled' → { location }

// Duty Roster Events
'shift:created' → { shift }
'shift:updated' → { shift }
'shift:deleted' → { shift }

'assignment:created' → { assignment }
'assignment:updated' → { assignment }
'assignment:deleted' → { assignment }

// Settings Events
'settings:updated' → { settings }

// Message Events
'message:new_message' → { message }
'message:broadcast_message' → { message }
```

### Frontend Usage
**File**: `src/hooks/useWebSocket.ts` (Refactored: 2025-11-03)
**Singleton Service**: `src/services/websocket.ts`

**IMPORTANT**: WebSocket connection is now managed by a **singleton service** wrapped by React hook.
- ✅ **ONE connection** for entire application (no more multiple connections)
- ✅ All components share the same WebSocket instance
- ✅ Automatic React Query cache invalidation
- ✅ Connection state management via React hooks

```typescript
const { isConnected, on, off, emit } = useWebSocket();

// Subscribe to event
const unsubscribe = on('guest:created', (data) => {
  // React Query cache automatically invalidated by hook
  console.log('New guest created:', data);
});

// Cleanup (unsubscribe)
useEffect(() => {
  const unsub = on('guest:created', handler);
  return () => unsub(); // Auto cleanup on unmount
}, []);
```

**Architecture**:
1. **Singleton Service** (`src/services/websocket.ts`): Manages Socket.IO connection
2. **React Hook** (`src/hooks/useWebSocket.ts`): Wraps singleton, provides React integration
3. **Auto-Connect**: Hook automatically connects when user is authenticated
4. **Auto-Cleanup**: Unsubscribes on component unmount (does NOT disconnect singleton)

**Recent Refactoring (2025-11-03)**:
- Fixed disconnect/reconnect loop (was creating multiple connections)
- Removed dependency on `queryClient` in useEffect (causing infinite re-renders)
- Removed duplicate WebSocket initialization from `App.tsx`
- All components now use same singleton instance

---

## 📝 HOW TO UPDATE THIS DOCUMENT

**CRITICAL**: Update this document whenever you:
1. Add a new API endpoint
2. Modify an existing endpoint
3. Add a new frontend hook
4. Change component-to-API connections

### Step-by-Step Update Process

#### Adding New Backend Endpoint:
1. Find the appropriate API section (e.g., "3. SERVICE REQUESTS API")
2. Add new row to the table with:
   - Endpoint path
   - HTTP method
   - Required permission
   - Description
   - Query params (if any)
   - Request body (if any)
3. Update the "Used By" field if frontend components use it

**Example**:
```markdown
| Endpoint | Method | Permission | Description | Request Body |
|----------|--------|------------|-------------|--------------|
| `/:id/archive` | PUT | `service-requests.complete` | Archive completed request | None |
```

#### Adding New Frontend Hook:
1. Go to "FRONTEND API SERVICES" section
2. Add new subsection with:
   - File path
   - Query key (if React Query)
   - Exports (functions/hooks)
   - Used By (components)

**Example**:
```markdown
#### 11. Service Categories Hook
**File**: `src/hooks/useServiceCategoriesApi.ts`
**Query Key**: `['service-categories']`

**Exports**:
\`\`\`typescript
useServiceCategories() => { categories, isLoading, ... }
\`\`\`

**Used By**: `service-requests.tsx`
```

#### Adding Component-to-API Mapping:
1. Go to "COMPONENT-TO-API MAPPING" section
2. Add new subsection with:
   - File path
   - APIs Used (list all endpoints)
   - Features You Can See (for non-technical verification)

**Example**:
```markdown
### 12. REPORTS PAGE
**File**: `src/components/pages/reports.tsx`
**APIs Used**:
- `GET /api/reports/summary` - Get summary statistics
- `GET /api/reports/export` - Export data

**Features You Can See**:
- Summary statistics cards
- Export buttons (PDF, CSV)
- Date range picker
```

---

## ✅ VERIFICATION CHECKLIST

Before creating a new API, check:
- [ ] Searched this document (Ctrl+F) for the feature
- [ ] Checked Backend API Endpoints section
- [ ] Checked Frontend API Services section
- [ ] Checked Component-to-API Mapping section
- [ ] Confirmed API doesn't exist
- [ ] If it exists, decided to extend it instead of duplicating

After creating/modifying an API, update:
- [ ] Backend API Endpoints table
- [ ] Frontend API Services section (if applicable)
- [ ] Component-to-API Mapping (if applicable)
- [ ] Document header date
- [ ] Commit changes to Git

---

## 🎯 QUICK REFERENCE

**Total Backend Endpoints**: 123+
**Total Route Files**: 25
**Total Frontend Hooks**: 7
**Total Page Components**: 13

**Most Commonly Used APIs**:
1. `/api/guests` - Guest management (7 endpoints)
2. `/api/service-requests` - Service request lifecycle (4 endpoints)
3. `/api/devices` - Device management (11 endpoints)
4. `/api/assignments` - Duty roster assignments (11 endpoints)
5. `/api/user-preferences` - Settings storage (6 endpoints)

**Real-Time Features** (WebSocket):
- Guest updates
- Service request status changes
- Crew status changes
- Device status changes
- Location DND toggles
- Duty roster updates

---

## 🐛 BUGFIX CHANGELOG

### 2025-11-03 - Critical System Fixes

#### 1. WebSocket Disconnect/Reconnect Loop (RESOLVED)
**Problem**: Multiple WebSocket connections being created, causing constant disconnect/reconnect spam in console.

**Root Cause**:
- `src/hooks/useWebSocket.ts` created NEW socket connection for each component (7+ components affected)
- `App.tsx` had duplicate WebSocket initialization calling singleton service directly
- `queryClient` in hook dependency array caused infinite re-renders

**Files Fixed**:
- ✅ `src/hooks/useWebSocket.ts` - Refactored to wrap singleton service (268 lines)
- ✅ `src/App.tsx` - Removed duplicate WebSocket code (~70 lines removed)
- ✅ Dependency array fixed (removed `queryClient`, kept only `user?.id`)

**Impact**: ONE stable WebSocket connection for entire app, no more reconnect spam

---

#### 2. Weather Widget - TypeError: Cannot Read Property of Null (RESOLVED)
**Problem**: Weather widgets crashing with "Cannot read property 'latitude' of null"

**Root Cause**:
- `weather-widget.tsx` accessed `coords.latitude` without null check
- `settings.locationName` accessed without optional chaining (`?.`)
- No default coordinates when yacht GPS location not set

**Files Fixed**:
- ✅ `src/components/weather-widget.tsx` - Added null guards (lines 64-70, 95)
- ✅ `src/components/windy-widget.tsx` - Safe access for settings (line 38)

**Impact**: Weather widgets now gracefully handle missing coordinates, show "No coordinates set" instead of crashing

---

#### 3. React Query Warning - yachtSettings Undefined (RESOLVED)
**Problem**: React Query warning: "Query data cannot be undefined"

**Root Cause**:
- `useYachtSettings` hook queryFn could return `undefined`
- React Query requires non-undefined return value from all query functions

**Files Fixed**:
- ✅ `src/hooks/useYachtSettings.ts` - Added DEFAULT_SETTINGS fallback (lines 66-81)
- ✅ queryFn now always returns valid data: `data || DEFAULT_SETTINGS`

**Impact**: No more undefined warnings, settings always have valid defaults

---

#### 4. Locations API - 401 Unauthorized (RESOLVED - Previous)
**Problem**: Locations page not loading, all API calls returning 401 Unauthorized

**Root Cause**:
- `backend/src/server.ts` line 141 missing `authMiddleware` for `/api/locations` route
- `locations.ts` uses `requirePermission()` which needs auth context

**Files Fixed**:
- ✅ `backend/src/server.ts:141` - Added authMiddleware to locations route

**Impact**: Locations page now loads correctly with proper authentication

---

#### 5. Service Requests - "Serving Now" Widget Not Showing Accepted Requests (RESOLVED)
**Problem**: Service requests accepted via popup dialog were not appearing in "Serving Now" widget

**Root Cause**:
- Backend returns status: `"IN_PROGRESS"` (uppercase with underscore)
- Frontend status mapping only had: `'in-progress': 'accepted'` (lowercase with dash)
- After `.toLowerCase()`: `"IN_PROGRESS"` → `"in_progress"` (underscore preserved!)
- No match found, defaulted to `'pending'` status
- Result: Accepted requests never showed in "Serving Now" (filters for `status === 'accepted'`)

**Debug Evidence**:
```
🔍 Transform Service Request:
backendStatus: "IN_PROGRESS"
frontendStatus: "pending"  ← WRONG! Should be "accepted"
assignedTo: "Alina Ela"
```

**Files Fixed**:
- ✅ `src/hooks/useServiceRequestsApi.ts:92` - Added `'in_progress': 'accepted'` to status mapping
- ✅ `src/contexts/ServiceRequestsContext.tsx` - Fixed accept/complete methods to call backend API
- ✅ `src/components/incoming-request-dialog.tsx` - Fixed to pass crew ID instead of name

**Impact**:
- Accepted service requests now correctly appear in "Serving Now" widget
- Status transformation handles both `in-progress` and `in_progress` formats

---

#### 6. Service Requests - Clear All Feature (NEW FEATURE)
**Problem**: Many old service requests cluttering the database with no way to clear them

**Solution**: Added "Clear All Requests" button with confirmation dialog

**Files Added/Modified**:
- ✅ `backend/src/routes/service-requests.ts` - Added `DELETE /clear-all` endpoint
- ✅ `backend/src/services/database.ts` - Added `deleteAllServiceRequests()` method
- ✅ `src/services/api.ts` - Added `clearAll()` API method
- ✅ `src/components/pages/service-requests.tsx` - Added Clear All button with confirmation dialog

**Features**:
- Red destructive button in Service Requests page header
- Confirmation dialog with warning message
- Shows count of requests to be deleted
- Disabled when no requests exist
- Deletes both ServiceRequest and ServiceRequestHistory records (foreign key constraint)
- Invalidates React Query cache to refresh UI

**Impact**: Users can now clear all old service requests with one click

---

#### 7. Service Requests - Finish Button Foreign Key Constraint (RESOLVED)
**Problem**: Clicking "Finish" button throws Prisma foreign key error and request doesn't complete

**Error Message**:
```
Foreign key constraint violated: ActivityLog_userId_fkey (index)
at: backend/src/services/database.ts:547
```

**Root Cause**:
- ActivityLog.userId has foreign key constraint to User table (not CrewMember table)
- Code was passing `request.assignedToId` (which is CrewMember ID)
- Should pass User ID from CrewMember.userId relation

**Files Fixed**:
- ✅ `backend/src/services/database.ts:547` - Changed from `userId: request.assignedToId` to `userId: request.CrewMember?.userId || null`

**Impact**:
- "Finish" button now works without errors
- Completed requests properly logged in ActivityLog
- Request disappears from "Serving Now" widget
- Request added to history correctly

---

#### 8. Service Requests - Delegate Button Not Working (RESOLVED)
**Problem**: Clicking "Delegate" shows toast but request doesn't appear in "Serving Now" widget

**Root Cause Analysis**:
- `delegateServiceRequest()` function was empty (only invalidated cache)
- Frontend passed crew member NAME instead of crew member ID
- Backend has NO separate "delegated" status
- Backend supports: PENDING, IN_PROGRESS, COMPLETED, CANCELLED only
- Delegate should work same as Accept (both assign crew + set IN_PROGRESS status)

**Files Fixed (Rule #9 - Entire Codebase Search)**:
- ✅ `src/contexts/ServiceRequestsContext.tsx:78-84` - Changed delegateServiceRequest to call accept API: `acceptMutation.mutate({ id, crewId })`
- ✅ `src/contexts/AppDataContext.tsx:153` - Fixed type signature: `crewMemberId` instead of `toCrewMember`
- ✅ `src/components/incoming-request-dialog.tsx:126,395,436` - handleSelectCrew now receives (crewId, crewName) and passes crew.id
- ✅ `src/components/service-request-panel.tsx:374,77-92` - SelectItem value changed from crew.name to crew.id, confirmDelegate finds name for toast
- ✅ `src/components/pages/service-requests.tsx:916,287-300` - SelectItem value changed from crew.name to crew.id, confirmDelegate finds name for toast

**How It Works Now**:
1. User clicks "Delegate" → Selects crew member from dropdown
2. Frontend calls `delegateServiceRequest(requestId, crewMemberId)`
3. Function calls backend `PUT /api/service-requests/:id/accept` with crewMemberId
4. Backend sets status to `IN_PROGRESS` and assigns crew member
5. Frontend maps `IN_PROGRESS` → `accepted` status
6. Request appears in "Serving Now" widget (filters `status === 'accepted'`)

**Impact**:
- Delegate button now fully functional
- Uses correct crew member ID (not name) for database relations
- Request properly assigned and appears in "Serving Now" widget
- Same backend endpoint as Accept (consolidated logic)

---

#### 9. Service Requests - Forward Sets Invalid Status (RESOLVED)
**Problem**: Forward feature was setting `status: 'delegated'` which backend doesn't support

**Root Cause**:
- `confirmForward()` in service-requests.tsx set `status: 'delegated'`
- Backend validator only accepts: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- Would cause validation errors when forwarding requests

**Files Fixed**:
- ✅ `src/components/pages/service-requests.tsx:314-315` - Removed status change from forward operation

**How It Works Now**:
- Forward only updates `categoryId` field
- Request status remains unchanged (keeps current status)
- No backend validation errors

**Impact**:
- Forward feature works without errors
- Request maintains proper status lifecycle
- Category assignment works correctly

---

### Testing Checklist After Bugfixes

#### Core Functionality
- ✅ WebSocket connects ONCE on app load (check console)
- ✅ No disconnect/reconnect loop
- ✅ Weather widgets show "No coordinates set" gracefully (if no GPS)
- ✅ No React Query undefined warnings
- ✅ Locations page loads with guest data
- ✅ All 5 major sections work: Dashboard, Crew, Guests, Devices, Locations

#### Service Requests (Latest Fixes - 2025-11-04)
- ✅ Service requests accepted via popup show in "Serving Now" widget
- ✅ "Clear All Requests" button works with confirmation dialog
- ✅ **"Finish" button completes request without errors** (ActivityLog fix)
- ✅ **Completed requests disappear from "Serving Now" widget**
- ✅ **"Delegate" button assigns request and shows in "Serving Now"** (Uses accept API)
- ✅ **Forward updates category without breaking status**

---

**End of Document**
**Last Updated**: 2025-11-04 (Service Requests: Finish/Delegate/Forward Fixes)
**Maintained By**: Claude Code Assistant
**Next Review Date**: When adding/modifying any API
