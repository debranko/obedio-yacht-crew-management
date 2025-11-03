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