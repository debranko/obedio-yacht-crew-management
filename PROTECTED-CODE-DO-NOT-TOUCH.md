# 🔒 PROTECTED CODE - DO NOT TOUCH

**Claude: PRE BILO KOJE IZMENE, PRVO PROVERI OVAJ FAJL!**

Ovaj fajl sadrži sve implementirane funkcije koje **RADE KAKO TREBA** i **NE SMEJU SE DIRATI** osim ako korisnik eksplicitno ne traži izmenu.

---

## ⛔ KRITIČNO PRAVILO - PROČITAJ PRVO!!!

```
🚫 NIKADA NE DODAJ KOD PRE NEGO ŠTO:
1. Otvoriš aplikaciju u browser-u
2. Vidiš gde je komponenta/stranica
3. Pitaš korisnika: "Video sam [opis]. Gde tačno treba izmena?"
4. Dobiješ potvrdu od korisnika

❌ NE improvizujem! NE pravim pretpostavke!
❌ NE kodiram "na slepo" bez gledanja aplikacije!
❌ NE dodajem funkcionalnost dok ne vidim gde tačno treba!

✅ UVEK:
   - Otvorim browser
   - Vidim trenutno stanje
   - Pitam korisnika
   - Čekam potvrdu
   - TEK ONDA kodiram
```

**Ažurirano**: 2025-10-30 - Korisnik insistirao sto puta!

---

## 🚫 BACKEND API - NE DIRATI

### ✅ Već implementirani endpoints koji RADE:

1. **Service Requests** - `/api/service-requests`
   - ✅ GET `/` - Lista service requests
   - ✅ POST `/` - Kreiranje requesta
   - ✅ POST `/:id/accept` - Accept request
   - ✅ POST `/:id/complete` - Complete request
   - ⚠️ **NEDOSTAJE**: `/delegate` endpoint - MOŽE SE DODATI AKO KORISNIK TRAŽI

2. **Guests** - `/api/guests`
   - ✅ CRUD operacije (GET, POST, PUT, DELETE)
   - ✅ Pagination, filtering, search
   - ✅ Stats endpoint (`/stats`)
   - ✅ Meta endpoint (`/meta`)

3. **Crew** - `/api/crew`
   - ✅ CRUD operacije sa proper permissions
   - ✅ Automatski kreira User account na POST

4. **Locations** - `/api/locations`
   - ✅ CRUD operacije
   - ✅ Smart button assignment validacija

5. **Devices** - `/api/devices`
   - ✅ CRUD + Config management
   - ✅ MQTT integration
   - ✅ Test button press
   - ✅ Device logs

6. **Activity Logs** - `/api/activity-logs`
   - ✅ GET i POST endpoints rade

7. **Auth** - `/api/auth`
   - ✅ Login sa JWT
   - ✅ Refresh token
   - ✅ Rate limiting na login (conditional - samo production)

---

## 🚫 FRONTEND COMPONENTS - NE DIRATI

### ✅ Service Requests:

1. **Activity Logging** ✅ - RADI SAVRŠENO
   - `src/components/incoming-request-dialog.tsx` (Accept, Delegate)
   - `src/components/service-request-panel.tsx` (Accept, Complete)
   - `src/components/pages/service-requests.tsx` (Cancel)
   - ⚠️ **NE DIRAJ OVO** - dodaje log u Activity Log nakon svake akcije

2. **Service Request Panel** ✅
   - Prikazuje pending i serving requests
   - Accept i Complete dugmad
   - Backend API integration

3. **Incoming Request Dialog** ✅
   - Popup za nove requeste
   - Accept i Delegate funkcionalnost
   - First-on-duty auto-assignment

---

### ✅ Crew Management:

1. **Crew List Page** ✅ - RADI SAVRŠENO
   - `src/components/pages/crew-list.tsx`
   - Desktop table view + Mobile card view
   - **Nickname display** - prikazuje se ispod imena ✅
   - **Crew colors** - boje na avatarima ✅
   - **Leave dates** - prikazuje "15 Jan - 20 Jan" ✅
   - ⚠️ **NE DIRAJ** - sve tri feature rade kako treba

2. **Crew Card View** ✅
   - `src/components/crew-card-view.tsx`
   - Avatar sa crew color
   - Nickname display
   - Leave status + dates

3. **Crew Member Details Dialog** ✅
   - View/Edit mode toggle
   - Kompletna crew member informacija
   - Leave management

---

### ✅ Guest Management:

1. **Guest List Page** ✅ - RADI SAVRŠENO
   - `src/components/pages/guests-list.tsx`
   - Pagination, filtering, search
   - Dietary Alerts widget
   - ⚠️ **GUEST ONBOARD WIDGET UKLONJEN** - ne vraćaj ga nazad!

2. **Guest Details Dialog** ✅ - SA EDIT MODOM
   - `src/components/guest-details-dialog.tsx`
   - View mode - prikazuje sve info
   - **Edit mode toggle** - dodato nedavno ✅
   - Basic info, Accommodation, Notes editing
   - ⚠️ **NE DIRAJ** - edit mode tek dodat, radi kako treba

3. **Guest Form Dialog** ✅
   - `src/components/guest-form-dialog.tsx`
   - Camera/Upload za foto
   - Tabs za različite sekcije
   - **Bidirectional cabin assignment** ✅
   - ⚠️ **Nedavno dodata lokacija assignment funkcionalnost**

---

### ✅ Location Management:

1. **Locations Page** ✅ - RADI SAVRŠENO
   - `src/components/pages/locations.tsx`
   - **Guest assignment** - čuva u bazu ✅
   - **Validation** - jedan guest po lokaciji ✅
   - **Bidirectional** - radi sa obe strane ✅
   - Smart button assignment
   - DND toggle
   - ⚠️ **NE DIRAJ** - guest assignment tek popravljen

2. **DND Functionality** ✅
   - Instant updates bez refresh (React Query) ✅
   - DND alert widget prikazuje se conditional ✅
   - ⚠️ **Sidebar DND widget UKLONJEN** - ne vraćaj ga!

---

### ✅ Device Manager:

1. **Device Manager Page** ✅
   - `src/components/pages/device-manager.tsx`
   - Statistics cards sa clickable filtering ✅
   - Device CRUD operations
   - Pairing flow
   - Config management

---

### ✅ Dashboard:

1. **Guest Status Widget** ✅ - RADI SAVRŠENO
   - `src/components/guest-status-widget.tsx`
   - Prikazuje onboard goste ✅
   - Koristi **ili** locationId **ili** cabin field ✅
   - ⚠️ **Nedavno popravljeno** - ne diraj filter logiku

---

## 🚫 REACT QUERY PATTERNS - NE MENJAJ

### ✅ Koriste se sledeći hooks:

1. **useGuests()** - za guests data
2. **useGuestMutations()** - za update/create/delete
3. **useLocations()** - za locations data
4. **useDevices()** - za devices data
5. **useDND()** - za DND locations
6. **useAppData()** - centralni context

⚠️ **PRAVILO**: UVEK koristi React Query hooks umesto direktnog pozivanja API-ja!

---

## 📝 WORKFLOW BEFORE ANY CHANGE:

### 1️⃣ **PRE ČITANJA KODA:**
```
1. Proveri DA LI TA FUNKCIJA VEĆ POSTOJI u ovom fajlu
2. Proveri DA LI SE KORISTI NEKI HOOK za to
3. Proveri DA LI JE BACKEND ENDPOINT VEĆ IMPLEMENTIRAN (pogledaj diagnostics/api-backend.md)
```

### 2️⃣ **PRE IMPLEMENTACIJE:**
```
1. Pretraži codebase sa Grep/Glob za EXISTING patterns
2. Proveri DA LI JE VEĆ NEGDE IMPLEMENTIRANO
3. Ako postoji, KORISTI POSTOJEĆE, ne pravi novo!
```

### 3️⃣ **PRE IZMENE:**
```
1. Proveri DA LI JE U "PROTECTED CODE" listi
2. Ako jeste, PITAJ KORISNIKA da li sme da se menja
3. Ne pretpostavljaj - PROVERI!
```

---

## 🔴 KRITIČNA PRAVILA:

### ❌ NIKADA NE:

1. **NE MENJAJ React Query hooks** bez provere da li će aplikacija raditi
2. **NE BRISI imports** koje se koriste
3. **NE PRAVI DUPLIKATE** funkcija koje već postoje
4. **NE DIRAJ service request activity logging** - radi savršeno
5. **NE VRAĆAJ OBRISANE widgets** (Guests Onboard iz Guests List)
6. **NE DIRAJ DND instant updates** - React Query pattern radi
7. **NE MENJAJ guest/location assignment** - tek popravljeno

### ✅ UVEK:

1. **PRVO GREP/GLOB** za existing functionality
2. **PROVERI PROTECTED CODE** fajl
3. **KORISTI POSTOJEĆE HOOKS** umesto kreiranja novih
4. **TESTIRAJ DA LI RADI** nakon izmene
5. **PITAJ KORISNIKA** ako nisi siguran

---

## 📋 RECENTLY FIXED (Ne diraj ovo):

1. ✅ Rate limiter - conditional u dev mode
2. ✅ Service request activity logging - 4 akcije
3. ✅ Crew nickname, color, leave dates
4. ✅ Guest details edit mode
5. ✅ Location guest assignment - saves + validation
6. ✅ DND instant updates - React Query
7. ✅ Device statistics clickable
8. ✅ Guests Onboard widget - uklonjen sa Guests List
9. ✅ Dashboard Guest Status widget - prikazuje sve onboard goste
10. ✅ **2025-01-30**: Backup permission checks - dodato `authMiddleware` u [server.ts:165](backend/src/server.ts#L165)
11. ✅ **2025-01-30**: Assignment permission checks - dodato `requirePermission()` u sve assignment routes [assignments.ts](backend/src/routes/assignments.ts)
12. ✅ **2025-01-30**: Delegate endpoint - kreiran `POST /service-requests/:id/delegate` za delegiranje zahteva između crew members (radi sa Wear OS, ESP32, smart button) [service-requests.ts:49](backend/src/routes/service-requests.ts#L49) + [database.ts:514](backend/src/services/database.ts#L514)
13. ✅ **2025-10-30**: ESP32 Auth/API Key Security - dodato `esp32AuthMiddleware` za zaštitu smart button endpoints (press, status, telemetry, test) + zaštićen simulate-announce endpoint [auth.ts:109-146](backend/src/middleware/auth.ts#L109-L146) + [smart-buttons.ts](backend/src/routes/smart-buttons.ts) + [device-discovery.ts:152](backend/src/routes/device-discovery.ts#L152)
14. ✅ **2025-10-30**: Guest CRUD permission checks - dodato `requirePermission()` za sve 5 guest endpoints (GET /, POST /, GET /:id, PUT /:id, DELETE /:id) sa guests.view/create/edit/delete permissions [guests.ts](backend/src/routes/guests.ts)
15. ✅ **2025-10-30**: Location permission checks - dodato `requirePermission()` za svih 7 location endpoints (GET /, GET /:id, POST /, PUT /:id, DELETE /:id, POST /:id/toggle-dnd, GET /dnd/active) sa locations.view/create/edit/delete permissions [locations.ts](backend/src/routes/locations.ts)
16. ✅ **2025-10-30**: Shift permission checks - dodato `requirePermission()` za svih 8 shift endpoints (GET /, GET /active, GET /:id, POST /, PUT /:id, DELETE /:id, POST /:id/toggle-active, POST /reorder) sa shifts.view/create/edit/delete permissions [shifts.ts](backend/src/routes/shifts.ts)
17. ✅ **2025-10-30**: Activity Log permission fix - promenjena POST permission sa 'system.view-logs' na 'system.create-logs' [activity-logs.ts:16](backend/src/routes/activity-logs.ts#L16)
18. ✅ **2025-10-30**: Rate limiting za kritične endpoints - dodato:
    - Auth endpoints: GET /auth/verify (strictRateLimiter), POST /auth/setup-password (strictRateLimiter) [auth.ts](backend/src/routes/auth.ts)
    - Backup endpoints: POST /backup/create, POST /backup/restore/:filename (strictRateLimiter) [backup.ts](backend/src/routes/backup.ts)
    - Creation endpoints: POST /api/guests, POST /api/service-requests (generalRateLimiter) [guests.ts](backend/src/routes/guests.ts) + [service-requests.ts](backend/src/routes/service-requests.ts)

**Datum poslednjeg update-a**: 2025-10-30

---

## 🛠️ KNOWN ISSUES (Može se raditi na ovome):

1. ✅ **FIXED 2025-01-30**: Backend: Backup endpoints - dodato `authMiddleware` u server.ts line 165
2. ✅ **FIXED 2025-01-30**: Backend: `/service-requests/:id/delegate` endpoint - kreiran i radi
3. ✅ **FIXED 2025-10-30**: Backend: ESP32 endpoints bez auth - dodato API key auth
4. ⚠️ Backend: ~50% endpoints nema permission checks (guest CRUD, locations, shifts, etc.)
5. ⚠️ Avatari: Seed ne dodaje avatare (može se dodati)

---

**CLAUDE: Ako nisi 100% siguran šta radiš, PRVO PROVERI OVAJ FAJL!**
