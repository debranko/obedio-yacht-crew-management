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

### Izmene napravljene:

1. ✅ **`src/types/guests.ts:10`** - TypeScript type usklađen sa bazom
2. ✅ **`src/components/pages/guests-list.tsx:215`** - `'primary'` → `'guest'`
3. ✅ **`src/components/guest-form-dialog.tsx:80`** - Default `'charter'` → `'guest'`
4. ✅ **`src/components/guest-form-dialog.tsx:348-354`** - Obrisane opcije za primary/child/charter iz dropdown-a
5. ✅ **`src/components/guest-card-view.tsx:38-50`** - Obrisani case-ovi za nepostojeće tipove
6. ✅ **`src/components/guest-details-dialog.tsx:57-69`** - Obrisani case-ovi za nepostojeće tipove
7. ✅ **Cleanup:** Debug log obrisan iz `backend/src/middleware/error-handler.ts`
8. ✅ **Cleanup:** Test fajl `backend/check-guest-dates.js` obrisan

**Ukupno:** 5 frontend fajlova, ~20 linija koda, NULA backend izmena

### Test plan:
- [ ] Toggle VIP (zvezda) - Trebalo bi da radi
- [ ] Add New Guest - Trebalo bi da kreira sa `type: 'guest'`
- [ ] Edit Guest - Trebalo bi da update-uje bez greške
