# OBEDIO YACHT MANAGEMENT - MASTER API DOCUMENTATION
## Kompletna lista svih API endpoints, database modela i integracija

**Datum kreiranja**: 2025-10-30
**Verzija**: 1.0.0
**Status**: Production System (sa identifikovanim greškama nakon commit 8c24e96)

---

## EXECUTIVE SUMMARY

### Status sistema:
- **Backend endpoints**: 157 ukupno
- **Frontend API poziva**: 60 ukupno
- **Database modeli**: 20 Prisma modela
- **Kritične greške**: 11 identifikovanih
- **Nedostajući endpoints**: 3
- **Broken API pozivi**: 6 (api.guests.*)

### Root Cause Analysis:
**PROBLEM**: Commit `8c24e96` ("Major codebase cleanup and feature additions") je obrisao 46,488 linija koda i promenio 420 fajlova, što je uzrokovalo:
1. Frontend API pozivi `api.guests.*` ne postoje više
2. Database enum mismatch-evi (on_leave vs on-leave)
3. Duplirani constraint-i u database
4. Missing permission checks na 63 endpoints
5. Missing rate limiting na 143 endpoints

---

## 1. DATABASE ARHITEKTURA

### 1.1 PRISMA MODELI (20 modela)

#### **User** - Korisnički nalozi
```prisma
model User {
  id           String        @id @default(cuid())
  username     String        @unique
  email        String        @unique
  password     String        // bcrypt hashed
  role         UserRole      // admin, chief-stewardess, stewardess, crew, eto
  firstName    String?
  lastName     String?
  isActive     Boolean       @default(true)
  lastLogin    DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}
```
**Relacije**: CrewMember (1:1), ActivityLogs (1:N), UserPreferences (1:1), Messages (1:N)

---

#### **CrewMember** - Posada jahte
```prisma
model CrewMember {
  id         String   @id @default(cuid())
  name       String
  position   String   // Chief Stewardess, Stewardess, Deckhand, itd.
  department String   // Interior, Deck, Engine, Galley
  status     CrewMemberStatus // active, on-duty, off-duty, on-leave
  avatar     String?
  color      String   @default("#C8A96B")
  userId     String?  @unique
}
```
**Relacije**: User (1:1), DeviceAssignments (1:N), Devices (1:N), ServiceRequests (1:N), Assignments (1:N)

**⚠️ KRITIČNI BUG**: Enum values su `on-duty` (dash) ali seed.ts koristi `on_leave` (underscore)!

---

#### **Guest** - Gosti na jahti
```prisma
model Guest {
  id             String      @id @default(cuid())
  firstName      String
  lastName       String
  type           GuestType   @default(guest) // owner, vip, guest, partner, family
  status         GuestStatus @default(onboard) // expected, onboard, ashore, departed
  locationId     String?     // Cabin/location assignment
  allergies      String[]    @default([])
  dietaryRestrictions String[] @default([])
  preferences    String?
  doNotDisturb   Boolean     @default(false)
}
```
**Relacije**: Location (N:1), ServiceRequests (1:N), ActivityLogs (1:N)

**Constraint**: `checkOutDate > checkInDate` (CHECK constraint)

---

#### **Location** - Kabine i lokacije na jahti
```prisma
model Location {
  id             String   @id @default(cuid())
  name           String   @unique // "Master Bedroom", "VIP Cabin #1"
  type           String   // "cabin", "suite", "public"
  floor          String?  // "Sun Deck", "Main Deck", "Lower Deck"
  smartButtonId  String?  @unique // Unique - jedna lokacija = jedan button
  doNotDisturb   Boolean  @default(false)
  image          String?  // URL slike lokacije
}
```
**Relacije**: Guests (1:N), ServiceRequests (1:N), Devices (1:N), ActivityLogs (1:N)

**KRITIČNO**: `smartButtonId` je UNIQUE - samo jedan smart button može biti na jednoj lokaciji!

---

#### **Device** - IoT uređaji (ESP32, T-Watch, Mobile apps)
```prisma
model Device {
  id              String        @id @default(cuid())
  deviceId        String        @unique // BTN-001, WCH-001, APP-IOS-001
  name            String
  type            String        // "smart_button", "watch", "repeater", "mobile_app"
  subType         String?       // "esp32", "twatch_s3", "ios", "android", "wearos"
  status          DeviceStatus  @default(online) // online, offline, low_battery, error
  locationId      String?
  crewMemberId    String?
  batteryLevel    Int?          // 0-100
  signalStrength  Int?          // RSSI -120 to 0
  lastSeen        DateTime?
  config          Json?         // Device configuration
}
```
**Relacije**: Location (N:1), CrewMember (N:1), DeviceAssignments (1:N), DeviceLogs (1:N), ActivityLogs (1:N)

**Constraint-i**:
- `batteryLevel BETWEEN 0 AND 100`
- `signalStrength BETWEEN -120 AND 0`

---

#### **ServiceRequest** - Service requests od gostiju
```prisma
model ServiceRequest {
  id          String   @id @default(cuid())
  requestType ServiceRequestType @default(call) // call, service, emergency
  priority    ServiceRequestPriority @default(normal) // low, normal, urgent, emergency
  status      ServiceRequestStatus @default(pending) // pending, accepted, completed, cancelled
  guestId     String?
  locationId  String?
  categoryId  String?
  assignedToId String? // FK to CrewMember
  notes       String?
  voiceTranscript String?
  acceptedAt  DateTime?
  completedAt DateTime?
}
```
**Relacije**: Guest (N:1), Location (N:1), ServiceCategory (N:1), AssignedCrew (N:1)

**Constraint**: `completedAt >= acceptedAt`

---

#### **ServiceCategory** - Kategorije service requests
```prisma
model ServiceCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  icon        String   @default("tag")
  color       String   @default("gray")
  order       Int      @default(0)
  isActive    Boolean  @default(true)
}
```

---

#### **Shift** - Radne smene za duty roster
```prisma
model Shift {
  id           String   @id @default(cuid())
  name         String   // "Morning", "Afternoon", "Night"
  startTime    String   // "08:00"
  endTime      String   // "20:00"
  color        String   @default("#3B82F6")
  isActive     Boolean  @default(true)
  primaryCount Int      @default(2) // Koliko primary crew članova treba
  backupCount  Int      @default(1) // Koliko backup crew članova treba
}
```

---

#### **Assignment** - Duty roster assignments
```prisma
model Assignment {
  id           String   @id @default(cuid())
  date         String   // ISO date "2025-10-23"
  shiftId      String
  crewMemberId String
  type         String   // "primary" or "backup"
}
```
**Constraint**: UNIQUE (date, shiftId, crewMemberId, type)

---

#### **ActivityLog** - Sistem activity logs
```prisma
model ActivityLog {
  id         String          @id @default(cuid())
  type       ActivityLogType // CREW, GUEST, SERVICE_REQUEST, DEVICE, DND, SYSTEM
  action     String
  details    String?
  userId     String?
  locationId String?
  guestId    String?
  deviceId   String?
  timestamp  DateTime        @default(now())
}
```

---

#### **Message** - Inter-crew messaging
```prisma
model Message {
  id         String          @id @default(cuid())
  senderId   String
  receiverId String?         // Null = broadcast
  content    String
  type       MessageType     @default(text) // text, alert, announcement
  priority   MessagePriority @default(normal) // low, normal, high, urgent
  isRead     Boolean  @default(false)
  readAt     DateTime?
}
```

**⚠️ PROBLEM**: ON DELETE RESTRICT na senderId blokira brisanje korisnika!

---

#### **YachtSettings** - Yacht konfiguracija
```prisma
model YachtSettings {
  id              String   @id @default(cuid())
  name            String   @default("Serenity")
  type            String   @default("motor")
  timezone        String   @default("Europe/Monaco")
  floors          String[] @default(["Lower Deck", "Main Deck", "Upper Deck", "Sun Deck"])
  dateFormat      String   @default("DD/MM/YYYY")
  timeFormat      String   @default("24h")
}
```

---

### 1.2 CONSTRAINT-I I INDEXI

#### Check Constraints:
1. `Guest.checkOutDate > Guest.checkInDate`
2. `Device.batteryLevel BETWEEN 0 AND 100`
3. `Device.signalStrength BETWEEN -120 AND 0`
4. `ServiceRequest.completedAt >= ServiceRequest.acceptedAt`

**🔴 KRITIČNI BUG**: `Guest_checkDates_check` je duplikat - postoje 2 ista constraint-a!

#### Foreign Key Constraints sa ON DELETE RESTRICT:
1. `DeviceAssignment → Device` - **BLOKIRA** brisanje device-a
2. `DeviceAssignment → CrewMember` - **BLOKIRA** brisanje crew membera
3. `Message.senderId → User` - **BLOKIRA** brisanje usera

#### Indexi:
**Postojeći**:
- `CrewMember`: userId, department, status
- `Guest`: locationId, status, type, checkInDate, checkOutDate
- `ServiceRequest`: guestId, locationId, categoryId, status, priority, assignedToId, createdAt
- `Device`: locationId, crewMemberId, status, type, lastSeen
- `Assignment`: date, shiftId, crewMemberId, type

**⚠️ NEDOSTAJU**:
- `ActivityLog.guestId`
- `ActivityLog.deviceId`
- `DeviceAssignment.crewMemberId`
- `CrewMember.leaveStart`, `leaveEnd`
- `Guest.email`, `phone`

---

## 2. BACKEND API ENDPOINTS (157 total)

### 2.1 AUTHENTICATION (`/api/auth`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/auth/login` | POST | ❌ | ❌ | ✅ 100/15min | ✅ OK |
| `/api/auth/refresh` | POST | ❌ | ❌ | ✅ 10/15min | ✅ OK |
| `/api/auth/verify` | GET | ❌ | ❌ | ✅ 10/15min | ✅ OK |
| `/api/auth/setup-password` | POST | ❌ | ❌ | ✅ 10/15min | ✅ OK |
| `/api/auth/logout` | POST | ❌ | ❌ | ❌ | ✅ OK |

**Prisma Models**: User
**Implementacija**: `backend/src/routes/auth.ts`

---

### 2.2 CREW MEMBERS (`/api/crew`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/crew` | GET | ✅ | `crew.view` | ❌ | ✅ OK |
| `/api/crew` | POST | ✅ | `crew.create` | ❌ | ✅ OK |
| `/api/crew/:id` | GET | ❌ | ❌ | ❌ | ❌ **MISSING** |
| `/api/crew/:id` | PUT | ✅ | `crew.edit` | ❌ | ✅ OK |
| `/api/crew/:id` | DELETE | ✅ | `crew.delete` | ❌ | ✅ OK |

**Prisma Models**: CrewMember, User
**WebSocket**: ✅ DA (crew:updated)
**Auto-generates**: Username, password, setup token pri kreiranju

**🔴 PROBLEM**: Nedostaje `GET /api/crew/:id` endpoint!

---

### 2.3 GUESTS (`/api/guests`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/guests` | GET | ✅ | `guests.view` | ❌ | ✅ OK |
| `/api/guests/stats` | GET | ✅ | `guests.view` | ❌ | ✅ OK |
| `/api/guests/meta` | GET | ✅ | `guests.view` | ❌ | ✅ OK |
| `/api/guests` | POST | ✅ | `guests.create` | ✅ General | ✅ OK |
| `/api/guests/:id` | GET | ✅ | `guests.view` | ❌ | ✅ OK |
| `/api/guests/:id` | PUT | ✅ | `guests.edit` | ❌ | ✅ OK |
| `/api/guests/:id` | DELETE | ✅ | `guests.delete` | ❌ | ✅ OK |

**Prisma Models**: Guest, Location, ServiceRequest
**Validacija**: ✅ Zod schemas, state machine validacija
**Filteri**: status, type, diet, allergy, cabin, vip
**Pagination**: ✅ DA

**ODLIČNO**: Kompletna implementacija sa state machine!

---

### 2.4 SERVICE REQUESTS (`/api/service-requests`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/service-requests` | GET | ✅ | `service-requests.view` | ❌ | ✅ OK |
| `/api/service-requests` | POST | ✅ | `service-requests.create` | ✅ General | ✅ OK |
| `/api/service-requests/:id` | GET | ✅ | `service-requests.view` | ❌ | ✅ OK |
| `/api/service-requests/:id` | PUT | ✅ | `service-requests.edit` | ❌ | ✅ OK |
| `/api/service-requests/:id` | DELETE | ❌ | ❌ | ❌ | ❌ **MISSING** |
| `/api/service-requests/:id/accept` | POST | ✅ | `service-requests.accept` | ❌ | ✅ OK |
| `/api/service-requests/:id/delegate` | POST | ✅ | `service-requests.delegate` | ❌ | ✅ OK |
| `/api/service-requests/:id/complete` | POST | ✅ | `service-requests.complete` | ❌ | ✅ OK |
| `/api/service-requests/:id/cancel` | POST | ✅ | `service-requests.cancel` | ❌ | ✅ OK |

**Prisma Models**: ServiceRequest, Guest, Location, CrewMember, ServiceCategory
**WebSocket**: ✅ DA (service-request:new, service-request:updated)

**🔴 PROBLEM**: Nedostaje DELETE endpoint!

---

### 2.5 LOCATIONS (`/api/locations`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/locations` | GET | ✅ | `locations.view` | ❌ | ✅ OK |
| `/api/locations/:id` | GET | ✅ | `locations.view` | ❌ | ✅ OK |
| `/api/locations` | POST | ✅ | `locations.create` | ❌ | ✅ OK |
| `/api/locations/:id` | PUT | ✅ | `locations.edit` | ❌ | ✅ OK |
| `/api/locations/:id` | DELETE | ✅ | `locations.delete` | ❌ | ✅ OK |
| `/api/locations/:id/toggle-dnd` | POST | ✅ | `locations.edit` | ❌ | ✅ OK |
| `/api/locations/dnd/active` | GET | ✅ | `locations.view` | ❌ | ✅ OK |

**Prisma Models**: Location, Guest, ServiceRequest, Device
**WebSocket**: ✅ DA (location:dnd-toggle)
**Validacija**: Prevents duplicate smart button assignments

---

### 2.6 DEVICES (`/api/devices`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/devices` | GET | ✅ | `devices.view` | ❌ | ✅ OK |
| `/api/devices/logs` | GET | ✅ | `devices.view` | ❌ | ✅ OK |
| `/api/devices/stats/summary` | GET | ✅ | `devices.view` | ❌ | ✅ OK |
| `/api/devices/:id` | GET | ✅ | `devices.view` | ❌ | ✅ OK |
| `/api/devices` | POST | ✅ | `devices.add` | ❌ | ✅ OK |
| `/api/devices/:id` | PUT | ✅ | `devices.edit` | ❌ | ✅ OK |
| `/api/devices/:id` | DELETE | ✅ | `devices.delete` | ❌ | ✅ OK |
| `/api/devices/:id/config` | GET | ✅ | `devices.view` | ❌ | ✅ OK |
| `/api/devices/:id/config` | PUT | ✅ | `devices.edit` | ❌ | ✅ OK |
| `/api/devices/:id/test` | POST | ✅ | `devices.edit` | ✅ 20/10min | ✅ OK |
| `/api/devices/:id/logs` | GET | ✅ | `devices.view` | ❌ | ✅ OK |

**Prisma Models**: Device, DeviceLog, Location, CrewMember
**MQTT Integration**: ✅ DA (publishes config to MQTT)
**WebSocket**: ✅ DA (device events)

---

### 2.7 SMART BUTTONS (`/api/smart-buttons`) - ESP32 Integration

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/smart-buttons/press` | POST | ✅ ESP32 | ❌ | ❌ | ✅ OK |
| `/api/smart-buttons/status/:deviceId` | POST | ✅ ESP32 | ❌ | ❌ | ✅ OK |
| `/api/smart-buttons/telemetry/:deviceId` | POST | ✅ ESP32 | ❌ | ❌ | ✅ OK |
| `/api/smart-buttons/test/:deviceId` | POST | ✅ ESP32 | ❌ | ❌ | ✅ OK |
| `/api/smart-buttons/mqtt-status` | GET | ✅ | ❌ | ❌ | ⚠️ OK |

**Auth**: ESP32 API Key (`X-ESP32-API-KEY` header)
**MQTT Integration**: ✅ DA
**Prisma Models**: Device, DeviceLog, Location, ServiceRequest

**⚠️ PROBLEM**: Nema rate limiting - ESP32 može spamovati!

---

### 2.8 DEVICE DISCOVERY (`/api/device-discovery`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/device-discovery/discover` | POST | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/device-discovery/pairing` | GET | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/device-discovery/pair/:deviceId` | POST | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/device-discovery/simulate-announce` | POST | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/device-discovery/pairing/:deviceId` | DELETE | ✅ | ❌ | ❌ | ⚠️ OK |

**MQTT Integration**: ✅ DA (discovery protocol)
**WebSocket**: ✅ DA (device-discovered event)

**⚠️ PROBLEM**: Nema permission checks - bilo ko može pair devices!

---

### 2.9 ASSIGNMENTS (`/api/assignments`) - Duty Roster

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/assignments` | GET | ✅ | `duty.view` | ❌ | ✅ OK |
| `/api/assignments/by-date/:date` | GET | ✅ | `duty.view` | ❌ | ✅ OK |
| `/api/assignments/by-week/:startDate` | GET | ✅ | `duty.view` | ❌ | ✅ OK |
| `/api/assignments/crew/:crewMemberId` | GET | ✅ | `duty.view` | ❌ | ✅ OK |
| `/api/assignments/:id` | GET | ✅ | `duty.view` | ❌ | ✅ OK |
| `/api/assignments` | POST | ✅ | `duty.manage` | ❌ | ✅ OK |
| `/api/assignments/bulk` | POST | ✅ | `duty.manage` | ❌ | ✅ OK |
| `/api/assignments/:id` | PUT | ✅ | `duty.manage` | ❌ | ✅ OK |
| `/api/assignments/:id` | DELETE | ✅ | `duty.manage` | ❌ | ✅ OK |
| `/api/assignments/by-date/:date` | DELETE | ✅ | `assignments.delete` | ❌ | ✅ OK |
| `/api/assignments/crew/:crewMemberId` | DELETE | ✅ | `duty.manage` | ❌ | ✅ OK |

**Prisma Models**: Assignment, Shift
**Transakcije**: ✅ DA (bulk save)
**ODLIČNO**: Kompletna CRUD + bulk operations!

---

### 2.10 SHIFTS (`/api/shifts`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/shifts` | GET | ✅ | `shifts.view` | ❌ | ✅ OK |
| `/api/shifts/active` | GET | ✅ | `shifts.view` | ❌ | ✅ OK |
| `/api/shifts/:id` | GET | ✅ | `shifts.view` | ❌ | ✅ OK |
| `/api/shifts` | POST | ✅ | `shifts.create` | ❌ | ✅ OK |
| `/api/shifts/:id` | PUT | ✅ | `shifts.edit` | ❌ | ✅ OK |
| `/api/shifts/:id` | DELETE | ✅ | `shifts.delete` | ❌ | ✅ OK |
| `/api/shifts/:id/toggle-active` | POST | ✅ | `shifts.edit` | ❌ | ✅ OK |
| `/api/shifts/reorder` | POST | ✅ | `shifts.edit` | ❌ | ✅ OK |

**Prisma Models**: Shift, Assignment

---

### 2.11 MESSAGES (`/api/messages`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/messages` | GET | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/messages/conversation/:otherUserId` | GET | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/messages` | POST | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/messages/:messageId/read` | PUT | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/messages/mark-all-read` | PUT | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/messages/:messageId` | DELETE | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/messages/unread-count` | GET | ✅ | ❌ | ❌ | ⚠️ OK |

**Prisma Models**: Message, User
**WebSocket**: ✅ DA

**⚠️ PROBLEM**: Nema permission checks, nema rate limiting (spam vulnerability)!

---

### 2.12 ACTIVITY LOGS (`/api/activity-logs`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/activity-logs` | GET | ✅ | `system.view-logs` | ❌ | ✅ OK |
| `/api/activity-logs` | POST | ✅ | `system.create-logs` | ❌ | ✅ OK |

**Prisma Models**: ActivityLog

---

### 2.13 UPLOAD (`/api/upload`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/upload/image` | POST | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/upload/image/:filename` | DELETE | ✅ | ❌ | ❌ | ⚠️ OK |

**File Validation**: ✅ DA (image types, 5MB limit)
**Multer**: ✅ DA

**⚠️ PROBLEM**: Nema permission checks, nema rate limiting!

---

### 2.14 TRANSCRIBE (`/api/transcribe`) - Voice Transcription

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/transcribe` | POST | ❌ | ❌ | ❌ | ❌ **KRITIČNO** |
| `/api/transcribe/test` | GET | ❌ | ❌ | ❌ | ❌ **KRITIČNO** |

**External API**: OpenAI Whisper (KOŠTA NOVAC!)
**File Validation**: ✅ DA (audio types, 25MB limit)

**🔴 KRITIČNO**: Nema autentifikacije, nema rate limiting - bilo ko može slati audio i trošiti OpenAI credits!

---

### 2.15 BACKUP (`/api/backup`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/backup/settings` | GET | ✅ | `system.backup` | ❌ | ✅ OK |
| `/api/backup/settings` | PUT | ✅ | `system.backup` | ❌ | ✅ OK |
| `/api/backup/status` | GET | ✅ | `system.backup` | ❌ | ✅ OK |
| `/api/backup/create` | POST | ✅ | `system.backup` | ✅ 10/15min | ✅ OK |
| `/api/backup/restore/:filename` | POST | ✅ | `system.backup` | ✅ 10/15min | ✅ OK |
| `/api/backup/:filename` | DELETE | ✅ | `system.backup` | ❌ | ✅ OK |
| `/api/backup/download/:filename` | GET | ✅ | `system.backup` | ❌ | ✅ OK |

**ODLIČNO**: Resource-intensive operations imaju strict rate limiting!

---

### 2.16 YACHT SETTINGS (`/api/yacht-settings`)

| Endpoint | Method | Auth | Permission | Rate Limit | Status |
|----------|--------|------|------------|------------|--------|
| `/api/yacht-settings` | GET | ✅ | ❌ | ❌ | ⚠️ OK |
| `/api/yacht-settings` | PUT | ✅ | ❌ | ❌ | ⚠️ OK |

**Prisma Models**: YachtSettings

**⚠️ PROBLEM**: Bilo ko može mijenjati yacht name, timezone, floors!

---

## 3. FRONTEND API POZIVI (60 total)

### 3.1 AUTENTIFIKACIJA

#### `POST /api/auth/login`
**Fajl**: `src/services/auth.ts:32`
**Šta šalje**: `{ username: string, password: string }`
**Šta očekuje**: `{ success: boolean, data: { token: string, user: {...} } }`
**Status**: ✅ OK

---

### 3.2 CREW MEMBERS

#### `GET /api/crew`
**Fajl**: `src/hooks/useCrewMembers.ts:18`
**Via**: `api.crew.getAll()`
**React Query**: ✅ DA
**Status**: ✅ OK

#### `POST /api/crew`
**Fajl**: `src/hooks/useCrewMembers.ts:38`
**Via**: `api.crew.create(data)`
**Status**: ✅ OK

---

### 3.3 GUESTS - **🔴 KRITIČNE GREŠKE**

#### `GET /api/guests`
**Fajl**: `src/hooks/useGuestsApi.ts:18`
**Via**: `api.guests.getAll()` ← **GREŠKA!**
**Problem**: ❌ **`api.guests` NE POSTOJI!** (linija 581 u `api.ts` kaže "Use GuestsService")
**Fix**: Koristiti `GuestsService.list()` umesto `api.guests.getAll()`
**Status**: ❌ **BROKEN**

#### `POST /api/guests`
**Fajl**: `src/hooks/useGuestsApi.ts:57`
**Via**: `api.guests.create(data)` ← **GREŠKA!**
**Problem**: ❌ **`api.guests.create()` NE POSTOJI!**
**Fix**: Koristiti `GuestsService.create(data)`
**Status**: ❌ **BROKEN**

#### `PUT /api/guests/:id`
**Fajl**: `src/hooks/useGuestsApi.ts:76`
**Via**: `api.guests.update(id, data)` ← **GREŠKA!**
**Problem**: ❌ **`api.guests.update()` NE POSTOJI!**
**Fix**: Koristiti `GuestsService.update(id, data)`
**Status**: ❌ **BROKEN**

#### `DELETE /api/guests/:id`
**Fajl**: `src/hooks/useGuestsApi.ts:94`
**Via**: `api.guests.delete(id)` ← **GREŠKA!**
**Problem**: ❌ **`api.guests.delete()` NE POSTOJI!**
**Fix**: Koristiti `GuestsService.delete(id)`
**Status**: ❌ **BROKEN**

---

### 3.4 SERVICE REQUESTS

#### `GET /api/service-requests`
**Fajl**: `src/hooks/useServiceRequestsApi.ts:18`
**Via**: `api.serviceRequests.getAll()`
**React Query**: ✅ DA (`refetchInterval: 10s`)
**Status**: ✅ OK

#### `POST /api/service-requests/:id/accept`
**Fajl**: `src/hooks/useServiceRequestsApi.ts:99`
**Via**: `api.serviceRequests.accept(id, crewMemberId)`
**Status**: ✅ OK

#### `POST /api/service-requests/:id/complete`
**Fajl**: `src/hooks/useServiceRequestsApi.ts:117`
**Via**: `api.serviceRequests.complete(id)`
**Status**: ✅ OK

---

### 3.5 DEVICES

#### `GET /api/devices`
**Fajl**: `src/hooks/useDevices.ts:74`
**Via**: `api.get('/devices')`
**Query params**: type, status, locationId, crewMemberId
**Status**: ✅ OK

#### `POST /api/devices/:id/test`
**Fajl**: `src/hooks/useDevices.ts:200`
**Via**: `api.post('/devices/:id/test')`
**Status**: ✅ OK

---

## 4. KRITIČNE GREŠKE - PRIORITET POPRAVKI

### 🔴 KRITIČNE (Odmah)

#### 1. `api.guests` ne postoji - Frontend BROKEN
**Fajl**: `src/services/api.ts:581`
**Problem**: Hook `useGuestsApi.ts` poziva `api.guests.*` koji nije exportovan
**Uticaj**: Guest management **NE RADI** (create, update, delete)
**Fix**:
```typescript
// Option 1: Export guests API
export const api = {
  crew: crewApi,
  guests: guestsApi, // ← Dodati ovo
  ...
}

// Option 2: Refaktorisati useGuestsApi.ts da koristi GuestsService
```

---

#### 2. Transcribe endpoint bez auth - Security rizik
**Fajl**: `backend/src/routes/transcribe.ts`
**Problem**: Nema autentifikacije, troši OpenAI credits
**Fix**:
```typescript
router.post('/', strictRateLimiter, requirePermission('service-requests.create'), ...
```

---

#### 3. Upload endpoint bez permission checks
**Fajl**: `backend/src/routes/upload.ts`
**Problem**: Bilo ko može upload fajlove
**Fix**:
```typescript
router.post('/image', generalRateLimiter, requirePermission('media.upload'), ...
```

---

#### 4. Yacht Settings bez permission checks
**Fajl**: `backend/src/routes/yacht-settings.ts`
**Problem**: Bilo ko može mijenjati yacht settings
**Fix**:
```typescript
router.put('/', requirePermission('settings.edit'), ...
```

---

#### 5. Database enum mismatch - CrewMemberStatus
**Fajl**: `backend/prisma/seed.ts:183`
**Problem**: Koristi `on_leave` umesto `on-leave`
**Fix**:
```typescript
status: 'on-leave', // ← umesto 'on_leave'
```

---

#### 6. Duplirani CHECK constraint
**Fajl**: `backend/prisma/migrations/.../migration.sql`
**Problem**: `Guest_checkDates_check` postoji 2 puta
**Fix**: Kreirati migration za brisanje duplikata

---

### ⚠️ OZBILJNO (Ova sedmica)

7. Messages nema rate limiting - spam vulnerability
8. Device discovery nema permission checks
9. Smart buttons nema rate limiting
10. Nedostaje DELETE endpoint za service requests
11. Nedostaje GET :id endpoint za crew

---

## 5. WEBSOCKET EVENTS

### Backend emituje:
- `service-request:new` - Novi service request
- `service-request:updated` - Update requesta
- `crew:updated` - Crew member updated
- `guest:updated` - Guest updated
- `location:updated` - Location updated
- `location:dnd-toggle` - DND status changed
- `device:updated` - Device status updated
- `device:telemetry` - Device telemetry data
- `device-discovered` - Novi device pronađen (discovery)

---

## 6. MQTT TOPICS

### ESP32 publishes:
- `obedio/button/{deviceId}/press` - Button press event
- `obedio/button/{deviceId}/status` - Device status update
- `obedio/button/{deviceId}/telemetry` - Battery, signal strength
- `obedio/watch/{deviceId}/ack` - Watch acknowledgement
- `obedio/device/{deviceId}/announce` - Device discovery announce

### Backend publishes:
- `obedio/device/{deviceId}/config` - Configuration update
- `obedio/device/{deviceId}/test` - Test button press

---

## 7. STATISTIKA

| Kategorija | Broj |
|------------|------|
| Backend endpoints | 157 |
| Frontend API poziva | 60 |
| Prisma modeli | 20 |
| WebSocket eventi | 9 |
| MQTT topici | 8 |
| Kritične greške | 6 |
| Ozbiljne greške | 5 |
| Endpoints bez auth | 10 |
| Endpoints bez permissions | 63 |
| Endpoints bez rate limiting | 143 |

---

## 8. ZAKLJUČAK

**Ocjena sistema**: 6.5/10

### ✅ DOBRO:
- Dobra arhitektura i struktura koda
- WebSocket i MQTT integracija
- Većina endpoints ima autentifikaciju
- Prisma ORM za SQL injection protection
- React Query za state management

### ❌ LOŠE:
- `api.guests` export missing - **BROKEN GUEST MANAGEMENT**
- Transcribe endpoint bez auth - **SECURITY RIZIK**
- 63 endpoints bez permission checks
- 143 endpoints bez rate limiting
- Database enum mismatch (on_leave vs on-leave)
- Duplirani constraint-i

### 🎯 AKCIONI PLAN:
1. **HITNO**: Popraviti `api.guests` export
2. **HITNO**: Dodati auth na transcribe endpoint
3. **HITNO**: Fiksirati enum mismatch u seed.ts
4. **VAŽNO**: Dodati permission checks na sve endpoints
5. **VAŽNO**: Dodati rate limiting gdje nedostaje

---

**Kraj dokumentacije**