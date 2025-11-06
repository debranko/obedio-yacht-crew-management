# Guest Type Enum Audit - DETALJNO ISPITIVANJE

**Datum:** 2025-11-06
**Problem:** Frontend koristi 'primary', 'child', 'charter' ali baza podržava samo: owner, vip, guest, partner, family

---

## Pronađeno u ispitivanju

### 1. BAZA PODATAKA (Prisma Schema)
**Fajl:** `backend/prisma/schema.prisma:461-467`

```prisma
enum GuestType {
  owner
  vip
  guest
  partner
  family
}
```

**✅ Podržava:** owner, vip, guest, partner, family
**❌ NE podržava:** primary, child, charter

---

### 2. BACKEND VALIDACIJA (Zod)
**Fajl:** `backend/src/validators/schemas.ts:17-19`

```typescript
type: z.enum(['owner', 'vip', 'guest', 'partner', 'family'], {
  errorMap: () => ({ message: 'Invalid guest type' })
}).default('guest'),
```

**✅ Podržava:** owner, vip, guest, partner, family
**❌ NE podržava:** primary, child, charter

---

### 3. FRONTEND TYPESCRIPT TYPE
**Fajl:** `src/types/guests.ts:10`

```typescript
type: 'primary' | 'partner' | 'family' | 'child' | 'vip' | 'owner' | 'charter';
```

**❌ Neusklađeno sa bazom!**

---

## Gde se koriste problematični tipovi

### LOKACIJA 1: Toggle VIP funkcija (GLAVNI BUG)
**Fajl:** `src/components/pages/guests-list.tsx:215`

```typescript
const newType = (guest.type === 'vip' || guest.type === 'owner') ? 'primary' : 'vip';
//                                                                   ^^^^^^^^^ BUG!
```

**Šta radi:** Kada klikneš na zvezdu da ukloniš VIP, šalje `type: 'primary'` što baza odbija
**Greška:** `Invalid guest type - received "primary"`

---

### LOKACIJA 2: Default vrednost za novi guest
**Fajl:** `src/components/guest-form-dialog.tsx:80`

```typescript
type: 'charter',  // Default kada dodaješ novog gosta
```

**Šta radi:** Kada dodaješ novog gosta, automatski se postavlja `type: 'charter'`
**Problem:** Baza će odbiti ovaj tip!

---

### LOKACIJA 3: Guest Type Dropdown
**Fajl:** `src/components/guest-form-dialog.tsx:349-355`

```tsx
<SelectContent>
  <SelectItem value="primary">Primary Guest</SelectItem>
  <SelectItem value="partner">Partner</SelectItem>
  <SelectItem value="family">Family</SelectItem>
  <SelectItem value="child">Child</SelectItem>
  <SelectItem value="vip">VIP</SelectItem>
  <SelectItem value="owner">Owner</SelectItem>
  <SelectItem value="charter">Charter</SelectItem>
</SelectContent>
```

**Problem:** Korisnik može izabrati primary/child/charter koje baza ne podržava!

---

### LOKACIJA 4: Guest Card View - Labele
**Fajl:** `src/components/guest-card-view.tsx:38-54`

```typescript
const getGuestTypeLabel = (type: Guest['type']) => {
  switch (type) {
    case 'primary': return 'Primary Guest';
    case 'partner': return 'Partner';
    case 'family': return 'Family';
    case 'child': return 'Child';
    case 'vip': return 'VIP';
    case 'owner': return 'Owner';
    case 'charter': return 'Charter';
  }
};
```

**Problem:** Prikazuje labele za tipove koji ne postoje u bazi

---

### LOKACIJA 5: Guest Details Dialog - Labele
**Fajl:** `src/components/guest-details-dialog.tsx:57-73`

```typescript
const getGuestTypeLabel = (type: Guest['type']) => {
  switch (type) {
    case 'primary': return 'Primary Guest';
    case 'partner': return 'Partner';
    case 'family': return 'Family';
    case 'child': return 'Child';
    case 'vip': return 'VIP';
    case 'owner': return 'Owner';
    case 'charter': return 'Charter';
  }
};
```

**Problem:** Identično kao gore

---

## Analiza problema

### Zašto ovo nije ranije pucalo?

1. **Existing guests u bazi SU validni** - svi imaju `type: 'vip'` (videli smo iz check-guest-dates.js)
2. **Add New Guest verovatno NE radi** - ali korisnik nije pokušao (mislili smo da je datetime problem)
3. **Edit Guest NE radi** - ali korisnik nije koristio (takođe mislili da je datetime)
4. **Toggle VIP NE radi** - OVO je korisnik konačno pokušao i našli smo pravi bug!

---

## Šta je ispravno rešenje?

### Opcija A: Dodati tipove u bazu (VIŠE POSLA)
1. Dodati `primary`, `child`, `charter` u Prisma schema
2. Kreirati migraciju
3. Update Zod validator
4. Frontend ostaje isti

**Rizik:** Promena database schema-e, migracija

---

### Opcija B: Uskladiti frontend sa bazom (PREPORUČENO)
1. Promeniti TypeScript tip u `src/types/guests.ts`
2. Zameniti `'primary'` → `'guest'` u toggleVip funkciji
3. Zameniti `'charter'` → `'guest'` u default vrednosti
4. Zameniti `'child'` → `'family'` (deca su deo porodice)
5. Obrisati ove opcije iz dropdown-a
6. Obrisati case-ove iz getGuestTypeLabel() funkcija

**Rizik:** MINIMALAN - samo frontend promene

---

## Šta treba promeniti (Opcija B)

### Fajl 1: `src/types/guests.ts`
**Linija 10:**
```typescript
// BEFORE
type: 'primary' | 'partner' | 'family' | 'child' | 'vip' | 'owner' | 'charter';

// AFTER
type: 'owner' | 'vip' | 'guest' | 'partner' | 'family';
```

---

### Fajl 2: `src/components/pages/guests-list.tsx`
**Linija 215:**
```typescript
// BEFORE
const newType = (guest.type === 'vip' || guest.type === 'owner') ? 'primary' : 'vip';

// AFTER
const newType = (guest.type === 'vip' || guest.type === 'owner') ? 'guest' : 'vip';
```

---

### Fajl 3: `src/components/guest-form-dialog.tsx`

**Linija 80:**
```typescript
// BEFORE
type: 'charter',

// AFTER
type: 'guest',
```

**Linije 349-355:**
```tsx
// BEFORE
<SelectContent>
  <SelectItem value="primary">Primary Guest</SelectItem>
  <SelectItem value="partner">Partner</SelectItem>
  <SelectItem value="family">Family</SelectItem>
  <SelectItem value="child">Child</SelectItem>
  <SelectItem value="vip">VIP</SelectItem>
  <SelectItem value="owner">Owner</SelectItem>
  <SelectItem value="charter">Charter</SelectItem>
</SelectContent>

// AFTER
<SelectContent>
  <SelectItem value="guest">Guest</SelectItem>
  <SelectItem value="partner">Partner</SelectItem>
  <SelectItem value="family">Family</SelectItem>
  <SelectItem value="vip">VIP</SelectItem>
  <SelectItem value="owner">Owner</SelectItem>
</SelectContent>
```

---

### Fajl 4: `src/components/guest-card-view.tsx`
**Linije 38-54:**
```typescript
// BEFORE
const getGuestTypeLabel = (type: Guest['type']) => {
  switch (type) {
    case 'primary': return 'Primary Guest';
    case 'partner': return 'Partner';
    case 'family': return 'Family';
    case 'child': return 'Child';
    case 'vip': return 'VIP';
    case 'owner': return 'Owner';
    case 'charter': return 'Charter';
  }
};

// AFTER
const getGuestTypeLabel = (type: Guest['type']) => {
  switch (type) {
    case 'guest': return 'Guest';
    case 'partner': return 'Partner';
    case 'family': return 'Family';
    case 'vip': return 'VIP';
    case 'owner': return 'Owner';
  }
};
```

---

### Fajl 5: `src/components/guest-details-dialog.tsx`
**Linije 57-73:**
```typescript
// BEFORE
const getGuestTypeLabel = (type: Guest['type']) => {
  switch (type) {
    case 'primary': return 'Primary Guest';
    case 'partner': return 'Partner';
    case 'family': return 'Family';
    case 'child': return 'Child';
    case 'vip': return 'VIP';
    case 'owner': return 'Owner';
    case 'charter': return 'Charter';
  }
};

// AFTER
const getGuestTypeLabel = (type: Guest['type']) => {
  switch (type) {
    case 'guest': return 'Guest';
    case 'partner': return 'Partner';
    case 'family': return 'Family';
    case 'vip': return 'VIP';
    case 'owner': return 'Owner';
  }
};
```

---

## SUMIRANJE IZMENA

| Fajl | Broj linija | Opis promene |
|------|-------------|--------------|
| `src/types/guests.ts` | 1 linija | Type definicija |
| `src/components/pages/guests-list.tsx` | 1 linija | toggleVip funkcija |
| `src/components/guest-form-dialog.tsx` | 4 linije | Default + dropdown |
| `src/components/guest-card-view.tsx` | 7 linija | getGuestTypeLabel() |
| `src/components/guest-details-dialog.tsx` | 7 linija | getGuestTypeLabel() |

**UKUPNO: 5 fajlova, ~20 linija koda**

---

## Test plan posle izmene

1. ✅ **Toggle VIP (zvezda)** - Trebalo bi da radi
2. ✅ **Add New Guest** - Trebalo bi da kreira sa `type: 'guest'`
3. ✅ **Edit Guest** - Trebalo bi da update-uje bez greške
4. ✅ **Dropdown opcije** - Samo validni tipovi vidljivi
5. ✅ **Labele** - Prikazuju se ispravno za sve tipove

---

## Čišćenje posle fixa

1. Obrisati debug log iz `backend/src/middleware/error-handler.ts:96-98`
2. Obrisati `backend/check-guest-dates.js` test script
3. Git commit sa opisom fixa

---

**Status:** ✅ **FIX PRIMENJEN - 2025-11-06**

---

## ✅ IMPLEMENTIRANO

### Izmene napravljene (Commit 1 - Guest Type Enum):

1. ✅ **`src/types/guests.ts:10`** - TypeScript type usklađen sa bazom
2. ✅ **`src/components/pages/guests-list.tsx:215`** - `'primary'` → `'guest'`
3. ✅ **`src/components/guest-form-dialog.tsx:80`** - Default `'charter'` → `'guest'`
4. ✅ **`src/components/guest-form-dialog.tsx:348-354`** - Obrisane opcije za primary/child/charter iz dropdown-a
5. ✅ **`src/components/guest-card-view.tsx:38-50`** - Obrisani case-ovi za nepostojeće tipove
6. ✅ **`src/components/guest-details-dialog.tsx:57-69`** - Obrisani case-ovi za nepostojeće tipove
7. ✅ **Cleanup:** Debug log obrisan iz `backend/src/middleware/error-handler.ts`
8. ✅ **Cleanup:** Test fajl `backend/check-guest-dates.js` obrisan

**Ukupno:** 5 frontend fajlova, ~20 linija koda, NULA backend izmena

### Izmene napravljene (Commit 2 - Date Format & Null Handling):

**GLAVNI BUG:** Linija 128 u `useEffect` hook-u je postavljala `type: 'charter'` umesto `'guest'` kada se otvara Add Guest dialog!

**Root Cause Analysis:**
- `useEffect` se pokreće kada `open` postane true
- Resetuje formData i override-uje inicijalnu state vrednost sa linija 75-108
- Rezultat: Svaki put kada otvoriš "Add Guest", type se postavlja na 'charter' (invalid)

**Dodatni problemi pronađeni:**

9. ✅ **`src/components/guest-form-dialog.tsx:85, 133`** - `locationId: ''` → `locationId: undefined`
   - Problem: PostgreSQL foreign key odbija empty string, traži null ili valid ID

10. ✅ **`src/components/guest-form-dialog.tsx:97, 145`** - `specialOccasionDate: ''` → `specialOccasionDate: undefined`
    - Problem: Zod validator odbija empty string za datetime field

11. ✅ **`src/components/guest-form-dialog.tsx:128`** - `type: 'charter'` → `type: 'guest'` (useEffect reset)
    - **GLAVNI BUG** - override-ovao inicijalnu state vrednost!

12. ✅ **`src/components/guest-form-dialog.tsx:211-228`** - Dodao data transformation u handleSubmit:
    - **Date format conversion:** `"2025-11-06"` → `"2025-11-06T00:00:00.000Z"`
    - **Email validation:** `contactPerson.email: ''` → `undefined`
    - **ContactPerson logic:** Šalje samo ako je bar jedno polje popunjeno

**Ukupno (Commit 2):** 1 fajl, 4 lokacije, ~30 linija izmena

**Backend Validation Errors Resolved:**
- ❌ Invalid guest type "charter" → ✅ Now sends "guest"
- ❌ Invalid datetime for checkInDate → ✅ ISO format "2025-11-06T00:00:00.000Z"
- ❌ Invalid datetime for checkOutDate → ✅ ISO format
- ❌ Invalid datetime for specialOccasionDate → ✅ ISO format or undefined
- ❌ Invalid email for contactPerson.email → ✅ undefined if empty
- ❌ Foreign key constraint (locationId) → ✅ undefined instead of empty string

### Test plan:
- [x] Toggle VIP (zvezda) - ✅ RADI (Commit 1)
- [x] Edit Guest - ✅ RADI (Commit 1)
- [x] Add New Guest - ✅ RADI (Commit 2)
- [x] Add Guest sa cabin-om - ✅ RADI (locationId fix)
- [x] Add Guest bez cabin-a - ✅ RADI (undefined umesto empty string)

---

## 🔍 DODATNA ANALIZA CELOG CODEBASE-a

**Datum:** 2025-11-06 (nakon fixa)
**Cilj:** Detaljno ispitivanje celog koda da nađemo slične probleme

### PRONAĐENI PROBLEMI (nakon temeljnog ispitivanja)

#### 🔴 HIGH PRIORITY - Treba rešiti uskoro

##### 1. Guest status 'ashore' nedostaje u frontend-u

**Backend (Prisma schema):**
```prisma
enum GuestStatus {
  expected
  onboard
  ashore      // ← POSTOJI u bazi
  departed
}
```

**Backend validator (schemas.ts line 20):**
```typescript
status: z.enum(['expected', 'onboard', 'ashore', 'departed'])  // ← Podržava 'ashore'
```

**Frontend (src/types/guests.ts line 11):**
```typescript
status: 'expected' | 'onboard' | 'departed';  // ← NEDOSTAJE 'ashore'
```

**Frontend (guest-form-dialog.tsx lines 367-371):**
```tsx
<SelectContent>
  <SelectItem value="expected">Expected</SelectItem>
  <SelectItem value="onboard">Onboard</SelectItem>
  <SelectItem value="departed">Departed</SelectItem>
  <!-- NEDOSTAJE opcija za 'ashore' -->
</SelectContent>
```

**RIZIK:** MEDIUM
**Problem:** Ako se guest postavi na 'ashore' status (možda sa mobile app-a), frontend ga neće prepoznati.

**FIX:**
1. Dodati 'ashore' u `src/types/guests.ts` Guest interface
2. Dodati `<SelectItem value="ashore">Ashore</SelectItem>` u guest-form-dialog.tsx

---

##### 2. ServiceRequest priority mismatch (Web vs Mobile)

**Backend (Prisma schema):**
```prisma
enum ServiceRequestPriority {
  low       // ← Postoji u bazi
  normal
  urgent
  emergency
}
```

**Frontend Web (src/types/service-requests.ts line 28):**
```typescript
priority: 'normal' | 'urgent' | 'emergency';  // ← NEDOSTAJE 'low'
```

**Mobile iOS (Models.swift lines 27-30):**
```swift
enum ServiceRequestPriority: String, Codable {
    case normal = "normal"
    case high = "high"         // ← Koristi 'high' umesto 'urgent'!
    case emergency = "emergency"
}
```

**RIZIK:** MEDIUM
**Problem:**
- Frontend Web ne može da kreira 'low' priority zahteve
- Mobile iOS koristi 'high' ali backend očekuje 'urgent'
- Sync problemi između Web i Mobile aplikacija

**FIX:**
1. Dodati 'low' u frontend Web ServiceRequest type
2. Poravnati Mobile iOS da koristi 'urgent' umesto 'high'
3. ILI update-ovati backend da prihvata oba ('urgent' i 'high')

---

#### 🟡 MEDIUM PRIORITY - Razmotriti

##### 3. Email validacija u Crew forms

**Backend (schemas.ts line 89):**
```typescript
email: z.string().email('Invalid email').max(100).optional().nullable(),
```

**Frontend (crew-list.tsx line 238):**
```typescript
email: formData.email || null,  // ← Konvertuje empty string u null ✅
                                // ALI ne validira email format pre slanja
```

**RIZIK:** LOW-MEDIUM
**Problem:** Ako korisnik unese nevalidan email, backend će odbaciti request.
**User Experience:** Greška se prikazuje tek nakon slanja, nije user-friendly.

**FIX:** Dodati email validaciju u frontend pre slanja (npr. koristi Zod na frontend-u)

---

##### 4. 'low' priority opcija ne postoji u UI

**Backend:** Podržava 'low' priority
**Frontend:** Ne prikazuje opciju za 'low' priority u forms

**RIZIK:** LOW
**Problem:** Korisnici ne mogu da kreiraju low priority service requests sa Web app-a.

**FIX:** Dodati 'low' opciju u ServiceRequest forms

---

#### ✅ VERIFIKOVANO - Nema problema

##### CrewMember date handling
- ✅ `joinDate` koristi ISO datetime format (correct)
- ✅ `leaveStart/leaveEnd` koriste YYYY-MM-DD format (correct - stored as String)
- ✅ Backend validator matches database schema

##### Location optional fields handling
- ✅ Backend route koristi `!== undefined` checks
- ✅ Neće slučajno poslati empty strings

##### WebSocket real-time updates
- ✅ Guest events properly emitted (created/updated/deleted)
- ✅ Real-time sync funkcioniše

---

### PREPORUKE PO PRIORITETU

#### ODMAH (Pre production):
- Ništa KRITIČNO - Guest fix je bio glavni problem ✅

#### USKORO (Sledeći sprint):
1. **Dodati 'ashore' status** - Guest može biti ashore, frontend mora to podržati
2. **Poravnati ServiceRequest priority** - Web vs Mobile sync problem

#### RAZMOTRITI (Nice to have):
1. **Email validacija na frontend-u** - Bolja UX
2. **Dodati 'low' priority opciju** - Kompletna funkcionalnost

---

### ZAKLJUČAK ANALIZE

✅ **Guest form bug je bio GLAVNI problem u codebase-u**

Našao sam 2 HIGH priority problema i 2 MEDIUM priority problema, ali **nijedan nije kritičan** kao Guest enum/date/validation bug koji smo fixovali.

Codebase je generalno **dobro strukturiran** sa pravilnom validacijom, ali postoji nekoliko enum mismatch-eva između frontend types i backend schemas koje bi trebalo rešiti pre production deploya.

**Kompletan spisak fajlova pregledanih:**
- ✅ Svi Guest-related komponenti (8 frontend files)
- ✅ Svi backend routes (guests, crew, service-requests, locations)
- ✅ Svi validators i schemas
- ✅ Prisma schema (svi enums pregledani)
- ✅ Mobile iOS Models (za cross-platform sync)
- ✅ WebSocket handlers
- ✅ All hooks and services
