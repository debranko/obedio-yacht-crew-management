# MASTER BACKLOG

> Technical issue log maintained during application/firmware walkthrough.
> Items batched for developer action.

---

## Issue Log

### [ID-001] Remove Manual Status Dropdown from Add Guest Dialog (High Priority)
* **User Report:** "When I'm adding a new guest, I have this status in a dropdown menu. I should not have that as I have the dates inside so it should be taken automatically from the dates."
* **Technical Suspect:** Status is a manually-set dropdown field in `guest-form-dialog.tsx:376-391`. No date-based calculation exists - the field just stores whatever user selects. Default is `'expected'`.
* **Implementation Guide:**
    * [ ] Step 1: Open `src/components/guest-form-dialog.tsx`
    * [ ] Step 2: Remove the Status `<Select>` component (lines 376-391)
    * [ ] Step 3: Remove `status` from `formData` initial state and form handling
    * [ ] Step 4: Backend should calculate status on save based on `checkInDate`/`checkOutDate`

---

### [ID-002] Auto-Calculate Guest Status from Check-in/Check-out Dates (High Priority)
* **User Report:** "Is it expected or on board or past? It should be taken automatically from the dates."
* **Technical Suspect:** No automatic date-based status calculation exists anywhere in codebase. Status is stored as static string `'expected' | 'onboard' | 'departed'` and never recalculated.
* **Implementation Guide:**
    * [ ] Step 1: Create utility function `calculateGuestStatus(checkInDate, checkOutDate)`:
        - `today < checkInDate` → `'expected'`
        - `checkInDate <= today <= checkOutDate` → `'onboard'`
        - `today > checkOutDate` → `'departed'`
    * [ ] Step 2: Apply in backend `guests.ts` on GET requests (compute on read)
    * [ ] Step 3: Or run scheduled job to update statuses daily
    * [ ] Step 4: Update `guests-list.tsx` to use calculated status for display

---

### [ID-003] Guest List Shows Incorrect "Onboard" Status for All Guests (High Priority)
* **User Report:** "Inside of this page for everybody it says they are on board even if they are not. George Clooney has check-in 01/01/1970 but shows Onboard."
* **Technical Suspect:** `guests-list.tsx:598-602` displays `guest.status` directly from database without validation. Status was manually set to `'onboard'` and never updated. The 01/01/1970 dates are likely default/placeholder values (Unix epoch).
* **Implementation Guide:**
    * [ ] Step 1: Fix depends on [ID-002] - status must be calculated from dates
    * [ ] Step 2: Add data migration to fix existing guests with bad dates
    * [ ] Step 3: Consider adding date validation in `guest-form-dialog.tsx` to prevent invalid dates

---

### [ID-004] Call Backup Does Not Persist Crew Status to Database (High Priority)
* **User Report:** "When I press Call Backup it doesn't put a crew to duty. I can see it gives me the popup and notification but I don't see it in the toggle button. Also not in the widget."
* **Technical Suspect:** `handleBackupCalled()` in `duty-timer-card.tsx:224-232` only updates LOCAL React state via `setCrewMembers()`. **No API call is made** to persist the status change. The toggle in `crew-list.tsx` relies on database state, so it stays OFF. Change is lost on page refresh.
* **Implementation Guide:**
    * [ ] Step 1: Open `src/components/duty-timer-card.tsx`
    * [ ] Step 2: In `handleBackupCalled()` (lines 224-232), add API call:
        ```typescript
        // After finding crew member by name, call API:
        await api.patch(`/crew/${member.id}`, { status: 'on-duty' });
        ```
    * [ ] Step 3: Use same mutation pattern as `crew-list.tsx:429-443` (`updateCrewMutation.mutate()`)
    * [ ] Step 4: Invalidate crew queries to refresh UI state
    * [ ] Step 5: Consider adding a `backupReason` field to track why backup was called

---

### [ID-005] Backup Crew Badge Not Synced with Status Toggle (Medium Priority)
* **User Report:** "Emma Williams shows in 'Currently on duty' widget with Backup badge but her toggle is still OFF in the table."
* **Technical Suspect:** Two sources of truth conflict: Widget uses `dutyStatus.backup` array (local state), while toggle uses `dutyStatus.onDuty` which checks `member.status === 'on-duty'` from database. When backup is called, only local state updates.
* **Implementation Guide:**
    * [ ] Step 1: Fix [ID-004] first - this will sync both views
    * [ ] Step 2: Consider adding `backupStatus` field to crew model to distinguish backup from regular duty
    * [ ] Step 3: Update `getCurrentDutyStatus()` in `AppDataContext.tsx:600-660` to handle backup status correctly

---

### [ID-006] Comment Out Button Simulator from Sidebar (Low Priority)
* **User Report:** "I think we can remove the button simulator from the sidebar. But we can just comment it out, I don't want to delete it because we are still using that as an example for the real ESP device."
* **Technical Suspect:** Button Simulator is a development/testing tool that should be hidden in production but kept in codebase for ESP firmware reference.
* **Implementation Guide:**
    * [ ] Step 1: Open `src/components/app-sidebar.tsx`
    * [ ] Step 2: Find the Button Simulator nav item and comment it out (do NOT delete)
    * [ ] Step 3: Add comment: `// Hidden for production - kept as ESP device reference`

---

### [ID-007] Smart Watches Show "Unknown" Type Badge (Low Priority)
* **User Report:** Screenshot shows all 3 watches with "Unknown" type badge in Device Manager.
* **Technical Suspect:** Watch device `type` field is not being set or recognized. Likely missing type assignment when watches register via WebSocket/API.
* **Implementation Guide:**
    * [ ] Step 1: Check Device Manager component for type display logic
    * [ ] Step 2: Verify backend device registration sets correct type for watches
    * [ ] Step 3: May need to add "smartwatch" as valid device type or map existing values

---

### [ID-009] ⚠️ CRITICAL: Delegated Requests Skip "Pending" and Go Directly to "Serving Now" (CRITICAL Priority)
* **User Report:** "When I delegate a request to somebody, it automatically goes to SERVING NOW. We need to implement that it listens on WebSocket - only when crew presses ACCEPT on the watch should it go to Serving Now. Now calls can be missed which is one of the most important things in this system."
* **Technical Suspect:** Service request status state machine is broken. When delegating, backend likely sets `status: 'in-progress'` immediately instead of `status: 'assigned'`. Watch acceptance via WebSocket/MQTT is not triggering the status change.
* **Expected Flow:**
    1. `pending` → New request arrives
    2. `assigned` → Admin delegates to crew (request stays visible, crew notified)
    3. `in-progress` → **ONLY** when crew accepts on watch
    4. `completed` → Crew marks done
* **Implementation Guide:**
    * [ ] Step 1: Add new status `'assigned'` to service request model
    * [ ] Step 2: When delegating, set status to `'assigned'` (NOT `'in-progress'`)
    * [ ] Step 3: Watch app sends MQTT/WebSocket `accept` event
    * [ ] Step 4: Backend listens for accept event → changes status to `'in-progress'`
    * [ ] Step 5: UI shows `assigned` requests in "Pending" column, `in-progress` in "Serving Now"
    * [ ] Step 6: Add timeout/escalation if crew doesn't accept within X minutes

---

### [ID-010] Merge "Couldn't Understand" & "On My Way" into Single Button (Medium Priority)
* **User Report:** "These two buttons should be the same thing. Both mean crew will go to the location."
* **Decision:** Remove "Couldn't Understand" button, keep only **"On My Way"**
* **Suggested Button Names:**
    - ✅ **"On My Way"** (recommended - clear, already exists)
    - "Coming"
    - "Responding"
    - "I'll Be Right There"
* **Implementation Guide:**
    * [ ] Step 1: Open `incoming-request-dialog.tsx`
    * [ ] Step 2: Remove "Couldn't Understand" button entirely
    * [ ] Step 3: Keep only "On My Way" button
    * [ ] Step 4: Optionally add dropdown/checkbox to log reason (understood vs not) for analytics

---

### [ID-011] LED Ring Feedback on Physical Button Device (High Priority)
* **User Report:** "The guest should have feedback on the LED ring when crew is coming. Currently it's not working at all."
* **Technical Suspect:** LED ring control via MQTT not implemented or broken. Need to rewrite LED feedback system.
* **Expected LED Behavior (to implement fresh):**
    ```
    1. Button pressed     → LED: Pulsing GOLD (request sent, waiting)
    2. Crew accepts       → LED: Solid GREEN (someone is coming)
    3. No response/timeout → LED: Pulsing RED (escalation needed)
    4. Completed          → LED: OFF or brief GREEN flash
    ```
* **Implementation Guide:**
    * [ ] Step 1: Define LED states in firmware: `IDLE`, `WAITING`, `ACCEPTED`, `TIMEOUT`
    * [ ] Step 2: Backend sends MQTT message to button when crew accepts: `obedio/button/{deviceId}/led`
    * [ ] Step 3: Firmware listens for LED commands and updates ring color
    * [ ] Step 4: Add timeout logic - if no accept within X seconds, show red
    * [ ] Step 5: Test full flow: button press → LED gold → crew accepts → LED green

---

### [ID-012] Do Not Disturb (DND) Button Feature (High Priority)
* **User Report:** "On the ESP button there is a DND button. It sends MQTT message and shows as DND active state - NOT a service request. Shows in Location, Guest page, and Dashboard DND widget."
* **Technical Suspect:** DND is a **location state toggle**, not a service request. Needs full implementation.
* **Flow:**
    ```
    ESP DND Button pressed
         ↓
    MQTT: obedio/button/{deviceId}/dnd → {state: true/false, locationId: "..."}
         ↓
    Backend updates Location.dndActive = true
         ↓
    Shows in:
      • Location page: "DND Active" badge
      • Guest page: Guest's cabin shows DND status
      • Dashboard "Do Not Disturb" widget: List of all DND locations
    ```
* **Implementation Guide:**
    * [ ] Step 1: Add `dndActive: boolean` field to Location model (if not exists)
    * [ ] Step 2: ESP firmware: DND button sends MQTT `obedio/button/{id}/dnd` with toggle state
    * [ ] Step 3: Backend MQTT handler: Listen for DND messages, update Location
    * [ ] Step 4: Location page: Show DND badge/indicator when active
    * [ ] Step 5: Guest page: Show DND status for guest's assigned cabin
    * [ ] Step 6: Dashboard widget: "Do Not Disturb" - list all locations with DND active
    * [ ] Step 7: WebSocket broadcast DND state changes for real-time UI updates

---

### [ID-013] Admin Password Reset for Crew Members (Medium Priority)
* **User Report:** "Admin should have rights to reset the password of any crew member. He can also give in permission matrix this right to other crew members."
* **Technical Suspect:** Need to investigate if password reset functionality exists. May need new API endpoint and UI.
* **Requirements:**
    1. Admin can reset password for any crew member
    2. Permission matrix should have option to grant this right to other crew members
* **Implementation Guide:**
    * [ ] Step 1: Check if password reset API exists in `backend/src/routes/crew.ts` or `auth.ts`
    * [ ] Step 2: If not, create `POST /api/crew/:id/reset-password` endpoint
    * [ ] Step 3: Add "Can Reset Passwords" permission to permission matrix
    * [ ] Step 4: Add UI button in crew management (table row action or detail page)
    * [ ] Step 5: Show new password in modal or send via email (confirm with user)
    * [ ] Step 6: Ensure permission check in backend - only admin or users with permission can reset

---

### [ID-008] Dashboard Widget: Active Requests + Serving Now (Vertical Layout) (High Priority)
* **User Report:** "The widget should have first active requests and underneath serving now list. NOT two columns - vertical layout."
* **Technical Suspect:** Current widget only shows "Serving Now". Needs to show both sections stacked vertically.
* **Expected Layout:**
    ```
    ┌─────────────────────┐
    │  ACTIVE REQUESTS    │  ← Top section (pending/assigned)
    ├─────────────────────┤
    │  SERVING NOW        │  ← Bottom section (in-progress)
    └─────────────────────┘
    ```
* **Implementation Guide:**
    * [ ] Step 1: Identify the Serving Now widget component on dashboard
    * [ ] Step 2: Add "Active Requests" section at TOP of widget
    * [ ] Step 3: Keep "Serving Now" section at BOTTOM
    * [ ] Step 4: Vertical stack layout (NOT side-by-side columns)

---

## Summary
| ID | Title | Priority | Status |
|----|-------|----------|--------|
| **ID-009** | **⚠️ Delegated→Serving Now (skip accept)** | **CRITICAL** | **Pending** |
| ID-011 | LED Ring Feedback on Button | High | Pending |
| ID-012 | Do Not Disturb (DND) Feature | High | Pending |
| ID-001 | Remove Manual Status Dropdown | High | Pending |
| ID-002 | Auto-Calculate Status from Dates | High | Pending |
| ID-003 | Incorrect Onboard Status Display | High | Pending |
| ID-004 | Call Backup Not Persisting to DB | High | Pending |
| ID-008 | Dashboard Vertical Widget Layout | High | Pending |
| ID-005 | Backup Badge vs Toggle Desync | Medium | Pending |
| ID-010 | Merge buttons → "On My Way" | Medium | Pending |
| ID-013 | Admin Password Reset for Crew | Medium | Pending |
| ID-006 | Comment Out Button Simulator | Low | Pending |
| ID-007 | Watches Show "Unknown" Type | Low | Pending |

---

## Critical Files
- `src/components/guest-form-dialog.tsx` - Status dropdown removal
- `src/components/pages/guests-list.tsx` - Status display logic
- `backend/src/routes/guests.ts` - Status calculation on API
- `src/types/guests.ts` - Guest type definition
- `src/components/duty-timer-card.tsx` - Call Backup handler (missing API call)
- `src/components/call-backup-dialog.tsx` - Backup dialog UI
- `src/components/crew-list.tsx` - Crew status toggle (working correctly)
- `src/contexts/AppDataContext.tsx` - getCurrentDutyStatus() logic
