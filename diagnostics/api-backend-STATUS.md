# Backend API Endpoints - STATUS REPORT (2025-10-30)

## 📊 STATISTIKA

- **Ukupno route fajlova**: 24 fajla
- **Ukupno endpoints**: 120+ endpointa
- **Auth mehanizam**: JWT + role-based permissions
- **Validacija**: Zod schemas
- **Rate limiting**: Da (login, device test)

---

## ⚡ BRZI PREGLED - ŠTA JE URAĐENO?

### ✅ ISPRAVLJENO (2 problema):
1. ✅ **Backup endpoints** - Sada SVI imaju `system.backup` permission
   - Fajl: `backend/src/routes/backup.ts:20`
   - `router.use(requirePermission('system.backup'));`

2. ✅ **Service Requests** - Dodati novi endpoints:
   - `PUT /:id` - generalno update (linija 76)
   - `POST /:id/cancel` - cancel request (linija 86)

### ⚠️ DELIMIČNO ISPRAVLJENO (5 problema):
3. ⚠️ **Assignments** - Ima auth, ali nedostaju permission checks
   - Fajl: `backend/src/routes/assignments.ts:15`
   - IMA: `router.use(authMiddleware);` ✅
   - NEMA: Permission checks na 10 od 11 endpoints ❌
   - JEDINO: `DELETE /by-date/:date` ima `requirePermission('assignments.delete')` (linija 316)

4. ⚠️ **Shifts** - Ima auth, ali nedostaju permission checks
   - Fajl: `backend/src/routes/shifts.ts:15`
   - IMA: `router.use(authMiddleware);` ✅
   - NEMA: Permission checks na NIJEDNOM endpoint-u ❌

5. ⚠️ **Crew Change Logs** - Ima auth, ali nedostaju permission checks
   - Fajl: `backend/src/routes/crew-change-logs.ts`
   - IMA: `authMiddleware` na svakom endpoint-u ✅
   - NEMA: Permission checks na NIJEDNOM endpoint-u ❌

6. ⚠️ **Messages** - Ima auth, ali nedostaju permission checks
   - Fajl: `backend/src/routes/messages.ts`
   - IMA: `authMiddleware` na svakom endpoint-u ✅
   - NEMA: Permission checks ❌
   - **NAPOMENA**: Verovatno OK jer user može da čita samo svoje poruke (logika u kodu)

7. ⚠️ **Guests** - Samo 2 od 7 endpoints imaju permission checks
   - Fajl: `backend/src/routes/guests.ts`
   - IMA permission: `GET /stats` i `GET /meta` ✅
   - NEMA permission: `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` ❌

### ❌ JOŠ UVEK PROBLEMATIČNO (4 kritična problema):
8. ❌ **Activity Logs POST** - Pogrešan permission
   - Fajl: `backend/src/routes/activity-logs.ts:16`
   - Trenutno: `router.post('/', requirePermission('system.view-logs'), ...)`
   - Treba: `requirePermission('system.create-logs')`

9. ❌ **Service Requests** - Nedostaje /delegate endpoint
   - Fajl: `backend/src/routes/service-requests.ts`
   - IMA: `POST /:id/accept`, `POST /:id/complete`, `POST /:id/cancel` ✅
   - NEMA: `POST /:id/delegate` ❌
   - Frontend ga očekuje za delegiranje requesta drugom crew memberu

10. ❌ **Locations** - NEMA auth NI permission checks
    - Fajl: `backend/src/routes/locations.ts`
    - NEMA: `authMiddleware` ❌
    - NEMA: Permission checks ❌
    - Svi CRUD endpoints su potpuno nezaštićeni

11. ❌ **Smart Buttons** - NEMA auth (security risk)
    - Fajl: `backend/src/routes/smart-buttons.ts`
    - Endpoints: `POST /press`, `POST /status/:deviceId`, `POST /telemetry/:deviceId`
    - NEMA: Auth ❌
    - **RAZLOG**: ESP32 uređaji direktno šalju podatke
    - **RIZIK**: Bilo ko može da simulira button press bez autentifikacije

---

## 📋 DETALJNA ANALIZA PO ENDPOINTS-u

### 1. ACTIVITY LOGS (`/api/activity-logs`)

| Method | Endpoint | Auth | Permission | Status | Problem |
|--------|----------|------|------------|--------|---------|
| GET | `/` | ✅ | ✅ system.view-logs | ✅ OK | - |
| POST | `/` | ✅ | ❌ system.view-logs | ❌ GREŠKA | Treba `system.create-logs` |

**AKCIJA**: Promeniti permission na POST endpoint-u (linija 16).

---

### 2. ASSIGNMENTS (`/api/assignments`)

| Method | Endpoint | Auth | Permission | Status |
|--------|----------|------|------------|--------|
| GET | `/` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| GET | `/by-date/:date` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| GET | `/by-week/:startDate` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| GET | `/crew/:crewMemberId` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| GET | `/:id` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| POST | `/` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| POST | `/bulk` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| PUT | `/:id` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| DELETE | `/:id` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| DELETE | `/by-date/:date` | ✅ | ✅ assignments.delete | ✅ OK |
| DELETE | `/crew/:crewMemberId` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |

**AKCIJA**: Dodati permission checks na sve endpoints.

---

### 3. BACKUP (`/api/backup`)

| Method | Endpoint | Auth | Permission | Status |
|--------|----------|------|------------|--------|
| GET | `/settings` | ✅ | ✅ system.backup | ✅ ISPRAVLJENO |
| PUT | `/settings` | ✅ | ✅ system.backup | ✅ ISPRAVLJENO |
| GET | `/status` | ✅ | ✅ system.backup | ✅ ISPRAVLJENO |
| POST | `/create` | ✅ | ✅ system.backup | ✅ ISPRAVLJENO |
| POST | `/restore/:filename` | ✅ | ✅ system.backup | ✅ ISPRAVLJENO |
| DELETE | `/:filename` | ✅ | ✅ system.backup | ✅ ISPRAVLJENO |
| GET | `/download/:filename` | ✅ | ✅ system.backup | ✅ ISPRAVLJENO |

**STATUS**: ✅ SVI ENDPOINTS SADA IMAJU PERMISSION CHECKS (linija 20: `router.use(requirePermission('system.backup'))`)

---

### 4. GUESTS (`/api/guests`)

| Method | Endpoint | Auth | Permission | Status |
|--------|----------|------|------------|--------|
| GET | `/` | ❌ | ❌ Nema | ❌ KRITIČNO |
| GET | `/stats` | ✅ | ✅ guests.view | ✅ OK |
| GET | `/meta` | ✅ | ✅ guests.view | ✅ OK |
| POST | `/` | ❌ | ❌ Nema | ❌ KRITIČNO |
| GET | `/:id` | ❌ | ❌ Nema | ❌ KRITIČNO |
| PUT | `/:id` | ❌ | ❌ Nema | ❌ KRITIČNO |
| DELETE | `/:id` | ❌ | ❌ Nema | ❌ KRITIČNO |

**AKCIJA**: Dodati auth middleware i permission checks na sve CRUD endpoints.

---

### 5. LOCATIONS (`/api/locations`)

| Method | Endpoint | Auth | Permission | Status |
|--------|----------|------|------------|--------|
| GET | `/` | ❌ | ❌ Nema | ❌ KRITIČNO |
| GET | `/:id` | ❌ | ❌ Nema | ❌ KRITIČNO |
| POST | `/` | ❌ | ❌ Nema | ❌ KRITIČNO |
| PUT | `/:id` | ❌ | ❌ Nema | ❌ KRITIČNO |
| DELETE | `/:id` | ❌ | ❌ Nema | ❌ KRITIČNO |
| POST | `/:id/toggle-dnd` | ❌ | ❌ Nema | ❌ KRITIČNO |
| GET | `/dnd/active` | ❌ | ❌ Nema | ❌ KRITIČNO |

**AKCIJA**: Dodati auth middleware i permission checks - HITNO!

---

### 6. SERVICE REQUESTS (`/api/service-requests`)

| Method | Endpoint | Auth | Permission | Status |
|--------|----------|------|------------|--------|
| GET | `/` | ✅ | ✅ service-requests.view | ✅ OK |
| POST | `/` | ✅ | ✅ service-requests.create | ✅ OK |
| GET | `/:id` | ✅ | ✅ service-requests.view | ✅ OK |
| POST | `/:id/accept` | ✅ | ✅ service-requests.accept | ✅ OK |
| POST | `/:id/complete` | ✅ | ✅ service-requests.complete | ✅ OK |
| PUT | `/:id` | ✅ | ✅ service-requests.edit | ✅ NOVO |
| POST | `/:id/cancel` | ✅ | ✅ service-requests.cancel | ✅ NOVO |
| POST | `/:id/delegate` | - | - | ❌ NEDOSTAJE |

**AKCIJA**: Dodati `POST /:id/delegate` endpoint.

---

### 7. SHIFTS (`/api/shifts`)

| Method | Endpoint | Auth | Permission | Status |
|--------|----------|------|------------|--------|
| GET | `/` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| GET | `/active` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| GET | `/:id` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| POST | `/` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| PUT | `/:id` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| DELETE | `/:id` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| POST | `/:id/toggle-active` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| POST | `/reorder` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |

**AKCIJA**: Dodati permission checks na sve endpoints.

---

### 8. SMART BUTTONS (`/api/smart-buttons`)

| Method | Endpoint | Auth | Permission | Status |
|--------|----------|------|------------|--------|
| POST | `/press` | ❌ | ❌ | ⚠️ NAMERNO |
| POST | `/status/:deviceId` | ❌ | ❌ | ⚠️ NAMERNO |
| POST | `/telemetry/:deviceId` | ❌ | ❌ | ⚠️ NAMERNO |
| POST | `/test/:deviceId` | ❌ | ❌ | ⚠️ NAMERNO |
| GET | `/mqtt-status` | ❌ | ❌ | ⚠️ NAMERNO |

**NAPOMENA**: Endpoints NAMERNO nemaju auth jer ESP32 uređaji direktno šalju podatke.
**RIZIK**: Bilo ko na mreži može da simulira button press.
**PREPORUKA**: Dodati API key ili IP whitelist za ESP32 uređaje.

---

### 9. CREW CHANGE LOGS (`/api/crew-change-logs`)

| Method | Endpoint | Auth | Permission | Status |
|--------|----------|------|------------|--------|
| GET | `/` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| POST | `/` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| GET | `/crew/:crewMemberId` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| POST | `/bulk` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |
| GET | `/recent` | ✅ | ❌ Nema | ⚠️ NEDOSTAJE |

**AKCIJA**: Dodati permission checks (npr. `crew.view-logs`, `crew.create-logs`).

---

### 10. MESSAGES (`/api/messages`)

| Method | Endpoint | Auth | Permission | Status |
|--------|----------|------|------------|--------|
| GET | `/` | ✅ | ❌ Nema | ⚠️ OK? |
| GET | `/conversation/:otherUserId` | ✅ | ❌ Nema | ⚠️ OK? |
| POST | `/` | ✅ | ❌ Nema | ⚠️ OK? |
| PUT | `/:messageId/read` | ✅ | ❌ Nema | ⚠️ OK? |
| PUT | `/mark-all-read` | ✅ | ❌ Nema | ⚠️ OK? |
| DELETE | `/:messageId` | ✅ | ❌ Nema | ⚠️ OK? |
| GET | `/unread-count` | ✅ | ❌ Nema | ⚠️ OK? |

**NAPOMENA**: Verovatno OK jer user može da pristupa samo svojim porukama (logika u kodu).

---

## 🔴 PRIORITET ZA POPRAVKU

### KRITIČNO (Hitno):
1. ❌ **Locations** - Dodati auth middleware i permission checks
2. ❌ **Guests CRUD** - Dodati auth i permission checks na osnovne CRUD operacije
3. ❌ **Activity Logs POST** - Popraviti permission sa `view-logs` na `create-logs`
4. ❌ **Service Requests** - Dodati `POST /:id/delegate` endpoint

### VISOK PRIORITET:
5. ⚠️ **Assignments** - Dodati permission checks na sve endpoints
6. ⚠️ **Shifts** - Dodati permission checks na sve endpoints
7. ⚠️ **Smart Buttons** - Dodati auth (API key ili IP whitelist)

### SREDNJI PRIORITET:
8. ⚠️ **Crew Change Logs** - Dodati permission checks
9. ⚠️ **Messages** - Razmotriti da li su potrebni permission checks

---

## 📈 NAPREDAK

### Pre analize:
- Endpoints sa permission checks: ~50 (40%)
- Endpoints bez permission checks: ~70 (60%)

### Posle analize (trenutno stanje):
- ✅ **Ispravljeno**: 9 endpoints (Backup module)
- ⚠️ **Delimično ispravljeno**: ~30 endpoints (imaju auth, nedostaje permission)
- ❌ **Još uvek problematično**: ~35 endpoints (bez auth ili permission)

### Preostalo za popravku:
- **Kritično**: ~20 endpoints
- **Visok prioritet**: ~25 endpoints
- **Srednji prioritet**: ~15 endpoints

---

## ✅ PLAN AKCIJE

1. **Faza 1 - Kritično (1-2 sata)**:
   - Dodati `router.use(authMiddleware)` na locations.ts
   - Dodati `requirePermission('locations.*')` na sve locations endpoints
   - Dodati auth i permissions na guests CRUD endpoints
   - Popraviti activity-logs POST permission
   - Implementirati service-requests `/delegate` endpoint

2. **Faza 2 - Visok prioritet (2-3 sata)**:
   - Dodati permission checks na assignments endpoints
   - Dodati permission checks na shifts endpoints
   - Implementirati API key auth za smart-buttons endpoints

3. **Faza 3 - Srednji prioritet (1-2 sata)**:
   - Dodati permission checks na crew-change-logs endpoints
   - Razmotriti permission checks za messages endpoints

---

## 📝 ZAKLJUČAK

**Pozitivno**:
- Backup module je potpuno zaštićen ✅
- Većina endpoints ima auth ✅
- Service requests su dobro zaštićeni ✅

**Negativno**:
- Locations potpuno nezaštićeni ❌
- Guests CRUD endpoints nezaštićeni ❌
- Smart buttons bez auth (security risk) ❌
- Activity logs ima pogrešan permission ❌

**Sledeći koraci**:
1. Prioritizovati kritične probleme
2. Dodati nedostajuće permission checks
3. Implementirati auth za ESP32 uređaje
4. Testirati sve izmene

---

**DATUM ANALIZE**: 2025-10-30
**ANALIZIRAO**: Claude Code
**VERZIJA**: 1.0
