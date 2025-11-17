# Backend API Endpoint Inventory

**Generated**: November 17, 2025
**Total Route Files**: 26
**Purpose**: Complete inventory of all API endpoints to identify duplicates and integration opportunities

---

## Table of Contents

1. [Voice/Audio Endpoints](#voiceaudio-endpoints)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Service Request Endpoints](#service-request-endpoints)
4. [Device Management Endpoints](#device-management-endpoints)
5. [Crew Management Endpoints](#crew-management-endpoints)
6. [Guest Management Endpoints](#guest-management-endpoints)
7. [Location Management Endpoints](#location-management-endpoints)
8. [Message Endpoints](#message-endpoints)
9. [Dashboard & Preferences Endpoints](#dashboard--preferences-endpoints)
10. [Duty Roster Endpoints](#duty-roster-endpoints)
11. [Settings Endpoints](#settings-endpoints)
12. [Backup & System Endpoints](#backup--system-endpoints)
13. [Upload Endpoints](#upload-endpoints)
14. [Logging & History Endpoints](#logging--history-endpoints)
15. [Smart Button Endpoints](#smart-button-endpoints)
16. [Device Discovery Endpoints](#device-discovery-endpoints)

---

## Voice/Audio Endpoints

### POST /api/voice/upload
**File**: [backend/src/routes/voice.ts](../../backend/src/routes/voice.ts)
**Purpose**: Save audio file and return public URL
**Authentication**: None (public endpoint for ESP32)
**Request**:
```
Content-Type: multipart/form-data
Field: audio (file, max 10MB)
Allowed types: wav, webm, mp3, mpeg, ogg, m4a
```
**Response**:
```json
{
  "success": true,
  "url": "http://10.10.0.10:3001/uploads/voice/voice-1732012345678-987654321.wav",
  "filename": "voice-1732012345678-987654321.wav",
  "size": 320044,
  "mimetype": "audio/wav"
}
```
**Created**: November 17, 2025 (ESP32 voice fix)
**Used By**: ESP32 firmware (audio_http_upload.c)

### GET /api/voice/test
**File**: [backend/src/routes/voice.ts](../../backend/src/routes/voice.ts)
**Purpose**: Test endpoint to verify upload service setup
**Response**:
```json
{
  "success": true,
  "message": "Voice upload service is ready",
  "uploadsDir": "/path/to/backend/uploads/voice"
}
```

### POST /api/transcribe
**File**: [backend/src/routes/transcribe.ts](../../backend/src/routes/transcribe.ts)
**Purpose**: Transcribe audio using OpenAI Whisper (bilingual: original + English)
**Authentication**: None
**Request**:
```
Content-Type: multipart/form-data
Field: audio (file, max 25MB)
Allowed types: webm, mp3, mpeg, wav, ogg, m4a
```
**Response**:
```json
{
  "success": true,
  "transcript": "Cabin 5 needs towels",
  "translation": "Cabin 5 needs towels",
  "language": "en",
  "duration": 5.2
}
```
**Used By**: Frontend virtual button (button-simulator-widget.tsx)

### GET /api/transcribe/test
**File**: [backend/src/routes/transcribe.ts](../../backend/src/routes/transcribe.ts)
**Purpose**: Test endpoint to verify OpenAI Whisper setup
**Response**:
```json
{
  "success": true,
  "message": "Transcription service is ready",
  "openai": {
    "configured": true,
    "keyPreview": "sk-proj-xx..."
  }
}
```

---

## Authentication Endpoints

### POST /api/auth/login
**File**: [backend/src/routes/auth.ts](../../backend/src/routes/auth.ts)
**Purpose**: User login with JWT token generation
**Request**:
```json
{
  "username": "alice",
  "password": "password123"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "username": "alice",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "role": "chief-stewardess",
      "avatar": null,
      "department": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
**Notes**: Sets HTTP-only cookie `obedio-auth-token` for session persistence

### POST /api/auth/refresh
**File**: [backend/src/routes/auth.ts](../../backend/src/routes/auth.ts)
**Purpose**: Refresh JWT token
**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "..." }
  }
}
```

### GET /api/auth/verify
**File**: [backend/src/routes/auth.ts](../../backend/src/routes/auth.ts)
**Purpose**: Verify token validity (reads from HTTP-only cookie)
**Response**:
```json
{
  "success": true,
  "valid": true,
  "user": { "..." }
}
```

### POST /api/auth/logout
**File**: [backend/src/routes/auth.ts](../../backend/src/routes/auth.ts)
**Purpose**: Clear authentication cookie
**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Service Request Endpoints

### GET /api/service-requests
**File**: [backend/src/routes/service-requests.ts](../../backend/src/routes/service-requests.ts)
**Purpose**: Get all service requests with filtering
**Query Params**: `status`, `priority`, `page`, `limit`
**Response**: Paginated list of service requests

### POST /api/service-requests
**File**: [backend/src/routes/service-requests.ts](../../backend/src/routes/service-requests.ts)
**Purpose**: Create new service request
**Permission**: `service-requests.create`
**Broadcasts**: WebSocket event `service-request:created`

### PUT /api/service-requests/:id/accept
**File**: [backend/src/routes/service-requests.ts](../../backend/src/routes/service-requests.ts)
**Purpose**: Accept/assign service request to crew member
**Permission**: `service-requests.accept`
**Broadcasts**: WebSocket events + MQTT notification to watch

### PUT /api/service-requests/:id/complete
**File**: [backend/src/routes/service-requests.ts](../../backend/src/routes/service-requests.ts)
**Purpose**: Mark service request as completed
**Permission**: `service-requests.complete`
**Broadcasts**: WebSocket + MQTT status update

### DELETE /api/service-requests/clear-all
**File**: [backend/src/routes/service-requests.ts](../../backend/src/routes/service-requests.ts)
**Purpose**: Delete all service requests
**Permission**: `service-requests.delete`

---

## Device Management Endpoints

### GET /api/devices/discover
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Public endpoint for watch devices to discover their device ID
**Authentication**: None (uses MAC address)
**Query**: `macAddress`
**Response**: Device info with crew assignment

### GET /api/devices/logs
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Get all device logs with filters
**Query**: `deviceId`, `status`, `startDate`, `endDate`, `search`, `page`, `limit`, `eventType`

### GET /api/devices/stats/summary
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Get device statistics
**Response**:
```json
{
  "total": 15,
  "online": 12,
  "offline": 2,
  "lowBattery": 1,
  "byType": {
    "smart_button": 8,
    "watch": 7
  }
}
```

### GET /api/devices
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: List all devices with filters
**Query**: `type`, `status`, `locationId`, `crewMemberId`, `macAddress`

### GET /api/devices/:id
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Get single device with details and logs

### POST /api/devices
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Create new device
**Permission**: `devices.add`
**Broadcasts**: WebSocket event `device:created`

### PUT /api/devices/:id
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Update device
**Permission**: `devices.edit`
**Broadcasts**: WebSocket events for updates and status changes

### DELETE /api/devices/:id
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Delete device
**Permission**: `devices.delete`

### GET /api/devices/:id/config
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Get device configuration

### PUT /api/devices/:id/config
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Update device configuration and name
**Permission**: `devices.edit`

### POST /api/devices/:id/test
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Send test signal to device (LED blink, beep)
**Permission**: `devices.edit`
**MQTT**: Sends test command to device

### GET /api/devices/:id/logs
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Get event logs for specific device
**Query**: `limit`, `eventType`

### GET /api/devices/me
**File**: [backend/src/routes/devices.ts](../../backend/src/routes/devices.ts)
**Purpose**: Get current user's assigned device (watch)

---

## Crew Management Endpoints

### GET /api/crew
**File**: [backend/src/routes/crew.ts](../../backend/src/routes/crew.ts)
**Purpose**: Get all crew members

### GET /api/crew/members
**File**: [backend/src/routes/crew.ts](../../backend/src/routes/crew.ts)
**Purpose**: Get filtered crew members (for Wear OS app)
**Query**: `status`, `department`

### POST /api/crew
**File**: [backend/src/routes/crew.ts](../../backend/src/routes/crew.ts)
**Purpose**: Create crew member WITH user account
**Auto-generates**: Username and temporary password
**Response**: Includes credentials (only shown once)

### PUT /api/crew/:id
**File**: [backend/src/routes/crew.ts](../../backend/src/routes/crew.ts)
**Purpose**: Update crew member
**Broadcasts**: WebSocket event for status changes

### DELETE /api/crew/:id
**File**: [backend/src/routes/crew.ts](../../backend/src/routes/crew.ts)
**Purpose**: Delete crew member

---

## Guest Management Endpoints

### GET /api/guests
**File**: [backend/src/routes/guests.ts](../../backend/src/routes/guests.ts)
**Purpose**: List guests with filtering, sorting, pagination
**Query**: `q`, `status`, `type`, `diet`, `allergy`, `cabin`, `vip`, `page`, `limit`, `sort`

### GET /api/guests/stats
**File**: [backend/src/routes/guests.ts](../../backend/src/routes/guests.ts)
**Purpose**: Get guest statistics
**Response**:
```json
{
  "onboard": 12,
  "expected": 3,
  "vip": 2,
  "dietaryAlerts": 4
}
```

### GET /api/guests/meta
**File**: [backend/src/routes/guests.ts](../../backend/src/routes/guests.ts)
**Purpose**: Get metadata for filters (statuses, types, allergies, diets, cabins)

### POST /api/guests
**File**: [backend/src/routes/guests.ts](../../backend/src/routes/guests.ts)
**Purpose**: Create new guest
**Permission**: `guests.create`
**Broadcasts**: WebSocket event

### GET /api/guests/:id
**File**: [backend/src/routes/guests.ts](../../backend/src/routes/guests.ts)
**Purpose**: Get single guest with service requests

### PUT /api/guests/:id
**File**: [backend/src/routes/guests.ts](../../backend/src/routes/guests.ts)
**Purpose**: Update guest
**Permission**: `guests.update`
**Broadcasts**: WebSocket event

### DELETE /api/guests/:id
**File**: [backend/src/routes/guests.ts](../../backend/src/routes/guests.ts)
**Purpose**: Delete guest
**Permission**: `guests.delete`
**Broadcasts**: WebSocket event

---

## Location Management Endpoints

### GET /api/locations
**File**: [backend/src/routes/locations.ts](../../backend/src/routes/locations.ts)
**Purpose**: Get all locations
**Permission**: `locations.view`

### GET /api/locations/:id
**File**: [backend/src/routes/locations.ts](../../backend/src/routes/locations.ts)
**Purpose**: Get single location with guests and service requests

### POST /api/locations
**File**: [backend/src/routes/locations.ts](../../backend/src/routes/locations.ts)
**Purpose**: Create new location
**Permission**: `locations.create`
**Broadcasts**: WebSocket event

### PUT /api/locations/:id
**File**: [backend/src/routes/locations.ts](../../backend/src/routes/locations.ts)
**Purpose**: Update location
**Permission**: `locations.update`
**Broadcasts**: WebSocket event + DND toggle event

### DELETE /api/locations/:id
**File**: [backend/src/routes/locations.ts](../../backend/src/routes/locations.ts)
**Purpose**: Delete location
**Permission**: `locations.delete`
**Validation**: Blocks deletion if location has guests or service requests

### POST /api/locations/:id/toggle-dnd
**File**: [backend/src/routes/locations.ts](../../backend/src/routes/locations.ts)
**Purpose**: Toggle Do Not Disturb status
**Broadcasts**: WebSocket DND event

### GET /api/locations/dnd/active
**File**: [backend/src/routes/locations.ts](../../backend/src/routes/locations.ts)
**Purpose**: Get all locations with DND enabled

---

## Message Endpoints

### GET /api/messages
**File**: [backend/src/routes/messages.ts](../../backend/src/routes/messages.ts)
**Purpose**: Get messages for authenticated user
**Query**: `type`, `unreadOnly`, `page`, `limit`

### GET /api/messages/conversation/:otherUserId
**File**: [backend/src/routes/messages.ts](../../backend/src/routes/messages.ts)
**Purpose**: Get conversation between two users
**Side Effect**: Marks messages as read

### POST /api/messages
**File**: [backend/src/routes/messages.ts](../../backend/src/routes/messages.ts)
**Purpose**: Send a message
**Broadcasts**: WebSocket to receiver or broadcast

### PUT /api/messages/:messageId/read
**File**: [backend/src/routes/messages.ts](../../backend/src/routes/messages.ts)
**Purpose**: Mark message as read

### PUT /api/messages/mark-all-read
**File**: [backend/src/routes/messages.ts](../../backend/src/routes/messages.ts)
**Purpose**: Mark all messages as read

### DELETE /api/messages/:messageId
**File**: [backend/src/routes/messages.ts](../../backend/src/routes/messages.ts)
**Purpose**: Delete a message

### GET /api/messages/unread-count
**File**: [backend/src/routes/messages.ts](../../backend/src/routes/messages.ts)
**Purpose**: Get unread message count

---

## Dashboard & Preferences Endpoints

### GET /api/dashboard/layout
**File**: [backend/src/routes/dashboard.ts](../../backend/src/routes/dashboard.ts)
**Purpose**: Get user's dashboard layout and active widgets

### PUT /api/dashboard/layout
**File**: [backend/src/routes/dashboard.ts](../../backend/src/routes/dashboard.ts)
**Purpose**: Save user's dashboard layout and active widgets

### POST /api/dashboard/reset
**File**: [backend/src/routes/dashboard.ts](../../backend/src/routes/dashboard.ts)
**Purpose**: Reset dashboard to default layout for user's role

### GET /api/dashboard/defaults/:role
**File**: [backend/src/routes/dashboard.ts](../../backend/src/routes/dashboard.ts)
**Purpose**: Get default layout for specific role (admin only)
**Permission**: `settings.manage`

### GET /api/user-preferences
**File**: [backend/src/routes/user-preferences.ts](../../backend/src/routes/user-preferences.ts)
**Purpose**: Get current user's preferences (theme, language, service request settings, etc.)

### PUT /api/user-preferences/dashboard
**File**: [backend/src/routes/user-preferences.ts](../../backend/src/routes/user-preferences.ts)
**Purpose**: Update dashboard layout and active widgets

### PUT /api/user-preferences/theme
**File**: [backend/src/routes/user-preferences.ts](../../backend/src/routes/user-preferences.ts)
**Purpose**: Update theme preference (light, dark, auto)

### PUT /api/user-preferences/notifications
**File**: [backend/src/routes/user-preferences.ts](../../backend/src/routes/user-preferences.ts)
**Purpose**: Update notification preferences (email, emergency contacts)

### PUT /api/user-preferences/service-requests
**File**: [backend/src/routes/user-preferences.ts](../../backend/src/routes/user-preferences.ts)
**Purpose**: Update service request display preferences

### DELETE /api/user-preferences/dashboard
**File**: [backend/src/routes/user-preferences.ts](../../backend/src/routes/user-preferences.ts)
**Purpose**: Reset dashboard to defaults

---

## Duty Roster Endpoints

### GET /api/shifts
**File**: [backend/src/routes/shifts.ts](../../backend/src/routes/shifts.ts)
**Purpose**: Get all shifts with assignment counts

### GET /api/shifts/active
**File**: [backend/src/routes/shifts.ts](../../backend/src/routes/shifts.ts)
**Purpose**: Get only active shifts

### GET /api/shifts/:id
**File**: [backend/src/routes/shifts.ts](../../backend/src/routes/shifts.ts)
**Purpose**: Get single shift with recent assignments

### POST /api/shifts
**File**: [backend/src/routes/shifts.ts](../../backend/src/routes/shifts.ts)
**Purpose**: Create new shift
**Broadcasts**: WebSocket event

### PUT /api/shifts/:id
**File**: [backend/src/routes/shifts.ts](../../backend/src/routes/shifts.ts)
**Purpose**: Update shift
**Broadcasts**: WebSocket event

### DELETE /api/shifts/:id
**File**: [backend/src/routes/shifts.ts](../../backend/src/routes/shifts.ts)
**Purpose**: Delete shift (cascades to assignments)
**Broadcasts**: WebSocket event

### POST /api/shifts/:id/toggle-active
**File**: [backend/src/routes/shifts.ts](../../backend/src/routes/shifts.ts)
**Purpose**: Toggle shift active status

### POST /api/shifts/reorder
**File**: [backend/src/routes/shifts.ts](../../backend/src/routes/shifts.ts)
**Purpose**: Update order of multiple shifts

### GET /api/assignments
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Get all assignments with filtering
**Query**: `date`, `shiftId`, `crewMemberId`, `type`, `startDate`, `endDate`

### GET /api/assignments/by-date/:date
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Get all assignments for specific date

### GET /api/assignments/by-week/:startDate
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Get assignments for week starting from date

### GET /api/assignments/crew/:crewMemberId
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Get assignments for specific crew member
**Query**: `startDate`, `endDate`

### GET /api/assignments/:id
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Get single assignment

### POST /api/assignments
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Create new assignment
**Broadcasts**: WebSocket event

### POST /api/assignments/bulk
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Create multiple assignments at once
**Skip**: Duplicates via `skipDuplicates`

### PUT /api/assignments/:id
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Update assignment
**Broadcasts**: WebSocket event

### DELETE /api/assignments/:id
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Delete single assignment
**Broadcasts**: WebSocket event

### DELETE /api/assignments/by-date/:date
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Delete all assignments for specific date

### DELETE /api/assignments/crew/:crewMemberId
**File**: [backend/src/routes/assignments.ts](../../backend/src/routes/assignments.ts)
**Purpose**: Delete all assignments for crew member
**Query**: `startDate`, `endDate`

---

## Settings Endpoints

### GET /api/settings/all
**File**: [backend/src/routes/settings.ts](../../backend/src/routes/settings.ts)
**Purpose**: Get all settings (yacht + notification + user preferences)
**Response**: Combined settings object

### GET /api/settings/system-status
**File**: [backend/src/routes/settings.ts](../../backend/src/routes/settings.ts)
**Purpose**: Get system status (uptime, version, etc.)

### GET /api/yacht-settings
**File**: [backend/src/routes/yacht-settings.ts](../../backend/src/routes/yacht-settings.ts)
**Purpose**: Get yacht settings (name, type, timezone, GPS location, etc.)

### PUT /api/yacht-settings
**File**: [backend/src/routes/yacht-settings.ts](../../backend/src/routes/yacht-settings.ts)
**Purpose**: Update yacht settings
**Broadcasts**: WebSocket event

### GET /api/notification-settings
**File**: [backend/src/routes/notification-settings.ts](../../backend/src/routes/notification-settings.ts)
**Purpose**: Get notification settings for user

### PUT /api/notification-settings
**File**: [backend/src/routes/notification-settings.ts](../../backend/src/routes/notification-settings.ts)
**Purpose**: Update notification settings

### POST /api/notification-settings/push-token
**File**: [backend/src/routes/notification-settings.ts](../../backend/src/routes/notification-settings.ts)
**Purpose**: Update push token only

### POST /api/notification-settings/test
**File**: [backend/src/routes/notification-settings.ts](../../backend/src/routes/notification-settings.ts)
**Purpose**: Send test notification

### GET /api/service-categories
**File**: [backend/src/routes/service-categories.ts](../../backend/src/routes/service-categories.ts)
**Purpose**: Get all service categories
**Permission**: `settings.view`

### POST /api/service-categories
**File**: [backend/src/routes/service-categories.ts](../../backend/src/routes/service-categories.ts)
**Purpose**: Create service category
**Permission**: `settings.edit`

### PUT /api/service-categories/:id
**File**: [backend/src/routes/service-categories.ts](../../backend/src/routes/service-categories.ts)
**Purpose**: Update service category
**Permission**: `settings.edit`

### DELETE /api/service-categories/:id
**File**: [backend/src/routes/service-categories.ts](../../backend/src/routes/service-categories.ts)
**Purpose**: Delete service category
**Permission**: `settings.edit`
**Validation**: Blocks deletion if in use

### PUT /api/service-categories/reorder
**File**: [backend/src/routes/service-categories.ts](../../backend/src/routes/service-categories.ts)
**Purpose**: Reorder service categories
**Permission**: `settings.edit`

### GET /api/role-permissions/roles/:role
**File**: [backend/src/routes/role-permissions.ts](../../backend/src/routes/role-permissions.ts)
**Purpose**: Get permissions for specific role

### GET /api/role-permissions/roles
**File**: [backend/src/routes/role-permissions.ts](../../backend/src/routes/role-permissions.ts)
**Purpose**: Get all role permissions

### PUT /api/role-permissions/roles/:role
**File**: [backend/src/routes/role-permissions.ts](../../backend/src/routes/role-permissions.ts)
**Purpose**: Update permissions for role (admin only)

### POST /api/role-permissions/roles/:role/reset
**File**: [backend/src/routes/role-permissions.ts](../../backend/src/routes/role-permissions.ts)
**Purpose**: Reset role permissions to defaults (admin only)

---

## Backup & System Endpoints

### GET /api/backup/settings
**File**: [backend/src/routes/backup.ts](../../backend/src/routes/backup.ts)
**Purpose**: Get current backup settings
**Permission**: `system.backup`

### PUT /api/backup/settings
**File**: [backend/src/routes/backup.ts](../../backend/src/routes/backup.ts)
**Purpose**: Update backup settings
**Permission**: `system.backup`

### GET /api/backup/status
**File**: [backend/src/routes/backup.ts](../../backend/src/routes/backup.ts)
**Purpose**: Get backup status and list of backups
**Permission**: `system.backup`

### POST /api/backup/create
**File**: [backend/src/routes/backup.ts](../../backend/src/routes/backup.ts)
**Purpose**: Create new database backup using pg_dump
**Permission**: `system.backup`

### POST /api/backup/restore/:filename
**File**: [backend/src/routes/backup.ts](../../backend/src/routes/backup.ts)
**Purpose**: Restore from backup file using pg_restore
**Permission**: `system.backup`

### DELETE /api/backup/:filename
**File**: [backend/src/routes/backup.ts](../../backend/src/routes/backup.ts)
**Purpose**: Delete backup file
**Permission**: `system.backup`

### GET /api/backup/download/:filename
**File**: [backend/src/routes/backup.ts](../../backend/src/routes/backup.ts)
**Purpose**: Download backup file
**Permission**: `system.backup`

### GET /api/system-settings
**File**: [backend/src/routes/system-settings.ts](../../backend/src/routes/system-settings.ts)
**Purpose**: Get system settings and status
**Permission**: `system.settings`
**Response**: Status (uptime, memory, CPU) + settings

### PUT /api/system-settings
**File**: [backend/src/routes/system-settings.ts](../../backend/src/routes/system-settings.ts)
**Purpose**: Update system settings
**Permission**: `system.settings`

### GET /api/system-settings/health
**File**: [backend/src/routes/system-settings.ts](../../backend/src/routes/system-settings.ts)
**Purpose**: Quick health check
**Permission**: `system.settings`

---

## Upload Endpoints

### POST /api/upload/image
**File**: [backend/src/routes/upload.ts](../../backend/src/routes/upload.ts)
**Purpose**: Upload single image file
**Authentication**: Required
**Request**:
```
Content-Type: multipart/form-data
Field: image (file, max 5MB)
Allowed types: jpeg, jpg, png, gif, webp
```
**Response**:
```json
{
  "success": true,
  "data": {
    "filename": "avatar-1732012345678-987654321.png",
    "url": "/uploads/images/avatar-1732012345678-987654321.png",
    "size": 52341,
    "mimetype": "image/png",
    "message": "Image uploaded successfully"
  }
}
```

### DELETE /api/upload/image/:filename
**File**: [backend/src/routes/upload.ts](../../backend/src/routes/upload.ts)
**Purpose**: Delete uploaded image
**Authentication**: Required

---

## Logging & History Endpoints

### GET /api/activity-logs
**File**: [backend/src/routes/activity-logs.ts](../../backend/src/routes/activity-logs.ts)
**Purpose**: Get activity logs with filters
**Query**: `type`, `userId`, `locationId`, `page`, `limit`

### POST /api/activity-logs
**File**: [backend/src/routes/activity-logs.ts](../../backend/src/routes/activity-logs.ts)
**Purpose**: Create activity log entry

### GET /api/crew-change-logs
**File**: [backend/src/routes/crew-change-logs.ts](../../backend/src/routes/crew-change-logs.ts)
**Purpose**: Get crew change logs with filters
**Query**: `page`, `limit`, `crewMemberId`, `changeType`, `changedBy`, `startDate`, `endDate`, `search`

### POST /api/crew-change-logs
**File**: [backend/src/routes/crew-change-logs.ts](../../backend/src/routes/crew-change-logs.ts)
**Purpose**: Create crew change log entry

### GET /api/crew-change-logs/crew/:crewMemberId
**File**: [backend/src/routes/crew-change-logs.ts](../../backend/src/routes/crew-change-logs.ts)
**Purpose**: Get logs for specific crew member
**Query**: `limit`

### POST /api/crew-change-logs/bulk
**File**: [backend/src/routes/crew-change-logs.ts](../../backend/src/routes/crew-change-logs.ts)
**Purpose**: Log bulk changes (from duty roster notifications)

### GET /api/crew-change-logs/recent
**File**: [backend/src/routes/crew-change-logs.ts](../../backend/src/routes/crew-change-logs.ts)
**Purpose**: Get recent changes for dashboard (last 10)

### GET /api/service-request-history
**File**: [backend/src/routes/service-request-history.ts](../../backend/src/routes/service-request-history.ts)
**Purpose**: Get service request history with filters
**Query**: `page`, `limit`, `userId`, `serviceRequestId`, `startDate`, `endDate`, `action`

### POST /api/service-request-history
**File**: [backend/src/routes/service-request-history.ts](../../backend/src/routes/service-request-history.ts)
**Purpose**: Create service request history entry

### GET /api/service-request-history/request/:serviceRequestId
**File**: [backend/src/routes/service-request-history.ts](../../backend/src/routes/service-request-history.ts)
**Purpose**: Get history for specific service request

### GET /api/service-request-history/completed
**File**: [backend/src/routes/service-request-history.ts](../../backend/src/routes/service-request-history.ts)
**Purpose**: Get completed service requests for activity log
**Query**: `page`, `limit`, `search`

---

## Smart Button Endpoints

### POST /api/smart-buttons/press
**File**: [backend/src/routes/smart-buttons.ts](../../backend/src/routes/smart-buttons.ts)
**Purpose**: Handle smart button press (web simulator or direct API)
**MQTT**: Publishes to `obedio/button/{deviceId}/press`

### POST /api/smart-buttons/status/:deviceId
**File**: [backend/src/routes/smart-buttons.ts](../../backend/src/routes/smart-buttons.ts)
**Purpose**: Update device status (battery, signal)
**MQTT**: Publishes to `obedio/button/{deviceId}/status`

### POST /api/smart-buttons/telemetry/:deviceId
**File**: [backend/src/routes/smart-buttons.ts](../../backend/src/routes/smart-buttons.ts)
**Purpose**: Send telemetry data
**MQTT**: Publishes to `obedio/device/{deviceId}/telemetry`

### POST /api/smart-buttons/test/:deviceId
**File**: [backend/src/routes/smart-buttons.ts](../../backend/src/routes/smart-buttons.ts)
**Purpose**: Test device connection
**MQTT**: Sends test command

### GET /api/smart-buttons/mqtt-status
**File**: [backend/src/routes/smart-buttons.ts](../../backend/src/routes/smart-buttons.ts)
**Purpose**: Get MQTT connection status

---

## Device Discovery Endpoints

### POST /api/device-discovery/discover
**File**: [backend/src/routes/device-discovery.ts](../../backend/src/routes/device-discovery.ts)
**Purpose**: Start device discovery
**MQTT**: Broadcasts discovery request
**Response**: 30-second discovery window

### GET /api/device-discovery/pairing
**File**: [backend/src/routes/device-discovery.ts](../../backend/src/routes/device-discovery.ts)
**Purpose**: Get devices in pairing mode
**Auto-cleanup**: Removes entries older than 60 seconds

### POST /api/device-discovery/pair/:deviceId
**File**: [backend/src/routes/device-discovery.ts](../../backend/src/routes/device-discovery.ts)
**Purpose**: Pair discovered device
**MQTT**: Sends pairing confirmation
**Broadcasts**: WebSocket event `device:paired`

### POST /api/device-discovery/simulate-announce
**File**: [backend/src/routes/device-discovery.ts](../../backend/src/routes/device-discovery.ts)
**Purpose**: Test endpoint to simulate device announcement

### DELETE /api/device-discovery/pairing/:deviceId
**File**: [backend/src/routes/device-discovery.ts](../../backend/src/routes/device-discovery.ts)
**Purpose**: Cancel pairing for device
**MQTT**: Sends pairing_cancelled command

---

## Duplicate Analysis

### Voice/Audio Upload Endpoints - OVERLAP DETECTED

**Endpoint 1**: `POST /api/voice/upload`
- File: [voice.ts](../../backend/src/routes/voice.ts)
- Purpose: Save audio file → Return URL
- Used by: ESP32 firmware
- Max size: 10MB
- Created: Nov 17, 2025

**Endpoint 2**: `POST /api/transcribe`
- File: [transcribe.ts](../../backend/src/routes/transcribe.ts)
- Purpose: Accept audio file → Transcribe → Return text + language
- Used by: Frontend virtual button
- Max size: 25MB
- Older endpoint

**Overlap**: Both accept audio files via multipart/form-data

**Difference**:
- `/voice/upload`: Returns URL only (storage)
- `/transcribe`: Returns transcription + translation (processing)

**Recommendation**: ✅ Keep both - Different purposes, but consider integration (see below)

---

### Dashboard/Preferences Endpoints - PARTIAL OVERLAP

**Set 1**: Dashboard Layout Endpoints
- `GET /api/dashboard/layout` - Get layout
- `PUT /api/dashboard/layout` - Save layout
- `POST /api/dashboard/reset` - Reset layout

**Set 2**: User Preferences Dashboard Endpoints
- `GET /api/user-preferences` - Includes `dashboardLayout` field
- `PUT /api/user-preferences/dashboard` - Update layout
- `DELETE /api/user-preferences/dashboard` - Reset layout

**Overlap**: Both manage dashboard layout in same DB table (`UserPreferences`)

**Recommendation**: 🔄 Consolidate - Use `/api/user-preferences/*` exclusively, deprecate `/api/dashboard/*`

---

### Settings Endpoints - SCATTERED

**Multiple settings routes**:
1. `GET /api/settings/all` - Combines yacht + notification + user preferences
2. `GET /api/yacht-settings` - Yacht-specific
3. `GET /api/notification-settings` - Notification-specific
4. `GET /api/user-preferences` - User-specific
5. `GET /api/system-settings` - System-specific

**Overlap**: `/settings/all` duplicates other endpoints

**Recommendation**: ✅ Keep as-is - `/settings/all` is convenience endpoint for initial load

---

### Device Logs - DUPLICATE QUERIES

**Endpoint 1**: `GET /api/devices/logs` (all device logs)
**Endpoint 2**: `GET /api/devices/:id/logs` (logs for specific device)

**Overlap**: Both query same `DeviceLog` table with similar filtering

**Recommendation**: ✅ Keep both - Different use cases (global vs device-specific)

---

## Integration Opportunities

### Voice Pipeline Integration - HIGH PRIORITY

**Current Flow**:
```
ESP32 → POST /api/voice/upload → Get URL
        ↓
     MQTT publishes URL
        ↓
   Frontend receives notification
        ↓
Frontend → POST /api/transcribe (re-fetch audio) → Get text
```

**Recommended Flow**:
```
ESP32 → POST /api/voice/upload → Auto-transcribe → Return URL + transcript
```

**Implementation**:
```typescript
// In backend/src/routes/voice.ts
router.post('/upload', upload.single('audio'), async (req, res) => {
  // 1. Save file (existing code)
  const publicUrl = `${protocol}://${host}/uploads/voice/${req.file.filename}`;

  // 2. Auto-transcribe if OpenAI configured (NEW)
  let transcript = null;
  let translation = null;
  let language = null;

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const audioFile = fs.createReadStream(req.file.path);

      const result = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json'
      });

      transcript = result.text;
      language = result.language;

      // Get English translation if not English
      if (language !== 'en') {
        const translationFile = fs.createReadStream(req.file.path);
        const translationResult = await openai.audio.translations.create({
          file: translationFile,
          model: 'whisper-1'
        });
        translation = translationResult.text;
      }
    } catch (error) {
      console.error('Transcription error (non-fatal):', error);
      // Continue without transcription
    }
  }

  // 3. Return combined response (ENHANCED)
  res.json({
    success: true,
    url: publicUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    // NEW fields:
    transcript: transcript,
    translation: translation,
    language: language
  });
});
```

**Benefits**:
1. Single request instead of two
2. ESP32 MQTT payload includes transcript
3. Frontend doesn't need separate `/transcribe` call
4. Faster user experience

**Migration**:
- Keep `/api/transcribe` for backward compatibility
- Frontend virtual button can use either endpoint
- ESP32 automatically gets transcription in response

---

### Unified Settings Endpoint - MEDIUM PRIORITY

**Current**: Multiple settings endpoints requiring multiple requests

**Recommended**: Enhanced `/api/settings/all` with optional sections

```typescript
// GET /api/settings/all?sections=yacht,notifications,user,system
router.get('/all', authMiddleware, asyncHandler(async (req, res) => {
  const sections = (req.query.sections as string)?.split(',') ||
                   ['yacht', 'notifications', 'user'];

  const response: any = {};

  if (sections.includes('yacht')) {
    response.yacht = await getYachtSettings();
  }
  if (sections.includes('notifications')) {
    response.notifications = await getNotificationSettings(userId);
  }
  if (sections.includes('user')) {
    response.userPreferences = await getUserPreferences(userId);
  }
  if (sections.includes('system')) {
    response.system = await getSystemSettings();
  }

  res.json(apiSuccess(response));
}));
```

**Benefits**:
- Flexible loading (request only needed sections)
- Single request for app initialization
- Reduces network roundtrips

---

### Device Status Aggregation - LOW PRIORITY

**Current**: Multiple device status endpoints

**Recommended**: Add unified device status dashboard endpoint

```typescript
// GET /api/devices/dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [stats, recentLogs, lowBattery, offline] = await Promise.all([
    getDeviceStats(),
    getRecentDeviceLogs(10),
    getDevicesByStatus('low_battery'),
    getDevicesByStatus('offline')
  ]);

  res.json(apiSuccess({
    stats,
    recentActivity: recentLogs,
    alerts: {
      lowBattery,
      offline
    }
  }));
}));
```

---

## Summary Statistics

| Category | Endpoint Count | Notes |
|----------|---------------|-------|
| Voice/Audio | 4 | Integration opportunity |
| Authentication | 4 | Complete |
| Service Requests | 5 | Complete |
| Devices | 13 | Well-structured |
| Crew | 5 | Complete |
| Guests | 7 | Complete |
| Locations | 7 | Complete |
| Messages | 7 | Complete |
| Dashboard/Preferences | 10 | Consolidation opportunity |
| Duty Roster | 20 | Complex but organized |
| Settings | 19 | Scattered but functional |
| Backup/System | 10 | Complete |
| Uploads | 2 | Complete |
| Logging/History | 10 | Complete |
| Smart Buttons | 5 | Complete |
| Device Discovery | 5 | Complete |
| **TOTAL** | **133 endpoints** | Across 26 route files |

---

## Recommended Actions

### Immediate (Before METS Demo)
1. ✅ None - All endpoints functional

### Short-term (Post-METS)
1. 🔄 Implement voice upload + transcription integration
2. 📝 Document which endpoints are public vs authenticated
3. 🧪 Add OpenAPI/Swagger documentation

### Long-term
1. 🔄 Consolidate dashboard layout endpoints
2. 📊 Add unified device dashboard endpoint
3. 🔒 Audit permission requirements across all endpoints
4. 📈 Add rate limiting to public endpoints

---

**Generated by**: Claude Code API Inventory Specialist
**Date**: November 17, 2025
**Status**: ✅ Complete inventory of all backend API endpoints
