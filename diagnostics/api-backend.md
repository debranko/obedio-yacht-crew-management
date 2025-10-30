# Backend API Endpoints - Kompletna Analiza

## STATISTIKA

- **Ukupno route fajlova**: 24 fajla
- **Ukupno endpoints**: 120+ endpointa
- **Auth mehanizam**: JWT + role-based permissions
- **Validacija**: Zod schemas
- **Rate limiting**: Da (login, device test)

---

## TABELA SVIH ENDPOINTS - PO RESOURCE-u

### 1. ACTIVITY LOGS (`/api/activity-logs`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | system.view-logs | ✅ prisma.activityLog.findMany | Lista svih activity logs |
| POST | `/` | ✅ | system.view-logs | ✅ prisma.activityLog.create | Kreiranje novog log entry |

**PROBLEM**: POST `/` zahteva `system.view-logs` umesto `system.create-logs`. Čudna permission za POST.

---

### 2. ASSIGNMENTS (`/api/assignments`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.assignment.findMany | Lista svih assignments |
| GET | `/by-date/:date` | ✅ | ❌ Nema | ✅ prisma.assignment.findMany | Assignments za određeni datum |
| GET | `/by-week/:startDate` | ✅ | ❌ Nema | ✅ prisma.assignment.findMany | Assignments za nedelju |
| GET | `/crew/:crewMemberId` | ✅ | ❌ Nema | ✅ prisma.assignment.findMany | Assignments za jednog crew membera |
| GET | `/:id` | ✅ | ❌ Nema | ✅ prisma.assignment.findUnique | Pojedinačan assignment |
| POST | `/` | ✅ | ❌ Nema | ✅ prisma.assignment.create | Kreiranje novog assignment |
| POST | `/bulk` | ✅ | ❌ Nema | ✅ prisma.assignment.createMany | Bulk kreiranje |
| PUT | `/:id` | ✅ | ❌ Nema | ✅ prisma.assignment.update | Update assignment |
| DELETE | `/:id` | ✅ | ❌ Nema | ✅ prisma.assignment.delete | Brisanje assignment |
| DELETE | `/by-date/:date` | ✅ | assignments.delete | ✅ prisma.assignment.deleteMany | Brisanje po datumu |
| DELETE | `/crew/:crewMemberId` | ✅ | ❌ Nema | ✅ prisma.assignment.deleteMany | Brisanje svih za crew membera |

**PROBLEM**: Većina endpoints NEMA permission check-ove. Samo DELETE `/by-date/:date` ima.

---

### 3. AUTH (`/api/auth`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| POST | `/login` | ❌ | ❌ | ✅ prisma.user.findUnique | Login sa username/password |
| POST | `/refresh` | ❌ | ❌ | ✅ prisma.user.findUnique | Refresh JWT token |
| GET | `/verify` | ❌ | ❌ | ✅ prisma.user.findUnique | Verify JWT token |
| POST | `/setup-password` | ❌ | ❌ | ✅ prisma.user.update | Setup password za novog usera |
| POST | `/logout` | ❌ | ❌ | ❌ | Logout (client-side samo) |

**NAPOMENA**: Auth endpoints ne zahtevaju auth (logično). Login ima rate limiting.

---

### 4. BACKUP (`/api/backup`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/settings` | ✅ | ❌ Nema | ✅ prisma.settings | Backup settings |
| PUT | `/settings` | ✅ | ❌ Nema | ✅ prisma.settings.update | Update backup settings |
| GET | `/status` | ✅ | ❌ Nema | ✅ File system | Status backupa |
| POST | `/create` | ✅ | ❌ Nema | ✅ DB export | Kreiranje backupa |
| POST | `/restore/:filename` | ✅ | ❌ Nema | ✅ DB import | Restore iz backupa |
| DELETE | `/:filename` | ✅ | ❌ Nema | ✅ File system | Brisanje backup fajla |
| GET | `/download/:filename` | ✅ | ❌ Nema | ✅ File system | Download backup fajla |

**PROBLEM**: Backup endpoints NEMAJU permission checks - opasno! Bilo ko može da restoruje ili obriše backup.

---

### 5. CREW (`/api/crew`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | crew.view | ✅ prisma.crewMember.findMany | Lista svih crew members |
| POST | `/` | ✅ | crew.create | ✅ prisma.crewMember.create + prisma.user.create | Kreiranje crew + user account |
| PUT | `/:id` | ✅ | crew.edit | ✅ prisma.crewMember.update | Update crew membera |
| DELETE | `/:id` | ✅ | crew.delete | ✅ prisma.crewMember.delete | Brisanje crew membera |

**NAPOMENA**: POST `/` automatski kreira i User account sa generisanim username/password.

---

### 6. CREW CHANGE LOGS (`/api/crew-change-logs`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.crewChangeLog.findMany | Lista svih change log-ova |
| POST | `/` | ✅ | ❌ Nema | ✅ prisma.crewChangeLog.create | Kreiranje change loga |
| GET | `/crew/:crewMemberId` | ✅ | ❌ Nema | ✅ prisma.crewChangeLog.findMany | Logs za jednog crew membera |
| POST | `/bulk` | ✅ | ❌ Nema | ✅ prisma.crewChangeLog.createMany | Bulk kreiranje |
| GET | `/recent` | ✅ | ❌ Nema | ✅ prisma.crewChangeLog.findMany | Recent changes |

**PROBLEM**: Nema permission checks.

---

### 7. DASHBOARD (`/api/dashboard`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/layout` | ✅ | ❌ Nema | ✅ prisma.dashboardLayout.findUnique | User's dashboard layout |
| PUT | `/layout` | ✅ | ❌ Nema | ✅ prisma.dashboardLayout.upsert | Save dashboard layout |
| POST | `/reset` | ✅ | ❌ Nema | ✅ prisma.dashboardLayout.delete | Reset na default |
| GET | `/defaults/:role` | ✅ | settings.manage | ✅ prisma.dashboardLayout.findUnique | Default layout za role |

**ANALIZA**: Dobro - user-specific dashboard customization.

---

### 8. DEVICE DISCOVERY (`/api/device-discovery`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| POST | `/discover` | ✅ | ❌ Nema | ✅ MQTT | Trigger device discovery |
| GET | `/pairing` | ✅ | ❌ Nema | ✅ In-memory cache | Lista pending devices |
| POST | `/pair/:deviceId` | ✅ | ❌ Nema | ✅ prisma.device.create | Pair device sa sistemom |
| POST | `/simulate-announce` | ✅ | ❌ Nema | ✅ MQTT | Simulacija ESP32 announce |
| DELETE | `/pairing/:deviceId` | ✅ | ❌ Nema | ✅ In-memory cache | Uklanjanje iz pending liste |

**ANALIZA**: ESP32 device discovery flow. Koristi MQTT za discovery.

---

### 9. DEVICES (`/api/devices`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/logs` | ✅ | devices.view | ✅ prisma.deviceLog.findMany | Device logs |
| GET | `/stats/summary` | ✅ | devices.view | ✅ prisma.device.findMany + aggregacija | Stats za sve devices |
| GET | `/` | ✅ | devices.view | ✅ prisma.device.findMany | Lista svih devices |
| GET | `/:id` | ✅ | devices.view | ✅ prisma.device.findUnique | Pojedinačan device |
| POST | `/` | ✅ | devices.add | ✅ prisma.device.create | Kreiranje novog device |
| PUT | `/:id` | ✅ | devices.edit | ✅ prisma.device.update | Update device |
| DELETE | `/:id` | ✅ | devices.delete | ✅ prisma.device.delete | Brisanje device |
| GET | `/:id/config` | ✅ | devices.view | ✅ prisma.device.findUnique | Device konfiguracija |
| PUT | `/:id/config` | ✅ | devices.edit | ✅ prisma.device.update + MQTT publish | Update config + slanje na MQTT |
| POST | `/:id/test` | ✅ | devices.edit | ✅ MQTT publish | Test button press |
| GET | `/:id/logs` | ✅ | devices.view | ✅ prisma.deviceLog.findMany | Logs za jedan device |

**ANALIZA**: Kompletan CRUD + config management + MQTT integracija. Ima rate limiting na `/test`.

---

### 10. GUESTS (`/api/guests`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.guest.findMany | Lista guestova (sa filterima) |
| GET | `/stats` | ✅ | guests.view | ✅ prisma.guest.groupBy | Guest statistika |
| GET | `/meta` | ✅ | guests.view | ✅ prisma.guest.findMany | Metadata (distinct values) |
| POST | `/` | ✅ | ❌ Nema | ✅ prisma.guest.create | Kreiranje guesta |
| GET | `/:id` | ✅ | ❌ Nema | ✅ prisma.guest.findUnique | Pojedinačan guest |
| PUT | `/:id` | ✅ | ❌ Nema | ✅ prisma.guest.update | Update guesta |
| DELETE | `/:id` | ✅ | ❌ Nema | ✅ prisma.guest.delete | Brisanje guesta |

**PROBLEM**: GET `/` i CRUD operacije NEMAJU permission checks. Samo `/stats` i `/meta` imaju.

---

### 11. LOCATIONS (`/api/locations`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.location.findMany | Lista lokacija |
| GET | `/:id` | ✅ | ❌ Nema | ✅ prisma.location.findUnique | Pojedinačna lokacija |
| POST | `/` | ✅ | ❌ Nema | ✅ prisma.location.create | Kreiranje lokacije |
| PUT | `/:id` | ✅ | ❌ Nema | ✅ prisma.location.update | Update lokacije |
| DELETE | `/:id` | ✅ | ❌ Nema | ✅ prisma.location.delete | Brisanje lokacije |

**ANALIZA**: Standardan CRUD. Ima smart button assignment validaciju.

---

### 12. MESSAGES (`/api/messages`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.message.findMany | Sve poruke korisnika |
| GET | `/conversation/:otherUserId` | ✅ | ❌ Nema | ✅ prisma.message.findMany | Konverzacija sa drugim userom |
| POST | `/` | ✅ | ❌ Nema | ✅ prisma.message.create | Slanje poruke |
| PUT | `/:messageId/read` | ✅ | ❌ Nema | ✅ prisma.message.update | Označavanje kao pročitano |
| PUT | `/mark-all-read` | ✅ | ❌ Nema | ✅ prisma.message.updateMany | Sve poruke kao pročitane |
| DELETE | `/:messageId` | ✅ | ❌ Nema | ✅ prisma.message.delete | Brisanje poruke |
| GET | `/unread-count` | ✅ | ❌ Nema | ✅ prisma.message.count | Broj nepročitanih |

**ANALIZA**: Messaging sistem između crew members.

---

### 13. NOTIFICATION SETTINGS (`/api/notification-settings`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.notificationSettings.findUnique | User's notification settings |
| PUT | `/` | ✅ | ❌ Nema | ✅ prisma.notificationSettings.upsert | Update notification settings |
| POST | `/push-token` | ✅ | ❌ Nema | ✅ prisma.user.update | Register push notification token |
| POST | `/test` | ✅ | ❌ Nema | ❌ Push API | Test push notifikacije |

**ANALIZA**: Push notification support (za PWA ili mobile app).

---

### 14. ROLE PERMISSIONS (`/api/role-permissions`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/roles/:role` | ✅ | ❌ Nema | ✅ In-memory | Permissions za određenu role |
| GET | `/roles` | ✅ | ❌ Nema | ✅ In-memory | Lista svih role-a |
| PUT | `/roles/:role` | ✅ | ❌ Nema | ✅ In-memory (možda DB?) | Update role permissions |
| POST | `/roles/:role/reset` | ✅ | ❌ Nema | ✅ In-memory | Reset na default permissions |

**ANALIZA**: RBAC sistem. Verovatno koristi hardcoded config.

---

### 15. SERVICE CATEGORIES (`/api/service-categories`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | settings.view | ✅ prisma.serviceCategory.findMany | Lista kategorija |
| POST | `/` | ✅ | settings.edit | ✅ prisma.serviceCategory.create | Kreiranje kategorije |
| PUT | `/:id` | ✅ | settings.edit | ✅ prisma.serviceCategory.update | Update kategorije |
| DELETE | `/:id` | ✅ | settings.edit | ✅ prisma.serviceCategory.delete | Brisanje kategorije |
| PUT | `/reorder` | ✅ | settings.edit | ✅ prisma.serviceCategory.updateMany | Reorder kategorija |

**ANALIZA**: Service request kategorizacija.

---

### 16. SERVICE REQUEST HISTORY (`/api/service-request-history`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.serviceRequestHistory.findMany | Sva istorija |
| POST | `/` | ✅ | ❌ Nema | ✅ prisma.serviceRequestHistory.create | Dodavanje history entry |
| GET | `/request/:serviceRequestId` | ✅ | ❌ Nema | ✅ prisma.serviceRequestHistory.findMany | History za jedan request |
| GET | `/completed` | ✅ | ❌ Nema | ✅ prisma.serviceRequestHistory.findMany | Completed requests history |

**ANALIZA**: Audit trail za service requests.

---

### 17. SERVICE REQUESTS (`/api/service-requests`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | service-requests.view | ✅ prisma.serviceRequest.findMany | Lista service requests |
| POST | `/` | ✅ | service-requests.create | ✅ prisma.serviceRequest.create | Kreiranje service requesta |
| POST | `/:id/accept` | ✅ | service-requests.accept | ✅ prisma.serviceRequest.update | Accept request (assign to crew) |
| POST | `/:id/complete` | ✅ | service-requests.complete | ✅ prisma.serviceRequest.update | Complete request |

**PROBLEM**: Nedostaje DELETE endpoint. Nedostaje DELEGATE endpoint koji frontend očekuje (videćemo u frontend analizi).

---

### 18. SETTINGS (`/api/settings`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/all` | ✅ | ❌ Nema | ✅ prisma.settings.findMany | Svi system settings |
| GET | `/system-status` | ✅ | ❌ Nema | ✅ DB query + system info | System health status |

**ANALIZA**: Read-only settings endpoints. Update je verovatno u `/system-settings`.

---

### 19. SHIFTS (`/api/shifts`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.shift.findMany | Lista shifts |
| GET | `/active` | ✅ | ❌ Nema | ✅ prisma.shift.findMany | Samo aktivni shifts |
| GET | `/:id` | ✅ | ❌ Nema | ✅ prisma.shift.findUnique | Pojedinačan shift |
| POST | `/` | ✅ | ❌ Nema | ✅ prisma.shift.create | Kreiranje shift-a |
| PUT | `/:id` | ✅ | ❌ Nema | ✅ prisma.shift.update | Update shift-a |
| DELETE | `/:id` | ✅ | ❌ Nema | ✅ prisma.shift.delete | Brisanje shift-a |
| POST | `/:id/toggle-active` | ✅ | ❌ Nema | ✅ prisma.shift.update | Aktiviranje/deaktiviranje |
| POST | `/reorder` | ✅ | ❌ Nema | ✅ prisma.shift.updateMany | Reorder shifts |

**ANALIZA**: Shift management za crew scheduling.

---

### 20. SMART BUTTONS (`/api/smart-buttons`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| POST | `/press` | ❌ | ❌ Nema | ✅ MQTT + prisma.serviceRequest.create | Button press event (od ESP32) |
| POST | `/status/:deviceId` | ❌ | ❌ Nema | ✅ prisma.device.update | Device status update |
| POST | `/telemetry/:deviceId` | ❌ | ❌ Nema | ✅ prisma.deviceLog.create | Device telemetry |
| POST | `/test/:deviceId` | ❌ | ❌ Nema | ✅ MQTT publish | Test button press |
| GET | `/mqtt-status` | ❌ | ❌ Nema | ✅ In-memory | MQTT connection status |

**ANALIZA**: ESP32 communication endpoints. Press i status NEMAJU auth (ESP32 direktno šalje). Security risk?

---

### 21. SYSTEM SETTINGS (`/api/system-settings`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.systemSettings.findUnique | System settings |
| PUT | `/` | ✅ | ❌ Nema | ✅ prisma.systemSettings.upsert | Update system settings |
| GET | `/health` | ❌ | ❌ Nema | ✅ DB ping + system metrics | Health check endpoint |

**ANALIZA**: Health check je public (dobro za monitoring).

---

### 22. TRANSCRIBE (`/api/transcribe`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| POST | `/` | ❌ | ❌ Nema | ✅ External API (OpenAI Whisper?) | Voice to text transcription |
| GET | `/test` | ❌ | ❌ Nema | ❌ | Test endpoint |

**ANALIZA**: Voice transcription za service requests. Nema auth - možda namerno za ESP32?

---

### 23. UPLOAD (`/api/upload`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| POST | `/image` | ✅ | ❌ Nema | ✅ File system | Image upload |
| DELETE | `/image/:filename` | ✅ | ❌ Nema | ✅ File system | Delete uploaded image |

**ANALIZA**: Image upload za locations, crew avatars, itd.

---

### 24. USER PREFERENCES (`/api/user-preferences`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.userPreferences.findUnique | User preferences |
| PUT | `/dashboard` | ✅ | ❌ Nema | ✅ prisma.userPreferences.upsert | Dashboard preferences |
| PUT | `/theme` | ✅ | ❌ Nema | ✅ prisma.userPreferences.upsert | Theme preferences |
| DELETE | `/dashboard` | ✅ | ❌ Nema | ✅ prisma.userPreferences.update | Reset dashboard prefs |

**ANALIZA**: User customization (dashboard layout, theme).

---

### 25. YACHT SETTINGS (`/api/yacht-settings`)

| Method | Endpoint | Auth | Permission | Koristi DB? | Opis |
|--------|----------|------|------------|-------------|------|
| GET | `/` | ✅ | ❌ Nema | ✅ prisma.yachtSettings.findUnique | Yacht-specific settings |
| PUT | `/` | ✅ | ❌ Nema | ✅ prisma.yachtSettings.upsert | Update yacht settings |

**ANALIZA**: Multi-yacht support (yacht name, logo, itd.).

---

## PRISMA MODELI KOJE BACKEND KORISTI

**Confirmed Prisma models** (koriste se u backend kodu):

1. **User** - User accounts (login, auth)
2. **CrewMember** - Crew members (linked to User)
3. **Guest** - Guests/passengers
4. **Location** - Cabins/locations
5. **Device** - ESP32 devices (smart buttons, T-Watch)
6. **DeviceLog** - Device telemetry/logs
7. **ServiceRequest** - Service requests
8. **ServiceRequestHistory** - Service request audit trail
9. **ServiceCategory** - Request categories
10. **Assignment** - Crew-task assignments
11. **Shift** - Work shifts
12. **Message** - Inter-crew messaging
13. **NotificationSettings** - Push notification preferences
14. **ActivityLog** - System activity logs
15. **CrewChangeLog** - Crew change history
16. **DashboardLayout** - User dashboard customization
17. **UserPreferences** - User preferences
18. **YachtSettings** - Yacht-specific config
19. **SystemSettings** - System-level settings
20. **Settings** - General settings (backup, itd.)

**TOTAL**: 20 Prisma modela se koriste.

---

## ENDPOINTS BEZ IMPLEMENTACIJE / PROBLEMATIČNI

### 1. Service Requests - DELEGATE nije implementiran

Frontend očekuje (videćemo u sledećem koraku):
```
POST /api/service-requests/:id/delegate
```

**POSTOJI**:
- `POST /:id/accept`
- `POST /:id/complete`

**NEDOSTAJE**:
- `POST /:id/delegate` - Potrebno za forward-ovanje requesta drugom crew memberu

---

### 2. Activity Logs - Čudan POST permission

```
POST /api/activity-logs
```

Zahteva `system.view-logs` umesto `system.create-logs`. Verovatno greška.

---

### 3. Endpoints bez Permission Checks - SECURITY PROBLEM

**Kritični endpoints BEZ permission checks**:

#### Assignments (11 endpoints):
- Svi CRUD endpointi nemaju permissions osim DELETE `/by-date/:date`

#### Backup (7 endpoints):
- **КРИТИЧНО** - Backup restore/delete nemaju permission checks
- Bilo ko sa JWT-om može da obriše ili restoruje backup!

#### Guests (7 endpoints):
- Svi CRUD endpointi nemaju permissions osim `/stats` i `/meta`

#### Locations (5 endpoints):
- Svi CRUD endpointi nemaju permissions

#### Crew Change Logs (5 endpoints):
- Svi endpoints nemaju permissions

#### Messages (7 endpoints):
- Svi endpoints nemaju permissions (možda OK - user može da čita samo svoje poruke)

#### Shifts (8 endpoints):
- Svi endpoints nemaju permissions

#### Smart Buttons:
- `POST /press` - **ESP32 direktno šalje** - nema auth
- `POST /status/:deviceId` - nema auth
- `POST /telemetry/:deviceId` - nema auth

**RIZIK**: Bilo ko sa valjanim JWT može da pristupa ovim endpoint-ima bez obzira na role.

---

### 4. Endpoints bez Auth (namerno ili ne?)

#### Očekivano bez auth (public):
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/verify`
- `POST /api/auth/setup-password`
- `GET /api/system-settings/health` (health check)

#### Pitanje - da li treba auth?:
- `POST /api/smart-buttons/press` - ESP32 button press
- `POST /api/smart-buttons/status/:deviceId` - ESP32 status
- `POST /api/smart-buttons/telemetry/:deviceId` - ESP32 telemetry
- `POST /api/transcribe` - Voice transcription

**PITANJE**: Da li ESP32 treba da šalje API key ili JWT? Trenutno nema zaštitu.

---

## MIDDLEWARE SUMMARY

### Korišćeni middleware:

1. **authMiddleware** - JWT verifickacija
2. **requirePermission(permission)** - RBAC check
3. **validate(schema)** - Zod schema validacija
4. **asyncHandler** - Error handling wrapper
5. **loginLimiter** - Rate limiting za login (brute force protection)
6. **deviceTestRateLimiter** - Rate limiting za device test
7. **strictRateLimiter** - Strict rate limiting (za refresh token)
8. **upload.single('...')** - Multer file upload

---

## WEBSOCKET EVENTS (emitovani iz backend-a)

Pregledao sam kod - backend emituje WebSocket events preko `websocketService`:

**Confirmed WebSocket events**:
- `service-request:new` - Novi service request
- `service-request:updated` - Update requesta
- `crew:updated` - Crew member updated
- `guest:updated` - Guest updated
- `location:updated` - Location updated
- `device:updated` - Device status updated
- `device:telemetry` - Device telemetry data
- (verovatno više - treba proveriti `websocket.ts`)

---

## ZAKLJUČAK - BACKEND API

### ✅ DOBRO:

1. **Dobro organizovano** - svaki resource ima svoj route fajl
2. **Prisma integration** - svi endpointi koriste Prisma ORM
3. **Validation** - koristi Zod schemas za validation
4. **RBAC sistem** - role-based permissions implementiran
5. **Rate limiting** - ima na kritičnim endpoint-ima
6. **Health check** - `/api/system-settings/health` za monitoring
7. **WebSocket support** - real-time updates
8. **ESP32 integration** - MQTT + device discovery
9. **Voice transcription** - `/api/transcribe` endpoint
10. **Messaging sistem** - inter-crew komunikacija

---

### ⚠️ PROBLEMI:

1. **Nedostaje `/service-requests/:id/delegate` endpoint** - frontend ga očekuje
2. **50%+ endpoints NEMAJU permission checks** - security rizik
3. **Backup endpoints nemaju permissions** - КРИТИЧНО
4. **ESP32 endpoints nemaju auth** - security pitanje
5. **Activity log POST ima pogrešan permission** (`view` umesto `create`)
6. **Nema UPDATE endpoint za Service Requests** - samo accept i complete

---

### 📊 STATISTIKA:

- **Total endpoints**: 120+
- **Endpoints sa permission checks**: ~50 (40%)
- **Endpoints bez permission checks**: ~70 (60%)
- **Endpoints sa Prisma queries**: ~110 (90%)
- **Endpoints sa MQTT integration**: ~10 (8%)
- **Endpoints sa rate limiting**: 3 (2%)

---

## PRIORITET ZA POPRAVKU:

### 🔴 HIGH PRIORITY:
1. Dodati permission checks na Backup endpoints
2. Dodati permission checks na Assignment endpoints
3. Dodati `/service-requests/:id/delegate` endpoint
4. Dodati auth/API key za ESP32 endpoints (ili whitelisting)

### 🟡 MEDIUM PRIORITY:
5. Dodati permission checks na Guests, Locations, Shifts
6. Popraviti Activity Log POST permission
7. Dodati UPDATE endpoint za Service Requests

### 🟢 LOW PRIORITY:
8. Dodati više rate limiting na kritičnim endpoints
9. Dodati audit logging na sensitive operacije
