# OBEDIO - Task Tracking List
**Created:** 2025-10-28
**Last Updated:** 2025-10-28 18:00

---

## ✅ COMPLETED TASKS

### 1. ✅ Wear OS Watch Integration
- [x] Kreiran Device record u bazi (WEAR-ANDROID-001)
- [x] Svi satovi sinhronizovani na type: 'watch' (bilo 'wearable')
- [x] Wear OS sat vidljiv u Device Manager - Watches sekciji
- [x] Pregledao ObedioWear kod i razumeo implementaciju
- **Result:** Wear OS sat može da se dodeli crew member-u i prima notifikacije

### 2. ✅ Device Assignment - Database Persistence
- [x] Dodao API call u handleAssignDevice() - `api.devices.update()`
- [x] Dodao API call u handleRemoveDevice() - `api.devices.update()`
- [x] Dodao refetch nakon assignment-a
- **Files:** `src/components/crew-member-details-dialog.tsx`
- **Result:** Device assignment sada persituje u bazu i ostaje nakon refresh-a

### 3. ✅ ESP Simulator - Popup Dialog
- [x] Button press sada kreira pravi service request preko API-a
- [x] Automatski prikazuje IncomingRequestDialog popup
- [x] Više nije samo toast notifikacija
- **Files:** `src/components/button-simulator-dialog.tsx`
- **Result:** Button press prikazuje popup kao za novi zahtev

### 4. ✅ Service Request - Remove Technical Info
- [x] Uklonjeno "button pressed" tekstove
- [x] Prikazuje se samo relevantni info (Service Call, Service Request, Emergency)
- [x] Dodato prikazivanje message-a ako postoji
- **Files:** `src/components/service-request-panel.tsx`
- **Result:** Nema više tehničkih detalja o button/signal-u

### 5. ✅ Crew - Remove Duplicate Edit Dialog
- [x] Uklonjen Edit Crew Sheet (duplikat funkcionalnost)
- [x] Sad se koristi samo CrewMemberDetailsDialog sa edit mode-om
- [x] Edit dugme sada otvara Details Dialog
- [x] Uklonjeni neiskorišćeni imports i state
- **Files:** `src/components/pages/crew-list.tsx`
- **Result:** Samo jedan način za editovanje crew member-a

### 6. ✅ isNewRequest Fix - Stop Showing Old Pending Requests
- [x] Dodao `preExistingRequestIds` state
- [x] Initialization hook pamti sve pending requests pri startu
- [x] `shouldRepeat` proverava `!isPreExisting` pre repeat-a
- **Files:** `src/components/incoming-request-dialog.tsx` (linija 575, 620, 670-671)
- **Result:** Stari pending requesti se više ne ponavljaju nakon refresh-a

---

## 🚧 IN PROGRESS

Nema trenutno aktivnih taskova.

---

## ⏳ PENDING TASKS (17 preostalih)

### PRIORITY: Service Request Features
- [ ] **Service Request - Log all actions to Activity Log**
  - Accept, Complete, Cancel, Forward actions treba da se loguju
  - Files: `src/components/incoming-request-dialog.tsx`, `src/components/service-request-panel.tsx`

### PRIORITY: Crew Page Improvements (3 tasks)
- [ ] **Crew - Prikazati nickname na crew page**
  - Dodati prikaz nickname-a na crew card/list view
  - Files: `src/components/pages/crew-list.tsx`, `src/components/crew-card-view.tsx`

- [ ] **Crew - Prikazati unique color za svakog crew member-a**
  - Crew member color već postoji u data model-u (crew.color)
  - Primeniti color na card/avatar border ili background
  - Files: `src/components/pages/crew-list.tsx`, `src/components/crew-card-view.tsx`

- [ ] **Crew - Prikazati leave status direktno na crew page**
  - Prikazati leave badge/indicator na crew list
  - Show leave dates ako je on-leave
  - Files: `src/components/pages/crew-list.tsx`, `src/components/crew-card-view.tsx`

### PRIORITY: Guest Features (2 tasks)
- [ ] **Guest - Prikazati sve info pri kliku (ne samo edit)**
  - Kreirati guest details view (readonly mode)
  - Files: `src/components/pages/guests-list.tsx`

- [ ] **Guest - Isti prozor za view i edit (edit mode toggle)**
  - Dodati Edit/View mode toggle u guest dialog
  - Slično kao CrewMemberDetailsDialog
  - Files: `src/components/guest-form-dialog.tsx`

### PRIORITY: Location - Guest Assignment (4 tasks)
- [ ] **Location - Guest assignment ne čuva u bazu**
  - Dodati API call za update location-a sa guestId
  - Files: `src/components/pages/locations.tsx`

- [ ] **Location - Edit prikazuje 'no guest' ali guest postoji**
  - Proveriti da li se pravilno fetch-uje guest assignment
  - Debug location edit dialog
  - Files: `src/components/pages/locations.tsx`

- [ ] **Location - Osigurati da guest može biti samo na 1 lokaciji**
  - Backend validation: jedan guest = jedna lokacija
  - Frontend: warning ako guest već assigned
  - Files: `backend/src/routes/locations.ts`, `src/components/pages/locations.tsx`

- [ ] **Location - Assignment mora raditi sa obe strane**
  - Assign guest FROM location page
  - Assign location FROM guest page
  - Both ways should work and sync
  - Files: `src/components/pages/locations.tsx`, `src/components/pages/guests-list.tsx`

### PRIORITY: DND Widget (3 tasks)
- [ ] **DND - Instant update bez refresh-a**
  - WebSocket ili polling za real-time DND status
  - Files: `src/components/pages/locations.tsx`

- [ ] **DND - Ukloniti duplikat widget, ostaviti samo gornji**
  - Pronaći duplikat DND widget i ukloniti ga
  - Files: `src/components/pages/*` (find duplicate)

- [ ] **DND - Widget vidljiv samo kada je DND aktivan**
  - Conditional rendering DND widget-a
  - Show only when any location has DND = true
  - Files: TBD (find DND widget component)

### PRIORITY: Device Manager (2 tasks)
- [ ] **Device Manager - Dodati device statistics widget**
  - Total devices, online/offline count, battery status
  - Files: `src/components/pages/device-manager.tsx`

- [ ] **Device Manager - Klikabilne statistike za filtriranje**
  - Click on stat → filter devices by that criteria
  - Example: Click "5 Offline" → show only offline devices
  - Files: `src/components/pages/device-manager.tsx`

---

## 📝 NOTES

### Important Database Models
- **Device:** `id`, `deviceId`, `name`, `type`, `crewMemberId`, `locationId`, `status`, `batteryLevel`
- **CrewMember:** `id`, `name`, `nickname`, `color`, `status`, `leaveStart`, `leaveEnd`
- **Guest:** `id`, `firstName`, `lastName`, `locationId`, `status`
- **Location:** `id`, `name`, `doNotDisturb`, `smartButtonId`
- **ServiceRequest:** `id`, `guestId`, `locationId`, `status`, `priority`, `createdAt`

### Backend API Endpoints
- `PUT /api/devices/:id` - Update device (supports crewMemberId)
- `PUT /api/locations/:id` - Update location
- `PUT /api/guests/:id` - Update guest
- `POST /api/service-requests` - Create service request
- `PUT /api/service-requests/:id` - Update service request

### Key Files
- Service Requests: `src/components/incoming-request-dialog.tsx`, `src/components/service-request-panel.tsx`
- Crew: `src/components/pages/crew-list.tsx`, `src/components/crew-member-details-dialog.tsx`
- Guests: `src/components/pages/guests-list.tsx`, `src/components/guest-form-dialog.tsx`
- Locations: `src/components/pages/locations.tsx`
- Device Manager: `src/components/pages/device-manager.tsx`

---

## ⚠️ KNOWN ISSUES
None currently.

---

**Total Tasks:** 23
**Completed:** 6
**Pending:** 17
**Progress:** 26%
