# 🛡️ OBEDIO AI DEVELOPMENT RULES

**OBAVEZNO PROČITATI PRE POČETKA RADA!**  
**Datum:** 1. Novembar 2025  
**Za:** Claude Code AI ili bilo koji drugi AI asistent

---

## 🚨 ZLATNO PRAVILO #1: NE KVARI ŠTO RADI!

### ✅ KOMPONENTE KOJE SU ZAVRŠENE - NE DIRATI:
```
src/components/pages/crew-list.tsx ✅
src/components/pages/crew-management.tsx ✅
src/components/pages/duty-roster-tab.tsx ✅ (samo localStorage deo treba migrirati)
src/hooks/useCrewMembers.ts ✅
src/hooks/useShifts.ts ✅
src/services/api.ts ✅ (samo dodavati nove endpoints, ne menjati postojeće)
backend/src/routes/crew.ts ✅
backend/src/services/mqtt.service.ts ✅
backend/src/services/database.ts ✅
```

**Ako vidiš da komponenta već koristi React Query - STOP! Ne refaktoriši je!**

---

## 📋 PRE POČETKA SVAKOG ZADATKA

### 1. PROVERI STATUS:
```bash
# Da li već postoji API endpoint?
ls backend/src/routes/ | grep [naziv]

# Da li već postoje hooks?
ls src/hooks/ | grep [naziv]

# Da li komponenta koristi React Query?
grep -n "useQuery\|useMutation" src/components/[komponenta].tsx

# Da li koristi AppDataContext? (to treba migrirati)
grep -n "useAppData" src/components/[komponenta].tsx
```

### 2. AKO NE POSTOJI BACKEND:
```
STOP! Prvo implementiraj backend API.
Ne možeš raditi frontend bez backend-a.
```

### 3. AKO POSTOJI I RADI:
```
Koristi postojeće. Ne izmišljaj novo.
```

---

## 🚫 STRIKTNO ZABRANJENO

### 1. **NIKAD NE DODAJI MOCK DATA:**
```typescript
// ❌ ZABRANJENO
const mockGuests = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' }
];

// ❌ ZABRANJENO
const testData = generateFakeData();

// ❌ ZABRANJENO
// TODO: Replace with real data
return <div>Loading...</div>;
```

### 2. **NIKAD NE KORISTI LOKALNI STATE ZA SERVER DATA:**
```typescript
// ❌ ZABRANJENO
const [guests, setGuests] = useState([]);
useEffect(() => {
  fetchGuests().then(setGuests);
}, []);

// ✅ OBAVEZNO
const { data: guests = [], isLoading } = useQuery({
  queryKey: ['guests'],
  queryFn: api.guests.getAll
});
```

### 3. **NIKAD NE PRAVI DIREKTNE FETCH POZIVE:**
```typescript
// ❌ ZABRANJENO
const response = await fetch('/api/guests');
const data = await response.json();

// ✅ OBAVEZNO
const { data } = await api.guests.getAll();
```

### 4. **NIKAD NE ČUVAJ APP DATA U LOCALSTORAGE:**
```typescript
// ❌ ZABRANJENO
localStorage.setItem('guests', JSON.stringify(guests));
localStorage.setItem('assignments', JSON.stringify(assignments));

// ✅ JEDINO DOZVOLJENO
localStorage.getItem('obedio-auth-token'); // Auth token
localStorage.getItem('theme'); // UI preferences
```

---

## ✅ OBAVEZNI PATTERNS

### 1. **REACT QUERY ZA SVE:**
```typescript
// Lista podataka
export function useGuests() {
  return useQuery({
    queryKey: ['guests'],
    queryFn: () => api.guests.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minuta
  });
}

// Create mutation
export function useCreateGuest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateGuestDTO) => api.guests.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast.success('Guest added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add guest');
    },
  });
}
```

### 2. **ERROR HANDLING UVEK:**
```typescript
// U komponenti
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data || data.length === 0) return <EmptyState />;

// U mutation
try {
  await createMutation.mutateAsync(formData);
  // success handled by mutation
} catch (error) {
  // error handled by mutation
  console.error('Failed to create:', error);
}
```

### 3. **WEBSOCKET LISTENERS:**
```typescript
useEffect(() => {
  const ws = websocketService.connect();
  
  ws.on('entity:created', () => {
    queryClient.invalidateQueries({ queryKey: ['entities'] });
  });
  
  ws.on('entity:updated', (entity) => {
    queryClient.setQueryData(['entities'], (old: any) => {
      if (!old) return old;
      return old.map(item => 
        item.id === entity.id ? entity : item
      );
    });
  });
  
  return () => ws.disconnect();
}, [queryClient]);
```

---

## 🔄 WORK FLOW

### KORAK 1: Proveri backend
```bash
# Testiraj da li endpoint radi
curl -X GET http://localhost:8080/api/[endpoint] \
  -H "Authorization: Bearer [token]"
```

### KORAK 2: Napravi/koristi hook
```typescript
// src/hooks/use[Entity].ts
// Koristi postojeći pattern iz useCrewMembers.ts
```

### KORAK 3: Implementiraj u komponenti
```typescript
// Zameni useAppData sa novim hook
// Dodaj loading i error states
// Dodaj WebSocket listener
```

### KORAK 4: Testiraj
```
1. Otvori React Query DevTools
2. Proveri da se query pojavljuje
3. Proveri Network tab - mora biti API poziv
4. Otvori u 2 taba - proveri sync
5. Ugasi/upali backend - proveri reconnect
```

---

## 📏 CODE REVIEW CHECKLIST

Pre commit-a, proveri:

- [ ] Nema `console.log` statements
- [ ] Nema hardcoded/mock data
- [ ] Nema `localStorage` za app data
- [ ] Svi API calls koriste `api` service
- [ ] Sve komponente koriste React Query
- [ ] Loading states implementirani
- [ ] Error handling implementiran
- [ ] WebSocket listeners dodati
- [ ] TypeScript nema grešaka
- [ ] Testirano u 2 taba (multi-client)

---

## 🎯 PRIMER: Migracija Guests komponente

### 1. Analiza postojećeg koda:
```typescript
// STARO - AppDataContext
const { guests, addGuest, updateGuest, deleteGuest } = useAppData();
```

### 2. Implementacija sa React Query:
```typescript
// NOVO - React Query
import { useGuests, useCreateGuest, useUpdateGuest, useDeleteGuest } from '@/hooks/useGuests';

export function GuestListPage() {
  const { data: guests = [], isLoading, error } = useGuests();
  const createGuestMutation = useCreateGuest();
  const updateGuestMutation = useUpdateGuest();
  const deleteGuestMutation = useDeleteGuest();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="p-8">
        <ErrorMessage 
          error={error} 
          onRetry={() => window.location.reload()} 
        />
      </Card>
    );
  }
  
  // Empty state
  if (guests.length === 0) {
    return (
      <Card className="p-8 text-center">
        <GuestIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No guests yet</h3>
        <p className="text-muted-foreground mb-4">
          Start by adding your first guest
        </p>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Guest
        </Button>
      </Card>
    );
  }
  
  // Normal render sa podacima
  return (
    <div>
      {guests.map(guest => (
        <GuestCard key={guest.id} guest={guest} />
      ))}
    </div>
  );
}
```

---

## 🔥 EMERGENCY CONTACTS

Ako nešto ne radi ili nisi siguran:

1. **Prvo pogledaj crew komponente** - one su primer kako treba
2. **Proveri postojeće hooks** - koristi isti pattern
3. **Čitaj TypeScript greške** - često pokazuju problem
4. **Proveri Network tab** - da li se API poziva?
5. **Proveri console** - da li ima WebSocket konekcije?

---

## 🎬 FINALNE NAPOMENE

1. **Ova aplikacija će raditi na jahti 24/7** - mora biti stabilna
2. **Bolje sporije nego pokvareno** - ne žuri
3. **Testiraj posle svake promene** - ne čekaj kraj
4. **Commit često** - sa jasnim porukama
5. **Ako sumjaš - pitaj** - bolje pitati nego pokvariti

**ZAPAMTI:** Ti samo MIGRIRAŠ postojeći kod da koristi pravu arhitekturu. Ne izmišljaš novo, ne refaktorišeš što radi, ne dodaješ features koji nisu traženi.

---

**SREĆNO! 🚀**

*P.S. Crew management je već završen i odličan je - koristi ga kao primer!*