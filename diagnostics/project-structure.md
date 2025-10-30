# Struktura Projekta - Analiza i Vizualizacija

## FOLDER ORGANIZACIJA - OVERVIEW

### Glavna struktura:
```
Luxury Minimal Web App Design/
├── backend/              # Node.js Express backend
│   ├── prisma/           # Database schema & migrations
│   ├── src/              # Source code
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   ├── config/       # Configuration
│   │   ├── tests/        # Unit tests
│   │   ├── utils/        # Utility functions
│   │   └── validators/   # Request validation schemas
│   └── *.js              # Utility/fix scripts (ROOT LEVEL - PROBLEM!)
├── src/                  # React frontend
│   ├── components/       # React components
│   │   ├── pages/        # Page components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── devices/      # Device-specific components
│   │   ├── guests/       # Guest-specific components
│   │   ├── duty-roster/  # Duty roster components
│   │   └── __tests__/    # Component tests
│   ├── contexts/         # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client services
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Frontend utilities
├── e2e/                  # End-to-end tests (Playwright)
├── obedio-pm/            # PM2 process manager config
├── public/               # Static assets
├── diagnostics/          # Dijagnostički fajlovi (novi)
└── docs/                 # Dokumentacija (stara, obrisana iz git-a)
```

---

## SEKCIJA 1: BACKEND STRUKTURA

### Backend Root Level - **PROBLEMATIČNI FAJLOVI** ⚠️

**Utility/Fix Scripts u root-u (treba ih premestiti):**
```
backend/
├── assign-twatch-to-chloe.js       # Device assignment script
├── check-crew.js                   # Crew validation script
├── check-device.js                 # Device check
├── check-devices.js                # Multiple devices check
├── check-location.js               # Location validation
├── check-smartbutton-id.js         # Smart button ID check
├── check-t3s3-device.js            # T3S3 device specific check
├── check-twatch-assignment.js      # T-Watch assignment check
├── fix-admin-password.ts           # Password reset script
├── fix-database-enums.js           # Enum migration script
├── fix-database.js                 # Database repair script
├── fix-device-type.js              # Device type correction
├── fix-enum-values-correct.js      # Enum values fix
├── fix-request-type.js             # Request type fix
├── get-ids.js                      # ID retrieval utility
├── test-activity-logs.js           # Activity log tester
└── test-button-press.js            # Button press simulator
```

**PROBLEM**: 17 utility/fix skripti u root-u umesto u `backend/scripts/` ili `backend/tools/`.

**PREPORUKA**: Kreirati `backend/scripts/` i premestiti sve ove fajlove tamo.

---

### Backend `/src` struktura - ✅ DOBRO ORGANIZOVANO

#### Routes (API Endpoints) - 20 fajlova:
```
backend/src/routes/
├── activity-logs.ts           # Activity logging endpoints
├── assignments.ts             # Crew assignments API
├── auth.ts                    # Authentication (login, logout, JWT)
├── backup.ts                  # Database backup endpoints
├── crew-change-logs.ts        # Crew change history
├── crew.ts                    # Crew CRUD operations
├── dashboard.ts               # Dashboard data aggregation
├── device-discovery.ts        # Device discovery/pairing
├── devices.ts                 # Device management
├── guests.ts                  # Guest CRUD operations
├── locations.ts               # Location/cabin management
├── messages.ts                # Messaging system
├── notification-settings.ts   # Notification preferences
├── role-permissions.ts        # RBAC permissions
├── service-categories.ts      # Service category management
├── service-request-history.ts # Service request logs
├── service-requests.ts        # Service request CRUD
├── settings.ts                # General settings
├── shifts.ts                  # Shift scheduling
├── smart-buttons.ts           # Smart button config
├── system-settings.ts         # System-level settings
├── transcribe.ts              # Voice transcription
├── upload.ts                  # File upload handling
├── user-preferences.ts        # User preferences
└── yacht-settings.ts          # Yacht-specific settings
```

**ANALIZA**: Dobro organizovano, svaki resource ima svoj fajl. Nema monolitnih route fajlova.

---

#### Services (Business Logic) - 8 fajlova:
```
backend/src/services/
├── database.ts             # Prisma client wrapper (808 linija)
├── db.ts                   # Database helper functions
├── mqtt-monitor.ts         # MQTT monitoring (541 linija)
├── mqtt-monitor.NEW.ts     # ⚠️ DUPLIKAT - novi MQTT monitor
├── mqtt-monitor.OLD.ts     # ⚠️ DUPLIKAT - stari MQTT monitor
├── mqtt.service.ts         # MQTT service main (933 linija - NAJVEĆI FAJL)
├── realtime.ts             # WebSocket realtime logic
└── websocket.ts            # WebSocket server setup
```

**PROBLEMI**:
1. **3 verzije MQTT monitor-a** (.ts, .NEW.ts, .OLD.ts) - **DEAD CODE KANDIDAT**
2. `mqtt.service.ts` - **933 linije** - možda previše za jedan fajl

**PREPORUKA**: Obrisati `.NEW.ts` i `.OLD.ts`, ili arhivirati ih van `src/`.

---

#### Middleware - 8 fajlova:
```
backend/src/middleware/
├── auth.ts               # JWT authentication
├── csrf.ts               # CSRF protection
├── error-handler.ts      # Global error handling
├── input-validation.ts   # Input sanitization
├── logger.ts             # HTTP request logging
├── rate-limiter.ts       # Rate limiting
├── validate.ts           # Validation middleware
```

**ANALIZA**: Kompletno, ima sve potrebne middleware-e za produkciju.

---

#### Tests - 6 test fajlova:
```
backend/src/tests/
├── auth.test.ts            # Auth endpoint tests (550 linija)
├── crew.test.ts            # Crew API tests
├── devices.test.ts         # Device API tests (637 linija)
├── guests.test.ts          # Guest API tests
├── locations.test.ts       # Location API tests
├── service-requests.test.ts # Service request tests
```

**ANALIZA**: Dobro pokrivene glavne funkcionalnosti. Nedostaju testovi za:
- assignments
- messages
- notifications
- shifts

---

#### Prisma (Database) - 7 fajlova:
```
backend/prisma/
├── schema.prisma           # Database schema definition
├── seed.ts                 # Main seed script (560 linija)
├── seed-admin.ts           # Admin user seeding
├── seed-demo-users.ts      # Demo user data
├── seed-devices.ts         # Device data (506 linija)
├── seed-yersin-images.ts   # Yacht-specific images
└── seed-yersin-locations.ts # Yacht-specific locations
```

**ANALIZA**: Dobro modularizovan seeding. Yacht "Yersin" je hardkodovan u naziv fajlova (ne idealno za reusability).

---

## SEKCIJA 2: FRONTEND STRUKTURA

### Frontend `/src/components` - 100+ komponenti

#### Pages (Glavne stranice) - 13 fajlova:
```
src/components/pages/
├── activity-log.tsx           # Activity log view (575 linija)
├── button-simulator.tsx       # Virtual button simulator (752 linija)
├── crew-list.tsx              # ⚠️ Crew management (1843 LINIJA - KRITIČNO VELIKI!)
├── crew-management.tsx        # Crew overview
├── device-manager.tsx         # ⚠️ Device management (1247 LINIJA - VELIKI!)
├── device-manager-full.tsx    # Full device view (643 linija)
├── duty-roster-tab.tsx        # Duty roster (962 linija)
├── guests-list.tsx            # Guest management (745 linija)
├── locations.tsx              # ⚠️ Location management (1312 LINIJA - VELIKI!)
├── service-requests.tsx       # Service requests (908 linija)
└── settings.tsx               # ⚠️ Settings page (1847 LINIJA - NAJV​​EĆI FRONTEND FAJL!)
```

**PROBLEMI**:
- **4 fajla preko 1000 linija** - trebalo bi da se razbiju na manje komponente
- `settings.tsx` - **1847 linija** - očigledno treba refaktorisati
- `crew-list.tsx` - **1843 linija** - može se razbiti na:
  - CrewListView
  - CrewFilters
  - CrewTable
  - CrewCard
- `locations.tsx` - **1312 linija** - može se razbiti
- `device-manager.tsx` - **1247 linija** - može se razbiti

---

#### UI Components (shadcn/ui) - 40+ fajlova:
```
src/components/ui/
├── accordion.tsx
├── alert.tsx
├── alert-dialog.tsx
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── calendar.tsx
├── card.tsx
├── checkbox.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── form.tsx
├── input.tsx
├── label.tsx
├── popover.tsx
├── select.tsx
├── sidebar.tsx (726 linija - VELIKI za UI component)
├── table.tsx
├── tabs.tsx
├── toast.tsx
└── ... (20+ više shadcn komponenti)
```

**ANALIZA**: Standardne shadcn/ui komponente. Sidebar je malo veliki (726 linija).

---

#### Feature Components (drugi):
```
src/components/
├── button-simulator-widget.tsx       # Button simulator (819 linija - VELIKI)
├── crew-member-details-dialog.tsx    # Crew details modal (857 linija - VELIKI)
├── guest-form-dialog.tsx             # Guest form (840 linija - VELIKI)
├── incoming-request-dialog.tsx       # Request notification (626 linija)
├── dashboard-grid.tsx                # Dashboard layout
├── crew-card-view.tsx                # Crew card display
├── guest-card-view.tsx               # Guest card display
├── service-request-panel.tsx         # Request panel
└── ... (50+ više komponenti)
```

**PROBLEM**: Previše komponenti u root-u `components/`. Trebalo bi da se organizuju u:
- `components/crew/`
- `components/guests/`
- `components/service-requests/`
- `components/devices/`
- `components/dashboard/`

---

### Frontend `/src/hooks` - 15+ custom hooks:
```
src/hooks/
├── useAssignments.ts
├── useCrewApi.ts
├── useDeviceLogs.ts
├── useGuestsApi.ts
├── useGuestsQueryParams.ts
├── useOptimizedQuery.ts      # Query optimization wrapper
├── useServiceRequestsApi.ts
├── useWebSocket.ts            # WebSocket hook
└── ... (više hooks)
```

**ANALIZA**: Dobro organizovano, svaki API resource ima svoj hook.

---

### Frontend `/src/services` - API klijenti:
```
src/services/
├── api.ts              # Main API client (557 linija)
├── auth.ts             # Auth service
├── guests.ts           # Guest API
├── websocket.ts        # WebSocket client
└── registerServiceWorker.ts
```

**ANALIZA**: Centralizovano. `api.ts` ima 557 linija - možda bi mogao da se razbije na module.

---

### Frontend `/src/contexts` - React Context:
```
src/contexts/
├── AppDataContext.tsx  # ⚠️ Glavni app state (1228 LINIJA - OGROMAN!)
├── AuthContext.tsx     # Authentication state
```

**PROBLEM**: `AppDataContext.tsx` - **1228 linija** - previše velik context. Trebalo bi da se razbije na:
- CrewContext
- GuestsContext
- ServiceRequestsContext
- DevicesContext
- LocationsContext

---

## SEKCIJA 3: PROBLEMATIČNI FAJLOVI

### TOP 10 NAJVEĆIH FAJLOVA (preko 800 linija):

| Fajl | Linija | Problem | Preporuka |
|------|--------|---------|-----------|
| `src/components/pages/settings.tsx` | 1847 | Previše settings sekcija u jednom fajlu | Razbiti na SettingsGeneral, SettingsSecurity, SettingsNotifications |
| `src/components/pages/crew-list.tsx` | 1843 | Kompleksna crew list sa filters, table, modal | Razbiti na CrewListView, CrewFilters, CrewTable |
| `src/components/pages/locations.tsx` | 1312 | Location management + floor plan + guests | Razbiti na LocationList, FloorPlan, LocationGuests |
| `src/components/pages/device-manager.tsx` | 1247 | Device CRUD + konfiguracija + monitoring | Razbiti na DeviceList, DeviceConfig, DeviceMonitor |
| `src/contexts/AppDataContext.tsx` | 1228 | Centralni state za sve entitete | Razbiti na više context-a po feature-u |
| `src/components/pages/duty-roster-tab.tsx` | 962 | Duty roster calendar + shifts | Razbiti na RosterCalendar, ShiftManagement |
| `backend/src/services/mqtt.service.ts` | 933 | MQTT broker + topic handling + events | Razbiti na MqttBroker, MqttTopicHandler, MqttEventEmitter |
| `src/components/pages/service-requests.tsx` | 908 | Request list + filters + actions | Razbiti na RequestList, RequestFilters, RequestActions |
| `src/components/crew-member-details-dialog.tsx` | 857 | Crew details modal sa puno sekcija | Razbiti na CrewDetailsHeader, CrewDetailsInfo, CrewDetailsSchedule |
| `src/components/guest-form-dialog.tsx` | 840 | Guest form sa mnogo polja | Razbiti na GuestBasicInfo, GuestPreferences, GuestDocuments |

**SUMMARY**: 10 fajlova sa ukupno **12,167 linija** koda - svi kandidati za refaktorisanje.

---

## SEKCIJA 4: DUPLIRANI FAJLOVI - DEAD CODE KANDIDATI

### Backend duplicates:
```
backend/src/services/
├── mqtt-monitor.ts         # Aktivna verzija
├── mqtt-monitor.NEW.ts     # ⚠️ Nova verzija koja se možda testira
└── mqtt-monitor.OLD.ts     # ⚠️ Stara verzija - DEAD CODE
```

**PREPORUKA**: Obrisati `.OLD.ts`, odlučiti da li `.NEW.ts` zamenjuje `.ts` ili obrnuto.

---

### Seed duplicates:
```
backend/prisma/
├── seed.ts             # Main seed
└── src/prisma/seed.ts  # ⚠️ DUPLIKAT? Proveri da li se koristi
```

**PROVERA POTREBNA**: Da li oba fajla rade isto ili imaju različite svrhe?

---

## SEKCIJA 5: FAJLOVI VAN LOGIČNE STRUKTURE

### Root level problemi:

#### 1. Backend utility scripts u root-u:
```
backend/
├── check-*.js (8 fajlova)
├── fix-*.js / fix-*.ts (7 fajlova)
└── test-*.js (2 fajla)
```

**PREPORUKA**: Premestiti u `backend/scripts/` ili `backend/tools/`.

---

#### 2. obedio-pm direktorijum:
```
obedio-pm/
├── import.js
├── index.js
├── server.js
└── web/app.js
```

**PROVERA POTREBNA**: Da li je ovo PM2 konfiguracija ili stari node app? Možda dead code.

---

#### 3. Dokumentacija u root-u (obrisana iz git-a):
Prema git statusu, mnogo `.md` fajlova je obrisano:
- APPLICATION-READINESS-REPORT.md
- BACKEND-API-PROGRESS-REPORT.md
- COMPREHENSIVE-SYSTEM-REVIEW-2025-01-22.md
- DEPLOYMENT-GUIDE.md
- MQTT-FIX-COMPLETE.md
- (50+ više dokumentacionih fajlova)

**PROBLEM**: Dokumentacija je bila u root-u umesto u `docs/`. Dobro što je očišćeno, ali može da se vrati u `docs/` ako je relevantna.

---

## SEKCIJA 6: TESTOVI - POKRIVENO vs NEPOKRIVENO

### Backend testovi - ✅ DOBRO POKRIVENO:
```
backend/src/tests/
├── auth.test.ts            # ✅ Postoji
├── crew.test.ts            # ✅ Postoji
├── devices.test.ts         # ✅ Postoji
├── guests.test.ts          # ✅ Postoji
├── locations.test.ts       # ✅ Postoji
└── service-requests.test.ts # ✅ Postoji
```

### Backend testovi - ❌ NEDOSTAJU:
- assignments.test.ts
- messages.test.ts
- notification-settings.test.ts
- shifts.test.ts
- smart-buttons.test.ts
- backup.test.ts

---

### Frontend testovi - ⚠️ SLABO POKRIVENO:
```
src/components/__tests__/
├── dashboard-grid.test.tsx        # ✅ Postoji
└── service-request-panel.test.tsx # ✅ Postoji
```

**NEDOSTAJU testovi za**:
- CrewList
- GuestList
- Locations
- DeviceManager
- ServiceRequests
- Settings
- Sve custom hooks (useCrewApi, useGuestsApi, itd.)

---

### E2E testovi - ✅ DOBRO POKRIVENO:
```
e2e/
├── auth.setup.ts                # Auth setup
├── guest-management.spec.ts     # Guest flow
└── service-request-flow.spec.ts # Request flow
```

**NEDOSTAJU E2E za**:
- Crew management flow
- Device pairing flow
- Location/cabin management
- Duty roster scheduling

---

## SEKCIJA 7: KONFUZNI NAZIVI

### Multiple "index" fajlovi:
```
./obedio-pm/index.js
./obedio-pm/web/app.js
./src/App.tsx
```

**PROBLEM**: Nije jasno šta je entry point za šta.

---

### Slični nazivi - različite stvari:
```
backend/src/services/database.ts    # Prisma client wrapper
backend/src/services/db.ts          # Database helper functions
```

**PREPORUKA**: Preimenuj `db.ts` u `databaseHelpers.ts` ili `dbUtils.ts` za jasnoću.

---

## SEKCIJA 8: DEAD CODE KANDIDATI - DETALJNA LISTA

### 1. Stari MQTT monitori:
```
backend/src/services/mqtt-monitor.NEW.ts
backend/src/services/mqtt-monitor.OLD.ts
```

### 2. Utility scripts koji možda nisu više potrebni:
```
backend/fix-admin-password.ts       # Ako je admin već kreiran
backend/fix-database-enums.js       # Ako je enum migracija završena
backend/fix-database.js             # Ako je baza popravljena
backend/fix-enum-values-correct.js  # Ako su enumi popravljeni
backend/fix-request-type.js         # Ako je request type popravljen
```

**PROVERA**: Pregledati svaki script i videti da li je još relevantan ili je jednokratno korišćen.

---

### 3. Check scripts:
```
backend/check-crew.js
backend/check-device.js
backend/check-devices.js
backend/check-location.js
backend/check-smartbutton-id.js
backend/check-t3s3-device.js
backend/check-twatch-assignment.js
```

**PROVERA**: Da li se ovi koriste u CI/CD pipeline-u ili su jednokratni debug scripts?

---

### 4. obedio-pm direktorijum:
```
obedio-pm/*
```

**PROVERA**: Da li se još koristi PM2 konfiguracija ili je to legacy?

---

### 5. Test scripts u backend root-u:
```
backend/test-activity-logs.js
backend/test-button-press.js
```

**PREPORUKA**: Ako se koriste, premestiti u `backend/scripts/testing/`. Ako ne, obrisati.

---

## SUMMARY - ORGANIZACIJA PROJEKTA

### ✅ DOBRO ORGANIZOVANO:
1. Backend `src/routes/` - svaki resource ima svoj fajl
2. Backend `src/middleware/` - kompletan set middleware-a
3. Backend `prisma/` - modularizovani seed scripts
4. Frontend `src/hooks/` - custom hooks po feature-u
5. E2E testovi - postoje osnovni flow-ovi

---

### ⚠️ POTREBNO POBOLJŠANJE:
1. **Veliki fajlovi (10 fajlova preko 800 linija)** - razbiti na manje module
2. **AppDataContext (1228 linija)** - razbiti na više context-a
3. **Backend utility scripts u root-u** - premestiti u `scripts/`
4. **Duplirani MQTT monitor fajlovi** - odlučiti koja verzija ostaje
5. **Frontend komponente u root-u** - organizovati u feature foldere
6. **Slabo pokriveni frontend testovi** - dodati unit testove za komponente i hooks

---

### ❌ PROBLEMATIČNO:
1. **17 utility/fix scripts u backend root-u** umesto u `scripts/`
2. **3 verzije mqtt-monitor.ts** (.ts, .NEW.ts, .OLD.ts)
3. **obedio-pm direktorijum** - nejasna svrha
4. **Nedostaje test coverage za 50%+ funkcionalnosti**
5. **Konfuzni nazivi** (database.ts vs db.ts)

---

## PREPORUKE ZA REORGANIZACIJU

### 1. Kreirati folder strukturu:
```
backend/
├── scripts/
│   ├── database/      # fix-database.js, check-*.js
│   ├── devices/       # check-device.js, fix-device-type.js
│   └── testing/       # test-*.js
```

### 2. Razbiti velike fajlove:
```
src/components/pages/settings/
├── SettingsPage.tsx
├── GeneralSettings.tsx
├── SecuritySettings.tsx
├── NotificationSettings.tsx
└── IntegrationSettings.tsx
```

### 3. Razbiti AppDataContext:
```
src/contexts/
├── AppDataContext.tsx      # Wrapper
├── CrewContext.tsx
├── GuestsContext.tsx
├── ServiceRequestsContext.tsx
├── DevicesContext.tsx
└── LocationsContext.tsx
```

### 4. Organizovati frontend komponente:
```
src/components/
├── crew/
│   ├── CrewList.tsx
│   ├── CrewCard.tsx
│   ├── CrewDetailsDialog.tsx
│   └── CrewFilters.tsx
├── guests/
│   ├── GuestList.tsx
│   ├── GuestCard.tsx
│   └── GuestFormDialog.tsx
└── ...
```

---

## ZAKLJUČAK

**Organizacija**: 6/10
- Backend je bolje organizovan od frontend-a
- Ima logičnu strukturu ali previše velikih fajlova
- Dosta dead code i utility scripts van organizacije

**Najveći problemi**:
1. 10 fajlova sa 12,000+ linija koda ukupno - svi trebaju refaktorisanje
2. 17 utility scripts u root-u backend-a
3. Duplirani fajlovi (mqtt-monitor x3)
4. Frontend komponente neorganizovane u feature foldere
5. Slab test coverage na frontend-u

**Prioritet**: Reorganizacija backend utility scripts-a i razbijanje velikih fajlova.
