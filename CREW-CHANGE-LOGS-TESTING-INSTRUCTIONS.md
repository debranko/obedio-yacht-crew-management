# 🧪 CREW CHANGE LOGS - TESTING INSTRUCTIONS

**Date:** 2025-11-06
**Purpose:** Test that crew change logs are created and displayed correctly after backend integration

---

## ✅ WHAT WAS FIXED

### Fixed Files:
1. **src/contexts/AppDataContext.tsx** - `markChangesAsNotified()` now calls backend API
2. **src/hooks/useCrewChangeLogsApi.ts** - Fixed `useBulkCreateCrewChangeLogs()` payload format
3. **src/types/crew.ts** - Updated `CrewChangeLog` interface field names
4. **src/components/pages/duty-roster-tab.tsx** - Made `handleConfirmNotify()` async

### What Changed:
- **BEFORE**: `markChangesAsNotified()` only stored logs in local state (never sent to backend)
- **AFTER**: `markChangesAsNotified()` calls `POST /api/crew-change-logs/bulk` to create logs in database

---

## 🔍 BEFORE TESTING - VERIFY FRONTEND IS RUNNING

1. **Refresh browser** (Ctrl+Shift+R or Cmd+Shift+R) to clear cache and load new code
2. **Check browser console** for any errors (F12 → Console tab)
3. **Verify backend is running** - should see "🚀 Obedio Server Started Successfully!" in terminal

---

## 📝 TEST PLAN - STEP BY STEP

### TEST 1: Verify Activity Log Fetches Crew Change Logs ✅

**Steps:**
1. Open browser and go to http://localhost:5173
2. Login as admin (username: `admin`, password: `admin123`)
3. Navigate to **Activity Log** page (sidebar)
4. Click on **"Crew Changes"** tab (NOT "Service Requests" tab!)
5. **Check backend terminal logs** - you should see:
   ```
   [TIMESTAMP] GET /api/crew-change-logs?limit=10
   ```

**Expected Result:**
- Backend shows GET request to `/api/crew-change-logs`
- Activity Log displays the 1 test log you created earlier
- If NO backend request appears → Frontend didn't reload properly, refresh browser

**If this fails:**
- Refresh browser (Ctrl+Shift+R)
- Check browser console for errors
- Make sure backend is running on port 8080

---

### TEST 2: Create Crew Change Log from Duty Roster 🎯

**Steps:**

#### Part A: Make a Roster Change
1. Navigate to **Duty Roster** page (sidebar)
2. Find a shift (e.g., "Day Shift" or "Night Shift")
3. Drag a crew member from "Available Crew" to the shift's "Primary Crew" section
4. OR add a crew member to Emergency Crew
5. **DO NOT SAVE YET** - just make the change

#### Part B: Click "Notify Crew"
6. Look for the **"Notify Crew"** button (top right of the page)
7. Click **"Notify Crew"** button
8. A dialog should open showing:
   - List of crew members with changes
   - Change types (e.g., "Added to Shift", "Removed from Shift")
   - "Send Notifications" button

#### Part C: Confirm Notification
9. In the dialog, click **"Send Notifications"** button
10. **IMMEDIATELY check backend terminal logs** - you should see:
    ```
    [TIMESTAMP] POST /api/crew-change-logs/bulk
    ```
11. Frontend should show success toast: "Crew change logs created successfully"
12. Dialog should close

**Expected Backend Log Output:**
```
[TIMESTAMP] POST /api/crew-change-logs/bulk
✅ Created bulk crew change logs - count: 1
```

**If you DON'T see the POST request:**
- Open browser console (F12) and check for JavaScript errors
- Try clicking "Notify Crew" again
- Make sure you confirmed the dialog (clicked "Send Notifications")
- Check if `pendingChanges` is empty (might mean no changes detected)

---

### TEST 3: Verify Logs Appear in Activity Log 📊

**Steps:**
1. After confirming the notification (Test 2), stay on the Duty Roster page
2. Navigate to **Activity Log** page (sidebar)
3. Click on **"Crew Changes"** tab
4. **Check backend terminal** - should see a new GET request:
   ```
   [TIMESTAMP] GET /api/crew-change-logs?limit=10
   ```
5. Look at the table - you should now see:
   - Your new crew change log entry
   - Crew member name
   - Action (e.g., "added", "removed")
   - Date and shift information
   - "Performed By" showing who made the change

**Expected Result:**
- New log entry appears in the table
- Shows correct crew member name
- Shows correct action type
- Shows correct date and shift

**If logs don't appear:**
- Refresh the Activity Log page
- Check backend logs - did GET request happen?
- Check backend logs - did POST request succeed? (look for "Created bulk crew change logs")
- Check browser console for React Query errors

---

## 🐛 DEBUGGING GUIDE

### Issue 1: No POST request to `/api/crew-change-logs/bulk`

**Possible Causes:**
1. **Frontend not reloaded** → Refresh browser (Ctrl+Shift+R)
2. **No changes detected** → Make sure you actually changed the roster before clicking "Notify Crew"
3. **Dialog not confirmed** → Make sure you clicked "Send Notifications" in the dialog
4. **JavaScript error** → Check browser console (F12)
5. **Notify Crew button disabled** → Check if button is grayed out (might need to save roster first)

**Debug Steps:**
```javascript
// In browser console, check if markChangesAsNotified is called:
console.log('Testing crew change logs...');
```

---

### Issue 2: Logs don't appear in Activity Log

**Possible Causes:**
1. **POST request failed** → Check backend logs for errors
2. **Wrong tab** → Make sure you're on "Crew Changes" tab, not "Service Requests"
3. **React Query cache issue** → Refresh the page
4. **Database issue** → Check if backend has database connection errors

**Debug Steps:**
1. Check backend logs for:
   ```
   ✅ Created bulk crew change logs - count: X
   ```
2. Test direct database query:
   ```bash
   # In backend directory
   npx prisma studio
   # Open CrewChangeLog table and check if records exist
   ```

---

### Issue 3: Notify Crew button is grayed out/disabled

**Possible Causes:**
1. **No changes detected** → `detectRosterChanges()` returned empty array
2. **Roster not saved** → Try saving the roster first, then click Notify Crew
3. **Frontend state issue** → Refresh the page

---

## 📊 BACKEND LOGS TO LOOK FOR

### Successful Test Flow:

```
# Step 1: User opens Activity Log → Crew Changes tab
[TIMESTAMP] GET /api/crew-change-logs?limit=10
[TIMESTAMP] GET /api/crew-change-logs?limit=10

# Step 2: User makes roster changes and clicks Notify Crew
[TIMESTAMP] POST /api/crew-change-logs/bulk
✅ Created bulk crew change logs - count: 1

# Step 3: User returns to Activity Log → Crew Changes tab
[TIMESTAMP] GET /api/crew-change-logs?limit=10
```

### If Something is Wrong:

**No GET requests** → User not on "Crew Changes" tab or frontend not loaded
**No POST request** → "Notify Crew" not clicked, dialog not confirmed, or JavaScript error
**POST but GET returns empty** → Database write failed, check backend errors

---

## ✅ SUCCESS CRITERIA

The test is successful when:

1. ✅ **Backend receives GET** `/api/crew-change-logs` when opening "Crew Changes" tab
2. ✅ **Backend receives POST** `/api/crew-change-logs/bulk` when confirming notification
3. ✅ **Backend logs show** "✅ Created bulk crew change logs - count: X"
4. ✅ **Activity Log displays** new crew change log entry
5. ✅ **Log shows correct** crew member name, action, date, shift

---

## 🔄 FULL TEST SEQUENCE

1. **Refresh browser** (Ctrl+Shift+R)
2. **Open Activity Log** → Click "Crew Changes" tab → Verify GET request
3. **Open Duty Roster** → Make a roster change (drag crew member to shift)
4. **Click "Notify Crew"** → Dialog opens
5. **Click "Send Notifications"** → Verify POST request in backend logs
6. **Check for success** → Backend logs show "✅ Created bulk crew change logs"
7. **Return to Activity Log** → Click "Crew Changes" tab
8. **Verify new log appears** → Table shows the new crew change log

---

## 📸 WHAT TO CHECK IN BACKEND LOGS

**Run this command in a separate terminal to monitor backend:**
```bash
cd backend
# Watch for crew-change-logs requests
npm run dev 2>&1 | grep -i "crew-change"
```

**Or manually search logs for:**
- `GET /api/crew-change-logs`
- `POST /api/crew-change-logs/bulk`
- `Created bulk crew change logs`

---

## ❓ QUESTIONS TO ASK IF TESTS FAIL

1. Did you refresh the browser after my code changes?
2. Are you looking at the "Crew Changes" tab (not "Service Requests" tab)?
3. Did you actually click "Send Notifications" in the dialog?
4. Do you see any errors in browser console (F12)?
5. Do you see any errors in backend terminal?

---

## 📝 REPORTING RESULTS

**Please tell me:**
1. ✅ or ❌ for each test
2. Copy/paste relevant backend log lines
3. Screenshot of Activity Log "Crew Changes" tab
4. Any error messages from browser console or backend

---

**Last Updated:** 2025-11-06
**Created By:** Claude Code - Systematic Testing Following RULES KORAK 2
