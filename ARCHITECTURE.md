# OBEDIO System Architecture

**Version:** 1.0.0
**Last Updated:** October 26, 2024
**Status:** Production-Ready after Faza 1-4 Fixes

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Layers](#architecture-layers)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [Frontend Architecture](#frontend-architecture)
7. [Real-Time Communication](#real-time-communication)
8. [Security & Authentication](#security--authentication)
9. [Data Consistency](#data-consistency)
10. [Deployment](#deployment)

---

## System Overview

OBEDIO is a comprehensive yacht management system designed for luxury yacht crew to manage:
- **Service Requests** from guests
- **Guest Management** (profiles, preferences, locations)
- **Crew Management** (roster, status, assignments)
- **Location Management** (cabins, smart button integration)
- **Real-time Communication** (WebSocket, MQTT)

###

 Key Features:
- 🏝️ Guest call button system with voice transcription
- 👥 Crew duty roster and status management
- 📍 Location-based services and DND functionality
- 🔔 Real-time notifications and alerts
- 📊 Activity logs and service request history
- 🔐 Role-based access control

---

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15
- **ORM:** Prisma 5.x
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Real-time:** WebSocket (ws)
- **IoT Protocol:** MQTT (Mosquitto)
- **API Documentation:** Swagger/OpenAPI

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS
- **State Management:** React Context + React Query
- **Routing:** React Router
- **Icons:** Lucide React

### Hardware Integration
- **Smart Buttons:** ESP32-based devices
- **Wearables:** T-Watch S3 (crew devices)
- **Protocol:** MQTT over Wi-Fi

### DevOps
- **Container:** Docker + Docker Compose
- **Database Container:** PostgreSQL (Docker)
- **MQTT Broker:** Mosquitto (Docker)
- **Version Control:** Git

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐     │
│  │  Web Client  │  │ ESP32 Devices│  │  T-Watch S3   │     │
│  │  (React/Vite)│  │ (Smart Buttons)│ │ (Crew Devices)│    │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘     │
└─────────┼──────────────────┼───────────────────┼─────────────┘
          │                  │                   │
          │ HTTP/WS          │ MQTT              │ MQTT
          │                  │                   │
┌─────────┼──────────────────┼───────────────────┼─────────────┐
│         ▼                  ▼                   ▼             │
│               APPLICATION LAYER (Backend)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API Routes        WebSocket Server     MQTT Client │    │
│  │  /api/guests       /ws                  mosquitto   │    │
│  │  /api/crew                                           │    │
│  │  /api/service-requests                               │    │
│  │  /api/locations                                      │    │
│  └────────┬────────────────────────────────────────────┘    │
│           │                                                   │
│  ┌────────▼──────────────┐  ┌──────────────────────────┐   │
│  │   Business Logic      │  │   Middleware Layer       │   │
│  │  - Database Service   │  │  - Authentication (JWT)  │   │
│  │  - Validators (Zod)   │  │  - Authorization (RBAC)  │   │
│  │  - Service Layer      │  │  - Error Handling        │   │
│  └───────┬───────────────┘  └──────────────────────────┘   │
└──────────┼───────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────┐
│                      DATA LAYER                               │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   PostgreSQL     │  │ Prisma ORM   │  │ Migrations    │  │
│  │   Database       │  │ (Type-safe)  │  │ (Schema Mgmt) │  │
│  └──────────────────┘  └──────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Models

#### 1. **ServiceRequest**
```prisma
model ServiceRequest {
  id           String                  @id @default(cuid())
  guestId      String?
  locationId   String?
  requestType  ServiceRequestType      @default(call)      // ENUM
  priority     ServiceRequestPriority  @default(normal)    // ENUM
  status       ServiceRequestStatus    @default(pending)   // ENUM
  assignedTo   String?
  assignedToId String?
  acceptedAt   DateTime?
  completedAt  DateTime?
  createdAt    DateTime                @default(now())
  updatedAt    DateTime                @updatedAt

  guest        Guest?      @relation(fields: [guestId], references: [id])
  location     Location?   @relation(fields: [locationId], references: [id])
}

enum ServiceRequestStatus {
  pending
  accepted
  completed
  cancelled
}

enum ServiceRequestPriority {
  low
  normal
  urgent
  emergency
}

enum ServiceRequestType {
  call
  service
  emergency
}
```

#### 2. **Guest**
```prisma
model Guest {
  id           String       @id @default(cuid())
  firstName    String
  lastName     String
  type         GuestType    @default(guest)     // ENUM
  status       GuestStatus  @default(onboard)   // ENUM
  locationId   String?
  doNotDisturb Boolean      @default(false)

  location     Location?           @relation(fields: [locationId], references: [id])
  serviceRequests ServiceRequest[]
}

enum GuestStatus {
  expected
  onboard
  ashore
  departed
}

enum GuestType {
  owner
  vip
  guest
  partner
  family
}
```

#### 3. **CrewMember**
```prisma
model CrewMember {
  id         String            @id @default(cuid())
  name       String
  position   String
  department String
  status     CrewMemberStatus  @default(active)  // ENUM
  email      String?
  userId     String?           @unique

  user       User?             @relation(fields: [userId], references: [id])
}

enum CrewMemberStatus {
  active
  on_duty  @map("on-duty")   // Stored as "on-duty" in DB
  off_duty @map("off-duty")
  on_leave @map("on-leave")
}
```

#### 4. **Location**
```prisma
model Location {
  id             String   @id @default(cuid())
  name           String   @unique
  type           String
  smartButtonId  String?  @unique
  doNotDisturb   Boolean  @default(false)

  guests          Guest[]
  serviceRequests ServiceRequest[]
  devices         Device[]
}
```

### Enum Standardization

**ALL enum values use lowercase with dashes:**
- ✅ `'pending'`, `'on-duty'`, `'expected'`
- ❌ `'PENDING'`, `'ON_DUTY'`, `'Expected'`

### Database Relationships

```
User (1) ←──→ (1) CrewMember
Location (1) ←──→ (*) Guest
Location (1) ←──→ (*) ServiceRequest
Guest (1) ←──→ (*) ServiceRequest
Location (1) ←──→ (1) Device (SmartButton)
```

---

## API Design

### REST API Endpoints

#### Service Requests
```
GET    /api/service-requests              # List all requests
GET    /api/service-requests/:id          # Get single request
POST   /api/service-requests              # Create request
PUT    /api/service-requests/:id          # Update request
POST   /api/service-requests/:id/accept   # Accept request (assign crew)
POST   /api/service-requests/:id/complete # Complete request
POST   /api/service-requests/:id/cancel   # Cancel request
```

#### Guests
```
GET    /api/guests                 # List all guests
GET    /api/guests/:id             # Get single guest
POST   /api/guests                 # Create guest
PUT    /api/guests/:id             # Update guest
DELETE /api/guests/:id             # Delete guest
GET    /api/guests/stats           # Get guest statistics
```

#### Crew
```
GET    /api/crew                   # List all crew
GET    /api/crew/:id               # Get single crew member
POST   /api/crew                   # Create crew member
PUT    /api/crew/:id               # Update crew member
PUT    /api/crew/:id/status        # Update status only
```

#### Locations
```
GET    /api/locations              # List all locations
GET    /api/locations/:id          # Get single location
POST   /api/locations              # Create location
PUT    /api/locations/:id          # Update location
POST   /api/locations/:id/dnd      # Toggle DND
```

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Authentication

All API endpoints (except `/api/auth/login`) require JWT token:

```
Authorization: Bearer <jwt_token>
```

### Validation

All inputs validated using **Zod schemas** before database operations.

---

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── pages/                 # Page components
│   │   ├── service-requests.tsx
│   │   ├── guests-list.tsx
│   │   └── crew-roster.tsx
│   ├── widgets/               # Dashboard widgets
│   ├── dialogs/               # Modal dialogs
│   └── shared/                # Shared components
├── contexts/
│   └── AppDataContext.tsx     # Global state
├── hooks/
│   ├── useServiceRequestsApi.ts  # React Query hooks
│   ├── useGuestsApi.ts
│   └── useCrewMembers.ts
├── services/
│   ├── api.ts                 # API client
│   └── websocket.ts           # WebSocket client
└── types/
    ├── service-requests.ts
    ├── guests.ts
    └── crew.ts
```

### State Management Strategy

1. **Server State:** React Query (TanStack Query)
   - Caching, background updates, optimistic updates
   - Used for: Service requests, guests, crew, locations

2. **Global UI State:** React Context
   - User preferences, theme, notifications
   - Real-time WebSocket data

3. **Local Component State:** useState/useReducer
   - Form state, dialog open/close, filters

### Data Flow

```
Component → React Query Hook → API Service → Backend API
    ↓                                              ↓
  Render ← Cache Update ← Response Processing ← Database
```

---

## Real-Time Communication

### WebSocket Events

**Client → Server:**
- `service-request:create`
- `service-request:accept`
- `crew:status-update`

**Server → Client:**
- `service-request:new`
- `service-request:updated`
- `emergency:alert`
- `guest:update`

### MQTT Topics

**Smart Button → Server:**
```
obedio/button/{deviceId}/press
obedio/button/{deviceId}/voice
```

**T-Watch → Server:**
```
obedio/watch/{crewId}/status
obedio/watch/{crewId}/heartbeat
```

**Server → Devices:**
```
obedio/alerts/{deviceId}/notify
obedio/crew/{crewId}/assignment
```

---

## Security & Authentication

### Authentication Flow

1. User logs in with credentials
2. Backend validates against database
3. JWT token generated (7-day expiry)
4. Token stored in localStorage
5. Token sent in `Authorization` header on all requests

### Role-Based Access Control (RBAC)

```typescript
Roles: 'admin' | 'chief-stewardess' | 'stewardess' | 'crew' | 'eto'

Permissions:
- admin: Full access
- chief-stewardess: Manage service requests, crew roster
- stewardess: View/accept service requests
- crew: View assigned tasks
- eto: Manage devices, view logs
```

### Security Measures

- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ Input validation (Zod)
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection (React escaping)
- ✅ CORS configuration
- ⚠️ **TODO:** Rate limiting
- ⚠️ **TODO:** HTTPS enforcement
- ⚠️ **TODO:** Security headers (Helmet.js)

---

## Data Consistency

### Type Safety Across Stack

**Database → Backend:**
- Prisma generates TypeScript types from schema
- Enum values enforced at database level

**Backend → Frontend:**
- Shared TypeScript interfaces (DTOs)
- API responses validated

**Frontend:**
- Type-safe React Query hooks
- Zod validation on forms

### Enum Consistency (Post Faza 1-4)

All enums now use **lowercase, dash-separated** values across:
- ✅ Prisma schema
- ✅ Database
- ✅ Backend API
- ✅ Frontend TypeScript types
- ✅ Frontend components

**Example:**
```
Database:  'on-duty'
Backend:   'on-duty'
Frontend:  'on-duty'
```

---

## Deployment

### Development Environment

```bash
# Start all services
docker-compose up -d

# Run migrations
cd backend && npx prisma migrate deploy

# Seed database
npx prisma db seed

# Start backend
npm run dev

# Start frontend (separate terminal)
cd .. && npm run dev
```

### Production Deployment

**Backend:**
```bash
# Build
npm run build

# Start
npm start
```

**Frontend:**
```bash
# Build
npm run build

# Serve static files (Nginx/Apache)
```

### Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/obedio
JWT_SECRET=your-secret-key
PORT=8080
MQTT_BROKER_URL=mqtt://localhost:1883
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080
```

---

## Key Architectural Decisions

### 1. **Enum Standardization**
- **Decision:** All enums use lowercase, dash-separated values
- **Rationale:** Consistency across stack, prevents bugs, improves DX
- **Impact:** Required migrations to update existing data

### 2. **Prisma ORM**
- **Decision:** Use Prisma instead of raw SQL or other ORMs
- **Rationale:** Type safety, migration management, excellent DX
- **Trade-offs:** Less control over queries, learning curve

### 3. **React Query**
- **Decision:** Use React Query for server state
- **Rationale:** Built-in caching, background updates, optimistic updates
- **Trade-offs:** Additional dependency, initial setup complexity

### 4. **Monorepo Structure**
- **Decision:** Keep backend and frontend in same repo
- **Rationale:** Easier development, shared types, single deployment
- **Trade-offs:** Larger repository, potential for tight coupling

### 5. **WebSocket + MQTT**
- **Decision:** Use both WebSocket (web clients) and MQTT (IoT devices)
- **Rationale:** WebSocket for browser, MQTT optimized for low-power devices
- **Trade-offs:** Two protocols to maintain

---

## Performance Considerations

- **Database Indexes:** All foreign keys and frequently queried fields indexed
- **Query Optimization:** Use Prisma `include` selectively
- **Caching:** React Query caches API responses (30s-5min TTL)
- **Pagination:** Implemented for large lists (guests, service requests)
- **WebSocket:** Selective event subscription to reduce bandwidth

---

## Testing Strategy

- **Unit Tests:** TBD
- **Integration Tests:** API endpoint tests (Jest + Supertest)
- **E2E Tests:** TBD
- **Manual Testing:** Comprehensive testing performed during Faza 1-4

---

## Future Enhancements

See [TODO.md](./TODO.md) for detailed roadmap.

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [MQTT Protocol](https://mqtt.org)

---

**Document Version:** 1.0.0
**Last Reviewed:** October 26, 2024
**Next Review:** December 2024
