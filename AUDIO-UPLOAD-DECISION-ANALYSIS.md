# Audio Upload Implementation Decision
**Date:** 2025-11-16 12:24 UTC
**Decision:** Keep [`upload.ts`](backend/src/routes/upload.ts:1), Delete [`upload-audio.ts`](backend/src/routes/upload-audio.ts:1)

---

## 📊 Comparison Analysis

### upload-audio.ts (124 lines)
**Purpose:** Simple audio file upload
**Features:**
- ✅ Saves audio to uploads/audio/
- ✅ Returns audioUrl
- ❌ NO transcription integration
- ❌ NO service request creation
- ❌ NO WebSocket notifications
- ❌ NO MQTT integration
- ❌ **NOT registered in server.ts**

**Pros:** Simple, focused
**Cons:** Incomplete, not working

---

### upload.ts /upload-audio endpoint (lines 104-326)
**Purpose:** Complete voice-to-text workflow
**Features:**
- ✅ Saves audio to uploads/audio/
- ✅ OpenAI Whisper transcription
- ✅ Multi-language support + translation
- ✅ Creates ServiceRequest with voice notes
- ✅ WebSocket emit for real-time updates
- ✅ MQTT notification to Wear OS
- ✅ Activity logging
- ✅ **Already registered in server.ts** (line 158)

**Pros:** Complete workflow, already integrated
**Cons:** Mixed with image uploads (but well-organized)

---

## ✅ Decision: Keep [`upload.ts`](backend/src/routes/upload.ts:116)

**Reasons:**
1. Already registered - works immediately
2. Has complete transcription integration
3. Creates service requests automatically
4. Notifies Wear OS via MQTT
5. Real-time WebSocket updates
6. Just needs endpoint path verification

**Action:**
- DELETE [`upload-audio.ts`](backend/src/routes/upload-audio.ts:1)
- KEEP [`upload.ts`](backend/src/routes/upload.ts:1) /upload-audio endpoint
- Endpoint will be: `POST /api/upload/upload-audio`

---

## ⚠️ Endpoint Path Note

**ESP32 Firmware expects:** `/api/upload-audio`
**Our endpoint provides:** `/api/upload/upload-audio`

**Solution:** Update ESP32 firmware to use correct path, OR add alias route.

**Recommendation:** Update ESP32 (simpler, cleaner)