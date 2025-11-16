# Button Simulator Fixes Report
**Date:** 2025-11-16  
**Issue:** Voice transcription and DND button issues in button simulators

## Summary
Fixed critical issues in the page button simulator ([`src/components/pages/button-simulator.tsx`](src/components/pages/button-simulator.tsx)) that prevented voice transcription from working and caused DND toggle to desync location and guest states.

---

## Issues Identified

### Issue 1: Voice Transcription Not Working in Page Simulator ❌

**Problem:**
- **Widget simulator** ([`button-simulator-widget.tsx`](src/components/button-simulator-widget.tsx:432-476)): ✅ Works correctly - records audio, calls `/api/transcribe`, gets transcript
- **Page simulator** ([`button-simulator.tsx`](src/components/pages/button-simulator.tsx:239-254)): ❌ Didn't transcribe at all - just used hardcoded "Voice Message" text

**Root Cause:**
The page simulator was missing:
1. Real audio recording implementation (MediaRecorder API)
2. Audio transcription logic (fetch to `/api/transcribe`)
3. Transcript handling in service request

**Evidence:**
```typescript
// OLD CODE - No transcription
if (recordingDuration > 0.5) {
  generateServiceRequest("main", "Voice Message", true, recordingDuration);
}
```

### Issue 2: DND Button Causes Desync ⚠️

**Problem:**
- **Widget:** ✅ Uses [`DNDService.toggleDND()`](src/services/dnd.ts:22) - atomic operation
- **Page simulator:** ❌ Directly calls [`updateLocation()`](src/components/pages/button-simulator.tsx:439) then [`updateGuest()`](src/components/pages/button-simulator.tsx:446) - NOT atomic, can cause desync

**Root Cause:**
Non-atomic updates can fail partially:
- Location DND updates successfully
- Guest DND update fails → DESYNC
- Or vice versa

**Evidence:**
```typescript
// OLD CODE - Non-atomic, can desync
await updateLocation({ id: currentLocation.id, doNotDisturb: newDNDStatus });
if (guest) {
  updateGuest(guest.id, { doNotDisturb: newDNDStatus }); // Separate call!
}
```

### Issue 3: Voice Display in Service Requests ✅

**Status:** Already working correctly

The [`serving-request-card.tsx`](src/components/serving-request-card.tsx:223-230) component properly displays voice transcripts:
```tsx
{request.voiceTranscript && (
  <div className="mb-3 p-3 bg-muted/30 rounded-md">
    <p className="text-xs text-muted-foreground italic line-clamp-2">
      "{request.voiceTranscript}"
    </p>
  </div>
)}
```

---

## Fixes Applied

### Fix 1: Added Real Voice Transcription to Page Simulator

**Files Modified:**
- [`src/components/pages/button-simulator.tsx`](src/components/pages/button-simulator.tsx)

**Changes:**

1. **Added State Variables** (lines 91-96):
```typescript
const [isTranscribing, setIsTranscribing] = useState(false);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
```

2. **Added Audio Recording Functions** (lines 108-132):
```typescript
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  mediaRecorderRef.current = mediaRecorder;
  // ... recording logic
};
```

3. **Added Transcription Function** (lines 175-217):
```typescript
const transcribeAudio = async (audioBlob: Blob, duration: number) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  
  const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
  const data = await response.json();
  
  return data.translation || data.transcript; // English translation for crew
};
```

4. **Updated Button Handlers** (lines 321-371):
```typescript
const handleMainButtonDown = () => {
  if (!selectedLocation) return;
  setIsMainPressed(true);
  
  pressTimerRef.current = setTimeout(() => {
    startRecording(); // Now actually records!
  }, 500);
};

const handleMainButtonUp = async () => {
  if (isRecording && recordingDuration > 0.3) {
    const { transcript } = await stopRecording();
    const voiceMessage = transcript || "Voice Message";
    generateServiceRequest("main", voiceMessage, true, recordingDuration);
  }
};
```

**Result:** ✅ Page simulator now transcribes voice messages just like widget simulator

### Fix 2: Made DND Toggle Atomic

**Files Modified:**
- [`src/components/pages/button-simulator.tsx`](src/components/pages/button-simulator.tsx)

**Changes:**

1. **Added Import** (line 10):
```typescript
import { DNDService } from "../../services/dnd";
```

2. **Replaced DND Handler** (lines 425-471):
```typescript
// OLD - Non-atomic
await updateLocation({ id: currentLocation.id, doNotDisturb: newDNDStatus });
if (guest) {
  updateGuest(guest.id, { doNotDisturb: newDNDStatus });
}

// NEW - Atomic operation
const result = await DNDService.toggleDND(
  currentLocation.id,
  newDNDStatus,
  guest?.id,
  updateGuest,
  addActivityLog
);

if (result.success) {
  toast.success("DND toggled (Atomic)");
  console.log("Atomic DND:", result);
}
```

**Result:** ✅ DND toggle now uses atomic service, preventing desync

---

## Audio Upload Workflow Analysis

### Current Workflows

**1. Simulators (Widget & Page):**
- Endpoint: [`/api/transcribe`](backend/src/routes/transcribe.ts:61)
- Flow: Record → Transcribe → Return transcript → Manually create service request
- Use: Development testing only

**2. ESP32 Hardware:**
- Endpoint: [`/api/upload/upload-audio`](backend/src/routes/upload.ts:129)
- Flow: Upload → Transcribe → Auto-create service request → Notify crew
- Use: Production hardware

### Recommendation

**Keep current setup** - simulators don't need full ESP32 workflow because:
1. Simulators already create service requests via context/MQTT
2. `/api/transcribe` is faster (no database operations)
3. Separates testing concerns from production workflow
4. Widget uses MQTT to simulate real ESP32 behavior

ESP32 needs `/api/upload/upload-audio` because:
- Hardware can't create service requests itself
- Needs single atomic operation (upload + transcribe + create request)
- Includes device tracking and activity logging

---

## Verification Checklist

### ✅ Widget Simulator (Already Working)
- [x] Records real audio via MediaRecorder API
- [x] Transcribes via `/api/transcribe`
- [x] Sends transcript via MQTT
- [x] DND uses atomic `DNDService.toggleDND()`
- [x] Voice transcript visible in service request card

### ✅ Page Simulator (Now Fixed)
- [x] Records real audio via MediaRecorder API  
- [x] Transcribes via `/api/transcribe`
- [x] Creates service request with transcript
- [x] DND uses atomic `DNDService.toggleDND()`
- [x] Voice transcript visible in service request card

### ✅ Backend
- [x] `/api/transcribe` - Transcribe-only endpoint works
- [x] `/api/upload/upload-audio` - Full ESP32 workflow works
- [x] Both use OpenAI Whisper for transcription
- [x] Both handle language detection + English translation

### ✅ Display
- [x] [`serving-request-card.tsx`](src/components/serving-request-card.tsx:223-230) shows voice transcripts
- [x] Transcript appears in service request notes
- [x] Works in both compact and full display modes

---

## Testing Instructions

### Test Voice Transcription

1. **Open Button Simulator** (page or widget)
2. **Select a location** from dropdown
3. **Hold main button** for 1+ seconds
4. **Speak a message** into microphone
5. **Release button**
6. **Verify:**
   - Toast shows "Voice message transcribed!"
   - Service request created with actual transcript
   - Transcript visible in service request card

### Test DND Toggle

1. **Open Button Simulator** (page)
2. **Select a location** with a guest assigned
3. **Click DND button**
4. **Verify:**
   - Toast shows "DND Enabled (Atomic)"
   - Console logs atomic operation details
   - Both location AND guest DND status updated
   - No desync between location and guest

### Test ESP32 Audio Workflow

1. **ESP32 records audio** (30s max)
2. **POST to `/api/upload/upload-audio`** with:
   - `audio` file (WAV/WebM)
   - `deviceId` (optional)
   - `locationId` (optional)
   - `priority` (optional)
3. **Backend:**
   - Saves audio to `uploads/audio/`
   - Transcribes with OpenAI Whisper
   - Creates service request
   - Notifies crew via WebSocket + MQTT
4. **Verify:**
   - Audio file saved
   - Transcript in service request
   - Crew receives notification

---

## Files Modified

1. [`src/components/pages/button-simulator.tsx`](src/components/pages/button-simulator.tsx)
   - Added real audio recording
   - Added transcription logic
   - Fixed DND to use atomic service
   - Updated button handlers

## Files Analyzed (No Changes Needed)

1. [`src/components/button-simulator-widget.tsx`](src/components/button-simulator-widget.tsx) - Already correct
2. [`src/services/dnd.ts`](src/services/dnd.ts) - Atomic service working
3. [`src/components/serving-request-card.tsx`](src/components/serving-request-card.tsx) - Display working
4. [`backend/src/routes/transcribe.ts`](backend/src/routes/transcribe.ts) - Endpoint working
5. [`backend/src/routes/upload.ts`](backend/src/routes/upload.ts) - ESP32 workflow working

---

## Known Issues (Minor TypeScript Warnings)

The page simulator has some pre-existing TypeScript warnings unrelated to our fixes:
- Line 572: `g.preferences?.cabin` type issue (guest preferences structure)
- Line 573: `?.name` property on Guest type
- Line 841: Implicit `any` type on `value` parameter

These are cosmetic type issues that don't affect functionality and were present before our changes.

---

## Conclusion

**All issues resolved:**
1. ✅ Voice transcription now works in page simulator
2. ✅ DND button uses atomic service (no more desync)
3. ✅ Voice transcripts display correctly in service requests
4. ✅ Audio upload workflow documented and verified

**System is now consistent:**
- Both simulators use real transcription
- Both simulators use atomic DND service
- ESP32 has dedicated upload+transcribe+create workflow
- All paths properly display voice transcripts