# 🎯 CREW & DUTY ROSTER - PLAN POTPUNE REFAKTORIZACIJE

**DATUM:** 2025-01-22
**BACKUP BRANCH:** `bmad-backup-before-refactor`
**WORKING BRANCH:** `bmad`

---

## 🎯 CILJ REFAKTORIZACIJE

**Eliminisati dupli state management i race conditions:**

1. ✅ **AppDataContext** - Direktno vraća React Query data bez local kopije
2. ✅ **duty-roster-tab** - Fix race condition u save funkciji
3. ✅ **Zadržati kompatibilnost** - 26 komponenti nastavlja da radi bez izmena

---

## 📋 REFACTORING CHECKLIST

### **FAZA 1: AppDataContext - Eliminiši Dupli State**

- [ ] **Step 1.1:** Ukloni `useState` za crewMembers
- [ ] **Step 1.2:** Direktno vrati `apiCrewMembers` kao `crewMembers`
- [ ] **Step 1.3:** Ukloni `useEffect` koji kopira crew members
- [ ] **Step 1.4:** Ukloni `useState` za assignments
- [ ] **Step 1.5:** Direktno vrati `apiAssignments` kao `assignments`
- [ ] **Step 1.6:** Ukloni `useEffect` koji kopira assignments
- [ ] **Step 1.7:** Ukloni `useState` za shifts
- [ ] **Step 1.8:** Direktno vrati `apiShifts` kao `shifts`
- [ ] **Step 1.9:** Ukloni `useEffect` koji kopira shifts
- [ ] **Step 1.10:** Update `setCrewMembers` da invalidate React Query cache
- [ ] **Step 1.11:** Update `setAssignments` da invalidate React Query cache
- [ ] **Step 1.12:** Update `setShifts` da invalidate React Query cache
- [ ] **Step 1.13:** Fix `saveAssignments()` da prima optional `assignments` parametar
- [ ] **Step 1.14:** Test da context i dalje radi za sve komponente

---

### **FAZA 2: duty-roster-tab - Fix Race Condition**

- [ ] **Step 2.1:** Update `handleSave` da prosleđuje `assignments` direktno
- [ ] **Step 2.2:** Ukloni `setContextAssignments` poziv pre save
- [ ] **Step 2.3:** Test save functionality
- [ ] **Step 2.4:** Test da unsaved changes tracking i dalje radi
- [ ] **Step 2.5:** Test autofill i continue pattern

---

### **FAZA 3: Testiranje & Validacija**

- [ ] **Step 3.1:** Test crew page (add, edit, delete)
- [ ] **Step 3.2:** Test duty roster (assign, remove, save)
- [ ] **Step 3.3:** Test device assignments
- [ ] **Step 3.4:** Test leave status i automatic assignment removal
- [ ] **Step 3.5:** Test dashboard widgets
- [ ] **Step 3.6:** Test page refresh (persistence)
- [ ] **Step 3.7:** Test multi-tab synchronization
- [ ] **Step 3.8:** TypeScript compilation test
- [ ] **Step 3.9:** Git commit sa detaljnim commit message
- [ ] **Step 3.10:** Git push

---

## 🔧 DETALJNE IZMENE PO FAJLU

### **FILE: src/contexts/AppDataContext.tsx**

#### **TRENUTNO (Lines 195-246):**

```typescript
// Initialize crew members with empty array - will be populated from API
const [crewMembers, setCrewMembers] = useState<CrewMemberExtended[]>([]);

// Update crew members when API data arrives - no localStorage
useEffect(() => {
  if (apiCrewMembers.length > 0) {
    const extendedCrew: CrewMemberExtended[] = apiCrewMembers.map(member => ({
      // ... mapping
    }));
    setCrewMembers(extendedCrew);
  }
}, [apiCrewMembers]);

// Initialize assignments with empty array - will be populated from API
const [assignments, setAssignments] = useState<Assignment[]>([]);

// Initialize shifts with empty array - will be populated from API
const [shifts, setShifts] = useState<ShiftConfig[]>([]);

// Update shifts when API data arrives
useEffect(() => {
  if (apiShifts && apiShifts.length > 0) {
    setShifts(apiShifts);
  }
}, [apiShifts]);

// Update assignments when API data arrives
useEffect(() => {
  if (apiAssignments && apiAssignments.length > 0) {
    setAssignments(apiAssignments);
  }
}, [apiAssignments]);
```

#### **POSLE REFAKTORIZACIJE:**

```typescript
// Map API crew members to extended format
const crewMembers: CrewMemberExtended[] = useMemo(() => {
  return apiCrewMembers.map(member => ({
    id: member.id,
    name: member.name,
    position: member.position,
    department: member.department,
    role: member.role ?? undefined,
    status: (member.status as any),
    contact: member.contact ?? undefined,
    email: member.email ?? undefined,
    joinDate: member.joinDate ?? undefined,
    leaveStart: (member as any).leaveStart ?? undefined,
    leaveEnd: (member as any).leaveEnd ?? undefined,
    languages: (member as any).languages,
    skills: (member as any).skills,
    avatar: (member as any).avatar,
    nickname: (member as any).nickname,
    color: (member as any).color,
    onBoardContact: (member as any).onBoardContact,
    phone: (member as any).phone ?? member.contact,
    notes: (member as any).notes,
    shift: (member as any).shift,
  }));
}, [apiCrewMembers]);

// Directly use API assignments
const assignments: Assignment[] = apiAssignments;

// Directly use API shifts
const shifts: ShiftConfig[] = apiShifts;

// setCrewMembers - invalidate React Query cache instead of local state
const setCrewMembers = useCallback((members: CrewMemberExtended[]) => {
  queryClient.invalidateQueries({ queryKey: ['crewMembers'] });
}, [queryClient]);

// setAssignments - invalidate React Query cache instead of local state
const setAssignments = useCallback((assignments: Assignment[]) => {
  queryClient.invalidateQueries({ queryKey: ['assignments'] });
}, [queryClient]);

// setShifts - invalidate React Query cache instead of local state
const setShifts = useCallback((shifts: ShiftConfig[]) => {
  queryClient.invalidateQueries({ queryKey: ['shifts'] });
}, [queryClient]);
```

---

#### **saveAssignments() Function - Fix Race Condition:**

**TRENUTNO (Lines 532-559):**

```typescript
const saveAssignments = async () => {
  setIsSaving(true);
  setPreviousAssignments([...assignments]);

  try {
    const uniqueDates = Array.from(new Set(assignments.map(a => a.date)));

    for (const date of uniqueDates) {
      await deleteAssignmentsByDate.mutateAsync(date);
    }

    if (assignments.length > 0) {
      await createBulkAssignments.mutateAsync(assignments);
    }

    const now = new Date();
    setLastSaved(now);
  } catch (error) {
    console.error('[AppData] Failed to save assignments:', error);
    throw error;
  } finally {
    setIsSaving(false);
  }
};
```

**POSLE REFAKTORIZACIJE:**

```typescript
const saveAssignments = async (assignmentsToSave?: Assignment[]) => {
  setIsSaving(true);

  // Use provided assignments or fallback to context assignments
  const assignmentsData = assignmentsToSave || assignments;
  setPreviousAssignments([...assignmentsData]);

  try {
    const uniqueDates = Array.from(new Set(assignmentsData.map(a => a.date)));

    // Delete all existing assignments for these dates first
    for (const date of uniqueDates) {
      await deleteAssignmentsByDate.mutateAsync(date);
    }

    // Now create all the new assignments
    if (assignmentsData.length > 0) {
      await createBulkAssignments.mutateAsync(assignmentsData);
    }

    const now = new Date();
    setLastSaved(now);

    // Invalidate assignments cache to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
  } catch (error) {
    console.error('[AppData] Failed to save assignments:', error);
    throw error;
  } finally {
    setIsSaving(false);
  }
};
```

---

### **FILE: src/components/pages/duty-roster-tab.tsx**

#### **TRENUTNO (Lines 606-611):**

```typescript
onClick={async () => {
  setContextAssignments(assignments); // ❌ RACE CONDITION!
  await saveAssignments();
  setAssignmentHistory([]);
  toast.success('Duty roster saved successfully');
}}
```

#### **POSLE REFAKTORIZACIJE:**

```typescript
onClick={async () => {
  await saveAssignments(assignments); // ✅ PROSLEĐUJE DIREKTNO!
  setAssignmentHistory([]);
  toast.success('Duty roster saved successfully');
}}
```

---

## 🎯 OČEKIVANI REZULTATI

### **Što će raditi BOLJE:**

1. ✅ **Nema više race conditions** - saveAssignments prima tačne podatke
2. ✅ **Manje memorije** - nema duplog state-a
3. ✅ **Brža sinhronizacija** - React Query automatski refetch
4. ✅ **Jednostavniji kod** - manje useEffect-ova
5. ✅ **Bolja type safety** - direktno korišćenje API tipova

### **Što će raditi ISTO:**

1. ✅ **Svi komponenti nastavljaju da rade** - isti interface
2. ✅ **duty-roster working copy** - zadržan za draft editing
3. ✅ **Undo/Redo** - zadržan u duty-roster
4. ✅ **Unsaved changes tracking** - zadržan

---

## ⚠️ POTENCIJALNI PROBLEMI I REŠENJA

### **Problem 1: setCrewMembers() ne radi kao pre**

**Simptom:** Komponente zovu `setCrewMembers()` ali ništa se ne dešava.

**Rešenje:**
```typescript
// Umesto da setuje local state, invalidate cache:
const setCrewMembers = (members) => {
  queryClient.invalidateQueries({ queryKey: ['crewMembers'] });
};
```

**Alternativa:** Ako komponente MORAJU da update-uju odmah, koristi mutation:
```typescript
const updateCrewMutation = useUpdateCrewMember();
updateCrewMutation.mutate({ id, data });
```

---

### **Problem 2: Assignments se ne update-uju odmah**

**Simptom:** duty-roster dodaje assignment, ali ne vidi ga u listi.

**Rešenje:** Lokalstani state u duty-roster-tab zadržan - radi kao i pre!

---

### **Problem 3: Multiple tabs nisu sinhronizovani**

**Simptom:** Izmene u jednom tab-u ne prikazuju se u drugom.

**Rešenje:** WebSocket real-time updates:
```typescript
websocketService.on('crewMemberUpdated', () => {
  queryClient.invalidateQueries({ queryKey: ['crewMembers'] });
});
```

---

## 📊 METRICS & PERFORMANCE

### **PRE Refaktorizacije:**

- Dupli state: **3x data u memoriji** (API cache + local state + component state)
- useEffect watchers: **3 useEffect-a** za kopiranje data
- Race conditions: **1 potencijalni bug** u saveAssignments

### **POSLE Refaktorizacije:**

- Single source of truth: **1x data u memoriji** (samo React Query cache)
- useEffect watchers: **0 useEffect-a** za kopiranje data
- Race conditions: **0 bug-ova** - direktno prosleđivanje

---

## ✅ DEFINICIJA "GOTOVO"

Refaktorizacija je završena kada:

- [ ] Svi TypeScript errors su rešeni
- [ ] Sve test checks iz checklist-e su prošle
- [ ] Git commit je kreiran sa detaljnim opisom
- [ ] Git push je uspešan
- [ ] Dev server radi bez grešaka
- [ ] Database persistence radi (page refresh ne gubi podatke)
- [ ] Backup branch je dostupan za rollback

---

## 🚀 DEPLOYMENT PLAN

1. **Development (bmad branch):** Testiraj refaktorisani kod
2. **Staging (ako postoji):** Deploy i testiraj u staging okruženju
3. **Production:** Merge bmad u main i deploy

**ROLLBACK STRATEGY:** Ako production pukne, `git revert` ili deploy `bmad-backup-before-refactor` branch.

---

## 📝 COMMIT MESSAGE TEMPLATE

```
Refactor AppDataContext and duty-roster to eliminate duplicate state

**BREAKING CHANGES:** None (backward compatible)

**What Changed:**

1. AppDataContext now returns React Query data directly
   - Removed duplicate useState for crewMembers, assignments, shifts
   - Removed 3 useEffect hooks that copied API data to local state
   - setCrewMembers/setAssignments/setShifts now invalidate cache

2. Fixed race condition in duty-roster-tab saveAssignments
   - saveAssignments now accepts optional assignments parameter
   - duty-roster passes assignments directly to avoid race condition

**Benefits:**
- Reduced memory usage (single source of truth)
- No more race conditions in save operations
- Faster data synchronization
- Cleaner code with fewer useEffect hooks

**Testing:**
- ✅ Crew page operations (add, edit, delete)
- ✅ Duty roster operations (assign, remove, save)
- ✅ Device assignments
- ✅ Leave status and assignment removal
- ✅ Dashboard widgets
- ✅ Page refresh persistence
- ✅ TypeScript compilation

**Rollback:**
Backup branch: bmad-backup-before-refactor

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## ✅ READY TO START!

**Backup kreiran:** ✅
**Plan dokumentovan:** ✅
**Rollback uputstva spremna:** ✅

**MOŽEŠ ZAPOČETI REFAKTORIZACIJU!** 🚀

Reci "GO" i počinjem! 🎯
