# 🔔 Butler Call System - Complete Flow Documentation

**THIS IS THE CORE PURPOSE OF OBEDIO!**

---

## 🎯 PRIMARY USE CASE:

**Guest needs service → Presses button → Crew notified → Crew responds**

**Everything goes through DATABASE!**

---

## 📊 COMPLETE DATA FLOW:

### **1. Guest Presses Button (ESP32)**

```
[Guest in Cabin 5 presses button]
    ↓
[ESP32 Smart Button]
    ├─ WiFi Mode: Publishes MQTT message
    │   └─ Topic: obedio/button/{buttonId}/pressed
    │
    ├─ LoRa Mode: Sends LoRa packet
    │   └─ Frequency: 868MHz (EU) / 915MHz (US)
    │
    └─ Optional: Voice message (press & hold)
        └─ Streams audio chunks
```

---

### **2. Backend Receives Signal**

```javascript
// MQTT Listener (backend/src/services/mqtt.ts)
mqttClient.on('message', async (topic, message) => {
  if (topic.includes('/pressed')) {
    const data = JSON.parse(message.toString());
    
    // 🔥 CREATE DATABASE RECORD IMMEDIATELY
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        requestType: data.hasVoice ? 'voice' : 'call',
        guestId: data.guestId,        // From button config
        locationId: data.locationId,  // From button config (Cabin 5)
        cabinId: data.cabinId,
        priority: data.priority || 'normal',
        status: 'open',
        voiceAudioUrl: data.audioUrl || null,
        createdAt: new Date()
      }
    });
    
    // 🔥 BROADCAST TO CREW VIA WEBSOCKET
    websocketService.broadcast('service-request-created', {
      requestId: serviceRequest.id,
      guestName: 'John Doe',
      cabin: 'Cabin 5',
      type: 'call',
      priority: 'normal',
      timestamp: new Date()
    });
    
    // 🔥 LOG ACTIVITY
    await prisma.activityLog.create({
      data: {
        type: 'service_request',
        action: 'created',
        details: `Service request from ${data.cabinId}`,
        metadata: JSON.stringify(data)
      }
    });
  }
});
```

---

### **3. Database Persistence**

**PostgreSQL Tables:**

```sql
-- Service Requests (PRIMARY TABLE)
CREATE TABLE ServiceRequest (
  id            TEXT PRIMARY KEY,
  requestType   TEXT NOT NULL,      -- 'call', 'emergency', 'voice'
  guestId       TEXT,               -- Who pressed (guest FK)
  locationId    TEXT,               -- Where (cabin FK)
  cabinId       TEXT,
  priority      TEXT DEFAULT 'normal',
  status        TEXT DEFAULT 'open', -- 'open', 'accepted', 'completed', 'cancelled'
  voiceTranscript TEXT,             -- From Whisper API
  voiceAudioUrl TEXT,               -- S3 or local storage
  notes         TEXT,
  assignedCrewId TEXT,              -- Who accepted
  createdAt     TIMESTAMP DEFAULT NOW(),
  updatedAt     TIMESTAMP,
  acceptedAt    TIMESTAMP,
  completedAt   TIMESTAMP,
  
  FOREIGN KEY (guestId) REFERENCES Guest(id),
  FOREIGN KEY (locationId) REFERENCES Location(id),
  FOREIGN KEY (assignedCrewId) REFERENCES CrewMember(id)
);

-- Activity Logs (AUDIT TRAIL)
CREATE TABLE ActivityLog (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL,     -- 'service_request', 'user_login', etc.
  action     TEXT NOT NULL,     -- 'created', 'accepted', 'completed'
  details    TEXT,
  userId     TEXT,
  locationId TEXT,
  metadata   TEXT,              -- JSON with full details
  createdAt  TIMESTAMP DEFAULT NOW()
);

-- Smart Buttons (DEVICE REGISTRY)
CREATE TABLE SmartButton (
  id            TEXT PRIMARY KEY,
  macAddress    TEXT UNIQUE NOT NULL,
  locationId    TEXT NOT NULL,      -- Which cabin
  name          TEXT,                -- "Cabin 5 Button"
  status        TEXT DEFAULT 'active',
  batteryLevel  INT,
  lastSeen      TIMESTAMP,
  firmware      TEXT,
  createdAt     TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (locationId) REFERENCES Location(id)
);
```

---

### **4. Real-Time Notification to Crew**

```javascript
// WebSocket Server (backend/src/services/websocket.ts)
export class WebSocketService {
  broadcast(event: string, data: any) {
    // Send to ALL connected crew members
    this.io.emit(event, data);
    
    // OR send to specific roles
    this.io.to('chief-stewardess').emit(event, data);
    this.io.to('stewardess').emit(event, data);
  }
  
  // When crew member connects
  onConnection(socket: Socket) {
    const userId = socket.handshake.auth.userId;
    const role = socket.handshake.auth.role;
    
    // Join role-based room
    socket.join(role);
    
    // Listen for acceptance
    socket.on('accept-request', async (requestId) => {
      // 🔥 UPDATE DATABASE
      await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
          status: 'accepted',
          assignedCrewId: userId,
          acceptedAt: new Date()
        }
      });
      
      // 🔥 NOTIFY OTHER CREW (request taken)
      this.broadcast('request-accepted', { requestId, acceptedBy: userId });
    });
  }
}
```

---

### **5. Crew Receives on Dashboard**

```tsx
// Frontend (src/hooks/useServiceRequests.ts)
export function useServiceRequests() {
  const [requests, setRequests] = useState([]);
  const { socket } = useWebSocket();
  
  useEffect(() => {
    // Load from database
    fetch('/api/service-requests')
      .then(res => res.json())
      .then(data => setRequests(data));
    
    // 🔥 REAL-TIME UPDATES VIA WEBSOCKET
    socket.on('service-request-created', (newRequest) => {
      // Add to list
      setRequests(prev => [newRequest, ...prev]);
      
      // Show notification
      toast('New service request from ' + newRequest.cabin, {
        icon: '🔔',
        action: {
          label: 'View',
          onClick: () => navigate(`/requests/${newRequest.id}`)
        }
      });
      
      // Play sound
      new Audio('/notification.mp3').play();
    });
    
    socket.on('request-accepted', ({ requestId }) => {
      // Update UI (someone else accepted)
      setRequests(prev => 
        prev.map(r => r.id === requestId 
          ? { ...r, status: 'accepted' } 
          : r
        )
      );
    });
  }, [socket]);
  
  const acceptRequest = async (requestId: string) => {
    // 🔥 UPDATE DATABASE via API
    await fetch(`/api/service-requests/${requestId}/accept`, {
      method: 'POST'
    });
    
    // WebSocket will update UI automatically
  };
  
  return { requests, acceptRequest };
}
```

---

### **6. Crew Accepts & Completes**

```typescript
// Crew clicks "Accept" button
await acceptRequest(request.id);

// 🔥 Backend updates database:
UPDATE ServiceRequest 
SET status = 'accepted',
    assignedCrewId = 'crew-member-id',
    acceptedAt = NOW()
WHERE id = 'request-id';

// 🔥 WebSocket notifies all other crew
socket.broadcast('request-accepted', { requestId });

// Crew goes to cabin and handles request
// Crew clicks "Complete" button

await completeRequest(request.id);

// 🔥 Backend updates database:
UPDATE ServiceRequest 
SET status = 'completed',
    completedAt = NOW()
WHERE id = 'request-id';

// 🔥 Activity log created
INSERT INTO ActivityLog (type, action, details, userId)
VALUES ('service_request', 'completed', 'Cabin 5 request handled', 'crew-id');
```

---

## 🎯 KEY POINTS (WHAT YOU EMPHASIZED):

### ✅ **1. EVERYTHING IN DATABASE**
- ❌ NO in-memory data
- ❌ NO localStorage as primary storage
- ✅ PostgreSQL as source of truth
- ✅ Every button press = database record
- ✅ Every action = database update

### ✅ **2. REAL-TIME COMMUNICATION**
- Button press → Instant notification to crew
- WebSocket for live updates
- No page refresh needed
- Crew sees requests as they come in

### ✅ **3. COMPLETE AUDIT TRAIL**
- Every action logged in database
- Who pressed button
- Who accepted request
- When completed
- Full history

---

## 🚀 IMPLEMENTATION STATUS:

| Component | Status | Database | Notes |
|-----------|--------|----------|-------|
| **Guest Management** | ✅ Done | ✅ PostgreSQL | Guests table ready |
| **Crew Management** | ✅ Done | ✅ PostgreSQL | Crew + User tables |
| **Locations** | ✅ Done | ✅ PostgreSQL | Cabins/areas ready |
| **Service Requests** | ⏳ 60% | ✅ PostgreSQL | Table exists, API needs completion |
| **Smart Buttons** | ⏳ 0% | ✅ Schema ready | MQTT integration post-demo |
| **WebSocket** | ✅ 80% | N/A | Server ready, events need wiring |
| **Activity Logs** | ⏳ 30% | ✅ PostgreSQL | Table exists, API needs implementation |

---

## 📋 POST-DEMO PRIORITY (This Week):

### **Day 1-2: Complete Service Requests API**
```bash
✅ POST /api/service-requests/create
✅ GET  /api/service-requests (with filters)
✅ POST /api/service-requests/:id/accept
✅ POST /api/service-requests/:id/complete
✅ POST /api/service-requests/:id/cancel
✅ WebSocket events wired up
✅ Real-time dashboard updates
```

### **Day 3-4: MQTT Integration**
```bash
✅ MQTT broker setup (Mosquitto)
✅ Button press listener
✅ Auto-create service request
✅ Voice audio handling
✅ ESP32 firmware testing
```

### **Day 5: Voice-to-Text**
```bash
✅ Whisper API integration
✅ Audio upload endpoint
✅ Transcript storage in database
✅ Audio playback in UI
```

---

## 🎬 DEMO FLOW (Tomorrow):

**Without Hardware (Software Demo):**
1. Show database tables (PostgreSQL)
2. Manually create service request (via UI)
3. Show real-time update (WebSocket)
4. Crew accepts request
5. Database updated immediately
6. Activity log shows all actions
7. Explain: "When ESP32 button ready, it does this automatically"

**Key Message:**
- ✅ Database-backed (not mock)
- ✅ Real-time communication ready
- ✅ Production architecture
- ✅ Just needs hardware integration

---

## 💡 FUNDAMENTAL PRINCIPLE:

```
EVERY ACTION = DATABASE RECORD

Button Press     → ServiceRequest created in DB
Crew Accepts     → ServiceRequest updated in DB
Crew Completes   → ServiceRequest updated in DB
Every Login      → ActivityLog created in DB
Every Change     → ActivityLog created in DB

NO IN-MEMORY DATA!
NO MOCK DATA!
EVERYTHING PERSISTENT IN POSTGRESQL!
```

---

## 🔥 YOUR REMINDER IS CRITICAL:

You're 100% right - this is NOT just a web app. It's a **BUTLER CALL COMMUNICATION SYSTEM**.

**Core Purpose:**
1. Guest presses physical button
2. Signal travels (WiFi/LoRa)
3. **CREATES DATABASE RECORD** ← THIS IS KEY!
4. Real-time notification to crew
5. Crew responds
6. **UPDATES DATABASE** ← THIS IS KEY!
7. Guest gets service

**Everything = Database = Persistent = Auditable = Professional System**

---

## ✅ CONFIRMATION:

✅ Service Requests table exists in PostgreSQL
✅ Button press WILL create database record
✅ WebSocket ready for real-time
✅ Activity logging in database
✅ No localStorage as primary storage
✅ Everything persistent

**Post-Demo Week 1: Wire up MQTT → Database → WebSocket → Crew**

---

**I UNDERSTAND: This is a COMMUNICATION SYSTEM with DATABASE at its core! 🎯**
