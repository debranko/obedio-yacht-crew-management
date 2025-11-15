# 🧪 CREW STRANICA - TEST PROMPT

Kopirati ovaj prompt u novi chat za testiranje Crew stranice.

---

## CONTEXT

U prethodnoj sesiji sam kompletirao backend integraciju za **Crew stranicu**. Sve frontend-only operacije sada rade preko backend API-ja i PostgreSQL baze podataka.

---

## ŠTA JE URAĐENO

### 1. **Device Assignment Backend Integration**
**Fajl:** `src/components/crew-member-details-dialog.tsx` (linije 102-147)

**Izmene:**
- `handleAssignDevice` sada poziva `updateDevice` mutation
- Postavlja `crewMemberId` u bazi podataka
- Automatski refetch-uje listu uređaja nakon dodele
- Održava backward compatibility sa AppDataContext

**Backend API:** `PUT /api/devices/:id` sa `{ crewMemberId: "..." }`

### 2. **Device Removal Backend Integration**
**Fajl:** `src/components/crew-member-details-dialog.tsx` (linije 149-180)

**Izmene:**
- `handleRemoveDevice` sada poziva `updateDevice` mutation
- Postavlja `crewMemberId: null` u bazi
- Automatski refetch-uje listu uređaja

**Backend API:** `PUT /api/devices/:id` sa `{ crewMemberId: null }`

### 3. **Crew Status Updates Backend Integration**
**Fajl:** `src/components/pages/crew-list.tsx` (linije 352-367, 423-438)

**Izmene:**
- `handleConfirmRemoval` sada poziva `updateCrewMutation.mutate`
- `handleConfirmActivation` sada poziva `updateCrewMutation.mutate`
- Status se čuva u bazi umesto samo u context-u

**Backend API:** `PUT /api/crew/:id` sa `{ status: "on-duty" | "off-duty" }`

### 4. **Duty Roster Assignments Persistence Fix (KRITIČNO!)**
**Fajl:** `src/contexts/AppDataContext.tsx` (linije 716-743)

**Izmene:**
- Dodao import `useDeleteAssignmentsByDate`
- Implementirao "delete-then-create" pattern u `saveAssignments` funkciji
- Sada prvo briše sve assignments za date, pa kreira nove
- Ovo rešava problem gde se obrisani assignments nisu brisali iz baze

**Backend API:**
- `DELETE /api/assignments/by-date/:date` - Briše sve za datum
- `POST /api/assignments/bulk` - Kreira nove

**Kod:**
```typescript
// Get all unique dates from assignments
const uniqueDates = Array.from(new Set(assignments.map(a => a.date)));

// Delete all existing assignments for these dates first
for (const date of uniqueDates) {
  await deleteAssignmentsByDate.mutateAsync(date);
}

// Now create all the new assignments
if (assignments.length > 0) {
  await createBulkAssignments.mutateAsync(assignments);
}
```

---

## IZMENJENI FAJLOVI (3 UKUPNO)

1. ✅ `src/components/crew-member-details-dialog.tsx`
2. ✅ `src/components/pages/crew-list.tsx`
3. ✅ `src/contexts/AppDataContext.tsx`

---

## TESTNI PLAN

Molim te da:

1. **Pokreneš aplikaciju** (http://localhost:5173)
2. **Uloguj se** kao admin
3. **Testiraj sve funkcionalnosti** ispod
4. **Proveri persistence** nakon refresh-a
5. **Reportuj sve bugove** ako ih nađeš

---

## ✅ TEST CHECKLIST

### 📱 **Device Assignment Tests**

**Test 1.1: Assign Device to Crew Member**
1. Otvori crew member details dialog
2. Klikni "Select a device" dropdown
3. Odaberi slobodan sat (npr. "Maria Garcia's Watch")
4. Klikni "Assign"
5. ✅ **Očekivano:** Toast "Watch assigned to [Name]"
6. ✅ **Očekivano:** Sat se pojavljuje u "Current Device" sekciji
7. Refresh stranicu (F5)
8. ✅ **Očekivano:** Sat je i dalje dodeljen (persistence)

**Test 1.2: Device Appears in Dropdown Only Once**
1. Otvori crew member A details
2. Assign "Maria Garcia's Watch"
3. Zatvori dialog
4. Otvori crew member B details
5. ✅ **Očekivano:** "Maria Garcia's Watch" NE pojavljuje se u dropdown-u

**Test 1.3: Remove Device from Crew Member**
1. Otvori crew member koji ima dodeljen sat
2. U "Current Device" sekciji, klikni "Remove Device"
3. ✅ **Očekivano:** Toast "Watch removed from [Name]"
4. ✅ **Očekivano:** "Current Device" sekcija prazna
5. Otvori drugi crew member
6. ✅ **Očekivano:** Sat se ponovo pojavljuje u dropdown-u kao slobodan
7. Refresh stranicu
8. ✅ **Očekivano:** Sat je i dalje slobodan (persistence)

**Test 1.4: No Devices Available Message**
1. Dodeli sve satove različitim crew member-ima
2. Otvori crew member koji nema sat
3. ✅ **Očekivano:** Vidiš amber poruku "No devices available"
4. ✅ **Očekivano:** Poruka kaže "All watches are currently assigned..."

---

### 👥 **Crew Status Tests**

**Test 2.1: Set Crew to On-Duty**
1. Idi na Crew List
2. Pronađi crew member sa status "Off-Duty"
3. Klikni "Activate for Duty" toggle
4. Potvrdi u dijalou
5. ✅ **Očekivano:** Toast "Activated for duty"
6. ✅ **Očekivano:** Status badge promeni se na "On-Duty"
7. Refresh stranicu
8. ✅ **Očekivano:** Status je i dalje "On-Duty" (persistence)

**Test 2.2: Remove Crew from Duty**
1. Pronađi crew member sa status "On-Duty"
2. Klikni "Remove from Duty" toggle
3. Potvrdi u dijalou
4. ✅ **Očekivano:** Toast "Removed from duty"
5. ✅ **Očekivano:** Status badge promeni se na "Off-Duty"
6. Refresh stranicu
7. ✅ **Očekivano:** Status je i dalje "Off-Duty" (persistence)

---

### 📅 **Duty Roster Assignment Tests (NAJVAŽNIJE!)**

**Test 3.1: Add Assignment**
1. Idi na Duty Roster tab
2. Drag-and-drop crew member na neki datum/shift
3. ✅ **Očekivano:** Assignment se pojavljuje na kalendaru
4. Klikni "Save Changes" dugme
5. ✅ **Očekivano:** Toast "Duty roster saved successfully"
6. Refresh stranicu (F5)
7. ✅ **Očekivano:** Assignment JE I DALJE TU (persistence)

**Test 3.2: Delete Assignment (KRITIČNI TEST!)**
1. Pronađi assignment na kalendaru
2. Klikni na njega i obriši (ili drag nazad u crew listu)
3. ✅ **Očekivano:** Assignment nestaje sa kalendara
4. Klikni "Save Changes"
5. ✅ **Očekivano:** Toast "Duty roster saved successfully"
6. Refresh stranicu (F5)
7. ✅ **KRITIČNO:** Assignment je ZAISTA OBRISAN (ne vraća se)

**Test 3.3: Edit Assignment**
1. Dodaj assignment za crew member A na datum X, shift Morning
2. Save
3. Drag assignment na drugi shift (Evening)
4. Save
5. Refresh stranicu
6. ✅ **Očekivano:** Assignment je na Evening shift (ne duplira se)

**Test 3.4: Auto-Fill Roster**
1. Klikni "Auto Fill" dugme
2. ✅ **Očekivano:** Kalendar se popuni assignments
3. Klikni "Save Changes"
4. Refresh stranicu
5. ✅ **Očekivano:** SVE assignments su sačuvane (persistence)

**Test 3.5: Clear Month**
1. Popuni nekoliko dana sa assignments
2. Klikni "Clear Month" (ako postoji u UI)
3. Klikni "Save Changes"
4. Refresh stranicu
5. ✅ **Očekivano:** Svi assignments su obrisani (ne vraćaju se)

**Test 3.6: Complex Scenario (FULL SYNC TEST)**
1. Dodaj 10 assignments u razne datume
2. Save → Refresh → ✅ Svi tu
3. Obriši 3 assignments
4. Dodaj 2 nova
5. Izmeni 1 postojeći
6. Save → Refresh
7. ✅ **Očekivano:**
   - Obrisanih 3 su STVARNO obrisani
   - Nova 2 su sačuvana
   - Izmenjen 1 je ažuriran (ne duplikovan)

---

### 🔄 **Undo Feature Test**

**Test 4.1: Undo Works**
1. Dodaj assignment
2. Klikni "Undo" dugme
3. ✅ **Očekivano:** Assignment nestaje
4. Klikni "Save Changes"
5. Refresh
6. ✅ **Očekivano:** Assignment nije u bazi (jer je undo-vano pre save-a)

---

## 🚨 POZNATI PROBLEMI (Ignoriši ih)

1. **MQTT Error** - Backend može da izbaci "MQTT connection refused", ali to NE utiče na API funkcionalnost
2. **Port 8888 conflict** - MQTT Monitor može da ima problem sa portom, ali Backend API radi na 8080

---

## 📊 REPORTOVANJE REZULTATA

Kada završiš testiranje, napravi izveštaj:

```
✅ PASS - Test 1.1: Assign Device
✅ PASS - Test 1.2: Device Dropdown
❌ FAIL - Test 1.3: Remove Device - BUG: Sat se ne vraća u dropdown
✅ PASS - Test 2.1: On-Duty Status
...
```

Za svaki FAIL test, opisati:
- Šta si uradio
- Šta si očekivao
- Šta se desilo
- Da li se problem dešava uvek ili samo ponekad

---

## 🎯 CILJ TESTIRANJA

**Potvrdi da SVE operacije rade preko backend-a i da se ČUVAJU u bazi.**

Najvažniji test je **Test 3.2 (Delete Assignment)** - to je bio najveći bug koji sam ispravio!

---

## 📁 DODATNI CONTEXT

- Svi izmenjeni fajlovi su dokumentovani u `CREW-PAGE-LOCKED.md`
- Backend API endpoints su u `backend/src/routes/`
- React Query hooks su u `src/hooks/`
- Delete-then-create pattern je ključna ispravka za persistence

---

## 🔒 NAKON TESTIRANJA

Ako su **SVI testovi PASS**, Crew stranica je spremna za produkciju i ne treba je više dirati!

Ako ima **FAIL testova**, reportuj ih i ja ću da ih ispravim u novoj sesiji.

---

**Good luck testing! 🧪**
