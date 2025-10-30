# API Mismatch Analiza - Backend vs Frontend

## EXECUTIVE SUMMARY

- **Frontend poziva, Backend NE postoji**: 3 endpoints ❌
- **Backend postoji, Frontend NE koristi**: ~70 endpoints ⚠️
- **Path mismatch**: 0 endpoints ✅
- **Method mismatch**: 0 endpoints ✅
- **KRITIČNI PROBLEMI**: 2 (Locations integracija, Service Request delegate)

---

## SEKCIJA 1: FRONTEND POZIVA, BACKEND NE POSTOJI ❌

### 1.1 Service Requests - GET /:id

**Frontend očekuje**:
```typescript
// api.ts line 215
getById: (id: string) => fetchApi<ServiceRequestDTO>(`/service-requests/${id}`)
```

**Backend status**: ❌ NE POSTOJI

**Backend ima**:
- GET `/service-requests` - lista svih
- POST `/service-requests` - kreiranje
- POST `/service-requests/:id/accept` - accept
- POST `/service-requests/:id/complete` - complete

**NEDOSTAJE**: GET `/service-requests/:id` - pojedinačan request

**UTICAJ**: Frontend ne može da fetchuje pojedinačan service request po ID-u.

**REŠENJE**: Dodati na backend:
```typescript
router.get('/:id', requirePermission('service-requests.view'), asyncHandler(async (req, res) => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: req.params.id },
    include: { guest: true, location: true, assignedTo: true }
  });
  if (!serviceRequest) {
    return res.status(404).json({ success: false, error: 'Service request not found' });
  }
  res.json({ success: true, data: serviceRequest });
}));
```

---

### 1.2 Service Requests - PUT /:id (general update)

**Frontend očekuje**:
```typescript
// api.ts line 229
update: (id: string, data: Partial<ServiceRequestDTO>) =>
  fetchApi<ServiceRequestDTO>(`/service-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
```

**Backend status**: ❌ NE POSTOJI

**Backend ima**:
- POST `/:id/accept` - specific update (status + assignedTo)
- POST `/:id/complete` - specific update (status + completedAt)

**NEDOSTAJE**: PUT `/:id` - general update (za bilo koje polje)

**UTICAJ**: Frontend ne može da update-uje proizvoljne fieldove (npr. priority, message, itd.)

**REŠENJE**: Dodati na backend:
```typescript
router.put('/:id', requirePermission('service-requests.edit'), validate(UpdateServiceRequestSchema), asyncHandler(async (req, res) => {
  const updated = await prisma.serviceRequest.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json({ success: true, data: updated });
}));
```

---

### 1.3 Service Requests - POST /:id/cancel

**Frontend očekuje**:
```typescript
// api.ts line 256
cancel: (id: string) =>
  fetchApi<ServiceRequestDTO>(`/service-requests/${id}/cancel`, {
    method: 'POST',
  })
```

**Backend status**: ❌ NE POSTOJI

**Backend ima**:
- accept, complete - ali NE cancel

**NEDOSTAJE**: POST `/:id/cancel`

**UTICAJ**: Frontend ne može da canceluje service request.

**REŠENJE**: Dodati na backend:
```typescript
router.post('/:id/cancel', requirePermission('service-requests.cancel'), asyncHandler(async (req, res) => {
  const cancelled = await prisma.serviceRequest.update({
    where: { id: req.params.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: req.user.id
    }
  });

  // Emit WebSocket event
  websocketService.emitServiceRequestUpdated(cancelled);

  res.json({ success: true, data: cancelled });
}));
```

---

## SEKCIJA 2: BACKEND POSTOJI, FRONTEND NE KORISTI ⚠️

### 2.1 LOCATIONS - KRITIČNO!

**Backend ima** (5 endpoints):
```
GET    /api/locations
GET    /api/locations/:id
POST   /api/locations
PUT    /api/locations/:id
DELETE /api/locations/:id
```

**Frontend status**: ❌ **NEMA NIJEDNO POZIVA**

**PROBLEM**: Pregledao sam `src/components/pages/locations.tsx` - koristi **MOCK DATA** ili Context umesto backend API-ja!

**UTICAJ**: Locations se ne sinhronizuju sa bazom. Multiplatform sync neće raditi.

**REŠENJE**:
1. Kreirati `/src/services/api.ts` lokacije API client:
```typescript
export const locationsApi = {
  getAll: () => fetchApi<Location[]>('/locations'),
  getById: (id: string) => fetchApi<Location>(`/locations/${id}`),
  create: (data) => fetchApi('/locations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchApi(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchApi(`/locations/${id}`, { method: 'DELETE' })
}
```

2. Kreirati `useLocationsApi.ts` hook
3. Integrisati u `locations.tsx` stranicu

---

### 2.2 MESSAGES - Messaging sistem

**Backend ima** (7 endpoints):
```
GET    /api/messages
GET    /api/messages/conversation/:otherUserId
POST   /api/messages
PUT    /api/messages/:messageId/read
PUT    /api/messages/mark-all-read
DELETE /api/messages/:messageId
GET    /api/messages/unread-count
```

**Frontend status**: ❌ **NEMA POZIVA**

**PITANJE**: Da li je messaging sistem planiran ali ne implementiran na frontend-u?

**UTICAJ**: Crew members ne mogu da šalju poruke jedni drugima (iako backend podržava).

---

### 2.3 BACKUP - Database backup

**Backend ima** (7 endpoints):
```
GET    /api/backup/settings
PUT    /api/backup/settings
GET    /api/backup/status
POST   /api/backup/create
POST   /api/backup/restore/:filename
DELETE /api/backup/:filename
GET    /api/backup/download/:filename
```

**Frontend status**: ❌ **NEMA POZIVA**

**PITANJE**: Da li backup treba da bude dostupan iz frontend-a ili je samo admin API?

**UTICAJ**: Korisnici ne mogu da kreiraju/restore backup-e iz UI-ja.

---

### 2.4 CREW CHANGE LOGS

**Backend ima** (5 endpoints):
```
GET  /api/crew-change-logs
POST /api/crew-change-logs
GET  /api/crew-change-logs/crew/:crewMemberId
POST /api/crew-change-logs/bulk
GET  /api/crew-change-logs/recent
```

**Frontend status**: ❌ **NEMA POZIVA**

**PITANJE**: Da li je ovo audit trail koji se automatski kreira ili treba UI?

---

### 2.5 DEVICE DISCOVERY

**Backend ima** (5 endpoints):
```
POST   /api/device-discovery/discover
GET    /api/device-discovery/pairing
POST   /api/device-discovery/pair/:deviceId
POST   /api/device-discovery/simulate-announce
DELETE /api/device-discovery/pairing/:deviceId
```

**Frontend status**: ❌ **NEMA POZIVA**

**PITANJE**: Kako frontend paruje ESP32 device ako ne poziva device-discovery API?

**Pregledao sam**: `device-manager.tsx` - koristi MOCK DATA za device discovery!

**UTICAJ**: ESP32 device pairing ne radi u realnosti.

---

### 2.6 NOTIFICATION SETTINGS

**Backend ima** (4 endpoints):
```
GET  /api/notification-settings
PUT  /api/notification-settings
POST /api/notification-settings/push-token
POST /api/notification-settings/test
```

**Frontend status**: ❌ **NEMA POZIVA**

**UTICAJ**: Korisnici ne mogu da konfigurišu notification preferences.

---

### 2.7 ROLE PERMISSIONS (RBAC)

**Backend ima** (4 endpoints):
```
GET  /api/role-permissions/roles/:role
GET  /api/role-permissions/roles
PUT  /api/role-permissions/roles/:role
POST /api/role-permissions/roles/:role/reset
```

**Frontend status**: ❌ **NEMA POZIVA**

**PITANJE**: Da li RBAC permissions treba da budu konfigurisani iz UI-ja?

---

### 2.8 SERVICE REQUEST HISTORY

**Backend ima** (4 endpoints):
```
GET  /api/service-request-history
POST /api/service-request-history
GET  /api/service-request-history/request/:serviceRequestId
GET  /api/service-request-history/completed
```

**Frontend status**: ❌ **NEMA POZIVA**

**NAPOMENA**: Activity log page možda bi trebalo da koristi ovo?

---

### 2.9 SMART BUTTONS (ESP32 Integration)

**Backend ima** (5 endpoints):
```
POST /api/smart-buttons/press
POST /api/smart-buttons/status/:deviceId
POST /api/smart-buttons/telemetry/:deviceId
POST /api/smart-buttons/test/:deviceId
GET  /api/smart-buttons/mqtt-status
```

**Frontend status**: ❌ **NEMA POZIVA**

**NAPOMENA**: Ovi endpoints su za ESP32 device-e, ne za browser frontend.

---

### 2.10 SYSTEM SETTINGS

**Backend ima** (3 endpoints):
```
GET /api/system-settings
PUT /api/system-settings
GET /api/system-settings/health
```

**Frontend status**: ❌ **NEMA POZIVA**

**NAPOMENA**: Health check je za monitoring tools, ne frontend UI.

---

### 2.11 TRANSCRIBE (Voice to Text)

**Backend ima**:
```
POST /api/transcribe
GET  /api/transcribe/test
```

**Frontend status**: ❌ **NEMA POZIVA**

**PITANJE**: Kako radi voice transcription za service requests ako frontend ne poziva?

**Pregledao sam**: Button simulator koristi MOCK transcription.

---

### 2.12 UPLOAD (Image Upload)

**Backend ima**:
```
POST   /api/upload/image
DELETE /api/upload/image/:filename
```

**Frontend status**: ⚠️ **KORISTI DIREKTAN FETCH**, ne kroz api.ts

**Pregledao sam**: locations.tsx ima direktan `fetch()` poziv za upload.

**PROBLEM**: Upload nije centralizovan u api.ts.

---

### 2.13 YACHT SETTINGS

**Backend ima**:
```
GET /api/yacht-settings
PUT /api/yacht-settings
```

**Frontend status**: ❌ **NEMA POZIVA**

**PITANJE**: Gde se konfiguriše yacht name, logo, itd.?

---

## SEKCIJA 3: PATH MISMATCH - GOTOVO IDENTIčNI ALI NISU ISTI

**Rezultat**: ✅ **NEMA PATH MISMATCH problema**

Svi endpoints koji frontend poziva imaju tačne path-ove kao backend (osim onih koji ne postoje).

---

## SEKCIJA 4: METHOD MISMATCH - FRONTEND ŠALJE POGREŠAN HTTP METHOD

**Rezultat**: ✅ **NEMA METHOD MISMATCH problema**

Svi endpoints koriste ispravne HTTP metode.

---

## SUMMARY STATISTIKA

| Kategorija | Broj endpoints |
|------------|---------------|
| **Backend total** | ~120 |
| **Frontend total poziva** | ~80 |
| **Frontend poziva, backend postoji** | ~77 (96%) |
| **Frontend poziva, backend NE postoji** | 3 (4%) ❌ |
| **Backend postoji, frontend ne koristi** | ~70 (58%) ⚠️ |

---

## KRITIČNI PROBLEMI - TOP 3

### 🔴 #1: LOCATIONS NISU INTEGRISANE SA BACKEND-OM

**Problem**: Frontend koristi MOCK DATA za locations umesto backend API-ja.

**Uticaj**:
- Locations se ne čuvaju u bazu
- Multiplatform sync ne radi
- ESP32 smart button assignment ne radi (jer locations nisu u bazi)

**Rešenje**: Integrisati locationsApi u frontend (2-3 sata posla).

---

### 🔴 #2: SERVICE REQUESTS - NEDOSTAJU 3 ENDPOINTA

**Problem**: Frontend očekuje:
- GET `/:id`
- PUT `/:id`
- POST `/:id/cancel`

Ali backend ih nema.

**Uticaj**:
- Ne može da se fetchuje pojedinačan service request
- Ne može da se update-uje arbitrary field
- Ne može da se canceluje request

**Rešenje**: Dodati ova 3 endpointa na backend (1 sat posla).

---

### 🔴 #3: DEVICE DISCOVERY KORISTI MOCK DATA

**Problem**: Frontend device-manager.tsx koristi mock discovery umesto pravog API-ja.

**Uticaj**: ESP32 device pairing ne radi u realnosti.

**Rešenje**: Integrisati device-discovery API (2 sata posla).

---

## OSTALI PROBLEMI

### ⚠️ MEDIUM PRIORITY:

4. **Messages API ne koristi se** - crew messaging ne radi
5. **Upload API nije centralizovan** - svaka komponenta ima svoj fetch
6. **Notification settings ne koriste se** - korisnici ne mogu da konfiguriše notifikacije
7. **Service request history ne koristi se** - nema audit trail u UI-ju
8. **Transcribe API ne koristi se** - voice input ne radi

---

### 🟢 LOW PRIORITY (možda namerno):

9. **Backup API ne koristi se** - možda samo za admin preko CLI?
10. **Crew change logs ne koriste se** - možda automatski audit trail?
11. **Role permissions ne koriste se** - možda hardkodovano?
12. **System settings ne koriste se** - možda samo za sysadmin?
13. **Yacht settings ne koriste se** - možda .env config?

---

## ZAKLJUČAK

**Glavni problem**: Frontend je daleko manje kompletan nego backend.

**Razlog (hipoteze)**:
1. Backend je razvijeniji jer se planira iOS/Android app koji će koristiti sve API-je
2. Frontend web app je MVP koji još nije završen
3. Dosta backend koda je spekulativno razvijen ("možda će nam trebati")

**Prioritet**:
1. ✅ Popraviti LOCATIONS integraciju (KRITIČNO)
2. ✅ Dodati SERVICE REQUEST endpoints (KRITIČNO)
3. ✅ Integrisati DEVICE DISCOVERY (KRITIČNO za ESP32)
4. ⚠️ Dodati MESSAGES ako je potrebno
5. ⚠️ Centralizovati UPLOAD
6. 🟢 Ostalo po potrebi

**Estimate**:
- Kritični problemi: 5-7 sati posla
- Medium priority: 10-15 sati posla
- Low priority: 20+ sati posla
