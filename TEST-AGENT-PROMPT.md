# TEST AGENT INSTRUCTIONS
**System:** Obedio Yacht Crew Management
**Branch:** BMaX
**Test Date:** 2025-11-18
**Recent Changes:** Fixed missing service request update endpoint + hardcoded URL

---

## YOUR ROLE

You are a TEST AGENT. Your ONLY job is to test the system functionality.

**DO NOT:**
- Write new code
- Fix bugs
- Modify files
- Suggest improvements

**DO:**
- Run tests
- Click through UI flows
- Report what works and what breaks
- Provide error messages and logs

---

## SYSTEM OVERVIEW

This is a **24/7 yacht crew management system** with:
- **Backend:** Node.js + Express + TypeScript + PostgreSQL (runs continuously)
- **Frontend:** React + TypeScript + Vite
- **Hardware:** ESP32 smart buttons (voice recording, MQTT communication)
- **Real-time:** WebSocket + MQTT for live updates
- **Devices:** Smart watches (crew), smart buttons (guest cabins), mobile apps

---

## TESTING ENVIRONMENT

### Start the System:

1. **Backend (must run first):**
   ```bash
   cd backend
   npm run dev
   ```
   - Should start on port 8080
   - Watch for: "Database connected", "MQTT connected", "WebSocket ready"

2. **Frontend:**
   ```bash
   npm run dev
   ```
   - Should start on port 5173 (or next available)
   - Should proxy API calls to backend:8080

3. **MQTT Broker (if testing hardware):**
   ```bash
   # Check if Mosquitto is running
   sc query mosquitto

   # Start if not running
   net start mosquitto
   ```

---

## TEST SCENARIOS (RUN IN ORDER)

### TEST 1: Service Request Update (CRITICAL - Just Fixed)

**What was fixed:** Added missing `PUT /api/service-requests/:id` endpoint

**Steps:**
1. Login to system (admin/admin or crew credentials)
2. Go to "Service Requests" page
3. Create a test service request (or use existing)
4. Try to **edit/update** the service request details
5. Change priority, add notes, or modify details
6. Save changes

**Expected Result:**
- ✅ Request updates successfully
- ✅ No 404 error in console
- ✅ Changes visible immediately (WebSocket sync)

**If it fails:**
- Check browser console for errors
- Check backend logs for route not found
- Copy exact error message

---

### TEST 2: Location Image Upload (CRITICAL - Just Fixed)

**What was fixed:** Removed hardcoded localhost URL, now uses relative path

**Steps:**
1. Go to "Locations" page
2. Click on any location (cabin/suite)
3. Click "Edit" or settings icon
4. Upload a new image for the location
5. Save location

**Expected Result:**
- ✅ Image uploads successfully
- ✅ No CORS or network errors
- ✅ Image displays in location card
- ✅ URL is relative (not http://localhost:8080/...)

**If it fails:**
- Check if backend upload route is working
- Check network tab for failed requests
- Verify image path in database

---

### TEST 3: Device Discovery & Pairing

**What was verified:** Device discovery routes ARE being used (not orphaned)

**Steps:**
1. Go to "Device Manager" page
2. Click "Add Device" or "Discover Devices"
3. Click "Scan for Devices" button
4. Watch for discovered devices to appear
5. Select a discovered device
6. Click "Pair Device"

**Expected Result:**
- ✅ Scan starts (polling backend every 2 seconds)
- ✅ Discovered devices list populates
- ✅ Can pair a device successfully
- ✅ Device appears in device list after pairing

**If it fails:**
- Check if ESP32 is in pairing mode (LED blinking blue)
- Check MQTT broker is running
- Check backend device-discovery logs

---

### TEST 4: Voice Recording & Transcription

**What was verified:** Two voice endpoints serve different purposes (both needed)

**Steps:**
1. Go to "Button Simulator" widget or page
2. Click "Press and Hold" to record voice
3. Record a short message (3-5 seconds)
4. Release button
5. Wait for transcription

**Expected Result:**
- ✅ Audio uploads to `/api/upload/upload-audio`
- ✅ Transcription appears in UI
- ✅ Audio file is saved (can play back later)
- ✅ Service request created with voice transcript

**If it fails:**
- Check OpenAI API key is configured
- Check audio file permissions in uploads/audio/
- Check backend logs for Whisper API errors

---

### TEST 5: Real-Time Updates (WebSocket)

**Steps:**
1. Open system in **two different browsers** (or incognito + normal)
2. Login as different users in each
3. In Browser 1: Create a service request
4. Watch Browser 2: Should see new request appear automatically
5. In Browser 2: Accept/complete the request
6. Watch Browser 1: Should see status update automatically

**Expected Result:**
- ✅ Changes appear in real-time (no manual refresh)
- ✅ WebSocket events logged in console
- ✅ Both clients stay in sync

**If it fails:**
- Check WebSocket connection status
- Check backend WebSocket service
- Look for "WebSocket disconnected" errors

---

### TEST 6: MQTT Hardware Integration (if hardware available)

**Steps:**
1. Ensure MQTT broker is running (mosquitto)
2. Ensure ESP32 smart button is powered on
3. Press main button on ESP32
4. Check backend logs for MQTT message
5. Check frontend for new service request

**Expected Result:**
- ✅ MQTT message received by backend
- ✅ Service request created automatically
- ✅ Request appears in UI in real-time

**If it fails:**
- Check MQTT broker connectivity
- Check ESP32 WiFi connection
- Check MQTT topic names match

---

### TEST 7: DND (Do Not Disturb) Toggle

**Steps:**
1. Go to a location with a guest
2. Toggle "Do Not Disturb" switch
3. Verify location shows DND badge
4. Try creating service request from that location
5. Verify DND status in guest profile

**Expected Result:**
- ✅ DND toggles immediately
- ✅ Location shows DND indicator
- ✅ Guest also marked as DND
- ✅ Backend handles atomic update via MQTT

**If it fails:**
- Check MQTT service for aux1 button handling
- Check location DND update logic
- Check WebSocket broadcast

---

### TEST 8: Duty Roster (Shifts & Assignments)

**Steps:**
1. Go to "Duty Roster" page
2. Create a new shift (e.g., "Morning Watch")
3. Assign crew members to the shift
4. Save assignments
5. View assignments by date/week

**Expected Result:**
- ✅ Shifts save successfully
- ✅ Assignments appear in calendar view
- ✅ Can filter by crew member
- ✅ Can delete assignments

**If it fails:**
- Check shift/assignment endpoints
- Check date handling in queries
- Check bulk assignment creation

---

## REGRESSION TESTING

After the fixes, verify these STILL work:

- [ ] Login/logout
- [ ] Crew member management (add/edit/delete)
- [ ] Guest management (check-in/check-out)
- [ ] Service request accept/complete (existing functionality)
- [ ] Messaging between crew
- [ ] Activity logs
- [ ] Dashboard widgets
- [ ] Settings pages (yacht, user preferences, notifications)

---

## ERROR REPORTING FORMAT

When you find a bug, report it like this:

```markdown
**Bug Found:** [Short description]
**Test:** TEST #[number] - [name]
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected:** What should happen
**Actual:** What actually happened

**Error Messages:**
[Copy exact error from console/logs]

**Screenshots:** (if applicable)
[Describe what you see]

**Priority:** Critical / High / Medium / Low
```

---

## SUCCESS CRITERIA

**All tests pass** means:
- ✅ Service request update works (TEST 1)
- ✅ Location image upload works (TEST 2)
- ✅ Device discovery works (TEST 3)
- ✅ Voice recording works (TEST 4)
- ✅ Real-time updates work (TEST 5)
- ✅ No console errors during normal operation
- ✅ No 404 errors in network tab
- ✅ All regression tests pass

---

## NOTES

- System is designed for 24/7 operation - backend should never crash
- Most logic is in backend (frontend is just UI)
- Hardcoded IPs/URLs are intentional for demo purposes
- MQTT is critical - many features depend on it
- WebSocket keeps all clients in sync automatically
- ESP32 hardware communicates via MQTT (not HTTP)

---

## START TESTING

Begin with TEST 1 (Service Request Update) since it was just fixed.
Report results for each test before moving to the next.
If any test fails, STOP and report the failure immediately.

Good luck! 🧪
