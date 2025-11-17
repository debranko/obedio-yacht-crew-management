# 🛡️ OBEDIO CONSOLIDATED RULES FOR AI DEVELOPMENT

**OVAJ DOKUMENT ZAMENJUJE SVE OSTALE RULES DOKUMENTE**  
**Datum:** 1. Novembar 2025  
**STATUS: JEDINA VAŽEĆA PRAVILA**

---

## 🚨 ZLATNA PRAVILA - BEZ IZUZETAKA

### PRAVILO #1: OBEDIO JE SERVER SOFTWARE
```
✅ ISPRAVNO: Backend je "brain", Frontend je samo "dashboard"
❌ POGREŠNO: Frontend je "controller", Backend je "storage"
```

**Sistem MORA raditi 24/7 bez frontend-a!**

### PRAVILO #2: NE KVARI ŠTO RADI
```
✅ ZAVRŠENE KOMPONENTE - NE DIRATI:
- src/components/pages/crew-list.tsx ✅
- src/components/pages/crew-management.tsx ✅
- src/hooks/useCrewMembers.ts ✅
- backend/src/routes/crew.ts ✅
```

### PRAVILO #3: BEZ MOCK DATA I LOCALSTORAGE
```typescript
❌ ZABRANJENO:
const mockGuests = [{...}];
localStorage.setItem('guests', JSON.stringify(guests));

✅ OBAVEZNO:
const { data: guests } = useQuery(['guests'], api.guests.getAll);
```

---

## 📋 OBAVEZAN WORKFLOW

### 1. PRE SVAKOG ZADATKA - CHECKLIST:
```
□ Pročitao ovaj dokument?
□ Pročitao OBEDIO-IMPLEMENTATION-TODO-LIST.md?
□ Znam tačno koji zadatak radim?
□ Proverio da li API endpoint postoji?
□ Proverio da komponenta već koristi React Query?
```

### 2. REDOSLED IMPLEMENTACIJE:
```
1. Backend API endpoint (ako ne postoji)
2. Testirati sa Postman/curl
3. React Query hook
4. Frontend komponenta
5. WebSocket listener
```

### 3. OBAVEZNI PATTERNS:

**Backend Endpoint:**
```typescript
router.post('/', 
  authMiddleware,
  requirePermission('resource.create'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const result = await prisma.resource.create({ data: req.body });
    websocketService.emit('resource:created', result);
    res.json({ success: true, data: result });
  })
);
```

**Frontend Hook:**
```typescript
export function useResources() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: () => api.resources.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}
```

**WebSocket Listener:**
```typescript
useEffect(() => {
  const ws = websocketService.connect();
  ws.on('resource:updated', () => {
    queryClient.invalidateQueries(['resources']);
  });
  return () => ws.disconnect();
}, []);
```

---

## 🔧 SYSTEMATIC CHANGE PROCEDURE FOR API FIXES

**KADA OTKRIJEŠ DA JE NEŠTO POKVARENO:**

### KORAK 1: IDENTIFIKACIJA PROBLEMA
```
1. Pronađi tačan fajl i liniju gde je problem
2. Razumi šta je OČEKIVANO ponašanje
3. Razumi šta je STVARNO ponašanje
4. Dokumentuj razliku
```

### KORAK 2: MAPIRANJE SVIH POVEZANIH DELOVA
```
□ Backend route (npr. backend/src/routes/activity-logs.ts)
□ Database service (npr. backend/src/services/database.ts)
□ API wrapper (npr. src/services/api.ts ili src/lib/api.ts)
□ Frontend hook (npr. src/hooks/useActivityLogs.ts)
□ UI komponenta (npr. src/components/pages/activity-log.tsx)
□ WebSocket listener (ako postoji)
□ TypeScript interfaces (DTO-ovi)
```

### KORAK 3: ANALIZA BEZBEDONSTI PROMENE
```
Za svaki povezan deo, proveri:
1. Da li DRUGI delovi koda zavise od njega?
2. Da li će promena POKVARITI nešto drugo?
3. Šta je SIGURNIJE promeniti - backend ili frontend?
```

**PRAVILO SIGURNOSTI:**
```typescript
✅ SIGURNIJE: Promeniti backend daWRAUJE podatke u objekat
// Backend: apiSuccess({ items: [...], pagination: {...} })
// Frontend prima: { items: [...], pagination: {...} }

❌ OPASNIJE: Promeniti API wrapper da ne unwrapuje
// Može pokvariti 50+ drugih endpoint-a koji rade ispravno
```

### KORAK 4: KREIRANJE TODO LISTE
```
1. Napravi listu SVIH promena koje treba uraditi
2. Sortiraj po prioritetu (broken > pagination lost > optimization)
3. Grupiši povezane promene
4. Označi dependencies (X mora pre Y)
```

**Primer TODO liste:**
```
□ Fix Activity Logs backend (BROKEN - priority 1)
□ Test Activity Logs frontend
□ Fix Messages backend (BROKEN - priority 1)
□ Test Messages frontend
□ Analyze Crew Changes (potentially broken)
□ IF broken: Fix Crew Changes backend
□ Review remaining endpoints (priority 2)
```

### KORAK 5: IMPLEMENTACIJA - JEDNO PO JEDNO
```
Za SVAKU promenu:
1. Pročitaj fajl
2. Napravi promenu
3. Testiraj backend (curl)
4. Testiraj frontend (UI)
5. Commit sa detaljnom porukom
6. Označi TODO kao completed
7. Nastavi na sledeći
```

**VAŽNO:**
```
❌ NEMOJ: Menjati 5 endpoint-a odjednom
✅ RADI: Jedan endpoint, testiraj, commit, sledeći
```

### KORAK 6: DOKUMENTACIJA
```
Nakon što završiš SVE promene:
1. Napravi ili update audit dokument
2. Dokumentuj šta je bilo pokvareno
3. Dokumentuj šta je ispravljeno
4. Dokumentuj šta JE OSTALO kao što je bilo (i zašto)
```

**Primer:**
- API-RESPONSE-STRUCTURE-AUDIT.md
- API-WRAPPER-ANALYSIS.md
- SERVICE-REQUESTS-MASTER-PLAN.md

### ⚠️ ZLATNO PRAVILO:
```
"Ako nisi 100% siguran da li nešto treba menjati,
 PRVO napravi audit, dokumentuj, i PITAJ."
```

**NE KVARI ŠTO RADI!**
- Service Requests ne koristi pagination → NE DIRAJ (čak i ako backend šalje)
- Crew Members ne koristi pagination → NE DIRAJ
- Ako UI ne prikazuje pagination → pagination nije potreban

---

## 🚫 STRIKTNO ZABRANJENO

1. **Hardcoded data** - SVE mora iz baze
2. **localStorage** - Samo za auth token
3. **Direktni fetch** - Koristiti api service
4. **Refaktorisanje završenih komponenti**
5. **Rad bez testiranja**

---

## ✅ TRENUTNI PRIORITETI

Pogledaj **OBEDIO-IMPLEMENTATION-TODO-LIST.md** za listu zadataka.

**PRVI ZADATAK:** Kreirati backend/src/routes/assignments.ts

---

## 🔍 AKO NISI SIGURAN

1. Pogledaj kako radi crew komponenta (primer dobre prakse)
2. Proveri da li postoji API endpoint pre frontend rada
3. Testiraj svaku promenu
4. Pitaj pre nego što menjaš arhitekturu

**ZAPAMTI:** Ovo je production sistem za jahtu, ne demo aplikacija!