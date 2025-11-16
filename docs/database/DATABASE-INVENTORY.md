# OBEDIO DATABASE INVENTORY
**Last Updated:** 2025-11-03
**Purpose:** Complete database schema reference - CHECK THIS BEFORE ANY API/DATABASE CHANGE!

---

## 📊 DATABASE OVERVIEW

**Database:** PostgreSQL
**ORM:** Prisma
**Schema File:** `backend/prisma/schema.prisma`
**Total Tables:** 19
**Total Enums:** 7

---

## 🗂️ ALL TABLES IN DATABASE

| # | Table Name | Primary Purpose | Related API Endpoint | Status |
|---|------------|-----------------|----------------------|--------|
| 1 | User | User accounts (login credentials) | `/api/auth` | ✅ Active |
| 2 | UserPreferences | User settings (dashboard, theme, notifications) | `/api/user-preferences` | ✅ Active |
| 3 | CrewMember | Crew profiles and management | `/api/crew` | ✅ Active |
| 4 | Location | Locations (cabins, decks, rooms) | `/api/locations` | ✅ Active |
| 5 | Guest | Guest profiles and info | `/api/guests` | ✅ Active |
| 6 | ServiceRequest | Guest requests from buttons | `/api/service-requests` | ✅ Active |
| 7 | ServiceRequestHistory | Historical service request logs | `/api/service-request-history` | ✅ Active |
| 8 | ServiceCategory | Service request categories | `/api/service-categories` | ✅ Active |
| 9 | Device | Smart devices (buttons, watches, sensors) | `/api/devices` | ✅ Active |
| 10 | DeviceLog | Device event logs | `/api/devices/logs` | ✅ Active |
| 11 | DeviceAssignment | Device-to-crew assignments | Part of `/api/devices` | ✅ Active |
| 12 | Shift | Duty roster shift definitions | `/api/shifts` | ✅ Active |
| 13 | Assignment | Crew shift assignments | `/api/assignments` | ✅ Active |
| 14 | ActivityLog | System activity logs | `/api/activity-logs` | ✅ Active |
| 15 | YachtSettings | Yacht/system settings | `/api/yacht-settings` | ✅ Active |
| 16 | Message | Inter-crew messaging | `/api/messages` | ✅ Active |
| 17 | NotificationSettings | User notification preferences | `/api/notification-settings` | ✅ Active |
| 18 | CrewChangeLog | Crew roster change audit | `/api/crew-change-logs` | ✅ Active |
| 19 | RolePermissions | Role-based permissions config | `/api/role-permissions` | ✅ Active |

---

## 🔗 TABLE DETAILS & RELATIONSHIPS

### 1. User
**Purpose:** User accounts for authentication and authorization
**Primary Key:** `id` (String, cuid)
**Unique Fields:** `username`, `email`

**Fields:**
- `id` - String (PK)
- `username` - String (unique)
- `email` - String (unique)
- `password` - String (hashed)
- `firstName` - String (nullable)
- `lastName` - String (nullable)
- `isActive` - Boolean (default: true)
- `lastLogin` - DateTime (nullable)
- `role` - String (default: "crew")
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Relationships:**
- 1:Many → ActivityLog
- 1:1 → CrewMember (optional)
- 1:Many → Message (as sender)
- 1:Many → Message (as receiver)
- 1:1 → NotificationSettings
- 1:1 → UserPreferences

**API Endpoints:**
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/verify`
- POST `/api/auth/refresh`

---

### 2. UserPreferences
**Purpose:** Per-user settings (dashboard layout, theme, Service Requests preferences)
**Primary Key:** `id` (String, cuid)
**Foreign Key:** `userId` → User (CASCADE delete)

**Fields:**
- `id` - String (PK)
- `userId` - String (FK, unique)
- `dashboardLayout` - Json (nullable)
- `activeWidgets` - Json (nullable)
- `theme` - String (default: "light")
- `language` - String (default: "en")
- `emailNotifications` - Boolean (default: false)
- `notificationEmail` - String (nullable)
- `emergencyContacts` - Json (nullable)
- **Service Requests Settings (12 fields):**
  - `serviceRequestDisplayMode` - String (default: "location")
  - `serviceRequestViewStyle` - String (default: "expanded")
  - `serviceRequestSortOrder` - String (default: "newest")
  - `serviceRequestShowGuestPhotos` - Boolean (default: true)
  - `serviceRequestServingTimeout` - Int (default: 5)
  - `serviceRequestSoundAlerts` - Boolean (default: true)
  - `serviceRequestVisualFlash` - Boolean (default: false)
  - `serviceRequestResponseWarning` - Int (default: 5)
  - `serviceRequestAutoArchive` - Int (default: 30)
  - `serviceRequestAutoPriorityVIP` - Boolean (default: true)
  - `serviceRequestAutoPriorityMaster` - Boolean (default: false)
  - `requestDialogRepeatInterval` - Int (default: 60)
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Relationships:**
- Many:1 → User (CASCADE delete)

**API Endpoints:**
- GET `/api/user-preferences`
- PUT `/api/user-preferences/dashboard`
- PUT `/api/user-preferences/theme`
- PUT `/api/user-preferences/notifications`
- PUT `/api/user-preferences/service-requests` ← **12 Service Requests settings**
- DELETE `/api/user-preferences/dashboard` (reset)

**Important:** Service Requests settings were recently migrated from localStorage to backend!

---

### 3. CrewMember
**Purpose:** Crew profiles, positions, departments, status
**Primary Key:** `id` (String, cuid)
**Foreign Key:** `userId` → User (optional)

**Fields:**
- `id` - String (PK)
- `name` - String
- `position` - String
- `department` - String
- `status` - String (active, on-duty, off-duty, on-leave)
- `contact` - String (nullable)
- `email` - String (nullable)
- `joinDate` - DateTime (nullable)
- `role` - String (nullable)
- `userId` - String (FK, unique, nullable)
- `avatar` - String (nullable)
- `color` - String (default: "#C8A96B")
- `languages` - String[]
- `leaveEnd` - String (nullable)
- `leaveStart` - String (nullable)
- `nickname` - String (nullable)
- `notes` - String (nullable)
- `onBoardContact` - String (nullable)
- `phone` - String (nullable)
- `skills` - String[]
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Relationships:**
- Many:1 → User (optional)
- 1:Many → Assignment
- 1:Many → Device
- 1:Many → DeviceAssignment
- 1:Many → ServiceRequest

**Indexes:**
- `userId`
- `department`
- `status`

**API Endpoints:**
- GET `/api/crew` - List all crew
- POST `/api/crew` - Create crew + auto-generate User account
- PUT `/api/crew/:id` - Update crew
- DELETE `/api/crew/:id` - Delete crew

**Special:** Creating crew auto-generates username/password and creates linked User account!

---

### 4. Location
**Purpose:** Physical locations (cabins, decks, common areas)
**Primary Key:** `id` (String, cuid)
**Unique Fields:** `name`, `smartButtonId`

**Fields:**
- `id` - String (PK)
- `name` - String (unique)
- `type` - String (cabin, common_area, deck, bridge, etc.)
- `floor` - String (nullable)
- `description` - String (nullable)
- `image` - String (nullable)
- `smartButtonId` - String (unique, nullable)
- `doNotDisturb` - Boolean (default: false)
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Relationships:**
- 1:Many → ActivityLog
- 1:Many → Device
- 1:Many → Guest
- 1:Many → ServiceRequest

**API Endpoints:**
- GET `/api/locations`
- POST `/api/locations`
- PUT `/api/locations/:id`
- DELETE `/api/locations/:id`
- POST `/api/locations/:id/toggle-dnd`
- GET `/api/locations/dnd/active`

---

### 5. Guest
**Purpose:** Guest profiles, preferences, dietary info, check-in/out
**Primary Key:** `id` (String, cuid)
**Foreign Key:** `locationId` → Location

**Fields:**
- `id` - String (PK)
- `firstName` - String
- `lastName` - String
- `preferredName` - String (nullable)
- `photo` - String (nullable)
- `type` - GuestType enum (owner, vip, guest, partner, family)
- `status` - GuestStatus enum (expected, onboard, ashore, departed)
- `nationality` - String (nullable)
- `languages` - String[]
- `passportNumber` - String (nullable)
- `locationId` - String (FK, nullable)
- `cabin` - String (deprecated, use locationId)
- `doNotDisturb` - Boolean (default: false)
- **Accommodation:**
  - `checkInDate` - DateTime (nullable)
  - `checkInTime` - String (HH:mm)
  - `checkOutDate` - DateTime (nullable)
  - `checkOutTime` - String (HH:mm)
- **Special Occasions:**
  - `specialOccasion` - String (nullable)
  - `specialOccasionDate` - DateTime (nullable)
- **Dietary & Medical:**
  - `allergies` - String[]
  - `dietaryRestrictions` - String[]
  - `medicalConditions` - String[]
  - `foodDislikes` - String[]
  - `favoriteFoods` - String[]
  - `favoriteDrinks` - String[]
- **Preferences & Notes:**
  - `preferences` - String (nullable)
  - `notes` - String (nullable)
  - `specialRequests` - String (nullable)
  - `vipNotes` - String (nullable)
  - `crewNotes` - String (nullable)
- **Contact Info:**
  - `contactPerson` - Json (nullable)
  - `emergencyContactName` - String (nullable)
  - `emergencyContactPhone` - String (nullable)
  - `emergencyContactRelation` - String (nullable)
  - `email` - String (nullable)
  - `phone` - String (nullable)
- **Metadata:**
  - `createdBy` - String (nullable)
  - `createdAt` - DateTime
  - `updatedAt` - DateTime

**Relationships:**
- 1:Many → ActivityLog
- Many:1 → Location
- 1:Many → ServiceRequest

**Indexes:**
- `locationId`
- `status`
- `type`
- `checkInDate`
- `checkOutDate`

**API Endpoints:**
- GET `/api/guests` - List with filters & pagination
- GET `/api/guests/stats` - Statistics (onboard, expected, VIP, dietary)
- GET `/api/guests/meta` - Filter metadata
- POST `/api/guests` - Create guest
- GET `/api/guests/:id` - Get single guest
- PUT `/api/guests/:id` - Update guest
- DELETE `/api/guests/:id` - Delete guest

---

### 6. ServiceRequest
**Purpose:** Guest requests from button presses
**Primary Key:** `id` (String, cuid)
**Foreign Keys:** `guestId`, `locationId`, `categoryId`, `assignedToId`

**Fields:**
- `id` - String (PK)
- `requestType` - ServiceRequestType enum (call, service, emergency)
- `guestId` - String (FK, nullable)
- `locationId` - String (FK, nullable)
- `cabinId` - String (nullable, legacy)
- `categoryId` - String (FK, nullable)
- `priority` - ServiceRequestPriority enum (low, normal, urgent, emergency)
- `notes` - String (nullable)
- `voiceTranscript` - String (nullable)
- `assignedTo` - String (nullable, legacy)
- `assignedToId` - String (FK, nullable)
- `guestName` - String (nullable)
- `guestCabin` - String (nullable)
- `acceptedAt` - DateTime (nullable)
- `completedAt` - DateTime (nullable)
- `status` - String (default: "pending")
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Relationships:**
- Many:1 → CrewMember (assignedToId)
- Many:1 → ServiceCategory
- Many:1 → Guest
- Many:1 → Location

**Indexes:**
- `guestId`
- `locationId`
- `categoryId`
- `priority`
- `assignedToId`
- `createdAt`

**API Endpoints:**
- GET `/api/service-requests` - List with filters
- POST `/api/service-requests` - Create request
- PUT `/api/service-requests/:id/accept` - Accept request
- PUT `/api/service-requests/:id/complete` - Complete request

**WebSocket Events:**
- `service-request:created`
- `service-request:assigned`
- `service-request:completed`
- `service-request:status-changed`

---

### 7. ServiceRequestHistory
**Purpose:** Historical log of completed service requests (analytics)
**Primary Key:** `id` (String, cuid)

**Fields:**
- `id` - String (PK)
- `serviceRequestId` - String (nullable)
- `originalRequestId` - String (nullable)
- `action` - String
- `notes` - String (nullable)
- `userId` - String (nullable)
- `metadata` - Json (nullable)
- `completedBy` - String (nullable)
- `completedAt` - DateTime (nullable)
- `responseTime` - Int (nullable)
- `completionTime` - Int (nullable)
- `guestName` - String (nullable)
- `location` - String (nullable)
- `requestType` - ServiceRequestType enum (nullable)
- `priority` - ServiceRequestPriority enum (nullable)
- `newStatus` - String (default: "pending")
- `createdAt` - DateTime

**Indexes:**
- `serviceRequestId`
- `originalRequestId`
- `createdAt`

**API Endpoints:**
- GET `/api/service-request-history`
- POST `/api/service-request-history`
- GET `/api/service-request-history/request/:id`
- GET `/api/service-request-history/completed`

**Used For:** Analytics, performance tracking, crew response time metrics

---

### 8. ServiceCategory
**Purpose:** Service request categorization
**Primary Key:** `id` (String, cuid)
**Unique Fields:** `name`

**Fields:**
- `id` - String (PK)
- `name` - String (unique)
- `icon` - String (default: "tag")
- `color` - String (default: "gray")
- `description` - String (nullable)
- `order` - Int (default: 0)
- `isActive` - Boolean (default: true)
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Relationships:**
- 1:Many → ServiceRequest

**API Endpoints:**
- GET `/api/service-categories`
- POST `/api/service-categories`
- PUT `/api/service-categories/:id`
- DELETE `/api/service-categories/:id`
- PUT `/api/service-categories/reorder`

---

### 9. Device
**Purpose:** Smart devices (buttons, watches, sensors)
**Primary Key:** `id` (String, cuid)
**Unique Fields:** `deviceId`
**Foreign Keys:** `locationId`, `crewMemberId`

**Fields:**
- `id` - String (PK)
- `deviceId` - String (unique)
- `name` - String
- `type` - String (smart_button, smart_watch, sensor, etc.)
- `subType` - String (nullable)
- `status` - DeviceStatus enum (online, offline, low_battery, error)
- `locationId` - String (FK, nullable)
- `crewMemberId` - String (FK, nullable)
- `batteryLevel` - Int (nullable)
- `signalStrength` - Int (nullable)
- `connectionType` - String (nullable)
- `lastSeen` - DateTime (nullable)
- `config` - Json (nullable)
- `firmwareVersion` - String (nullable)
- `hardwareVersion` - String (nullable)
- `macAddress` - String (nullable)
- `ipAddress` - String (nullable)
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Relationships:**
- 1:Many → ActivityLog
- Many:1 → CrewMember
- Many:1 → Location
- 1:Many → DeviceAssignment
- 1:Many → DeviceLog

**Indexes:**
- `locationId`
- `crewMemberId`
- `status`
- `type`
- `lastSeen`

**API Endpoints:**
- GET `/api/devices` - List with filters
- GET `/api/devices/logs` - All device logs
- GET `/api/devices/stats/summary` - Statistics
- GET `/api/devices/:id` - Single device
- POST `/api/devices` - Create device
- PUT `/api/devices/:id` - Update device
- DELETE `/api/devices/:id` - Delete device
- GET `/api/devices/:id/config` - Get config
- PUT `/api/devices/:id/config` - Update config
- POST `/api/devices/:id/test` - Test signal
- GET `/api/devices/:id/logs` - Device-specific logs

---

### 10. DeviceLog
**Purpose:** Event logs for devices (status changes, errors, events)
**Primary Key:** `id` (String, cuid)
**Foreign Key:** `deviceId` → Device (CASCADE delete)

**Fields:**
- `id` - String (PK)
- `deviceId` - String (FK)
- `eventType` - String
- `eventData` - Json (nullable)
- `severity` - String (default: "info")
- `createdAt` - DateTime

**Relationships:**
- Many:1 → Device (CASCADE delete)

**Indexes:**
- `deviceId`
- `eventType`
- `createdAt`

**API Endpoints:**
- Accessed via `/api/devices/logs` and `/api/devices/:id/logs`

---

### 11. DeviceAssignment
**Purpose:** Assignment of devices to crew members
**Primary Key:** `id` (String, cuid)
**Foreign Keys:** `deviceId`, `crewMemberId`
**Unique Constraint:** `(deviceId, crewMemberId)`

**Fields:**
- `id` - String (PK)
- `deviceId` - String (FK)
- `crewMemberId` - String (FK)
- `assignedAt` - DateTime
- `notes` - String (nullable)

**Relationships:**
- Many:1 → CrewMember
- Many:1 → Device

**API Endpoints:**
- Part of `/api/devices` endpoints

---

### 12. Shift
**Purpose:** Duty roster shift definitions (Morning, Day, Evening, Night)
**Primary Key:** `id` (String, cuid)

**Fields:**
- `id` - String (PK)
- `name` - String
- `startTime` - String (HH:mm format)
- `endTime` - String (HH:mm format)
- `color` - String (default: "#3B82F6")
- `description` - String (nullable)
- `isActive` - Boolean (default: true)
- `order` - Int (default: 0)
- `primaryCount` - Int (default: 2)
- `backupCount` - Int (default: 1)
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Relationships:**
- 1:Many → Assignment

**Indexes:**
- `isActive`

**API Endpoints:**
- GET `/api/shifts` - All shifts
- GET `/api/shifts/active` - Active shifts only
- GET `/api/shifts/:id` - Single shift
- POST `/api/shifts` - Create shift
- PUT `/api/shifts/:id` - Update shift
- DELETE `/api/shifts/:id` - Delete shift
- POST `/api/shifts/:id/toggle-active` - Toggle active
- POST `/api/shifts/reorder` - Reorder shifts

---

### 13. Assignment
**Purpose:** Crew assignments to shifts (duty roster)
**Primary Key:** `id` (String, cuid)
**Foreign Keys:** `shiftId`, `crewMemberId`
**Unique Constraint:** `(date, shiftId, crewMemberId, type)`

**Fields:**
- `id` - String (PK)
- `date` - String (YYYY-MM-DD format)
- `shiftId` - String (FK)
- `crewMemberId` - String (FK)
- `type` - String (primary, backup)
- `notes` - String (nullable)
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Relationships:**
- Many:1 → CrewMember (CASCADE delete)
- Many:1 → Shift (CASCADE delete)

**Indexes:**
- `date`
- `shiftId`
- `crewMemberId`
- `type`

**API Endpoints:**
- GET `/api/assignments` - All with filters
- GET `/api/assignments/by-date/:date` - For specific date
- GET `/api/assignments/by-week/:startDate` - For week
- GET `/api/assignments/crew/:crewMemberId` - For crew member
- GET `/api/assignments/:id` - Single assignment
- POST `/api/assignments` - Create assignment
- POST `/api/assignments/bulk` - Create multiple
- PUT `/api/assignments/:id` - Update
- DELETE `/api/assignments/:id` - Delete single
- DELETE `/api/assignments/by-date/:date` - Delete all for date
- DELETE `/api/assignments/crew/:crewMemberId` - Delete all for crew

---

### 14. ActivityLog
**Purpose:** System-wide activity logging
**Primary Key:** `id` (String, cuid)
**Foreign Keys:** `userId`, `locationId`, `guestId`, `deviceId`

**Fields:**
- `id` - String (PK)
- `action` - String
- `details` - String (nullable)
- `userId` - String (FK, nullable)
- `locationId` - String (FK, nullable)
- `guestId` - String (FK, nullable)
- `deviceId` - String (FK, nullable)
- `metadata` - String (nullable)
- `timestamp` - DateTime
- `createdAt` - DateTime
- `type` - String (default: "info")

**Relationships:**
- Many:1 → Device
- Many:1 → Guest
- Many:1 → Location
- Many:1 → User

**API Endpoints:**
- GET `/api/activity-logs` - List with filters & pagination
- POST `/api/activity-logs` - Create log entry

---

### 15. YachtSettings
**Purpose:** System-wide yacht settings
**Primary Key:** `id` (String, cuid)

**Fields:**
- `id` - String (PK)
- `name` - String (default: "Serenity")
- `type` - String (default: "motor")
- `timezone` - String (default: "Europe/Monaco")
- `floors` - String[] (default: ["Lower Deck", "Main Deck", "Upper Deck", "Sun Deck"])
- `dateFormat` - String (default: "DD/MM/YYYY")
- `timeFormat` - String (default: "24h")
- `weatherUnits` - String (default: "metric")
- `windSpeedUnits` - String (default: "knots")
- `weatherUpdateInterval` - Int (default: 30)
- **GPS Location:**
  - `latitude` - Float (nullable)
  - `longitude` - Float (nullable)
  - `accuracy` - Float (nullable)
  - `locationName` - String (nullable)
  - `locationUpdatedAt` - DateTime (nullable)
- `createdAt` - DateTime
- `updatedAt` - DateTime

**API Endpoints:**
- GET `/api/yacht-settings`
- PUT `/api/yacht-settings`

---

### 16. Message
**Purpose:** Inter-crew messaging system
**Primary Key:** `id` (String, cuid)
**Foreign Keys:** `senderId`, `receiverId`

**Fields:**
- `id` - String (PK)
- `senderId` - String (FK)
- `receiverId` - String (FK, nullable)
- `content` - String
- `type` - MessageType enum (text, alert, announcement)
- `priority` - MessagePriority enum (low, normal, high, urgent)
- `isRead` - Boolean (default: false)
- `readAt` - DateTime (nullable)
- `createdAt` - DateTime

**Relationships:**
- Many:1 → User (receiver)
- Many:1 → User (sender)

**Indexes:**
- `senderId`
- `receiverId`
- `createdAt`

**API Endpoints:**
- GET `/api/messages` - User's messages
- GET `/api/messages/conversation/:id` - Conversation
- POST `/api/messages` - Send message
- PUT `/api/messages/:id/read` - Mark as read
- PUT `/api/messages/mark-all-read` - Mark all as read
- DELETE `/api/messages/:id` - Delete message
- GET `/api/messages/unread-count` - Unread count

---

### 17. NotificationSettings
**Purpose:** User notification preferences
**Primary Key:** `id` (String, cuid)
**Foreign Key:** `userId` → User (CASCADE delete)

**Fields:**
- `id` - String (PK)
- `userId` - String (FK, unique)
- `pushEnabled` - Boolean (default: true)
- `pushToken` - String (nullable)
- `serviceRequests` - Boolean (default: true)
- `emergencyAlerts` - Boolean (default: true)
- `systemMessages` - Boolean (default: true)
- `guestMessages` - Boolean (default: true)
- `crewMessages` - Boolean (default: true)
- `quietHoursEnabled` - Boolean (default: false)
- `quietHoursStart` - String (nullable)
- `quietHoursEnd` - String (nullable)
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Relationships:**
- Many:1 → User (CASCADE delete)

**API Endpoints:**
- GET `/api/notification-settings`
- PUT `/api/notification-settings`
- POST `/api/notification-settings/register-token`

---

### 18. CrewChangeLog
**Purpose:** Audit trail for crew roster changes
**Primary Key:** `id` (String, cuid)

**Fields:**
- `id` - String (PK)
- `crewMemberId` - String
- `changeType` - String
- `fieldName` - String
- `oldValue` - String (nullable)
- `newValue` - String
- `changedBy` - String (nullable)
- `reason` - String (nullable)
- `createdAt` - DateTime

**Indexes:**
- `crewMemberId`
- `changeType`
- `createdAt`

**API Endpoints:**
- GET `/api/crew-change-logs`
- POST `/api/crew-change-logs`
- GET `/api/crew-change-logs/crew/:id`
- POST `/api/crew-change-logs/bulk`
- GET `/api/crew-change-logs/recent`

---

### 19. RolePermissions
**Purpose:** Role-based permission configuration
**Primary Key:** `id` (String, cuid)
**Unique Fields:** `role`

**Fields:**
- `id` - String (PK)
- `role` - String (unique)
- `permissions` - Json
- `createdAt` - DateTime
- `updatedAt` - DateTime

**API Endpoints:**
- GET `/api/role-permissions/roles/:role`
- GET `/api/role-permissions/roles`
- PUT `/api/role-permissions/:id/config`
- POST `/api/role-permissions/roles/:role/reset`

---

## 🏷️ ENUMS

### 1. DeviceStatus
```prisma
enum DeviceStatus {
  online
  offline
  low_battery
  error
}
```

### 2. GuestStatus
```prisma
enum GuestStatus {
  expected
  onboard
  ashore
  departed
}
```

### 3. GuestType
```prisma
enum GuestType {
  owner
  vip
  guest
  partner
  family
}
```

### 4. MessagePriority
```prisma
enum MessagePriority {
  low
  normal
  high
  urgent
}
```

### 5. MessageType
```prisma
enum MessageType {
  text
  alert
  announcement
}
```

### 6. ServiceRequestPriority
```prisma
enum ServiceRequestPriority {
  low
  normal
  urgent
  emergency
}
```

### 7. ServiceRequestType
```prisma
enum ServiceRequestType {
  call
  service
  emergency
}
```

---

## ⚠️ IMPORTANT PATTERNS & RULES

### 1. NO DUPLICATES ALLOWED
Before creating a new table or API:
- ✅ Check this document
- ✅ Check `OBEDIO-API-MASTER-REFERENCE.md`
- ✅ Search `backend/src/routes/` for existing endpoints
- ❌ NEVER create duplicate tables
- ❌ NEVER create duplicate APIs for existing tables

### 2. CASCADE DELETE RULES
- `UserPreferences` → CASCADE delete with User
- `NotificationSettings` → CASCADE delete with User
- `DeviceLog` → CASCADE delete with Device
- `Assignment` → CASCADE delete with CrewMember AND Shift

### 3. INDEXES FOR PERFORMANCE
**Existing Indexes:**
- User: none (uses unique constraints)
- CrewMember: `userId`, `department`, `status`
- Guest: `locationId`, `status`, `type`, `checkInDate`, `checkOutDate`
- ServiceRequest: `guestId`, `locationId`, `categoryId`, `priority`, `assignedToId`, `createdAt`
- Device: `locationId`, `crewMemberId`, `status`, `type`, `lastSeen`
- DeviceLog: `deviceId`, `eventType`, `createdAt`
- Assignment: `date`, `shiftId`, `crewMemberId`, `type`
- Message: `senderId`, `receiverId`, `createdAt`
- Shift: `isActive`
- ServiceRequestHistory: `serviceRequestId`, `originalRequestId`, `createdAt`
- CrewChangeLog: `crewMemberId`, `changeType`, `createdAt`

**Missing Indexes (potential performance issues):**
- ServiceRequest: `status` ← **Should add for filtering**
- ActivityLog: `type`, `timestamp` ← **Should add for filtering**
- DeviceLog: `severity` ← **Should add for filtering**

### 4. UNIQUE CONSTRAINTS
- User: `username`, `email`
- Location: `name`, `smartButtonId`
- Device: `deviceId`
- ServiceCategory: `name`
- RolePermissions: `role`
- DeviceAssignment: `(deviceId, crewMemberId)` composite
- Assignment: `(date, shiftId, crewMemberId, type)` composite

### 5. DEPRECATED FIELDS (DO NOT USE!)
- Guest: `cabin` ← Use `locationId` instead
- ServiceRequest: `assignedTo`, `cabinId` ← Use `assignedToId`, `locationId`

---

## 📊 TABLE-TO-API MAPPING

| Table | Primary API Route | Additional Routes |
|-------|-------------------|-------------------|
| User | `/api/auth` | - |
| UserPreferences | `/api/user-preferences` | `/api/dashboard` (layout part) |
| CrewMember | `/api/crew` | - |
| Location | `/api/locations` | - |
| Guest | `/api/guests` | - |
| ServiceRequest | `/api/service-requests` | - |
| ServiceRequestHistory | `/api/service-request-history` | - |
| ServiceCategory | `/api/service-categories` | - |
| Device | `/api/devices` | `/api/device-discovery`, `/api/smart-buttons` |
| DeviceLog | `/api/devices/logs` | `/api/devices/:id/logs` |
| DeviceAssignment | Part of `/api/devices` | - |
| Shift | `/api/shifts` | - |
| Assignment | `/api/assignments` | - |
| ActivityLog | `/api/activity-logs` | - |
| YachtSettings | `/api/yacht-settings` | - |
| Message | `/api/messages` | - |
| NotificationSettings | `/api/notification-settings` | - |
| CrewChangeLog | `/api/crew-change-logs` | - |
| RolePermissions | `/api/role-permissions` | - |

---

## ✅ CHECKLIST BEFORE ANY DATABASE/API CHANGE

```markdown
[ ] Read DATABASE-INVENTORY.md (this file)
[ ] Read OBEDIO-API-MASTER-REFERENCE.md
[ ] Search backend/src/routes/ for existing endpoints
[ ] Verify table exists in schema.prisma
[ ] Check for duplicate tables/APIs
[ ] Check CASCADE delete rules if modifying relationships
[ ] Verify indexes exist for frequently queried fields
[ ] Check enum usage (don't use strings for enum fields!)
[ ] Update this document if adding new table/field
[ ] Update OBEDIO-API-MASTER-REFERENCE.md if adding/modifying API
```

---

## 🚨 COMMON MISTAKES TO AVOID

1. ❌ Creating new table when existing one can be extended
2. ❌ Creating new API endpoint when existing one can accept new parameter
3. ❌ Using String for status fields that should use Enum
4. ❌ Forgetting to add indexes on frequently filtered fields
5. ❌ Not cascading deletes properly (orphaned records)
6. ❌ Creating duplicate APIs for same table
7. ❌ Hardcoding uppercase/lowercase status instead of using Enum
8. ❌ Using deprecated fields (cabin, assignedTo, cabinId)

---

**Last Updated:** 2025-11-03
**Maintained By:** Claude Code Assistant
**Next Review:** Before ANY database or API change
**Status:** ACTIVE - MUST CONSULT BEFORE CHANGES
