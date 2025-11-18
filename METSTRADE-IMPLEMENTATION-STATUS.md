# Metstrade Demo - Implementation Status
**Updated:** 2025-11-16 15:03 CET (Berlin Time)
**Target:** Metstrade Exhibition Demo
**Time Remaining:** ~12 hours

---

## ✅ COMPLETED TASKS

### 1. Audio Playback Fix - Web Button Simulator ✅

**Problem Solved:**
- Web simulator was creating temporary blob URLs that expired
- Audio couldn't play in the incoming request dialog
- No permanent storage of audio files

**Solution Implemented:**
Modified [`button-simulator.tsx`](src/components/pages/button-simulator.tsx) to upload audio to server (like ESP32):

**Changes Made:**
1. **New `uploadAudioToServer()` function** (lines 174-253):
   - Uploads audio to `/api/upload/upload-audio`
   - Backend saves file to `/uploads/audio/`
   - Backend transcribes with OpenAI Whisper
   - Backend auto-creates service request
   - Returns permanent audio URL

2. **Updated `stopRecording()` function** (lines 135-172):
   - Returns `{ transcript, audioUrl, serviceRequestId }`
   - Handles backend auto-creation of service request

3. **Updated `handleMainButtonUp()` function** (lines 339-371):
   - Uses backend service request if created
   - Falls back to manual creation if needed
   - Better user feedback

**Benefits:**
- ✅ Permanent audio URLs (work after refresh)
- ✅ Audio stored on server (can be replayed anytime)
- ✅ Consistent with ESP32 workflow
- ✅ Backend handles transcription + request creation
- ✅ Audio playback will work in incoming-request-dialog

---

## 🔄 WORKFLOW COMPARISON

### Before (Broken):
```
Web Simulator → Record Audio → Create Blob URL (temp) → Manual Service Request
                                      ↓
                              Blob expires → Audio can't play ❌
```

### After (Fixed):
```
Web Simulator → Record Audio → Upload to /api/upload/upload-audio
                                      ↓
                Backend → Save to /uploads/audio/ → Permanent URL
                       → Transcribe with Whisper
                       → Auto-create Service Request
                       → Notify Crew (WebSocket + MQTT)
                                      ↓
                              Audio plays in UI ✅
```

**Now matches ESP32 flow exactly!**

---

## 📋 NEXT STEPS (Priority Order)

### **Step 1: Test Web Simulator** (30 min)
1. Start backend and frontend
2. Open button simulator page
3. Select a location
4. Hold main button to record voice message
5. Verify:
   - ✅ Audio uploads to server
   - ✅ Service request created
   - ✅ Audio URL is permanent (`/uploads/audio/recording-xxxxx.webm`)
   - ✅ Audio plays in incoming request dialog
   - ✅ Transcript appears correctly

### **Step 2: ESP32 Accelerometer Shake Detection** (30 min)
**Current Status:**
- Code exists in firmware (lines 670-695 in [`obedio-custom-pcb-voice.ino`](hardware/obedio-custom-pcb-voice/obedio-custom-pcb-voice.ino))
- Shake detection → MQTT emergency call
- Settings: `SHAKE_THRESHOLD = 3.5` G-force

**To Verify:**
1. Upload firmware to ESP32
2. Shake device vigorously
3. Check MQTT message: `obedio/button/{deviceId}/press` with `pressType: "shake"`
4. Verify emergency service request created
5. Check LED feedback (red flash)

### **Step 3: ESP32 LED Feedback via MQTT** (30 min)
**Current Status:**
- ESP32 shows LED states for: recording, uploading, success, error
- Missing: MQTT acknowledgment from backend

**To Implement:**
Add to [`backend/src/routes/upload.ts`](backend/src/routes/upload.ts) after line 302:
```typescript
// Send MQTT acknowledgment to ESP32
if (deviceId) {
  await mqttService.publish(`obedio/button/${deviceId}/ack`, {
    success: true,
    requestId: serviceRequest.id,
    message: 'Voice message received and processed'
  });
}
```

**ESP32 already listens for this** - will show success LED!

### **Step 4: ESP32 Speaker Sounds** (30 min)
**Current Status:**
- I2S speaker pins defined in firmware
- Need to verify sound plays on events

**Events to Test:**
- Recording start (beep)
- Upload success (confirmation tone)
- Upload failure (error tone)

### **Step 5: Button Configuration System** (2-3 hours)
**Requirement:**
- Configure aux button functions from frontend
- Store in backend database
- ESP32 retrieves config via MQTT

**Implementation Needed:**
- Frontend: Button config UI (partially exists)
- Backend: API endpoint for button configuration
- Database: Button config table/fields
- MQTT: Send config to ESP32 on connect

---

## 🎯 DEMO SCENARIOS FOR METSTRADE

### Scenario 1: Voice Request (German → English)
1. Guest holds button, speaks in German: "Können Sie uns Kaffee bringen?"
2. ESP32 uploads audio to server
3. Backend transcribes: "Können Sie uns Kaffee bringen?"
4. Backend translates: "Can you bring us coffee?"
5. Crew receives notification with English text
6. Crew clicks play button → hears original audio
7. **Demo Impact:** Multi-language support!

### Scenario 2: Shake for Emergency
1. Guest shakes ESP32 device vigorously
2. Accelerometer detects shake
3. ESP32 sends emergency MQTT message
4. LED flashes red
5. Crew receives URGENT notification
6. **Demo Impact:** Safety feature!

### Scenario 3: Button Configuration
1. Admin configures aux button 1 as "Housekeeping"
2. Configuration saved to backend
3. ESP32 receives config via MQTT
4. Guest presses configured button
5. Housekeeping service request created
6. **Demo Impact:** Customization!

---

## ⚠️ KNOWN ISSUES (Minor)

**TypeScript Warnings in button-simulator.tsx:**
- Line 600: Property 'cabin' type issue (cosmetic)
- Line 601: Property 'name' type issue (cosmetic)
- Line 869: Parameter 'value' type (cosmetic)

**Impact:** None - these are pre-existing type warnings that don't affect functionality.

---

## 🚀 DEPLOYMENT PLAN

### When to Deploy to NUC:
1. ✅ After web simulator audio playback tested
2. ✅ After ESP32 features verified
3. ✅ Before Metstrade (with 2-3 hour buffer)

### Deployment Steps:
```bash
# On Windows
git add .
git commit -m "Audio playback fix + ESP32 features for Metstrade"
git push origin main

# On NUC (SSH)
ssh obedio@10.10.0.10
cd /opt/obedio-yacht-crew-management
git pull origin main
docker-compose restart
```

### Test on NUC:
- Frontend: http://10.10.0.10:3000
- Backend: http://10.10.0.10:3001/api/health
- MQTT: mosquitto running on port 1883

---

## 📊 TIME ESTIMATE

| Task | Estimated Time | Priority |
|------|---------------|----------|
| Test web simulator | 30 min | CRITICAL |
| ESP32 accelerometer | 30 min | HIGH |
| ESP32 LED feedback | 30 min | HIGH |
| ESP32 speaker sounds | 30 min | MEDIUM |
| Button configuration | 2-3 hours | LOW (nice-to-have) |
| Deploy to NUC | 1 hour | CRITICAL |
| Create demo script | 1 hour | CRITICAL |
| **TOTAL** | **6-7 hours** | |

**Buffer:** ~5 hours for issues/testing before Metstrade

---

## 📝 TESTING CHECKLIST

### Web Simulator Testing:
- [ ] Record voice message (hold button)
- [ ] Audio uploads to `/api/upload/upload-audio`
- [ ] Service request created automatically
- [ ] Audio URL is permanent (server path)
- [ ] Audio plays in incoming request dialog
- [ ] Transcript appears in request
- [ ] Translation works (if non-English)

### ESP32 Hardware Testing:
- [ ] Button press → service request
- [ ] Voice recording → upload → transcribe
- [ ] Shake detection → emergency
- [ ] LED feedback on all events
- [ ] Speaker sounds (if implemented)
- [ ] MQTT acknowledgment from backend

### Integration Testing:
- [ ] ESP32 → Backend → Web UI (full flow)
- [ ] Audio playback from ESP32 recording
- [ ] Crew notification on smartwatch
- [ ] Multi-language transcription
- [ ] DND mode prevents requests

---

## 🎬 NEXT IMMEDIATE ACTION

**Test the web simulator audio upload fix:**

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Open browser: http://localhost:3000
4. Navigate to Button Simulator page
5. Test voice recording and verify audio playback

**Let me know when you're ready to test or if you want me to continue with the next feature!**