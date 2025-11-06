# 🎯 SERVICE REQUESTS MASTER PLAN

**Datum:** 2025-11-06
**Status:** FAZA 1 ✅ COMPLETE | Faze 2-4 READY FOR IMPLEMENTATION
**Pristup:** Minimalne izmene, Baby Steps, Ne kvariti što radi

---

## 📋 EXECUTIVE SUMMARY

**Problem:** Service Requests sistem ima VELIKU nesinhronizaciju podataka između komponenti.

**Reference Implementation:** `incoming-request-dialog.tsx` (Pop-up window) - **OVO JE ISPRAVNO!**

**Problem Components:**
- Service Requests Page - pokazuje različite podatke
- Activity Log - prikazuje samo button presses
- Dashboard Serving Now Widget - inconsistent data
- AppDataContext - double transformation layer (GLAVNI PROBLEM)

---

## 🔍 DETALJNO POREĐENJE: POP-UP vs PAGE

### 1. DATA SOURCE

| Component | Data Source | Status |
|-----------|-------------|--------|
| **Pop-up (CORRECT)** | `useServiceRequestsApi()` | ✅ Direct API |
| **Service Requests Page** | `useServiceRequestsApi()` + `useAppData()` | ❌ MIXED sources |
| **Dashboard Widget** | `useAppData().serviceRequests` | ❌ Transformed data |
| **Activity Log** | `useActivityLog()` | ⚠️ Incomplete |

**PROBLEM:** AppDataContext.tsx (lines 343-375) transformiše API podatke DRUGI PUT:
```typescript
// AppDataContext RE-COMPUTES data that's already computed!
{
  id,
  guestName: guest ? `${guest.firstName} ${guest.lastName}` : apiReq.guestName,  // ❌ RE-COMPUTE
  guestCabin: location?.name ?? apiReq.guestCabin,  // ❌ RE-COMPUTE
  requestType: apiReq.priority === 'emergency' ? 'emergency' : 'call',  // ❌ CHANGES TYPE!
  priority: apiReq.priority === 'low' ? 'normal' : apiReq.priority,  // ❌ CHANGES VALUE
  // ❌ LOSES category, assignedToId, acceptedAt, etc.
}
```

---

### 2. CREW LIST DROPDOWN

| Component | Crew List Implementation | Status |
|-----------|--------------------------|--------|
| **Pop-up (CORRECT)** | Full crew list: on-duty + available (Lines 385-449) | ✅ Complete |
| **Service Requests Page** | ❌ DOES NOT EXIST | ❌ Missing |

**Pop-up kod (CORRECT):**
```typescript
// Lines 385-393: Filters crew members
const onDutyCrew = crewData?.filter(member => member.duty?.status === 'on-duty') || [];
const availableCrew = crewData?.filter(member =>
  member.duty?.status !== 'on-duty' &&
  member.duty?.status !== 'off-duty' &&
  member.duty?.status !== 'leave'
) || [];
const crewOptions = [...onDutyCrew, ...availableCrew];

// Lines 396-449: Renders dropdown with avatars
<Select value={assignedTo} onValueChange={setAssignedTo}>
  {/* Full crew list with photos */}
</Select>
```

**Service Requests Page:**
- Uses forward dropdown with CATEGORIES, not crew members (Lines 823-850)
- No crew assignment dropdown at all!

---

### 3. FORWARD FUNCTIONALITY

| Component | Forward Options | Status |
|-----------|-----------------|--------|
| **Pop-up (CORRECT)** | 8 teams with icons (Front Desk, Housekeeping, etc.) | ✅ Teams |
| **Service Requests Page** | Service categories from API | ❌ Categories |

**Pop-up kod (CORRECT - Lines 56-65):**
```typescript
const forwardOptions = [
  { value: 'Front Desk', icon: Users },
  { value: 'Housekeeping', icon: Shirt },
  { value: 'Maintenance', icon: Wrench },
  { value: 'Concierge', icon: Briefcase },
  { value: 'F&B', icon: UtensilsCrossed },
  { value: 'Spa', icon: Sparkles },
  { value: 'Security', icon: Shield },
  { value: 'Management', icon: Users }
];
```

**Service Requests Page (WRONG - Lines 823-850):**
```typescript
const { data: categoriesData } = useQuery({
  queryKey: ['service-categories'],
  queryFn: () => fetch('/api/service-categories').then(r => r.json()),
});

// Uses API categories, not teams!
```

---

### 4. VOICE TRANSCRIPT PARSING

| Component | Voice Transcript Handling | Status |
|-----------|---------------------------|--------|
| **Pop-up (CORRECT)** | Parses duration from transcript (Lines 296-335) | ✅ Full parsing |
| **Service Requests Page** | Shows raw transcript text | ❌ No parsing |

**Pop-up kod (CORRECT - Lines 296-335):**
```typescript
// Extracts duration like "(2:34)" from transcript
const durationMatch = request.transcript?.match(/\((\d+:\d+)\)/);
const duration = durationMatch ? durationMatch[1] : null;
const displayTranscript = request.transcript?.replace(/\(\d+:\d+\)/, '').trim();
```

**Service Requests Page:**
```typescript
// Lines 614-626: Just shows raw transcript
<p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.transcript}</p>
```

---

### 5. ACTIVITY LOG

| Log Type | What Shows | Status |
|----------|-----------|--------|
| **Button Press** | "Call Button pressed at Main Deck - Port" | ✅ Works |
| **Request Created** | ❌ DOES NOT EXIST | ❌ Missing |
| **Request Accepted** | ❌ DOES NOT EXIST | ❌ Missing |
| **Request Completed** | ✅ Shows in service_request logs | ✅ Works |

**Backend problem (database.ts):**
```typescript
// Lines 667-693: Button press creates DEVICE activity log ✅
await prisma.activityLog.create({
  data: {
    activityType: 'device',
    category: 'button_press',
    // ...
  }
});

// Lines 542-561: Completion creates SERVICE_REQUEST log ✅
await prisma.activityLog.create({
  data: {
    activityType: 'service_request',
    category: 'completed',
    // ...
  }
});

// ❌ MISSING: No activity log when request CREATED or ACCEPTED!
```

---

## 🎯 PRIORITIZOVANI PLAN FIXOVA

### FASE 1: FIX ACTIVITY LOG (Low Risk) ✅ PRIORITET #1

**Zašto prvo:** Smallest change, isolated, won't break existing code.

**Promene:**
1. Backend: `database.ts` - dodati activity log u `createServiceRequest()` funkciju
2. Backend: `database.ts` - dodati activity log u `acceptServiceRequest()` funkciju

**Risk:** 🟢 **NIZAK** - samo dodavanje novih log entries, ne menja postojeću logiku

**Files:**
- `backend/src/services/database.ts` - Add 2 activity log creations

**Kod za dodavanje:**
```typescript
// U createServiceRequest() funkciji nakon line 485:
await prisma.activityLog.create({
  data: {
    activityType: 'service_request',
    category: 'created',
    message: `Service request created: ${priorityLabel} priority${guestName ? ` from ${guestName}` : ''}`,
    metadata: {
      requestId: newRequest.id,
      priority: newRequest.priority,
      locationId: newRequest.locationId,
      guestId: newRequest.guestId,
      category: newRequest.category
    },
    userId: newRequest.createdById
  }
});

// U acceptServiceRequest() funkciji nakon line 528:
await prisma.activityLog.create({
  data: {
    activityType: 'service_request',
    category: 'accepted',
    message: `${crewMember.name} accepted service request${guestName ? ` from ${guestName}` : ''}`,
    metadata: {
      requestId: serviceRequest.id,
      crewMemberId: crewMember.id,
      priority: serviceRequest.priority,
      locationId: serviceRequest.locationId
    },
    userId: crewMemberId
  }
});
```

**Test Plan:**
1. Create new service request → Check activity log shows "created"
2. Accept service request → Check activity log shows "accepted"
3. Complete service request → Verify existing "completed" log still works

---

### FASE 2: FIX VOICE TRANSCRIPT PARSING (Low Risk) ✅ PRIORITET #2

**Zašto:** Easy fix, isolated component change, improves UX.

**Promene:**
1. Frontend: `service-requests.tsx` - Add transcript parsing function from pop-up

**Risk:** 🟢 **NIZAK** - samo display logic, ne menja data

**Files:**
- `src/components/pages/service-requests.tsx` - Add parsing (10 lines)

**Kod za dodavanje (Lines 614-626 area):**
```typescript
// Add helper function at top of component:
const parseTranscript = (transcript: string | null) => {
  if (!transcript) return { display: null, duration: null };
  const durationMatch = transcript.match(/\((\d+:\d+)\)/);
  const duration = durationMatch ? durationMatch[1] : null;
  const display = transcript.replace(/\(\d+:\d+\)/, '').trim();
  return { display, duration };
};

// Use it in render:
const { display: transcriptText, duration } = parseTranscript(request.transcript);

// Render:
{transcriptText && (
  <div>
    <p>{transcriptText}</p>
    {duration && <span className="text-xs">Duration: {duration}</span>}
  </div>
)}
```

**Test Plan:**
1. Create request with voice transcript containing "(2:34)"
2. Verify Service Requests page shows parsed transcript + duration
3. Verify pop-up still works

---

### FASE 3: ADD CREW DROPDOWN TO SERVICE REQUESTS PAGE (Medium Risk) ⚠️ PRIORITET #3

**Zašto:** Adds missing functionality, moderate complexity.

**Promene:**
1. Frontend: `service-requests.tsx` - Copy crew dropdown logic from pop-up

**Risk:** 🟡 **SREDNJI** - novi UI element, treba testirati assign logiku

**Files:**
- `src/components/pages/service-requests.tsx` - Add crew dropdown (50 lines)

**Kod za dodavanje:**
1. Copy lines 385-449 from `incoming-request-dialog.tsx` (crew filtering + dropdown)
2. Add to Service Requests page "Assign" column/button
3. Wire up to existing `assignServiceRequest` mutation

**Test Plan:**
1. Open Service Requests page
2. Click "Assign" on request
3. Verify dropdown shows on-duty crew first, then available crew
4. Assign to crew member → Verify WebSocket updates all clients
5. Verify activity log shows assignment

---

### FASE 4: FIX FORWARD FUNCTIONALITY (Medium Risk) ⚠️ PRIORITET #4

**Zašto:** Aligns page with pop-up reference, but affects existing dropdown.

**Promene:**
1. Frontend: `service-requests.tsx` - Replace categories dropdown with teams dropdown

**Risk:** 🟡 **SREDNJI** - menja postojeći dropdown, treba careful testing

**Files:**
- `src/components/pages/service-requests.tsx` - Replace forward dropdown (Lines 823-850)

**Kod promene:**
```typescript
// REPLACE Lines 823-850

// OLD (remove):
const { data: categoriesData } = useQuery({
  queryKey: ['service-categories'],
  queryFn: () => fetch('/api/service-categories').then(r => r.json()),
});

// NEW (use teams from pop-up):
const forwardOptions = [
  { value: 'Front Desk', icon: Users },
  { value: 'Housekeeping', icon: Shirt },
  { value: 'Maintenance', icon: Wrench },
  { value: 'Concierge', icon: Briefcase },
  { value: 'F&B', icon: UtensilsCrossed },
  { value: 'Spa', icon: Sparkles },
  { value: 'Security', icon: Shield },
  { value: 'Management', icon: Users }
];
```

**Test Plan:**
1. Open Service Requests page
2. Click "Forward" on request
3. Verify dropdown shows 8 teams with icons (same as pop-up)
4. Forward to team → Verify backend accepts team name
5. Verify activity log shows forward action

---

### FASE 5: REMOVE DOUBLE TRANSFORMATION (High Risk) 🔴 PRIORITET #5 - PAŽLJIVO!

**Zašto:** Eliminates root cause of data inconsistencies, BUT high risk of breaking things.

**Problem:** `AppDataContext.tsx` (Lines 343-375) transformiše API data DRUGI PUT.

**Risk:** 🔴 **VISOK** - može da pokvari sve komponente koje koriste `useAppData()`

**Odluka:** **ODLOŽITI ZA KASNIJE!** Prvo uraditi Faze 1-4, pa tek onda ovo.

**Razlog odlaganja:**
- Faze 1-4 fixuju immediate probleme sa minimalnim rizikom
- AppDataContext refactor je BIG CHANGE - treba posebna pažnja
- Može da sačeka dok ne testiramo Faze 1-4

**Kada uraditi:**
- Nakon što su Faze 1-4 testirane i stabilne
- Kreirati POSEBAN dokument za AppDataContext refactor plan
- Testirati na dev environment pre production

---

## 📊 RISK ASSESSMENT SUMMARY

| Faza | Risk Level | Impact | Complexity | Priority |
|------|-----------|--------|------------|----------|
| **Faza 1: Activity Log** | 🟢 Low | High | Low | #1 - Start here |
| **Faza 2: Voice Parsing** | 🟢 Low | Medium | Low | #2 |
| **Faza 3: Crew Dropdown** | 🟡 Medium | High | Medium | #3 |
| **Faza 4: Forward Teams** | 🟡 Medium | Medium | Medium | #4 |
| **Faza 5: Remove Double Transform** | 🔴 High | High | High | #5 - POSTPONE |

---

## ✅ IMPLEMENTATION CHECKLIST

### Pre implementacije:
- [ ] Pročitaj OBEDIO-CONSOLIDATED-RULES-FOR-AI.md
- [ ] Testiraj da sve trenutno radi
- [ ] Napravi git branch za svaku fazu

### Faza 1: Activity Log ✅ COMPLETE
- [x] Dodaj activity log u `createServiceRequest()` (backend/src/services/database.ts)
- [x] Dodaj activity log u `acceptServiceRequest()` (backend/src/services/database.ts)
- [x] Testiraj sa curl/Postman: Create request → Check activity log
- [x] Testiraj sa curl/Postman: Accept request → Check activity log
- [x] Fix API response structure (backend/src/routes/activity-logs.ts)
- [x] Testiraj frontend: Activity Log page shows new entries
- [x] Git commit 1: "Fix: Add activity log for service request created and accepted events" (e0d6c58)
- [x] Git commit 2: "Fix: Activity Log API response structure + Remove debug logging" (c53f3f6)

### Faza 2: Voice Transcript Parsing
- [ ] Dodaj `parseTranscript()` helper u service-requests.tsx
- [ ] Update transcript display to use parsed data
- [ ] Testiraj: Request sa transcript "(2:34)" → Page shows parsed
- [ ] Testiraj: Pop-up still works
- [ ] Git commit: "Add voice transcript parsing to Service Requests page"

### Faza 3: Crew Dropdown
- [ ] Copy crew filtering logic iz incoming-request-dialog.tsx
- [ ] Dodaj crew dropdown u Service Requests page
- [ ] Wire up assign mutation
- [ ] Testiraj: Dropdown shows on-duty + available crew
- [ ] Testiraj: Assign crew member → WebSocket updates
- [ ] Testiraj: Activity log shows assignment
- [ ] Git commit: "Add crew assignment dropdown to Service Requests page"

### Faza 4: Forward Teams
- [ ] Replace categories dropdown sa teams dropdown
- [ ] Testiraj: Forward shows 8 teams sa icons
- [ ] Testiraj: Forward action → Backend accepts
- [ ] Testiraj: Activity log shows forward
- [ ] Git commit: "Replace forward categories with teams (match pop-up reference)"

### Faza 5: Double Transformation (LATER)
- [ ] Kreirati POSEBAN dokument za plan
- [ ] Testirati na dev environment
- [ ] (TBD - odloženo za kasnije)

---

## 🎓 LESSONS LEARNED

1. **Pop-up window je CORRECT reference** - koristiti kao template
2. **AppDataContext double transformation je ROOT CAUSE** - ali high risk za fix
3. **Baby steps pristup:** Faze 1-2 su low risk, start there
4. **Activity log je NAJLAKŠI fix** - start with this
5. **Forward teams vs categories** - pop-up koristi teams, page koristi categories - needs alignment

---

## 📝 NOTES ZA CLAUDE CODE

**Kada radiš na ovome:**

1. **Faza 1 (Activity Log) je PRVI zadatak** - najmanji risk, najveći impact
2. **Testiraj SVAKI fix** pre nego što ideš na sledeći
3. **Git commit nakon SVAKE faze** - baby steps!
4. **NE DIRAJ Fazu 5** bez special approval - high risk!
5. **Prati OBEDIO-CONSOLIDATED-RULES-FOR-AI.md** - minimalne izmene!

**Reference files:**
- CORRECT: `incoming-request-dialog.tsx` (copy logic from here)
- FIX: `service-requests.tsx` (apply fixes here)
- FIX: `database.ts` (add activity logs)

---

## 📝 IMPLEMENTATION SUMMARY

### ✅ FAZA 1: ACTIVITY LOG - COMPLETED 2025-11-06

**PROBLEM DIAGNOSED:**
1. Backend was creating activity logs correctly ✅
2. API endpoint returned data correctly ✅
3. **BUT** API response structure didn't match frontend expectations ❌

**ROOT CAUSE:**
- Backend used `apiSuccess(result.items, pagination)` which sent: `{ success: true, data: [array], pagination }`
- `fetchApi()` unwrapped to just `[array]`, losing pagination field
- Frontend hook expected: `{ items: [...], pagination: {...} }`
- Result: Frontend received `[array]` but tried to access `[array].items` → `undefined`!

**FIX APPLIED:**
```typescript
// backend/src/routes/activity-logs.ts
const response = {
  items: result.items,
  pagination: buildPaginationMeta(result.total, result.page, result.limit)
};
res.json(apiSuccess(response));
```

**FILES CHANGED:**
1. `backend/src/services/database.ts` (Lines 462-484, 504-526)
   - Added activity log creation in `createServiceRequest()`
   - Added activity log creation in `acceptServiceRequest()`

2. `backend/src/routes/activity-logs.ts` (Lines 11-21)
   - Fixed API response structure to wrap items + pagination

3. `src/services/api.ts` (Lines 840-849)
   - Fixed URLSearchParams to filter out undefined values

4. `src/components/pages/activity-log.tsx`
   - Removed debug console.log statements

**COMMITS:**
1. `e0d6c58` - Fix: Add activity log for service request created and accepted events
2. `c53f3f6` - Fix: Activity Log API response structure + Remove debug logging

**TESTING COMPLETED:**
- ✅ Backend creates "Request Created" activity log
- ✅ Backend creates "Request Accepted" activity log
- ✅ API returns correct structure: `{ items: [...], pagination: {...} }`
- ✅ Frontend displays all activity logs in Activity Log page
- ✅ Service Requests tab shows: Button Press + Request Created + Request Accepted + Request Completed

**RESULT:** Service Request activity logs now fully functional! 🎉

---

**STATUS:** ✅ FAZA 1 COMPLETE | Faze 2-4 READY

**NEXT STEP:** Start Faza 2 (Voice Transcript Parsing) when ready.
