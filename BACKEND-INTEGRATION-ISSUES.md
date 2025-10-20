# 🔍 Backend Integration Issues - Detaljno Pregledano

**Datum:** 19. Oktobar 2025  
**Problem:** Frontend NE koristi pravi backend za CRUD operacije

---

## 🚨 GLAVNI PROBLEM

**Frontend ima DUAL SISTEM koji NIJE SINHRONIZOVAN:**

1. **AppDataContext** (`src/contexts/AppDataContext.tsx`)
   - Koristi **localStorage SAMO** za podatke
   - `addGuest()`, `updateGuest()`, `deleteGuest()` pišu u localStorage
   - ❌ **NE ŠALJE NIŠTA NA BACKEND**

2. **GuestsService** (`src/services/guests.ts`)
   - Ima backend API implementaciju ✅
   - API fallback na localStorage ako backend ne radi
   - ✅ **ALI KOMPONENTE NE KORISTE OVAJ SERVIS ZA MUTATIONS!**

---

## ✅ ŠTA JE POPRAVLJENO (Do sada)

### 1. **Kreiran `useGuestMutations` Hook**
**Fajl:** `src/hooks/useGuestMutations.ts` ✨ NOVO

```typescript
- createGuest() - POST /api/guests
- updateGuest() - PUT /api/guests/:id  
- deleteGuest() - DELETE /api/guests/:id
```

Koristi TanStack Query mutations sa:
- Automatic query invalidation
- Toast notifications
- Error handling
- Loading states

### 2. **GuestFormDialog Integrisan sa Backend-om**
**Fajl:** `src/components/guest-form-dialog.tsx` ✅ POPRAVLJENO

**PRE:**
```typescript
const { addGuest, updateGuest } = useAppData(); // ❌ localStorage SAMO
```

**POSLE:**
```typescript
const { createGuest, updateGuest } = useGuestMutations(); // ✅ Backend API
```

**Promene:**
- ✅ ADD gosta sada ide na backend (`POST /api/guests`)
- ✅ UPDATE gosta sada ide na backend (`PUT /api/guests/:id`)
- ✅ Loading states (`Saving...`)
- ✅ Toast notifications
- ✅ Automatic refetch posle mutation

---

## ⚠️ ŠTA OSTAJE DA SE URADI

### 1. **DELETE Funkcionalnost** ❌ NEDOSTAJE

**Problem:** Ne postoji UI za brisanje gostiju!

**Lokacija:** `src/components/pages/guests-list.tsx`

**Trenutno:**
```typescript
<DropdownMenuItem>View Details</DropdownMenuItem>
<DropdownMenuItem>Edit</DropdownMenuItem>
// ❌ NEMA Delete opciju!
```

**Rešenje:** Dodati:
```typescript
<DropdownMenuSeparator />
<DropdownMenuItem 
  onClick={() => setDeletingGuest(guest)}
  className="text-destructive"
>
  Delete
</DropdownMenuItem>
```

Plus AlertDialog za potvrdu brisanja.

### 2. **Crew Management** ❌ NE KORISTI BACKEND

**Problem:** Isti problem kao i sa Guests

**Potrebno:**
- `useCrewMutations` hook
- Integrisati u crew komponente
- Backend već ima `/api/crew` endpoint ✅

### 3. **Service Requests** ❌ NE KORISTI BACKEND

**Problem:** Service requests idu u localStorage

**Potrebno:**
- Integrisati sa `/api/service-requests`
- Accept/Complete operacije

### 4. **Locations** ❌ NE KORISTI BACKEND

**Problem:** Locations read-only iz localStorage

**Trenutno Status:**
- Backend endpoint: `GET /api/locations` ✅
- Frontend koristi mock podatke ❌

---

## 📊 BACKEND API ENDPOINTS (Spremni za korištenje)

### ✅ Guests API
- `GET /api/guests` - List (sa filterima)
- `POST /api/guests` - Create ✨ SADA RADI!
- `GET /api/guests/:id` - Get single
- `PUT /api/guests/:id` - Update ✨ SADA RADI!
- `DELETE /api/guests/:id` - Delete ⚠️ NEMA UI ZA OVO!

### ✅ Crew API
- `GET /api/crew` - List
- `POST /api/crew` - Create ❌ Frontend ne koristi

### ✅ Service Requests API (Zahteva Auth!)
- `GET /api/service-requests` - List
- `POST /api/service-requests` - Create
- `PUT /api/service-requests/:id/accept` - Accept
- `PUT /api/service-requests/:id/complete` - Complete

### ✅ Locations API
- `GET /api/locations` - List

---

## 🔧 KAKO TESTIRATI (Posle popravki)

### Test 1: Dodavanje Gosta (✅ RADI)

1. Pokreni backend: `cd backend && npm run dev`
2. Pokreni frontend: `npm run dev`
3. Otvori http://localhost:3000
4. Login: admin / admin123
5. Idi na Guests → Add Guest
6. Popuni formu i sačuvaj

**Očekivano:**
- ✅ Toast: "Guest created successfully"
- ✅ API poziv: `POST http://localhost:3001/api/guests`
- ✅ Podatak u PostgreSQL bazi
- ✅ Lista se automatski refetch-uje

### Test 2: Edit Gosta (✅ RADI)

1. Klikni na gosta → Edit
2. Izmeni podatke → Save

**Očekivano:**
- ✅ Toast: "Guest updated successfully"
- ✅ API poziv: `PUT http://localhost:3001/api/guests/:id`
- ✅ Updateovan u bazi

### Test 3: Brisanje Gosta (❌ NE RADI - NEMA UI)

**Problem:** Ne postoji opcija za brisanje u UI-ju!

---

## 🎯 PRIORITETI ZA POPRAVKU

### P0 - KRITIČNO
1. ✅ **Guest Create/Update** - POPRAVLJENO!
2. ❌ **Guest Delete UI** - NEDOSTAJE
3. ❌ **Crew Create/Update/Delete** - Ne koristi backend

### P1 - VAŽNO
4. ❌ **Service Requests** - Integrisati sa backend-om
5. ❌ **Locations** - Read sa backend-a

### P2 - NICE TO HAVE
6. ❌ **Real-time Updates** - WebSocket integracija
7. ❌ **Offline Support** - Service Worker

---

## 💡 ARHITEKTURALNI PROBLEM

**Root Cause:** AppDataContext je **anti-pattern** za backend-driven aplikaciju!

**Trenutno:**
```
Component → AppDataContext → localStorage
                ↓
         (ignoriše backend)
```

**Treba biti:**
```
Component → TanStack Query → Backend API → PostgreSQL
                ↓
         (localStorage cache opciono)
```

**Rešenje:**
- ✅ Koristiti TanStack Query za data fetching
- ✅ Mutations preko custom hooks (useGuestMutations, useCrewMutations)
- ❌ DEPRECATED: AppDataContext za CRUD operacije

---

## 📝 SLEDEĆI KORACI

### 1. Završi Guest Management
```typescript
// Dodaj u guests-list.tsx:
const { deleteGuest, isDeleting } = useGuestMutations();

<DropdownMenuItem 
  onClick={() => handleDeleteClick(guest)}
  className="text-destructive"
>
  Delete
</DropdownMenuItem>

// Alert dialog za potvrdu
<AlertDialog>...</AlertDialog>
```

### 2. Kreiraj Crew Mutations
```typescript
// src/hooks/useCrewMutations.ts
export function useCrewMutations() {
  // Similar to useGuestMutations
}
```

### 3. Integriši Service Requests
```typescript
// src/hooks/useServiceRequestMutations.ts
export function useServiceRequestMutations() {
  // Accept, Complete, Create
}
```

---

## ✅ VERIFIKACIJA DA BACKEND RADI

### Provera 1: Guest Endpoint
```bash
curl http://localhost:3001/api/guests
```

**Očekivano:** JSON lista gostiju iz PostgreSQL

### Provera 2: Create Guest
```bash
curl -X POST http://localhost:3001/api/guests \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Guest",
    "type": "charter",
    "status": "expected",
    "languages": [],
    "allergies": [],
    "dietaryRestrictions": [],
    "foodDislikes": [],
    "favoriteFoods": [],
    "favoriteDrinks": [],
    "medicalConditions": [],
    "checkInDate": "2025-10-20",
    "checkOutDate": "2025-10-27"
  }'
```

**Očekivano:** `{"success": true, "data": {...}}`

### Provera 3: PostgreSQL Baza
```bash
cd backend
npx prisma studio
```

**Očekivano:** Možeš videti sve podatke u bazi

---

## 🎯 KONAČNI CILJ

**Željena arhitektura:**

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       │ TanStack Query
       │ (useGuests, useGuestMutations)
       │
       ▼
┌──────────────┐
│  Backend API │
│  (Express)   │
└──────┬───────┘
       │
       │ Prisma ORM
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (Database)  │
└──────────────┘
```

**Sa ovom arhitekturom:**
- ✅ Podaci sinhronizovani između frontend i backend
- ✅ Perzistentni u bazi (ne gube se na refresh)
- ✅ Multi-user support (više korisnika istovremeno)
- ✅ Real-time updates moguće (WebSocket)
- ✅ Audit trail (ko je šta promenio)

---

**Status:** 
- ✅ Guest CREATE i UPDATE integrisani sa backend-om
- ❌ Guest DELETE UI nedostaje
- ❌ Crew/Service Requests/Locations još na localStorage

**Sledeće:** Dodati DELETE UI i integrisati ostale entitete!
