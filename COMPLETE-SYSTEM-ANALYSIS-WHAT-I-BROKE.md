# Complete System Analysis - What I Broke and How to Fix It
**Created:** 2025-11-16 15:33 UTC
**Purpose:** Detailed analysis of every change I made and what broke

---

## 📊 System Architecture (Mermaid)

```mermaid
graph TB
    subgraph Frontend
        Widget[button-simulator-widget.tsx]
        Page[button-simulator.tsx]
        ServiceReq[service-requests.tsx]
        Popup[incoming-request-dialog.tsx]
    end
    
    subgraph Backend_APIs
        Upload[/api/upload/upload-audio]
        Transcribe[/api/transcribe]
        ServiceReqAPI[/api/service-requests]
    end
    
    subgraph Services
        MQTT[mqtt.service.ts]
        WebSocket[websocket.ts]
        DB[(PostgreSQL)]
    end
    
    subgraph Devices
        ESP32[ESP32 Button]
        Watch[Wear OS Watch]
    end
    
    Widget -->|HTTP POST| Upload
    Widget -->|Was using| Transcribe
    Upload --> DB
    Upload --> MQTT
    Upload --> WebSocket
    
    ESP32 -->|MQTT| MQTT
    MQTT --> DB
    MQTT --> WebSocket
    MQTT --> Watch
    
    Watch -->|Accept| MQTT
    MQTT -->|Update| DB
    MQTT --> WebSocket
    
    WebSocket --> Popup
    WebSocket --> ServiceReq
    DB --> ServiceReqAPI
    ServiceReqAPI --> ServiceReq
```

---

## 📋 Every API Being Used (From OBEDIO-API-MASTER-REFERENCE.md)

### Service Requests APIs:
1. **GET /api/service-requests** - List all requests (useServiceRequestsApi hook)
2. **POST /api/service-requests** - Create request  
3. **PUT /api/service-requests/:id/accept** - Accept request (useAcceptServiceRequest)
4. **PUT /api/service-requests/:id/complete** - Complete request
5. **DELETE /api/service-requests/clear-all** - Clear all

### Audio APIs:
1. **POST /api/transcribe** - Transcribe audio only (was working)
2. **POST /api/upload/upload-audio** - Upload + transcribe + create request (I added)
3. **POST /api/upload/image** - Upload images

### MQTT Topics:
1. `obedio/button/{deviceId}/press` - Button press from ESP32
2. `obedio/watch/{deviceId}/notification` - Notify watch
3. `obedio/watch/{deviceId}/acknowledge` - Watch accepts request
4. `obedio/device/{deviceId}/command` - Commands to ESP32

### WebSocket Events:
1. `service-request:created` - New request
2. `service-request:updated` - Request status changed  
3. `service-request:assigned` - Request assigned to crew
4. `service-request:completed` - Request completed

---

## 🔴 What I Changed (LINE BY LINE)

### File 1: button-simulator-widget.tsx

**BEFORE (Working):**
```typescript
// Line 432-475: transcribeAudio function
const transcribeAudio = async (audioBlob, duration) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('duration', duration);
  
  const response = await fetch('/api/transcribe', {  // ← Was using transcribe endpoint
    method: 'POST',
    body: formData
  });
  
  // Got transcript only
  // Then called generateServiceRequest() via MQTT
  mqttClient.publishButtonPress(deviceId, {
    pressType: 'long',
    voiceTranscript: transcript,
    audioUrl: blobUrl  // ← Temporary blob URL
  });
};
```

**AFTER (What I Changed - BROKE IT):**
```typescript
// Changed to upload to /api/upload/upload-audio
const response = await fetch('/api/upload/upload-audio', {  // ← NEW endpoint
  method: 'POST',
  body: formData
});

// Now backend creates service request automatically
// NO MQTT publish
// NO generateServiceRequest() call
```

**What This Broke:**
- ❌ No MQTT message sent → ESP32 doesn't get button press logged
- ❌ Service request created by backend, not via MQTT flow
- ❌ Different code path → different behavior
- ❌ Lost shake detection
- ❌ Lost aux button handling

---

### File 2: backend/src/routes/upload.ts

**BEFORE:** Didn't exist or was simple image upload only

**AFTER (What I Added):**
- Lines 104-327: Complete `/upload-audio` endpoint
- Transcribes audio
- Creates service request directly
- Sends WebSocket event
- Calls MQTT notification

**What This Broke:**
- ❌ Different service request creation flow than MQTT handler
- ❌ May not have all same fields
- ❌ May not trigger same events

---

### File 3: backend/src/services/mqtt.service.ts

**BEFORE:** Had `handleButtonPress()` that created service requests

**AFTER (What Debug Mode Changed):**
- Line 360: Added `voiceAudioUrl: message.audioUrl`
- Line 871: Added `voiceAudioUrl` to watch notification

**What This May Have Broken:**
- ❌ Changed data structure
- ❌ May not match what watch expects

---

###File 4: backend/prisma/schema.prisma

**BEFORE:** ServiceRequest model line 214 had NO `voiceAudioUrl` field

**AFTER (What I Added):**
- Line 214: Added `voiceAudioUrl String?`

**What This Broke:**
- ❌ Database schema changed
- ❌ Old code doesn't know about new field
- ❌ May cause type errors

---

## 🎯 Root Cause Analysis

### **Why Virtual Button Broke:**

**Flow Change:**
```
BEFORE (Working):
Record → /api/transcribe → Get transcript → 
MQTT publish → Backend MQTT handler → Create request → 
WebSocket → Popup → Wear OS

AFTER (Broken):
Record → /api/upload/upload-audio → Backend creates request →
??? (No MQTT publish from widget!) →
NO proper event flow
```

**The Problem:**
- I changed widget to skip MQTT
- Backend upload endpoint creates request
- But doesn't trigger same events/flow as MQTT handler
- Lost: shake detection, aux buttons, proper MQTT flow

---

## ✅ The Fix

### **Option 1: Revert Widget to MQTT Flow (RECOMMENDED)**

**Restore button-simulator-widget.tsx to:**
- Use `/api/upload/upload-audio` for actual file upload
- Get back audioUrl and transcript
- BUT THEN call `mqttClient.publishButtonPress()` with audioUrl
- Let MQTT handler create service request (original flow)
- This preserves shake, aux buttons, all original logic

### **Option 2: Complete Upload Endpoint Properly**

**Make /api/upload/upload-audio match MQTT handler exactly:**
- Accept deviceId, locationId, button, pressType parameters
- Use SAME service request creation logic as MQTT handler
- Trigger SAME WebSocket events
- Call SAME notification functions

---

## 📝 Detailed Comparison Needed

I need to compare these files LINE BY LINE:
1. button-simulator-widget.tsx (current vs OBEDIO Final)
2. mqtt.service.ts (current vs OBEDIO Final)  
3. upload.ts (current vs OBEDIO Final)
4. schema.prisma (current vs OBEDIO Final)

**Should I create this detailed comparison document?**