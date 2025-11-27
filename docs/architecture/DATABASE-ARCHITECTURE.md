# 🗄️ Database Architecture

**Database:** PostgreSQL 14+  
**ORM:** Prisma 5.x  
**Location:** `backend/prisma/schema.prisma`

---

## 📋 Overview

The database is the **single source of truth** for all application state. It's designed for multi-platform access (web, mobile, wearables, ESP32).

**Key Features:**
- Strong foreign key relationships
- Activity logging (audit trail)
- Atomic operations (DND toggle)
- Indexes for performance
- Type-safe queries via Prisma

---

## 📊 Core Tables

### 1. `users` - Authentication
```prisma
model User {
  id            String   @id @default(uuid())
  username      String   @unique
  password      String   // bcrypt hashed
  role          Role     // admin, chief-stewardess, crew, eto
  firstName     String?
  lastName      String?
  email         String?
  isActive      Boolean  @default(true)
  lastLogin     DateTime?
  createdAt     DateTime @default(now())
  
  crewMember    CrewMember?
}
```

**Purpose:** User accounts and authentication

---

### 2. `crew_members` - Crew Profiles
```prisma
model CrewMember {
  id            String   @id @default(uuid())
  userId        String?  @unique
  firstName     String
  lastName      String
  role          String   // chief-stewardess, stewardess, crew
  department    String?  // interior, deck, engine
  dutyStatus    String   @default("off-duty")
  avatarUrl     String?
  phoneNumber   String?
  email         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User?    @relation(fields: [userId], references: [id])
  assignments   Assignment[]
  serviceRequests ServiceRequest[]
}
```

**Purpose:** Crew member profiles and status

**Key Fields:**
- `dutyStatus`: on-duty, off-duty, break
- `department`: Interior (stewardesses), Deck (crew), Engine (ETO)

---

### 3. `guests` - Guest Profiles
```prisma
model Guest {
  id            String   @id @default(uuid())
  firstName     String
  lastName      String
  title         String?  // Mr., Mrs., Dr.
  vipStatus     Boolean  @default(false)
  locationId    String?
  doNotDisturb  Boolean  @default(false)
  preferences   Json?
  dietary       String[]
  allergies     String[]
  avatarUrl     String?
  notes         String?
  checkIn       DateTime?
  checkOut      DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  location      Location? @relation(fields: [locationId], references: [id])
  serviceRequests ServiceRequest[]
}
```

**Purpose:** Guest profiles and preferences

**Critical:** `locationId` foreign key ensures guest-location integrity

---

### 4. `locations` - Yacht Areas
```prisma
model Location {
  id            String   @id @default(uuid())
  name          String   // "Owner's Cabin", "VIP Suite 1"
  type          String   // cabin, deck, salon, galley
  deckLevel     String?  // Upper Deck, Main Deck
  capacity      Int?
  doNotDisturb  Boolean  @default(false)
  imageUrl      String?
  coordinates   Json?    // { lat, lon } for GPS
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  guests        Guest[]
  devices       Device[]
  smartButtons  SmartButton[]
  serviceRequests ServiceRequest[]
}
```

**Purpose:** Yacht areas (cabins, decks, common areas)

**Key Feature:** DND status syncs with guests in that location

---

### 5. `service_requests` - Butler Calls
```prisma
model ServiceRequest {
  id            String   @id @default(uuid())
  guestId       String?
  locationId    String
  assignedTo    String?
  category      String   // service, food, maintenance
  priority      String   @default("normal") // normal, urgent, emergency
  status        String   @default("open") // open, accepted, completed, cancelled
  description   String?
  voiceTranscript String?
  audioUrl      String?
  responseTime  Int?     // seconds
  completionTime Int?    // seconds
  createdAt     DateTime @default(now())
  acceptedAt    DateTime?
  completedAt   DateTime?
  
  guest         Guest?   @relation(fields: [guestId], references: [id])
  location      Location @relation(fields: [locationId], references: [id])
  assignedCrew  CrewMember? @relation(fields: [assignedTo], references: [id])
}
```

**Purpose:** Service requests from guests

**Workflow:** open → accepted → completed

---

### 6. `devices` - Device Registry
```prisma
model Device {
  id            String   @id @default(uuid())
  name          String
  type          String   // tablet, button, watch
  macAddress    String   @unique
  ipAddress     String?
  locationId    String?
  assignedTo    String?  // crew member ID
  batteryLevel  Int?
  signalStrength Int?    // RSSI
  firmwareVersion String?
  isOnline      Boolean  @default(false)
  lastSeen      DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  location      Location? @relation(fields: [locationId], references: [id])
}
```

**Purpose:** Track all devices (tablets, buttons, watches)

---

### 7. `smart_buttons` - ESP32 Buttons
```prisma
model SmartButton {
  id            String   @id @default(uuid())
  deviceId      String   @unique
  locationId    String
  buttonType    String   // standard, deluxe, custom
  functions     Json     // { single: 'call', long: 'emergency' }
  batteryLevel  Int?
  lastPressed   DateTime?
  createdAt     DateTime @default(now())
  
  location      Location @relation(fields: [locationId], references: [id])
}
```

**Purpose:** ESP32 smart button configuration

---

### 8. `assignments` - Duty Roster
```prisma
model Assignment {
  id            String   @id @default(uuid())
  crewMemberId  String
  shiftConfigId String
  date          DateTime
  isActive      Boolean  @default(true)
  notes         String?
  createdAt     DateTime @default(now())
  
  crewMember    CrewMember @relation(fields: [crewMemberId], references: [id])
  shiftConfig   ShiftConfig @relation(fields: [shiftConfigId], references: [id])
}
```

**Purpose:** Crew shift assignments

---

### 9. `shift_configs` - Shift Definitions
```prisma
model ShiftConfig {
  id            String   @id @default(uuid())
  name          String   // "Morning Shift", "Night Watch"
  startTime     String   // "08:00"
  endTime       String   // "16:00"
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  
  assignments   Assignment[]
}
```

**Purpose:** Define shift times

---

### 10. `activity_logs` - Audit Trail
```prisma
model ActivityLog {
  id            String   @id @default(uuid())
  userId        String?
  action        String   // login, create_guest, toggle_dnd
  entityType    String?  // guest, crew, location
  entityId      String?
  oldValue      Json?
  newValue      Json?
  ipAddress     String?
  userAgent     String?
  timestamp     DateTime @default(now())
}
```

**Purpose:** Track all user actions for audit/debugging

---

## 🔗 Key Relationships

### 1. Guest → Location (Foreign Key)
```
guest.locationId → location.id
```

**Ensures:** Guest can only be assigned to existing location

**Cascade:** If location deleted, guest.locationId set to null

---

### 2. ServiceRequest → Guest + Location
```
service_request.guestId → guest.id
service_request.locationId → location.id
```

**Ensures:** Request always tied to valid guest and location

---

### 3. User → CrewMember (One-to-One)
```
crew_member.userId → user.id
```

**Purpose:** Link user account to crew profile

---

## ⚡ Critical Operations

### Atomic DND Toggle
**Problem:** Guest DND and Location DND must stay in sync

**Solution:** Transaction

```typescript
await prisma.$transaction(async (tx) => {
  const location = await tx.location.update({
    where: { id },
    data: { doNotDisturb: !current }
  });
  
  await tx.guest.updateMany({
    where: { locationId: id },
    data: { doNotDisturb: location.doNotDisturb }
  });
});
```

**Result:** Both update or both fail (no desync)

---

## 🚀 Performance Indexes

```prisma
@@index([locationId])  // Guest lookups by location
@@index([guestId])     // Service requests by guest
@@index([status])      // Filter by status
@@index([createdAt])   // Sort by date
@@index([userId])      // Activity logs by user
```

---

## 🔧 Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Create/update database schema
npx prisma db push

# Create migration
npx prisma migrate dev --name add_feature

# Deploy migrations (production)
npx prisma migrate deploy

# Seed database
npm run db:seed

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## 📝 Seed Data

Located in: `backend/prisma/seed.ts`

**Creates:**
- 1 Admin user (admin / admin123)
- 6 Crew members
- 9 Locations (cabins + decks)
- 4 Guests
- 2 Service requests
- 2 Smart buttons

**Usage:**
```bash
npm run db:seed
```

---

**Next:** See INTEGRATION-GUIDE.md for API integration details.
