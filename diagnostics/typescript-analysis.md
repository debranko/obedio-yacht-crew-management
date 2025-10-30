# TypeScript Greške - Potpuna Analiza

## STATISTIKA

- **Ukupan broj grešaka**: 435 linija (približno 300-350 jedinstvenih grešaka)
- **Broj jedinstvenih tipova grešaka**: 8 glavnih kategorija
- **Broj zahvaćenih fajlova**: 95+ fajlova

---

## KATEGORIJE GREŠAKA

### 1. Import/Export greške - NEDOSTAJU PAKETI

**Ukupno**: ~80 grešaka

#### Nedostaju testing biblioteke:
- `vitest` - potreban za testove
- `@testing-library/react` - potreban za React testove
- `@testing-library/jest-dom/matchers` - potreban za DOM assertions

#### Nedostaju UI biblioteke (sa verzijama u path-u):
- `react-router-dom`
- `react-grid-layout` (nema @types definicije)
- `@radix-ui/react-accordion@1.2.3`
- `@radix-ui/react-alert-dialog@1.1.6`
- `@radix-ui/react-aspect-ratio@1.1.2`
- `@radix-ui/react-avatar@1.1.3`
- `@radix-ui/react-checkbox@1.1.4`
- `@radix-ui/react-collapsible@1.1.3`
- `@radix-ui/react-context-menu@2.2.6`
- `@radix-ui/react-dialog@1.1.6`
- `@radix-ui/react-dropdown-menu@2.1.6`
- `@radix-ui/react-hover-card@1.1.6`
- `@radix-ui/react-label@2.1.2`
- `@radix-ui/react-menubar@1.1.6`
- `@radix-ui/react-navigation-menu@1.2.5`
- `@radix-ui/react-popover@1.1.6`
- `@radix-ui/react-progress@1.1.2`
- `@radix-ui/react-radio-group@1.2.3`
- `@radix-ui/react-scroll-area@1.2.3`
- `@radix-ui/react-select@2.1.6`
- `@radix-ui/react-separator@1.1.2`
- `@radix-ui/react-slider@1.2.3`
- `@radix-ui/react-slot@1.1.2`
- `@radix-ui/react-switch@1.1.3`
- `@radix-ui/react-tabs@1.1.3`
- `@radix-ui/react-toggle@1.1.2`
- `@radix-ui/react-toggle-group@1.1.2`
- `@radix-ui/react-tooltip@1.1.8`

#### Nedostaju utility biblioteke:
- `class-variance-authority@0.7.1`
- `lucide-react@0.487.0`
- `react-day-picker@8.10.1`
- `embla-carousel-react@8.6.0`
- `recharts@2.15.2`
- `cmdk@1.1.1`
- `vaul@1.1.2`
- `react-hook-form@7.55.0`
- `input-otp@1.4.2`
- `react-resizable-panels@2.1.7`

**PROBLEM**: Izgleda da su paketi instalirani, ali TypeScript ne može da ih pronađe zbog verzije u import putanji.

**PRIMER**:
```
src/components/ui/accordion.tsx(4,37): error TS2307: Cannot find module '@radix-ui/react-accordion@1.2.3'
```

---

### 2. Type Definition greške - PROPERTY MISMATCH

**Ukupno**: ~120 grešaka

#### CrewMember vs CrewMemberExtended neslaganja:

**Nedostaju property-ji na `CrewMemberExtended`**:
- `color` - nedostaje u preko 20 mesta
- `phone` - nedostaje
- `onBoardContact` - nedostaje
- `nickname` - nedostaje
- `leaveStart` - nedostaje
- `leaveEnd` - nedostaje
- `avatar` - nedostaje

**PRIMERI**:
```
src/components/pages/crew-list.tsx(155,13): Property 'phone' does not exist on type 'CrewMemberExtended'.
src/components/pages/crew-list.tsx(156,13): Property 'onBoardContact' does not exist on type 'CrewMemberExtended'.
src/components/pages/crew-list.tsx(184,20): Property 'color' does not exist on type 'CrewMemberExtended'.
src/components/pages/duty-roster-tab.tsx(122,16): Property 'nickname' does not exist on type 'CrewMemberExtended'.
```

#### Guest type neslaganja:

**Nedostaju property-ji na `Guest`**:
- `name` - nedostaje (koristi se u više mesta)
- `cabin` - type mismatch (očekuje se objekat, dobija se string)
- `email` - nedostaje
- `phone` - nedostaje

**PRIMERI**:
```
src/components/button-simulator-dialog.tsx(102,22): Property 'cabin' does not exist on type 'string'.
src/components/button-simulator-dialog.tsx(125,83): Property 'name' does not exist on type 'Guest'.
src/components/guest-card-view.tsx(137,22): Property 'email' does not exist on type 'Guest'.
src/components/guest-card-view.tsx(144,22): Property 'phone' does not exist on type 'Guest'.
```

#### Assignment type greške:
```
src/hooks/useAssignments.ts(15,5): 'notes' does not exist in type 'Assignment'.
src/hooks/useAssignments.ts(28,23): Property 'notes' does not exist on type 'Partial<Assignment>'.
```

#### ServiceRequestPanel props greške:

**8 testova ne mogu da pronađu `request` property**:
```
src/components/__tests__/service-request-panel.test.tsx(29,9): Property 'request' does not exist on type 'IntrinsicAttributes & ServiceRequestPanelProps'.
```

Ovo se ponavlja u linijama: 29, 44, 58, 83, 104, 124, 142, 162, 187

---

### 3. Implicit 'any' greške - NEDOSTAJU TYPE ANNOTATIONS

**Ukupno**: ~80 grešaka

#### Parameter types:
```
src/__tests__/setup.ts(21,37): Parameter 'query' implicitly has an 'any' type.
src/components/crew-card-view.tsx(152,31): Parameter 'e' implicitly has an 'any' type.
src/components/crew-member-details-dialog.tsx(730,36): Parameter 'range' implicitly has an 'any' type.
src/components/duty-roster/calendar-day-cell.tsx(483,28): Parameter 'open' implicitly has an 'any' type.
src/components/notification-settings-dialog.tsx(103,33): Parameter 'checked' implicitly has an 'any' type.
src/components/notification-settings-dialog.tsx(128,33): Parameter 'value' implicitly has an 'any' type.
src/components/pages/locations.tsx(208,40): Parameter 'g' implicitly has an 'any' type.
src/components/pages/locations.tsx(577,48): Parameter 'a' implicitly has an 'any' type.
src/components/ui/calendar.tsx(63,22): Binding element 'className' implicitly has an 'any' type.
src/components/ui/chart.tsx(182,23): Parameter 'item' implicitly has an 'any' type.
src/components/ui/sidebar.tsx(270,17): Parameter 'event' implicitly has an 'any' type.
```

#### Element access greške:
```
src/components/incoming-request-dialog.tsx(208,18): Element implicitly has an 'any' type because expression of type '"normal" | "low" | "emergency" | "urgent"' can't be used to index type...
src/components/pages/crew-list.tsx(184,20): Element implicitly has an 'any' type because expression of type '"color" | "email" | "name" | ...
```

---

### 4. Type Assignability greške - INCOMPATIBLE TYPES

**Ukupno**: ~60 grešaka

#### Status field type mismatches:

**CrewMember status**:
```
src/components/crew-member-details-dialog.tsx(252,14): Type 'string' is not assignable to type '"on-duty" | "off-duty" | "on-leave" | undefined'.
src/components/pages/crew-list.tsx(381,27): Type 'string' is not assignable to type '"active" | "on-duty" | "off-duty" | "on-leave" | undefined'.
```

**Guest type field**:
```
src/components/guest-card-view.tsx(40,12): Type '"primary"' is not comparable to type '"owner" | "vip" | "guest" | "partner" | "family"'.
src/components/guest-card-view.tsx(46,12): Type '"child"' is not comparable to type '"owner" | "vip" | "guest" | "partner" | "family"'.
src/components/guest-card-view.tsx(52,12): Type '"charter"' is not comparable to type '"owner" | "vip" | "guest" | "partner" | "family"'.
```

#### Priority field greške:
```
src/components/incoming-request-dialog.tsx(208,18): Property 'low' does not exist on type priority config object.
```

#### Missing required properties:
```
src/components/pages/crew-list.tsx(487,17): Property 'role' is missing in type.
src/components/pages/crew-list.tsx(672,47): Property 'date' is missing in type 'CrewMemberExtended' but required in type 'DutyInfo'.
```

#### Array type incompatibilities:
```
src/components/pages/duty-roster-tab.tsx(240,63): Type 'CrewMemberExtended[]' is not assignable to type 'CrewMember[]'.
```

#### WebSocket event listener greške:
```
src/hooks/useWebSocket.ts(273,35): Argument of type 'WebSocketEvents[K]' is not assignable...
src/hooks/useWebSocket.ts(277,39): Argument of type 'WebSocketEvents[K]' is not assignable...
```

#### Buffer type greške:
```
src/utils/registerServiceWorker.ts(161,7): Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'string | BufferSource | null | undefined'.
```

---

### 5. React Query / useOptimizedQuery greške

**Ukupno**: ~30 grešaka

#### Deprecated `cacheTime` property:
```
src/__tests__/utils/test-utils.tsx(17,9): 'cacheTime' does not exist in type 'QueryObserverOptions'.
src/hooks/useOptimizedQuery.ts(63,10): 'cacheTime' does not exist in type 'UndefinedInitialDataOptions'.
src/hooks/useOptimizedQuery.ts(86,10): 'cacheTime' does not exist in type 'UndefinedInitialDataOptions'.
src/hooks/useOptimizedQuery.ts(108,10): 'cacheTime' does not exist in type 'UndefinedInitialDataOptions'.
src/hooks/useOptimizedQuery.ts(157,10): 'cacheTime' does not exist in type 'UndefinedInitialDataOptions'.
```

**PROBLEM**: React Query v5 je zamenio `cacheTime` sa `gcTime`.

#### staleTime property greške:
```
src/hooks/useOptimizedQuery.ts(60,24): Property 'staleTime' does not exist on type '{}'.
src/hooks/useOptimizedQuery.ts(61,36): Property 'staleTime' does not exist on type '{}'.
```

---

### 6. Nekorišćene variable (TS6133) - DEAD CODE

**Ukupno**: ~100 grešaka

#### Najčešće nekorišćene varijable:

**Komponente/UI:**
- `React` - importovan ali ne koristi se (10+ fajlova)
- `Radio`, `Calendar`, `Clock`, `Battery` - Lucide ikone koje se ne koriste
- `Badge`, `Avatar`, `Switch`, `Separator` - UI komponente koje se ne koriste
- `toast` - importovan ali ne koristi se

**Hooks i funkcije:**
- `useEffect` - importovan ali ne koristi se
- `getCrewAvatarUrl` - deklarisan ali ne koristi se
- `can` - permission check funkcija koja se ne koristi

**State varijable:**
- `guests`, `crew`, `queryClient` - učitane ali nekorišćene
- `isLoading*` - različiti loading flag-ovi koji se ne koriste
- `showHistory`, `selectedCrewMember`, `playingAudio` - state koji se ne koristi

**Event handlers:**
- `handleSetOnLeave`, `handlePlayAudio` - definisani ali se ne pozivaju

**PRIMERI**:
```
src/components/app-sidebar.tsx(12,3): 'Radio' is declared but its value is never read.
src/components/button-simulator-widget.tsx(126,10): 'isTranscribing' is declared but its value is never read.
src/contexts/AppDataContext.tsx(298,9): 'wsConnected' is declared but its value is never read.
src/components/pages/service-requests.tsx(50,1): 'authService' is declared but its value is never read.
```

---

### 7. AppDataContext greške - NEDOSTAJU PROPERTIES

```
src/components/incoming-request-dialog.tsx(48,57): Property 'forwardServiceRequest' does not exist on type 'AppDataContextType'.
```

**PROBLEM**: Frontend očekuje funkciju `forwardServiceRequest` u context-u, ali ona nije definisana.

---

### 8. UI Component greške - SPECIFIČNE

#### Pagination duplicate property:
```
src/components/ui/pagination.tsx(75,7): 'size' is specified more than once, so this usage will be overwritten.
src/components/ui/pagination.tsx(92,7): 'size' is specified more than once, so this usage will be overwritten.
```

#### InputOTP slots property:
```
src/components/ui/input-otp.tsx(47,61): Property 'slots' does not exist on type '{}'.
```

#### Null assignment greške:
```
src/components/pages/locations.tsx(179,72): Type 'null' is not assignable to type 'string | undefined'.
src/components/pages/locations.tsx(198,62): Type 'null' is not assignable to type 'string | undefined'.
```

---

## TOP 10 NAJČEŠĆIH GREŠAKA

1. **Cannot find module '@radix-ui/...'** - 40+ ponavljanja
   - Svi Radix UI moduli imaju verziju u path-u koja sprečava TypeScript da ih pronađe

2. **Property 'color' is missing in type 'CrewMemberExtended'** - 20+ ponavljanja
   - `CrewMemberExtended` type nedostaje `color` property

3. **Type 'string' is not assignable to union type** - 15+ ponavljanja
   - Status fields koriste generičke stringove umesto union tipova

4. **Parameter '...' implicitly has an 'any' type** - 30+ ponavljanja
   - Event handlers i callback funkcije bez tipova parametara

5. **'...' is declared but its value is never read** (TS6133) - 100+ ponavljanja
   - Mnogo nekorišćenih importa i varijabli

6. **'cacheTime' does not exist** - 5 ponavljanja
   - React Query v5 migration problem (cacheTime → gcTime)

7. **Cannot find module 'vitest'** - 10+ ponavljanja u test fajlovima
   - Testing biblioteke nisu instalirane ili nisu konfigurisane

8. **Property does not exist on type 'Guest'** - 10+ ponavljanja
   - `Guest` type nedostaju: `name`, `email`, `phone`, `cabin` (kao objekat)

9. **Type 'CrewMemberExtended[]' is not assignable to 'CrewMember[]'** - 10+ ponavljanja
   - Structural type incompatibility

10. **Cannot find module 'lucide-react@0.487.0'** - 30+ ponavljanja
    - Isti problem kao Radix - verzija u path-u

---

## KRITIČNI FAJLOVI (više od 5 grešaka)

| Fajl | Broj grešaka | Kategorija problema |
|------|--------------|---------------------|
| `src/hooks/useOptimizedQuery.ts` | 15+ | React Query API breaking changes |
| `src/components/pages/crew-list.tsx` | 40+ | CrewMemberExtended type mismatch, implicit any |
| `src/components/pages/duty-roster-tab.tsx` | 20+ | CrewMemberExtended type mismatch |
| `src/components/pages/locations.tsx` | 15+ | Implicit any, null assignment |
| `src/components/pages/service-requests.tsx` | 20+ | Nekorišćene varijable |
| `src/components/ui/*.tsx` (svi) | 80+ | Missing module declarations (@radix-ui, lucide) |
| `src/components/__tests__/**` | 20+ | Missing test dependencies |
| `src/components/guest-card-view.tsx` | 10+ | Guest type mismatch |
| `src/components/button-simulator-dialog.tsx` | 8+ | Guest type mismatch |
| `src/hooks/useWebSocket.ts` | 10+ | WebSocket event type issues |
| `src/contexts/AppDataContext.tsx` | 12+ | Nekorišćene varijable |

---

## ROOT CAUSE ANALIZA

### 🔴 KRITIČNI PROBLEMI:

1. **Radix UI / Lucide imports sa verzijom u path-u**
   - **Uzrok**: Verovatno `package.json` ima verzije u dependency imenima ili exports nisu pravilno konfigurisani
   - **Uticaj**: Blokira ~80 grešaka u svim UI komponentama

2. **CrewMemberExtended vs CrewMember type mismatch**
   - **Uzrok**: Backend vraća `CrewMemberExtended` ali frontend očekuje `CrewMember`
   - **Uticaj**: ~50 grešaka širom aplikacije

3. **Guest type definition nepotpuna**
   - **Uzrok**: Frontend koristi `guest.name`, `guest.cabin`, `guest.email` ali type ih nema
   - **Uticaj**: ~15 grešaka

4. **React Query v5 breaking changes**
   - **Uzrok**: `cacheTime` → `gcTime` nije migriran
   - **Uticaj**: ~5 grešaka ali blokira hook koji se koristi svuda

---

## PREPORUKE ZA POPRAVKU (PRIORITET)

### 🔴 HIGH PRIORITY (mora se popraviti odmah)

1. **Popravi Radix UI / Lucide imports**
   - Proveri `package.json` dependency imena
   - Možda treba kreirati `tsconfig.paths` mapiranje

2. **Uskladi CrewMember type sa backend-om**
   - Dodaj `color`, `phone`, `onBoardContact`, `nickname`, `leaveStart`, `leaveEnd` u `CrewMemberExtended`
   - ILI prebaci sve na `CrewMember` ako backend zaista vraća kompletan tip

3. **Uskladi Guest type sa backend-om**
   - Dodaj `name`, `email`, `phone` u `Guest` type
   - Popravi `cabin` da bude objekat umesto stringa (ili obrnuto)

4. **Migruj React Query v5**
   - Zameni `cacheTime` sa `gcTime` u `useOptimizedQuery.ts`

### 🟡 MEDIUM PRIORITY

5. **Dodaj type annotations za sve implicit any**
   - Event handlers: `(e: React.MouseEvent)`, `(value: string)` itd.

6. **Ukloni nekorišćene imports**
   - Automatski sa `eslint --fix` ili ručno

7. **Dodaj `forwardServiceRequest` u AppDataContext**
   - Ili ukloni poziv ako nije potreban

### 🟢 LOW PRIORITY

8. **Instaliraj test dependencies**
   - `npm install -D vitest @testing-library/react @testing-library/jest-dom`

9. **Popravi UI component specifične greške**
   - Pagination duplicate `size`
   - InputOTP `slots` property

---

## SUMMARY

**Glavna dijagnoza**: Projekat ima **2-3 ROOT CAUSE problema** koji izazivaju većinu grešaka:

1. **Dependency import problem** (80 grešaka)
2. **Type definition mismatch između frontend-a i backend-a** (60+ grešaka)
3. **React Query outdated API** (5 grešaka ali kriticno)

Popravkom ova 3 problema, broj grešaka bi se smanjio sa ~350 na ~100.

Preostale greške su uglavnom "code quality" (nekorišćene varijable, implicit any) koje ne blokiraju funkcionalnost ali otežavaju maintenance.
