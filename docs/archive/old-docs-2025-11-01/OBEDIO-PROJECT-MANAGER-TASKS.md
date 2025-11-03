# 🎯 OBEDIO PROJECT MANAGER - ZADACI ZA IMPLEMENTACIJU

**Datum:** 1. Novembar 2025  
**Prioritet:** METSTRADE 2025 Demo (Januar 2025)  
**Metodologija:** Segmentirana implementacija sa strogim pravilima

---

## 📊 TRENUTNI STATUS KOMPONENTI

| Komponenta | Status | Backend API | Frontend | Napomena |
|------------|---------|-------------|----------|-----------|
| **Crew Management** | ✅ 95% | ✅ Potpuno | ✅ React Query | **GOTOVO - NE DIRATI!** |
| **Guests** | ⚠️ 70% | ✅ Potpuno | ⚠️ Hibrid | Koristi AppDataContext |
| **Service Requests** | ⚠️ 60% | ✅ Potpuno | ⚠️ Hibrid | Real-time ne radi |
| **Locations (DND)** | ⚠️ 50% | ✅ Potpuno | ❌ LocalStorage | Kritično - ne perzistira |
| **Duty Roster** | ❌ 40% | ❌ Nedostaje | ❌ LocalStorage | Assignments nemaju API |
| **Device Manager** | ⚠️ 50% | ✅ Potpuno | ⚠️ Parcijalno | UI nedovršen |
| **Settings** | ❌ 30% | ⚠️ Parcijalno | ❌ Nedovršeno | Samo service categories |
| **MQTT/WebSocket** | ✅ 90% | ✅ Odlično | ⚠️ Ne koristi se | Frontend ignorira events |
| **Messages** | ❌ 0% | ✅ API postoji | ❌ Nema UI | Nije implementirano |

---

## 🚨 KRITIČNI PROBLEMI

### 1. **AppDataContext.tsx (1205 linija!) - GLAVNI KRIVAC**
```typescript
// Trenutno stanje - SVE u jednom fajlu:
- Lokalni state arrays za sve entitete
- localStorage perzistencija
- Mešanje API poziva i lokalnih operacija
- 50+ TODO komentara
```

### 2. **Duty Roster - NEMA BACKEND INTEGRACIJU**
```typescript
// backend/src/routes/ - NEMA duty-assignments.ts!
// frontend čuva u localStorage umesto u bazu
```

### 3. **Real-time Updates - IGNORISANI**
```typescript
// WebSocket server radi odlično
// Ali frontend komponente ne slušaju events
```

---

## 📋 PRIORITETNI ZADACI (FAZE)

### 🔴 FAZA 1: KRITIČNI POPRAVCI (3-5 dana)
**Cilj:** Aplikacija mora raditi 24/7 bez frontend-a

#### ZADATAK 1.1: Kreirati Assignments API u Backend-u
```bash
# Kreirati novi fajl:
backend/src/routes/assignments.ts

# Dodati u server.ts:
app.use('/api/assignments', assignmentsRoutes);

# Kreirati Prisma model (već postoji):
model Assignment {
  id           String   @id @default(cuid())
  date         String   // ISO date "2025-01-15"
  shiftId      String
  crewMemberId String
  type         String   // "primary" | "backup"
  notes        String?
  
  shift        Shift      @relation(...)
  crewMember   CrewMember @relation(...)
}
```

**Endpoints koji trebaju:**
- `GET /api/assignments` - lista svih
- `GET /api/assignments/by-date/:date` - za određeni dan
- `POST /api/assignments/bulk` - bulk create/update
- `DELETE /api/assignments/:id` - brisanje

#### ZADATAK 1.2: Refaktorisati DutyRosterTab da koristi React Query
```typescript
// UMESTO:
const [assignments, setAssignments] = useState<Assignment[]>(contextAssignments);
const saveAssignments = () => localStorage.setItem(...);

// TREBA:
const { data: assignments } = useAssignments();
const createAssignmentMutation = useCreateAssignment();
```

#### ZADATAK 1.3: Razbiti AppDataContext na manje delove
```typescript
// Kreirati nove context fajlove:
src/contexts/
├── GuestsContext.tsx      // Samo guests logika
├── LocationsContext.tsx    // Samo locations & DND
├── ServiceRequestsContext.tsx
└── DutyRosterContext.tsx   // Assignments & shifts
```

#### ZADATAK 1.4: Implementirati WebSocket listeners
```typescript
// U svakoj komponenti dodati:
useEffect(() => {
  const ws = websocketService.connect();
  
  ws.on('guests:updated', () => {
    queryClient.invalidateQueries(['guests']);
  });
  
  return () => ws.disconnect();
}, []);
```

---

### 🟡 FAZA 2: OPTIMIZACIJE (2-3 dana)

#### ZADATAK 2.1: Ukloniti sve localStorage pozive
- Pretražiti celu bazu za `localStorage`
- Zameniti sa API pozivima
- User preferences već imaju API

#### ZADATAK 2.2: Dodati Error Boundaries
```typescript
// Kreirati ErrorBoundary komponentu
// Wrap-ovati sve stranice
```

#### ZADATAK 2.3: Implementirati Offline Queue
```typescript
// Za MQTT button presses kada nema mreže
// Čuvati u IndexedDB, ne localStorage
```

#### ZADATAK 2.4: Optimizovati Re-renders
```typescript
// Koristiti React.memo za velike liste
// UseMemo za skupe kalkulacije
```

---

### 🟢 FAZA 3: ZAVRŠNI DETALJI (2 dana)

#### ZADATAK 3.1: Završiti Device Manager UI
- Forma za dodavanje uređaja
- Battery monitoring widget
- Device assignment to crew

#### ZADATAK 3.2: Implementirati Settings stranicu
- User management tab
- Notification settings
- Backup/restore funkcionalnost

#### ZADATAK 3.3: Testing & Bug Fixes
- Testirati sve CRUD operacije
- Proveriti MQTT integraciju
- Load testing sa 10+ uređaja

---

## 🛡️ PRAVILA ZA CLAUDE CODE AI

### ⛔ STROGO ZABRANJENO:

1. **NE PREPRAVLJAJ FAJLOVE KOJI RADE!**
   ```
   ❌ NEMOJ dirati: crew-list.tsx, crew-management.tsx
   ❌ NEMOJ menjati: useCrewMembers.ts hook
   ❌ NEMOJ refaktorisati kod koji već koristi React Query
   ```

2. **NE DODAJI MOCK DATA!**
   ```typescript
   ❌ const mockGuests = [{...}]
   ❌ const testData = generateFakeData()
   ❌ if (!data) return <div>Loading...</div> // BEZ hardcoded UI
   ```

3. **NE KORISTI LOKALNI STATE ZA SERVER DATA!**
   ```typescript
   ❌ const [guests, setGuests] = useState([])
   ❌ useEffect(() => { fetchGuests().then(setGuests) })
   ```

### ✅ OBAVEZNI PATTERN:

1. **UVEK KORISTI REACT QUERY:**
   ```typescript
   ✅ const { data, isLoading, error } = useQuery({
       queryKey: ['guests'],
       queryFn: () => api.guests.getAll()
     });
   ```

2. **MUTATIONS ZA SVE PROMENE:**
   ```typescript
   ✅ const mutation = useMutation({
       mutationFn: (data) => api.guests.create(data),
       onSuccess: () => {
         queryClient.invalidateQueries(['guests'])
       }
     });
   ```

3. **PROVERI DA LI API POSTOJI PRE IMPLEMENTACIJE:**
   ```bash
   # Prvo proveri:
   - Da li postoji ruta u backend/src/routes/?
   - Da li postoji u src/services/api.ts?
   # Ako ne - PRVO napravi API, PA tek onda UI
   ```

### 📏 METODOLOGIJA RADA:

1. **JEDAN ZADATAK = JEDAN FAJL**
   - Radi samo na jednom fajlu u isto vreme
   - Završi potpuno pre prelaska na sledeći
   - Test posle svake izmene

2. **PROVERI PRE MENJANJA:**
   ```typescript
   // Pre bilo koje izmene, proveri:
   - Da li komponenta već koristi React Query? → NE MENJAJ
   - Da li postoji TODO komentar? → PRATI UPUTSTVO
   - Da li je obeleženo kao "deprecated"? → OBRIŠI
   ```

3. **BACKEND-FIRST PRISTUP:**
   - Prvo implementiraj/proveri backend API
   - Zatim hook (useQuery/useMutation)
   - Na kraju UI komponentu
   - Testiraj sa Postman/curl pre UI

### 🔍 NAČIN PROVERE:

```bash
# Za svaku implementaciju:
1. curl http://localhost:8080/api/[endpoint] → Mora raditi
2. React Query DevTools → Mora pokazati query
3. Network tab → Bez polling-a (osim gde je eksplicitno)
4. Console → Bez error-a i warning-a
```

---

## 📊 MERILA USPEHA

1. **Aplikacija radi bez frontend-a:**
   - ESP32 button → MQTT → Backend → Database ✓
   - Crew watch dobija notifikaciju ✓
   - Podaci se čuvaju u PostgreSQL ✓

2. **Real-time updates rade:**
   - Novi service request → Svi vide odmah
   - Status update → Instant refresh
   - Bez F5 refresh potrebe

3. **Nema localStorage za podatke:**
   ```bash
   grep -r "localStorage" src/ | grep -v "theme" | grep -v "auth-token"
   # Treba biti prazno!
   ```

4. **Performance:**
   - First load < 3 sekunde
   - Navigation instant (cache)
   - 50+ service requests smooth scroll

---

## 🚀 POČETAK RADA

### Za Claude Code AI:
1. Kloniraj repo i instaliraj dependencies
2. Pokreni backend: `cd backend && npm run dev`
3. Pokreni frontend: `cd .. && npm run dev`
4. Počni sa **ZADATAK 1.1** - Assignments API
5. **NE PRELAZI** na sledeći zadatak dok trenutni nije završen

### Važna napomena:
```
AppDataContext još uvek koriste mnoge komponente.
NE POKUŠAVAJ da refaktorišeš sve odjednom!
Radi postupno - jedan po jedan deo.
```

---

## 📞 KONTAKT & ESKALACIJA

Ako naiđeš na problem:
1. Prvo proveri da li je već rešeno u crew komponenti
2. Pogledaj postojeće hooks kao primer
3. Ako si nesiguran - PITAJ pre implementacije
4. Bolje je sporije i sigurno nego brzo i pokvareno

**ZAPAMTI:** Ova aplikacija će biti instalirana na jahti i raditi 24/7. Mora biti PRODUCTION-READY, ne prototip!