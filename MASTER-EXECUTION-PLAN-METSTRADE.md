# 🎯 MASTER EXECUTION PLAN - Metstrade 2025
**Created:** 2025-11-16 12:18 UTC
**Deadline:** 2025-11-17 ~12:00 UTC (24 hours)
**Owner:** Roo (Architect/Code AI)

---

## 📜 GOLDEN RULE

### **BEFORE CREATING ANY NEW API OR BACKEND CODE:**

1. ✅ **EXAMINE existing code completely** (no matter how long)
2. ✅ **READ all related files fully** (not partially)
3. ✅ **SEARCH for similar implementations** in codebase
4. ✅ **CHECK OBEDIO-API-MASTER-REFERENCE.md** for existing endpoints
5. ✅ **REVIEW server.ts** to see what's registered
6. ✅ **VERIFY database schema** (Prisma) for required fields
7. ✅ **UNDERSTAND data flow** end-to-end before coding
8. ✅ **ONLY THEN** create new code

**Never assume. Always verify. Think before coding.**

---

## 🗺️ COMPLETE SYSTEM LANDSCAPE

### **System 1: Windows Current Folder**
**Path:** `c:/Users/debra/OneDrive/Desktop/Luxury Minimal Web App Design`
**Branch:** `bmad` (48 commits ahead of origin)
**Status:** ✅ **MAIN WORKING SYSTEM**
- Backend working (port 8080)
- Frontend working (port 3000)
- MQTT working
- Wear OS notifications working
- Button simulator working
- Login working (admin/admin123)

**Critical Issue Found:**
- `backend/src/routes/upload-audio.ts` exists (124 lines)
- ❌ **NOT registered in server.ts** → ESP32 gets 404
- I added duplicate endpoint in `upload.ts` today (lines 104-326)
- ✅ This one IS registered in server.ts
- **Result:** Conflicting implementations!

---

### **System 2: OBEDIO Final Backup**
**Path:** `C:/Users/debra/OneDrive/Desktop/OBEDIO Final`
**Purpose:** Reference only (last known stable before voice attempts)
**Don't Use For:** Active development
**Use For:** Comparing if something broken

---

### **System 3: Git Remote Repository**
**URL:** https://github.com/debranko/obedio-yacht-crew-management.git

**Branches:**
- `main` - Will receive Windows bmad code (target for push)
- `bmad` - Current Windows work (48 commits ahead)
- `deployment-fixes` - Has OTA + MQTT improvements from friend

**Friend's Work:**
- Codes on MacBook
- Tests using NUC's MQTT broker
- Pushes to `deployment-fixes` branch
- Light toggle = Direct MQTT messages (not backend API)

---

### **System 4: NUC Linux Server** 
**IP:** 10.10.0.10
**Path:** `/opt/obedio-yacht-crew-management/`
**Branch:** `deployment-fixes`
**Access:** SSH (obedio / meinBruder!)
**Purpose:** **FINAL DEPLOYMENT TARGET FOR METSTRADE**

**Docker Status:**
- obedio-backend: ✅ HEALTHY (port 3001)
- obedio-db: ✅ HEALTHY (PostgreSQL port 5432)
- obedio-mqtt: ✅ HEALTHY (Mosquitto port 1883)
- obedio-frontend: ⚠️ **UNHEALTHY** (port 3000) **MUST FIX!**

**Features on N UC:**
- ✅ OTA updates (MQTT-triggered)
- ✅ ESP32-S3 firmware improvements
- ✅ MQTT broker working
- ✅ `transcribe.ts` exists
- ❌ Frontend broken
- ❌ Light toggle route not found (but MQTT works)

---

## 🎯 REQUIREMENTS FOR METSTRADE

**MUST WORK:**
1. ✅ ESP32 button → MQTT → Service Request
2. ✅ Wear OS real-time notifications
3. ✅ Crew accept/complete workflow
4. 🎤 **Voice-to-text** (ESP32 upload → OpenAI Whisper → Service Request)
5. 💡 **Light toggle** (MQTT direct control)

**NICE TO HAVE:**
- Multi-language voice transcription demo
- All 6 buttons working (T1-T6)
- Battery voltage stable

**DEMO SYSTEM:**
- NUC ONLY (not Windows laptop)
- Access via Tailscale
- Offline backup plan if network fails

---

## 📋 DETAILED EXECUTION CHECKLIST

### ✅ COMPLETED (Investigation Phase)
- [x] Analyzed Windows current folder vs OBEDIO Final
- [x] Found root cause: upload-audio.ts not registered
- [x] Analyzed NUC status via SSH
- [x] Understood Git branch strategy
- [x] Confirmed friend's light toggle approach
- [x] Created planning documents
- [x] Understood complete system landscape

---

### 🔴 PHASE 1: FIX WINDOWS AUDIO UPLOAD (2-3 hours)

#### **Task 1.1: Deep Code Examination (30 min - READ ONLY)**
```
Files to read COMPLETELY:
- backend/src/routes/upload-audio.ts (124 lines)
- backend/src/routes/upload.ts (333 lines with my additions)
- backend/src/routes/transcribe.ts (174 lines)
- backend/src/server.ts (lines 1-50, 138-163)
- backend/prisma/schema.prisma (ServiceRequest model)
- backend/src/services/mqtt.service.ts (voiceTranscript handling)

Questions to answer:
1. Which audio upload implementation is better?
2. Does upload-audio.ts have transcription? (probably not)
3. Does my upload.ts endpoint have transcription? (partially)
4. Which is easier to complete?
5. What does ESP32 firmware expect? (check AUDIO_RECORDING_UPDATE.ino)
```

**Decision Matrix:**
```
upload-audio.ts:
+ Separate file (cleaner organization)
+ Simpler code (just upload)
- NOT registered in server.ts
- NO transcription integration
- Incomplete

upload.ts /upload-audio endpoint:
+ Already registered in server.ts
+ Has OpenAI integration started
+ Has service request logic
- Mixed with image uploads
- Not fully complete
```

**My Recommendation:** Keep `upload.ts`, delete `upload-audio.ts`

---

#### **Task 1.2: Clean Up Duplicates (Code Mode - 15 min)**
```bash
# After deciding which to keep:

Option A (Keep upload.ts):
1. git rm backend/src/routes/upload-audio.ts
2. Verify server.ts line 158 still has: app.use('/api/upload', uploadRoutes)
3. Restart backend, confirm no errors

Option B (Keep upload-audio.ts):
1. Remove /upload-audio from upload.ts (lines 104-326)
2. Add to server.ts after line 37: import uploadAudioRoutes from './routes/upload-audio';
3. Add to server.ts after line 158: app.use('/api/upload-audio', uploadAudioRoutes);
4. Restart backend, test endpoint exists
```

---

#### **Task 1.3: Complete Voice Upload Implementation (Code Mode - 2h)**

**Read FIRST:**
- Current endpoint structure
- OpenAI client initialization (from transcribe.ts)
- Service request creation pattern (from MQTT service)
- WebSocket emit pattern (from other routes)

**Then Implement:**

**Step 1:** Add transcription to `/upload-audio` endpoint
```typescript
// Pattern from transcribe.ts lines 86-115
1. Check if openai client exists (null check!)
2. Create read stream from uploaded file
3. Call openai.audio.transcriptions.create()
4. Get transcript and language
5. If not English, call openai.audio.translations.create()
6. Handle errors gracefully (don't crash if OpenAI fails)
```

**Step 2:** Create service request with voice
```typescript
// Pattern from mqtt.service.ts lines 340-365
1. Get deviceId, locationId from request body
2. Find device in database
3. Find guest for location
4. Create ServiceRequest with:
   - requestType: ServiceRequestType.voice
   - voiceTranscript: transcript
   - notes: "Voice message: [transcript]" + translation if different
   - priority, guestName, guestCabin, etc.
5. Save audio file (already done by multer)
```

**Step 3:** Emit real-time updates
```typescript
// Pattern from mqtt.service.ts lines 415-432
1. Get WebSocket IO: websocketService.getIO()
2. Emit: io.emit('service-request:created', serviceRequest)
3. Publish MQTT: mqttService.publish() for watches
4. Call: mqttService.notifyAssignedCrewWatch()
```

**Step 4:** Return response to ESP32
```typescript
{
  success: true,
  audioUrl: "/uploads/audio/filename.wav",
  transcript: "I need coffee please",
  translation: "I need coffee please",
  language: "en",
  serviceRequest: { id, status, requestType }
}
```

---

#### **Task 1.4: Test Voice Upload (30 min)**
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal  2: Test with curl
curl -X POST http://localhost:8080/api/upload/upload-audio \
  -F "audio=@test-audio.wav" \
  -F "deviceId=BTN-TEST123" \
  -F "locationId=location-uuid" \
  -F "priority=normal"

# Expected response:
{
  "success": true,
  "data": {
    "audioUrl": "/uploads/audio/recording-123.wav",
    "transcript": "Test message",
    "serviceRequest": { "id": "...", "status": "pending" }
  }
}

# Verify:
1. Audio file saved in backend/uploads/audio/
2. Service request created in database
3. Frontend shows new request
4. Wear OS got notification
```

---

### 🟢 PHASE 2: UPDATE ESP32 FIRMWARE (1-2 hours)

#### **Task 2.1: Examine Firmware Code (30 min - READ ONLY)**
```arduino
Files to read COMPLETELY:
- hardware/obedio-custom-pcb-simple/obedio-custom-pcb-simple.ino (498 lines - STABLE)
- hardware/obedio-custom-pcb-simple/New folder/AUDIO_RECORDING_UPDATE.ino (387 lines - VOICE)

Understand:
1. How does stable firmware work? (buttons, MQTT, no voice)
2. What does voice update add? (I2S mic, recording, HTTP upload)
3. Is voice upload code correct? (URL, headers, WAV format)
4. What's the memory usage? (480KB buffer - safe for ESP32-S3?)
5. What happens if upload fails? (error handling exists?)
```

**Safety Check:**
- ESP32-S3 has 512KB RAM
- Voice buffer uses 480KB (30s @ 8kHz 16-bit)
- Only 32KB left for other operations
- **Risk:** May cause instability

**Decision:** 
- For Metstrade: Use stable firmware WITHOUT voice (safer)
- OR: Reduce recording to 15s (240KB buffer, safer)
- OR: Test thoroughly on hardware first

---

#### **Task 2.2: Choose Firmware Strategy**

**Option A: Stable (NO VOICE) - SAFEST**
```
Use: obedio-custom-pcb-simple.ino (498 lines)
Features: 6 buttons, MQTT, shake detection, LED feedback
Risk: LOW (proven stable)
Demo: Button press works perfectly
Limitation: No voice recording
```

**Option B: With Voice - RISKY**
```
Integrate: AUDIO_RECORDING_UPDATE.ino into base firmware
Features: All above + 30s voice recording
Risk: MEDIUM (memory tight, upload can fail)
Demo: Full voice-to-text workflow
Requires: Careful testing, may need 15s limit
```

**Option C: Hybrid - SMART**
```
Have BOTH firmwares ready
Demo with stable firmware
Have voice firmware if everything works
Quick flash if needed (2 minutes)
```

**Recommendation:** Option C

---

#### **Task 2.3: If Implementing Voice (1h)**
```arduino
Changes to AUDIO_RECORDING_UPDATE.ino:

Line 31: Fix server URL
const char* backend_server = "http://10.10.0.207:8080";
// Change to match your backend port

Line 163: Fix upload endpoint
String url = String(backend_server) + "/api/upload/upload-audio";
// Or "/api/upload-audio" depending on which endpoint we kept

Line 173: Verify headers correct
String contentType = "multipart/form-data; boundary=" + boundary;
// ESP32 must match server multer expectations

Test on hardware:
1. Upload firmware
2. Press and hold T1
3. Speak for 5-10 seconds
4. Release button
5. Watch LEDs: Blue (recording) → Green (uploading) → White (success)
6. Check battery voltage: Should stay ~3.93V (not drop to 0.14V)
7. If voltage drops: ABORT voice feature, use stable firmware
```

---

### 🔵 PHASE 3: GIT WORKFLOW (1-2 hours)

#### **Task 3.1: Understand Current Git State**
```bash
# On Windows:
git branch -a
# Shows: * bmad (current)
#        deployment-fixes
#        main
#        remotes/origin/...

git status
# Shows: 48 commits ahead, many modified files

git log origin/main -5 --oneline
# See what's currently on main

git log bmad -5 --oneline
# See our recent work on bmad
```

---

#### **Task 3.2: Push bmad to main (CAREFUL!)**
```bash
# Step 1: Commit current work
git status  # Review what's changed
git add .   # Stage everything
git commit -m "Complete voice-to-text endpoint + cleanup duplicates - Metstrade prep"

# Step 2: Switch to main and merge
git checkout main
git pull origin main  # Get latest main first
git merge bmad       # Merge our 48 commits

# Step 3: Handle conflicts (if any)
# Prefer bmad code for application files
# Check each conflict carefully
git status  # See conflicts
# Edit files, then:
git add .
git commit -m "Merge bmad branch - Metstrade ready"

# Step 4: Test on main branch
npm install  # In case dependencies changed
cd backend && npm install
START-OBEDIO.bat  # Must work!
# Open http://localhost:3000
# Test login, button simulator
# If works → proceed to push

# Step 5: Push to GitHub
git push origin main

# Step 6: Verify on GitHub
# Go to https://github.com/debranko/obedio-yacht-crew-management
# Check commits appeared on main branch
```

---

#### **Task 3.3: Merge deployment-fixes Features**
```bash
# Still on main branch
git fetch origin

# See what's in deployment-fixes
git log origin/deployment-fixes -10 --oneline
# Shows: OTA updates, MQTT improvements, ESP32 fixes

# Merge it
git merge origin/deployment-fixes

# EXPECT CONFLICTS - This is normal!
# Files likely to conflict:
# - docker-compose.yml
# - backend/.env.example
# - backend/src/services/mqtt.service.ts
# - Possibly others

# For each conflict:
# 1. Open file
# 2. Look for <<<<<<< HEAD markers
# 3. Decide: keep main code OR deployment-fixes code OR both
# 4. For application logic: prefer main (our working code)
# 5. For Docker/infrastructure: prefer deployment-fixes (friend's improvements)

# After resolving:
git add .
git commit -m "Merge deployment-fixes: Add OTA updates and MQTT improvements"

# Test again!
START-OBEDIO.bat
# Everything must still work

# Push merged code
git push origin main

# Safety backup
git tag metstrade-2025-ready
git push origin metstrade-2025-ready
```

---

### 🟣 PHASE 4: DEPLOY TO NUC (2-3 hours)

#### **Task 4.1: Pull Latest Code to NUC**
```bash
# On NUC (via SSH or friend does it):
cd /opt/obedio-yacht-crew-management

# Current state check
git status
git branch  # Shows: * deployment-fixes

# Backup current state
git branch deployment-fixes-backup

# Switch to main
git checkout main
git pull origin main  # Get all our work

# Verify files updated
ls -la backend/src/routes/ | grep upload
# Should see: upload.ts (with our audio endpoint)
# Should NOT see: upload-audio.ts (we deleted it)
```

---

#### **Task 4.2: Rebuild Docker Containers**
```bash
# Stop everything
docker-compose -f docker-compose.prod.yml down

# Check .env file has correct values
cat .env
# Must have:
# DATABASE_URL=...
# JWT_SECRET=...
# OPENAI_API_KEY=... (for transcription)
# MQTT_BROKER=mqtt://mosquitto:1883

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml build --no-cache

# Start
docker-compose -f docker-compose.prod.yml up -d

# Wait 2-3 minutes for startup
sleep 180

# Check status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs backend | tail -50
docker-compose -f docker-compose.prod.yml logs frontend | tail -50
```

---

#### **Task 4.3: Fix Frontend if Still Unhealthy**
```bash
# Get detailed frontend logs
docker logs obedio-frontend --tail=100

# Common issues and fixes:

# Issue 1: Build failed
# Fix: Check package.json, rebuild
docker-compose -f docker-compose.prod.yml build frontend --no-cache

# Issue 2: Port conflict
# Fix: Edit docker-compose.prod.yml, change port 3000 to 3002

# Issue 3: Environment variables missing
# Fix: Check frontend needs VITE_ prefixed vars in .env

# Issue 4: Dist folder missing
# Fix: Build manually:
docker exec obedio-frontend npm run build

# After fix:
docker-compose -f docker-compose.prod.yml restart frontend
docker-compose -f docker-compose.prod.yml ps
# Frontend should show HEALTHY
```

---

#### **Task 4.4: Verify NUC System Working**
```bash
# Test from command line:
curl http://10.10.0.10:3001/api/health
# Expected: {"status":"OK","timestamp":"..."}

curl http://10.10.0.10:3000
# Expected: HTML from frontend

# Test from browser (on Windows or phone via Tailscale):
http://10.10.0.10:3000
# Should see login page
# Login: admin / admin123
# Should see dashboard

# Test MQTT:
# Use TEST-MQTT.bat or mosquitto_pub
mosquitto_pub -h 10.10.0.10 -t "test/topic" -m "hello"

# Test button simulator
# Should create service request
# Wear OS should get notification
```

---

### 🟡 PHASE 5: TESTING & VALIDATION (2-3 hours)

#### **Task 5.1: Core Features Test**
```
On NUC system (http://10.10.0.10:3000):

Test 1: Authentication
[ ] Login with admin/admin123
[ ] Dashboard loads correctly
[ ] All widgets visible
[ ] No console errors (F12)

Test 2: Service Requests
[ ] Button simulator creates request
[ ] Request appears in frontend
[ ] Request shows in "Serving Now" widget
[ ] Crew can click "Accept"
[ ] Status changes to "Serving"
[ ] Crew can click "Complete"
[ ] Request disappears from active list

Test 3: Real-time Updates
[ ] Create request in one browser tab
[ ] See it appear in another tab (WebSocket)
[ ] Wear OS gets notification
[ ] Accept on Wear OS
[ ] See status change in frontend

Test 4: MQTT Communication
[ ] Backend logs show MQTT connected
[ ] Can publish/subscribe to topics
[ ] ESP32 button press creates request
[ ] Light toggle command sent (if implemented)

Test 5: Voice Upload (if implemented)
[ ] Upload WAV file via Postman
[ ] Get transcription back
[ ] Service request created
[ ] Voice notes appear in request
[ ] Wear OS shows transcript
```

---

#### **Task 5.2: ESP32 Hardware Test**
```
Hardware checklist:
[ ] ESP32 powers on (LED animation starts)
[ ] WiFi connects (check Serial Monitor)
[ ] MQTT connects (check backend logs)
[ ] Button T1 press → service request created
[ ] Check battery voltage: ~3.93V (stable)
[ ] All 6 buttons work (T1-T6)
[ ] Shake detection works (emergency)
[ ] LED feedback on button press

If voice implemented:
[ ] Long press T1 → recording starts (blue LED)
[ ] Release → uploading (green LED)
[ ] Success flash (white LED)
[ ] Check backend received audio
[ ] Check transcription appeared
[ ] Check battery voltage stayed stable
```

---

### 🟢 PHASE 6: METSTRADE PREPARATION (2 hours)

#### **Task 6.1: Create Demo Script**
```
Scenario 1: Basic Service Request
1. Guest presses ESP32 button in VIP Cabin
2. Service request appears on screen
3. Crew member's watch vibrates
4. Crew accepts on watch
5. Request moves to "Serving Now"
6. Crew completes task
7. Request archived

Scenario 2: Voice Request (if working)
1. Guest holds button and speaks: "I need fresh towels"
2. ESP32 records and uploads
3. Transcription appears in service request
4. Crew sees voice notes
5. Workflow continues as above

Scenario 3: Light Toggle (if working)
1. Show MQTT-controlled light
2. Toggle on/off via system
3. Demonstrate IoT integration

Scenario 4: Emergency
1. Shake ESP32 device
2. Emergency alert triggered
3. All crew notified immediately
4. Higher priority request
```

---

#### **Task 6.2: Prepare Hardware & Documentation**
```
Pack for Metstrade:
[ ] NUC in protective case
[ ] Power adapter for NUC
[ ] Ethernet cable (backup)
[ ] ESP32 smart button with battery
[ ] Spare batteries
[ ] Wear OS watch (charged)
[ ] Watch charger
[ ] USB cables
[ ] Mobile hotspot (backup internet)
[ ] Printed troubleshooting guide
[ ] Printed credentials card
[ ] Backup Windows laptop (insurance)

Credentials Card:
NUC SSH: obedio / meinBruder!
Web Login: admin / admin123
NUC IP: 10.10.0.10 (Tailscale)
MQTT: 10.10.0.10:1883
Backend: http://10.10.0.10:3001
Frontend: http://10.10.0.10:3000

Known Limitations:
- Voice: [working/not-working/partial]
- Light: [working/not-working]
- Battery life: ~X hours
- Network: Requires WiFi or hotspot
```

---

#### **Task 6.3: Create Troubleshooting Guide**
```markdown
PROBLEM: Cannot access http://10.10.0.10:3000
FIX: Check Tailscale connected, or use local network IP

PROBLEM: Backend not responding
FIX: SSH to NUC, run: docker-compose -f docker-compose.prod.yml restart backend

PROBLEM: Service requests not appearing
FIX: Check MQTT connected, check WebSocket in browser console

PROBLEM: ESP32 not connecting
FIX: Check WiFi credentials, verify MQTT broker IP (10.10.0.10:1883)

PROBLEM: Voice upload fails
FIX: Check OpenAI API key in .env, check backend logs

PROBLEM: Everything fails
FIX: Use backup Windows laptop with working system
```

---

## ⏰ TIMELINE (24-hour countdown)

**Hour 0-3:** Phase 1 - Fix Windows audio upload
**Hour 3-4:** Phase 2 - Update ESP32 firmware
**Hour 4-6:** Phase 3 - Git push and merge
**Hour 6-9:** Phase 4 - Deploy to NUC
**Hour 9-12:** Phase 5 - Testing & validation
**Hour 12-14:** Phase 6 - Metstrade prep
**Hour 14-24:** Buffer + sleep + final checks

---

## ✅ SUCCESS CRITERIA

**System is ready when:**
1. ✅ NUC all containers healthy (including frontend!)
2. ✅ Can login at http://10.10.0.10:3000
3. ✅ ESP32 button creates service request
4. ✅ Wear OS receives notifications
5. ✅ Crew can accept/complete requests
6. ✅ Light toggle works (MQTT)
7. ✅ Voice upload works (or safely disabled)
8. ✅ Ran 3 complete demos successfully
9. ✅ All hardware packed and ready
10. ✅ Backup plan documented

---

## 🎯 READY TO EXECUTE

**All planning complete. Comprehensive todo list created. Ready to switch to Code mode and start implementation.**

**Approve to proceed?**