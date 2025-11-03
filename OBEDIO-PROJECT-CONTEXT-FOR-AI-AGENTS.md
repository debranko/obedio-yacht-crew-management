# OBEDIO - Project Context for AI Agents & Developers

**Last Updated:** 2025-11-03
**Project Status:** 68% Complete - Preparing for METSTRADE Demo
**Primary Language:** Serbian (Srpski) + English for code

---

## 🎯 WHAT IS OBEDIO?

OBEDIO is a **luxury hospitality communication system** for superyachts. It's a **next-generation silent service platform** that enables guests to communicate with crew discreetly and efficiently.

### Core Concept:
- **Guest** presses a smart button in their cabin
- **Voice message** is recorded, transcribed, and auto-translated to English
- **Crew** receives notification on their smartwatch/phone
- **Response** is tracked, logged, and analyzed

### Brand Philosophy:
> "Obedio hears only when you choose to speak."

**Privacy-first, local-by-default, luxury silent service.**

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────┐
│  Smart Buttons  │  (ESP32-based, WiFi for now, LoRa later)
│  - Main button  │
│  - 4 aux buttons│
│  - Shake to Call│
└────────┬────────┘
         │ MQTT
         ↓
┌─────────────────┐
│   Backend API   │  (Node.js + TypeScript + Prisma)
│  - PostgreSQL   │
│  - WebSocket    │
│  - MQTT Broker  │
└────────┬────────┘
         │ REST/WS
         ↓
┌─────────────────┐
│  Frontend Apps  │  (React + TypeScript + Vite)
│  - Web Dashboard│
│  - iOS/Android  │
│  - Watch Apps   │
└─────────────────┘
```

---

## 📁 PROJECT STRUCTURE

```
Luxury Minimal Web App Design/
├── backend/                    # Node.js + TypeScript backend
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   │   ├── mqtt.service.ts      # MQTT device communication
│   │   │   ├── websocket.ts         # Real-time updates
│   │   │   └── database.ts          # Prisma client
│   │   ├── middleware/        # Auth, validation
│   │   └── server.ts          # Main entry point
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── package.json
│
├── src/                       # React frontend
│   ├── components/
│   │   ├── pages/            # Main pages
│   │   └── ui/               # Reusable components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   ├── services/             # API client
│   └── types/                # TypeScript types
│
├── ObedioWear/               # Smartwatch app (separate)
└── docs/                     # Documentation
```

---

## 🛠️ TECH STACK

### Backend:
- **Runtime:** Node.js v18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Real-time:** Socket.IO (WebSocket) + MQTT
- **Auth:** JWT + bcrypt
- **Voice:** OpenAI Whisper API (cloud for now, will be local post-METSTRADE)

### Frontend:
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **UI:** Tailwind CSS + shadcn/ui
- **State:** React Query + Context API
- **Real-time:** Socket.IO client
- **Icons:** Lucide React

### Hardware:
- **Microcontroller:** ESP32-S3
- **Communication:** WiFi (MQTT protocol) - LoRa coming later
- **Sensors:** Accelerometer (shake detection), I2S MEMS mic

---

## ✅ WHAT WORKS NOW (68% Complete)

### ✅ Fully Implemented:
1. **Guest Management (95%)**
   - CRUD operations
   - Check-in/out tracking
   - Preferences, allergies, dietary restrictions
   - VIP notes and special occasions
   - Files: `backend/src/routes/guests.ts`, `schema.prisma`

2. **Crew Management (90%)**
   - Crew profiles with roles (Admin, Chief Stewardess, Stewardess, Crew, ETO)
   - Shift scheduling
   - On-duty/off-duty status
   - Crew change logs
   - Files: `backend/src/routes/crew.ts`, `backend/src/routes/shifts.ts`

3. **Device Manager (85%)**
   - Real-time device status (online/offline/low_battery)
   - Battery level monitoring
   - Signal strength tracking
   - Firmware version management
   - Device logs and events
   - Files: `backend/src/routes/devices.ts`, `backend/src/services/mqtt.service.ts`

4. **Button System (85%)**
   - 5 interaction types: press, double press, long press (voice), shake (SOS)
   - 4 programmable auxiliary buttons
   - ESP32 firmware integration
   - Priority derivation from button type
   - Files: `backend/src/services/mqtt.service.ts` (lines 183-421)

5. **Service Requests (80%)**
   - Request creation from button press
   - Status tracking (pending, in_progress, completed)
   - Priority levels (low, normal, urgent, emergency)
   - Assignment to crew members
   - History tracking
   - Files: `backend/src/routes/service-requests.ts`

6. **Real-time Communication (85%)**
   - WebSocket server with Socket.IO
   - MQTT broker integration
   - Device status updates
   - Request notifications
   - Watch acknowledgements
   - Files: `backend/src/services/websocket.ts`, `backend/src/services/mqtt.service.ts`

7. **Logs & Permissions (90%)**
   - Activity logs for all system events
   - Device event logs
   - Role-based access control
   - Permission matrix per role
   - Files: `backend/src/routes/activity-logs.ts`, `backend/src/middleware/auth.ts`

8. **Authentication (85%)**
   - JWT token authentication
   - Password hashing with bcrypt
   - Role-based authorization
   - Session management
   - Files: `backend/src/middleware/auth.ts`, `backend/src/services/database.ts`

---

## 🟡 PARTIALLY IMPLEMENTED

### 🟡 Voice to Text (40%)
**Status:** Works but uses OpenAI Cloud API

**What works:**
- POST `/api/transcribe` endpoint
- Audio file upload (webm, mp3, wav, ogg, m4a)
- Transcription via OpenAI Whisper
- Auto-translation to English

**What's missing:**
- ❌ Local processing (violates "no cloud" principle)
- ❌ Offline capability
- ❌ Audio file preservation
- ❌ Language detection

**Note:** Cloud API is ACCEPTABLE for METSTRADE demo. Local processing comes after we have clients/investors.

**Files:** `backend/src/routes/transcribe.ts`

---

### 🟡 Locations & Map (60%)
**What works:**
- CRUD operations for locations
- Location types (cabin, common_area, deck, etc.)
- Guest/device assignment to locations
- DND (Do Not Disturb) toggle

**What's missing:**
- ❌ Coordinate system for 2D/3D map
- ❌ Floor plan integration
- ❌ Visual drag-and-drop on map
- ❌ Digital twin visualization

**Files:** `backend/src/routes/locations.ts`, `src/components/pages/locations.tsx`

---

### 🟡 Notifications (50%)
**What works:**
- Notification settings per user
- Push token registration
- WebSocket notifications
- MQTT notifications to watches
- Watch acknowledgement

**What's missing:**
- ❌ Automatic escalation (if no response → escalate to next crew)
- ❌ Escalation timer
- ❌ Fallback crew assignment
- ❌ Priority guest special colors/tones

**Files:** `backend/src/routes/notification-settings.ts`

---

## ❌ NOT IMPLEMENTED (Coming Post-METSTRADE)

### ❌ Analytics (0%)
**Planned features:**
- Average response time calculation
- Requests by location trending
- Crew performance metrics
- Peak hours analysis
- Predictive device diagnostics

**Note:** This would be GREAT for METSTRADE demo! See section below.

---

### ❌ Advanced Security (20%)
**What's missing:**
- ❌ End-to-end encryption
- ❌ Data retention policies
- ❌ MQTT encryption config
- ❌ Audit logging for config changes

**Note:** NOT priority for METSTRADE demo. Basic security (JWT, bcrypt, CORS) is sufficient.

---

### ❌ Network Failback & Redundancy (0%)
**What's missing:**
- ❌ Message delivery guarantee (retry mechanism)
- ❌ Emergency mesh networking
- ❌ Redundant notification paths
- ❌ Automatic failover

**Note:** NOT needed for METSTRADE WiFi demo. Critical for production on yachts.

---

### ❌ Crestron Integration (0%)
**What's missing:**
- ❌ Server bridge endpoints
- ❌ Scene control integration
- ❌ Lighting/HVAC control from buttons

**Note:** Future feature, not demo priority.

---

## 🎯 METSTRADE DEMO PRIORITIES

### Context:
METSTRADE is a trade show where we demonstrate the system to potential investors and yacht clients. The goal is to show a **functional, impressive demo** - not a perfect production system.

**Philosophy:** Like the company with smart lights (someone behind the scenes pressing buttons) - we need it to work well enough to impress and secure clients. Technical perfection comes AFTER funding.

---

### ✅ MUST WORK for Demo:
1. **Guest Button Press Flow:**
   - Guest presses button → creates service request
   - Crew gets notification (watch/phone/dashboard)
   - Crew accepts/completes request
   - Guest sees confirmation LED/tone

2. **Dashboard Real-time Updates:**
   - Active requests display
   - Device status grid
   - Crew on-duty status
   - Live WebSocket updates (no refresh needed)

3. **Voice to Text:**
   - Guest holds button → records voice
   - System transcribes and translates
   - Crew sees text + can play audio
   - **Cloud API is OK for demo!**

4. **Visual Polish:**
   - Clean, luxury UI design
   - Smooth animations
   - Professional look
   - No console errors

5. **Shake to Call (SOS):**
   - Shake button → emergency alert
   - All crew get instant notification
   - High priority/urgent status

---

### 🎨 NICE TO HAVE for Demo (High Impact):
1. **Analytics Dashboard Widget:**
   - Total requests today
   - Average response time
   - Active requests count
   - Simple line chart (requests over time)
   - Top performers leaderboard

   **Why:** Investors LOVE metrics. Shows it's a management tool, not just a button. "Data-driven crew performance optimization" sounds premium.

   **Effort:** 4-6 hours
   **ROI:** HUGE wow factor

---

### ❌ NOT NEEDED for Demo:
- End-to-end encryption
- Local voice processing
- Network failback
- LoRa communication (using WiFi)
- Emergency mesh
- Crestron integration
- Data retention policies

---

## 🚀 CURRENT WORK PRIORITIES

### Phase 1: Core Flow Stability (1-2 days)
- [ ] Fix any bugs in button → request → notification flow
- [ ] Ensure WebSocket updates work reliably
- [ ] Test end-to-end with real button or simulator
- [ ] Polish dashboard UI

### Phase 2: Analytics Dashboard (1 day) - **UNDER DISCUSSION**
- [ ] Create `/api/analytics/dashboard` endpoint
- [ ] Calculate: total requests, avg response time, active count
- [ ] Add analytics widget to dashboard
- [ ] Simple charts with recharts library

### Phase 3: Demo Polish (1 day)
- [ ] Test all demo scenarios
- [ ] Fix visual bugs
- [ ] Optimize performance
- [ ] Create demo script/checklist

---

## 📋 DATABASE SCHEMA OVERVIEW

Key models in `backend/prisma/schema.prisma`:

```prisma
model User            // Accounts for crew and admins
model CrewMember      // Crew profiles with roles and status
model Guest           // Guest profiles with preferences
model Location        // Cabins, decks, common areas
model Device          // Smart buttons and sensors
model SmartButton     // Button configuration and assignment
model ServiceRequest  // Guest requests (button presses)
model ActivityLog     // System event log
model DeviceLog       // Device event log
model Shift           // Crew shift scheduling
model NotificationSettings  // User notification preferences
```

---

## 🔌 API ENDPOINTS OVERVIEW

### Authentication:
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### Crew:
- `GET /api/crew` - List all crew
- `POST /api/crew` - Create crew member
- `PUT /api/crew/:id` - Update crew member
- `DELETE /api/crew/:id` - Delete crew member

### Guests:
- `GET /api/guests` - List guests (paginated)
- `POST /api/guests` - Create guest
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest

### Devices:
- `GET /api/devices` - List devices with status
- `POST /api/devices` - Register device
- `PUT /api/devices/:id` - Update device
- `PUT /api/devices/:id/location` - Move device to location
- `GET /api/devices/:id/logs` - Device event logs

### Service Requests:
- `GET /api/service-requests` - List requests
- `POST /api/service-requests` - Create request
- `PUT /api/service-requests/:id` - Update request status
- `DELETE /api/service-requests/:id` - Delete request

### Locations:
- `GET /api/locations` - List locations
- `POST /api/locations` - Create location
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

### Voice:
- `POST /api/transcribe` - Transcribe audio file

### Shifts:
- `GET /api/shifts` - Get crew shifts
- `POST /api/shifts` - Create shift
- `PUT /api/shifts/:id` - Update shift

### Analytics (TO BE IMPLEMENTED):
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/crew-performance` - Crew stats
- `GET /api/analytics/requests-over-time` - Time series data

---

## 🔗 REAL-TIME COMMUNICATION

### WebSocket Events (Socket.IO):

**Client → Server:**
- `join-room` - Join specific room for updates
- `leave-room` - Leave room

**Server → Client:**
- `device:created` - New device registered
- `device:updated` - Device info changed
- `device:deleted` - Device removed
- `device:status-changed` - Device status/battery/signal updated
- `service-request:created` - New request from guest
- `service-request:updated` - Request status changed
- `location:updated` - Location info changed
- `crew:duty-changed` - Crew on-duty status changed

---

### MQTT Topics:

**Device → Server:**
- `obedio/buttons/{deviceId}/press` - Button press event
- `obedio/buttons/{deviceId}/voice` - Voice recording
- `obedio/buttons/{deviceId}/heartbeat` - Device alive signal
- `obedio/buttons/{deviceId}/status` - Battery/signal status

**Server → Device:**
- `obedio/buttons/{deviceId}/config` - Configuration update
- `obedio/buttons/{deviceId}/command` - Remote command
- `obedio/buttons/{deviceId}/feedback` - LED/tone control

**Server → Watch:**
- `obedio/watch/{crewId}/notification` - New request notification
- `obedio/watch/{crewId}/update` - Request update

**Watch → Server:**
- `obedio/watch/{crewId}/ack` - Acknowledgement
- `obedio/watch/{crewId}/action` - Accept/complete action

---

## 🎨 FRONTEND STRUCTURE

### Main Pages:
- `/dashboard` - Overview with stats and active requests
- `/service-requests` - Full request management
- `/crew` - Crew management with shifts
- `/guests` - Guest profiles and preferences
- `/device-manager` - Device status and configuration
- `/locations` - Location management (map in future)
- `/settings` - System settings and preferences
- `/activity-log` - System event log

### Key Components:
- `service-request-card.tsx` - Request display card
- `device-status-grid.tsx` - Device overview
- `crew-duty-banner.tsx` - On-duty status display
- `active-requests-widget.tsx` - Dashboard widget

---

## 🐛 KNOWN ISSUES & GOTCHAS

### Backend:
1. **SQL Injection Risk:** Some routes use `$queryRawUnsafe` - needs parameterization
2. **Inconsistent Enums:** Some models use string enums, others use Prisma enums
3. **Missing Input Validation:** Not all endpoints validate input schemas
4. **MQTT Reconnection:** Connection loss handling could be more robust

### Frontend:
1. **Stale Closures:** Some WebSocket handlers capture old state
2. **React Query Cache:** Manual cache updates needed for real-time changes
3. **Type Inconsistencies:** Some API types don't match backend
4. **Error Boundaries:** Not implemented on all pages

### General:
1. **Environment Variables:** Ensure `.env` file is configured correctly
2. **Database Migrations:** Run `npx prisma migrate dev` after schema changes
3. **MQTT Broker:** Must be running locally or configured remotely
4. **Port Conflicts:** Backend (3001), Frontend (5173), MQTT (1883)

---

## 🛠️ DEVELOPMENT WORKFLOW

### Starting the System:

1. **Backend:**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run dev
   ```
   Runs on: `http://localhost:3001`

2. **Frontend:**
   ```bash
   npm install
   npm run dev
   ```
   Runs on: `http://localhost:5173`

3. **MQTT Broker:**
   Must be running on `localhost:1883` or configured in `.env`

---

### Making Changes:

1. **Database Schema Changes:**
   ```bash
   cd backend
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name your-change-description
   npx prisma generate
   ```

2. **Adding API Endpoint:**
   - Create route file in `backend/src/routes/`
   - Register in `backend/src/server.ts`
   - Update Swagger docs if needed

3. **Adding Frontend Page:**
   - Create component in `src/components/pages/`
   - Add route in `src/App.tsx`
   - Update navigation if needed

---

## 📞 IMPORTANT PROTOCOLS

### Button Press Flow:
```
1. ESP32 detects button press
2. ESP32 publishes MQTT: obedio/buttons/{id}/press
3. Backend mqtt.service.ts handleButtonPress()
4. Create ServiceRequest in database
5. Emit WebSocket: service-request:created
6. Publish MQTT: obedio/watch/{crewId}/notification
7. Frontend receives WebSocket update
8. Dashboard updates in real-time
9. Crew watch receives MQTT notification
10. Crew acknowledges via watch or dashboard
```

### Voice Message Flow:
```
1. Guest long-presses button (3+ seconds)
2. ESP32 records audio via I2S MEMS mic
3. ESP32 publishes audio to MQTT: obedio/buttons/{id}/voice
4. Backend receives and saves audio file
5. Backend calls POST /api/transcribe
6. OpenAI Whisper transcribes and translates
7. ServiceRequest updated with transcript
8. WebSocket update sent to frontend
9. Crew sees text + audio player
```

---

## 🎯 CODING GUIDELINES

### Language:
- **Code:** English (variables, functions, comments)
- **Communication:** Serbian is OK in markdown docs
- **Commits:** English preferred

### TypeScript:
- Always use proper types, avoid `any`
- Define interfaces for API responses
- Use Prisma generated types where possible

### API Design:
- RESTful conventions
- Consistent error responses: `{ error: string, details?: any }`
- Success responses: `{ data: any }` or just the data object
- Pagination: `{ data: [], total: number, page: number, limit: number }`

### React:
- Functional components only
- Custom hooks for API calls (React Query)
- Context for global state (Auth, Settings)
- Use shadcn/ui components

### Error Handling:
- Try-catch in all async functions
- Log errors with context
- Return user-friendly error messages
- Don't expose stack traces to client

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Roles:
1. **admin** - Full system access
2. **chief-stewardess** - Crew management, full service request access
3. **stewardess** - Service request management
4. **crew** - Basic service request access
5. **eto** (Electrical Technical Officer) - Device and system management

### Permission Checks:
- `requireAuth()` middleware ensures user is logged in
- `requireRole()` middleware checks specific roles
- Frontend hides UI based on user role
- Backend enforces permissions on all endpoints

### Token Flow:
- Login returns JWT in HttpOnly cookie
- Frontend includes cookie in all requests
- Token expires after 7 days (configurable)
- Refresh not implemented (logout/login required)

---

## 📊 PERFORMANCE CONSIDERATIONS

### Database:
- Indexes on frequently queried fields (deviceId, locationId, etc.)
- Pagination on list endpoints
- Avoid N+1 queries (use Prisma `include`)

### Real-time:
- WebSocket rooms for targeted updates
- Debounce rapid updates on frontend
- MQTT QoS 1 for important messages

### Frontend:
- React Query caching (5 min default)
- Lazy loading for heavy components
- Virtual scrolling for long lists (if needed)

---

## 🧪 TESTING FOR DEMO

### Manual Test Checklist:
- [ ] Login works
- [ ] Dashboard loads with real-time data
- [ ] Button press creates service request
- [ ] Service request appears in real-time (no refresh)
- [ ] Crew can accept/complete request
- [ ] Device status updates in real-time
- [ ] Voice transcription works
- [ ] No console errors
- [ ] UI looks professional
- [ ] Shake to Call creates emergency request

### Simulating Button Presses:
Use MQTT client (e.g., MQTT Explorer) to publish:
```json
Topic: obedio/buttons/TEST001/press
Payload: {
  "deviceId": "TEST001",
  "buttonId": "main",
  "pressType": "single",
  "timestamp": "2025-11-03T12:00:00Z"
}
```

---

## 🎬 DEMO SCRIPT IDEAS

### Scenario 1: Guest Service Request
1. Show dashboard with crew on duty
2. Guest presses button in cabin
3. Service request appears on dashboard (real-time)
4. Crew member gets notification on watch/phone
5. Crew accepts request
6. Guest sees confirmation (LED changes color)
7. Crew completes request
8. Request moves to history

### Scenario 2: Voice Message
1. Guest long-presses button
2. Guest speaks in foreign language (e.g., German)
3. System transcribes and translates to English
4. Crew sees text: "Can I have extra towels please"
5. Crew can play original audio
6. Crew responds and completes

### Scenario 3: Emergency (Shake to Call)
1. Show system in normal operation
2. Shake button device
3. Emergency alert flashes on all screens
4. All crew get instant notification
5. Nearest crew member responds
6. Show response time: 18 seconds

### Scenario 4: Analytics (if implemented)
1. Show analytics dashboard
2. Explain metrics: "Average response time 42 seconds"
3. Show peak hours chart
4. Show top performers
5. Explain how this helps optimize crew scheduling

---

## 💡 TIPS FOR AI AGENTS

### When adding features:
1. Check if database schema needs updates first
2. Update backend API endpoint
3. Update frontend API client
4. Update UI components
5. Test end-to-end flow
6. Check WebSocket/MQTT events if real-time needed

### When debugging:
1. Check browser console for frontend errors
2. Check backend terminal for API errors
3. Check MQTT broker logs for device communication
4. Use React Query DevTools for cache inspection
5. Use Network tab for API call inspection

### When optimizing:
1. Profile before optimizing
2. Focus on user-visible performance
3. Don't over-engineer for demo
4. Prioritize "looks fast" over "is fast"

---

## 🚨 CRITICAL NOTES

1. **Cloud API for Demo is OK:** Voice transcription uses OpenAI cloud API. This is acceptable for METSTRADE demo despite whitepaper requirement for local processing.

2. **WiFi Only for Demo:** System uses WiFi/MQTT for communication. LoRa/RF implementation comes post-demo.

3. **Security is Basic:** JWT + bcrypt + CORS is sufficient for demo. End-to-end encryption not needed yet.

4. **Analytics Would Be Great:** Not required, but high ROI for impression. See priorities section.

5. **Focus on Core Flow:** Guest presses button → Crew gets notification → Crew responds. This MUST work flawlessly.

6. **Visual Polish Matters:** Investors see with eyes first. Clean UI > perfect code for demo purposes.

---

## 📚 ADDITIONAL RESOURCES

### Master Whitepaper:
- Full technical specification in `OBEDIO-MASTER-WHITEPAPER-V2.md` (if exists)
- Contains long-term vision and post-demo requirements

### Implementation Checklist:
- `OBEDIO-IMPLEMENTATION-CHECKLIST.md` - Full feature list

### Analysis Reports:
- `OBEDIO-COMPREHENSIVE-DEBUG-REPORT.md` - Previous debugging session
- `OBEDIO-API-ANALYSIS-REPORT.md` - API endpoint documentation

---

## 🎯 FINAL SUMMARY FOR AI AGENTS

**You are working on:** A luxury superyacht hospitality system
**Current phase:** Preparing for METSTRADE trade show demo
**Your goal:** Make the core flow work flawlessly and look impressive
**Not your goal:** Perfect security, local processing, or production-ready features

**Core flow to prioritize:**
1. Button press → Service request created
2. Crew notification (real-time)
3. Crew response → Request completion
4. Dashboard real-time updates (no refresh)

**Nice to have:**
- Analytics dashboard (high impact, low effort)
- Voice to text working
- Shake to Call emergency alert

**Ignore for now:**
- End-to-end encryption
- Local voice processing
- Network failback
- LoRa communication
- Crestron integration

**When in doubt:** Ask the owner. They know what's important for the demo.

---

**Ready to code! This document should give you full context to jump in and start working effectively.** 🚀
