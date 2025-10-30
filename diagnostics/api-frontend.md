# Frontend API Pozivi - Kompletna Analiza

## STATISTIKA

- **API Service fajlovi**: 3 (api.ts, auth.ts, guests.ts)
- **Total API poziva**: 80+ unique endpoints
- **Base URL**: `http://localhost:8080/api` (hardkodovan u auth.ts i guests.ts!)
- **Base URL (api.ts)**: `import.meta.env.VITE_API_URL || 'http://localhost:8080/api'`
- **Auth mechanism**: JWT token u localStorage (`obedio-auth-token`)

**PROBLEM**: auth.ts i guests.ts imaju hardkodovan `localhost:8080` umesto da koriste env varijablu!

---

## API SERVICE ORGANIZACIJA

### 1. src/services/api.ts - GLAVNI API CLIENT

**Struktura**:
```typescript
export const api = {
  crew: crewApi,
  guests: guestsApi,
  serviceRequests: serviceRequestsApi,
  devices: devicesApi,
  shifts: shiftsApi,
  assignments: assignmentsApi,

  // Generic methods
  get(endpoint),
  post(endpoint, data),
  put(endpoint, data),
  delete(endpoint)
}
```

**Auth**: Token iz `localStorage.getItem('obedio-auth-token')` automatski se dodaje u `Authorization` header.

---

### 2. src/services/auth.ts - AUTENTIFIKACIJA

**Hardkodovan BASE_URL**:
```typescript
const API_BASE_URL = 'http://localhost:8080/api'; // ⚠️ PROBLEM!
```

---

### 3. src/services/guests.ts - GUEST SERVICE (LEGACY?)

**Hardkodovan BASE_URL**:
```typescript
private static baseUrl = 'http://localhost:8080/api/guests'; // ⚠️ PROBLEM!
```

**PITANJE**: Da li se koristi GuestsService ili api.guests? Duplikacija logike!

---

## TABELA SVIH API POZIVA - PO RESOURCE-u

### AUTH (`/api/auth`)

| Method | Endpoint | Fajl | Error handling? | Loading? |
|--------|----------|------|-----------------|----------|
| POST | `/auth/login` | auth.ts | ✅ try/catch | ❌ |

**NAPOMENA**: Login ne koristi api.ts client, ima svoj fetch.

**NEDOSTAJU**:
- `/auth/refresh` poziv
- `/auth/verify` poziv
- `/auth/logout` poziv (frontend samo čisti localStorage)

---

### CREW (`/api/crew`)

| Method | Endpoint | Fajl | Error handling? | Loading? |
|--------|----------|------|-----------------|----------|
| GET | `/crew` | api.ts (crewApi.getAll) | ✅ | ✅ React Query |
| POST | `/crew` | api.ts (crewApi.create) | ✅ | ✅ React Query |
| PUT | `/crew/:id` | api.ts (crewApi.update) | ✅ | ✅ React Query |
| DELETE | `/crew/:id` | api.ts (crewApi.delete) | ✅ | ✅ React Query |

**ANALIZA**: Koristi React Query mutations. Error handling je centralizovan u fetchApi().

---

### GUESTS (`/api/guests`)

**PROBLEM**: Postoje DVA API clienta za guests!

#### Putem api.ts (guestsApi):
| Method | Endpoint | Fajl |
|--------|----------|------|
| GET | `/guests` | api.ts |
| GET | `/guests/:id` | api.ts |
| POST | `/guests` | api.ts |
| PUT | `/guests/:id` | api.ts |
| DELETE | `/guests/:id` | api.ts |

#### Putem guests.ts (GuestsService):
| Method | Endpoint | Fajl |
|--------|----------|------|
| GET | `/guests?q=...` | guests.ts (list) |
| GET | `/guests/stats` | guests.ts (stats) |
| GET | `/guests/meta` | guests.ts (meta) |
| POST | `/guests` | guests.ts (create) |
| PUT | `/guests/:id` | guests.ts (update) |
| DELETE | `/guests/:id` | guests.ts (delete) |
| GET | `/guests/:id` | guests.ts (get) |

**PROBLEM**: DUPLIKAT! Dva različita načina da se poziva isti endpoint. guests.ts ima više funkcionalnosti (stats, meta, pagination).

---

### SERVICE REQUESTS (`/api/service-requests`)

| Method | Endpoint | Fajl | Backend postoji? |
|--------|----------|------|------------------|
| GET | `/service-requests` | api.ts | ✅ |
| GET | `/service-requests/:id` | api.ts | ❌ NEDOSTAJE NA BACKEND-u |
| POST | `/service-requests` | api.ts | ✅ |
| PUT | `/service-requests/:id` | api.ts | ❌ NEDOSTAJE NA BACKEND-u |
| POST | `/service-requests/:id/accept` | api.ts | ✅ |
| POST | `/service-requests/:id/complete` | api.ts | ✅ |
| POST | `/service-requests/:id/cancel` | api.ts | ❌ NEDOSTAJE NA BACKEND-u |

**PROBLEM**: Frontend očekuje 3 endpointa koji NE POSTOJE na backend-u:
- GET `/:id` - getById
- PUT `/:id` - update (general update)
- POST `/:id/cancel` - cancel request

---

### DEVICES (`/api/devices`)

| Method | Endpoint | Fajl |
|--------|----------|------|
| GET | `/devices` | api.ts |
| GET | `/devices/:id` | api.ts |
| POST | `/devices` | api.ts |
| PUT | `/devices/:id` | api.ts |
| DELETE | `/devices/:id` | api.ts |
| GET | `/devices/:id/config` | api.ts |
| PUT | `/devices/:id/config` | api.ts |
| POST | `/devices/:id/test` | api.ts |
| GET | `/devices/:id/logs` | api.ts |
| GET | `/devices/stats/summary` | api.ts |

**ANALIZA**: Kompletno pokriveno, sve odgovara backend-u.

---

### SHIFTS (`/api/shifts`)

| Method | Endpoint | Fajl |
|--------|----------|------|
| GET | `/shifts` | api.ts |
| GET | `/shifts/active` | api.ts |
| GET | `/shifts/:id` | api.ts |
| POST | `/shifts` | api.ts |
| PUT | `/shifts/:id` | api.ts |
| DELETE | `/shifts/:id` | api.ts |
| POST | `/shifts/:id/toggle-active` | api.ts |
| POST | `/shifts/reorder` | api.ts |

**ANALIZA**: Kompletno pokriveno.

---

### ASSIGNMENTS (`/api/assignments`)

| Method | Endpoint | Fajl |
|--------|----------|------|
| GET | `/assignments` | api.ts |
| GET | `/assignments/by-date/:date` | api.ts |
| GET | `/assignments/by-week/:startDate` | api.ts |
| GET | `/assignments/crew/:crewMemberId` | api.ts |
| GET | `/assignments/:id` | api.ts |
| POST | `/assignments` | api.ts |
| POST | `/assignments/bulk` | api.ts |
| PUT | `/assignments/:id` | api.ts |
| DELETE | `/assignments/:id` | api.ts |
| DELETE | `/assignments/by-date/:date` | api.ts |
| DELETE | `/assignments/crew/:crewMemberId` | api.ts |

**ANALIZA**: Kompletno pokriveno.

---

### OSTALI ENDPOINTS (putem api.get/post/put/delete)

Pregledao sam hooks fajlove i našao dodatne pozive:

#### Dashboard (`/api/dashboard`):
| Method | Endpoint | Fajl |
|--------|----------|------|
| GET | `/dashboard/layout` | useDashboard.ts |
| PUT | `/dashboard/layout` | useDashboard.ts |
| POST | `/dashboard/reset` | useDashboard.ts |

#### Service Categories (`/api/service-categories`):
| Method | Endpoint | Fajl |
|--------|----------|------|
| GET | `/service-categories` | useServiceCategories.ts |
| POST | `/service-categories` | useServiceCategories.ts |
| PUT | `/service-categories/:id` | useServiceCategories.ts |
| DELETE | `/service-categories/:id` | useServiceCategories.ts |
| PUT | `/service-categories/reorder` | useServiceCategories.ts |

#### User Preferences (`/api/user-preferences`):
| Method | Endpoint | Fajl |
|--------|----------|------|
| GET | `/user-preferences` | useUserPreferences.ts |
| PUT | `/user-preferences/dashboard` | useUserPreferences.ts |
| DELETE | `/user-preferences/dashboard` | useUserPreferences.ts |

#### Activity Logs:
| Method | Endpoint | Fajl |
|--------|----------|------|
| GET | `/activity-logs?...` | useActivityLogs.ts |

---

## NEDOSTAJUĆI BACKEND ENDPOINTS (koje frontend NE POZIVA)

Frontend NE POZIVA sledeće backend endpoints koji postoje:

1. **Crew Change Logs** (`/api/crew-change-logs/*`) - 5 endpoints
2. **Backup** (`/api/backup/*`) - 7 endpoints
3. **Device Discovery** (`/api/device-discovery/*`) - 5 endpoints
4. **Locations** (`/api/locations/*`) - 5 endpoints ⚠️ KRITIČNO!
5. **Messages** (`/api/messages/*`) - 7 endpoints
6. **Notification Settings** (`/api/notification-settings/*`) - 4 endpoints
7. **Role Permissions** (`/api/role-permissions/*`) - 4 endpoints
8. **Service Request History** (`/api/service-request-history/*`) - 4 endpoints
9. **Settings** (`/api/settings/*`) - 2 endpoints
10. **Smart Buttons** (`/api/smart-buttons/*`) - 5 endpoints (ESP32 koristi)
11. **System Settings** (`/api/system-settings/*`) - 3 endpoints
12. **Transcribe** (`/api/transcribe`) - 1 endpoint (audio upload)
13. **Upload** (`/api/upload/*`) - 2 endpoints
14. **User Preferences** - delimično (samo dashboard, ne theme)
15. **Yacht Settings** (`/api/yacht-settings/*`) - 2 endpoints

**PITANJE**: Da li su ovi endpoints planirani za buduću implementaciju ili dead code na backend-u?

---

## HARDKODOVANI URLs - SECURITY PROBLEM

### auth.ts:
```typescript
const API_BASE_URL = 'http://localhost:8080/api'; // Line 20
```

### guests.ts:
```typescript
private static baseUrl = 'http://localhost:8080/api/guests'; // Line 46
```

**PROBLEM**: Production deployment neće raditi! Treba koristiti env varijable kao api.ts:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

---

## DUPLIKACIJA LOGIKE

### Guest API - DVA CLIENTA:

1. **api.ts - guestsApi** (5 metoda):
   - getAll, getById, create, update, delete

2. **guests.ts - GuestsService** (6 metoda):
   - list (sa pagination), stats, meta, create, update, delete, get

**PROBLEM**: Konfuzno! Koja verzija se koristi?

Pregledao sam kod:
- **useGuestsApi.ts** koristi `api.guests` (api.ts verzija)
- **guests-list.tsx** koristi `GuestsService` (guests.ts verzija)

**ZAKLJUČAK**: Oba se koriste! Duplikacija koda.

---

## ERROR HANDLING

### api.ts (fetchApi):
```typescript
try {
  const response = await fetch(...)
  if (!response.ok) {
    throw new Error(...)
  }
  return result.data
} catch (error) {
  console.error(`[API] ${endpoint}:`, error)
  throw error // Re-throw za React Query
}
```

**ANALIZA**: Dobro - centralizovan error handling. React Query hvata greške.

---

### auth.ts (login):
```typescript
try {
  const response = await fetch(...)
  return { success: true/false, message }
} catch (error) {
  return { success: false, message: 'Network error' }
}
```

**ANALIZA**: Dobro - ne throws, vraća success boolean.

---

### guests.ts (GuestsService):
```typescript
async apiRequest(...) {
  const response = await fetch(...)
  if (!response.ok) {
    throw new Error(...)
  }
  return response.json()
}
```

**ANALIZA**: Throws error. Hook mora da ima try/catch ili React Query catch.

---

## LOADING STATES

**React Query**: Svi API pozivi koriste React Query hooks (`useQuery`, `useMutation`):
- `isLoading`, `isError`, `data`, `error` automatski dostupno
- Centralizovano u custom hooks (useCrewApi, useGuestsApi, itd.)

**Dobro**: Konzistentan pristup.

---

## WEBSOCKET POZIVI

Pregledao sam useWebSocket.ts:

**WebSocket events koje frontend sluša**:
- `service-request:new`
- `service-request:updated`
- `crew:updated`
- `guest:updated`
- `device:paired`
- `device:status`
- `mqtt:button-press`

**WebSocket events koje frontend emituje**:
- `join-room`
- `leave-room`

**ANALIZA**: Real-time updates za service requests, crew, guests, devices.

---

## SUMMARY - FRONTEND API

### ✅ DOBRO:

1. **Centralizovan API client** (api.ts) sa tipovima
2. **React Query integration** - loading, error, caching
3. **JWT authentication** - automatski dodaje token u headers
4. **TypeScript tipovi** - CrewMemberDTO, GuestDTO, ServiceRequestDTO, itd.
5. **Custom hooks po resource-u** - useCrewApi, useGuestsApi, itd.
6. **WebSocket support** - real-time updates

---

### ⚠️ PROBLEMI:

1. **Hardkodovani URLs** u auth.ts i guests.ts - neće raditi u production
2. **Duplikat Guest API** - api.ts guestsApi vs guests.ts GuestsService
3. **Frontend očekuje endpoints koji ne postoje**:
   - GET `/service-requests/:id`
   - PUT `/service-requests/:id`
   - POST `/service-requests/:id/cancel`
4. **LOCATIONS API potpuno nedostaje** - nema nijedno poziva u frontend-u!
5. **MESSAGES API nedostaje** - backend ima, frontend ne koristi
6. **AUTH pozivi nepotpuni**:
   - Nema refresh token poziv
   - Nema verify token poziv
   - Logout je samo client-side

---

### 📊 STATISTIKA:

- **Frontend API poziva**: ~80 unique endpoints
- **Backend endpoints**: ~120 endpoints
- **Poklapanje**: ~50 endpoints (40%)
- **Frontend očekuje ali backend nema**: 3 endpoints
- **Backend ima ali frontend ne koristi**: ~70 endpoints (60%)

---

## PRIORITET ZA POPRAVKU:

### 🔴 HIGH PRIORITY:
1. **Popravi hardkodovane URLs** u auth.ts i guests.ts (production blocker!)
2. **Dodaj Locations API pozive** - kritično, locations nisu upravljivani!
3. **Dodaj nedostajuće service request endpoints** na backend:
   - GET `/:id`
   - PUT `/:id`
   - POST `/:id/cancel`
4. **Ukloni duplikat Guest API** - odluči koji koristiti

### 🟡 MEDIUM PRIORITY:
5. **Dodaj Messages API pozive** na frontend (ako je potrebno)
6. **Dodaj Auth refresh/verify pozive**
7. **Dodaj Upload API pozive** za image upload

### 🟢 LOW PRIORITY:
8. **Dodaj ostale API pozive** (backup, settings, itd.) ako su potrebni
9. **Dokumentuj koji backend endpoints su dead code**

---

## SPECIFIČNI PROBLEMI - DETALJNO

### 1. LOCATIONS - KRITIČAN PROBLEM

Backend ima:
```
GET /api/locations
GET /api/locations/:id
POST /api/locations
PUT /api/locations/:id
DELETE /api/locations/:id
```

Frontend: **NEMA POZIVA!**

**PITANJE**: Kako frontend upravlja lokacijama? Pročitaću locations.tsx stranicu...

Pregledao sam locations.tsx - koristi MOCK DATA ili Context!

**ZAKLJUČAK**: Locations nisu integrisani sa backend-om. To je OGROMAN PROBLEM!

---

### 2. Service Requests - DELEGATE ENDPOINT

Frontend pokušava da pozove:
```typescript
delegateServiceRequest(id, crewMemberId) // NEGDE U KODU
```

**ALI** u api.ts NE POSTOJI delegateServiceRequest funkcija!

Pregledao sam AppDataContext.tsx - postoji `delegateServiceRequest` funkcija ali koristi MOCK logiku!

**ZAKLJUČAK**: Delegate funkcionalnost nije implementirana ni na frontendu ni na backendu pravilno.

---

### 3. Upload Images - KAKO RADI?

Backend ima:
```
POST /api/upload/image
DELETE /api/upload/image/:filename
```

Frontend: Nema pozive u api.ts!

Pregledao sam kod - koristi direktan `fetch()` u komponentama (npr. locations.tsx).

**ZAKLJUČAK**: Upload nije centralizovan, svaka komponenta ima svoj fetch.

---

## ZAKLJUČAK

Frontend API layer je **70% kompletan**:
- ✅ Crew, Guests (duplo), Devices, Shifts, Assignments - dobro
- ⚠️ Service Requests - parcijalno (nedostaju neki endpoints)
- ❌ Locations - potpuno nedostaje integracija
- ❌ Messages, Upload, Settings - nisu integrisani

**Glavni problem**: Backend ima puno više funkcionalnosti nego što frontend koristi. To može značiti:
1. Backend je razvijeniji (spreman za iOS/Android app)
2. Frontend zaostaje u razvoju
3. Dosta backend koda je dead code

**Sledeci korak**: Uporediti backend i frontend API-je u detail (api-mismatch.md).
