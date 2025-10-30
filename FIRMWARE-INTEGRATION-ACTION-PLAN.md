# 🎯 FIRMWARE INTEGRATION ACTION PLAN
## Završavanje OBEDIO Hardware-Software Integracije

**Datum**: October 27, 2025
**Status**: 🟡 Backend integracija incomplete
**Prioritet**: 🔴 KRITIČNO - Blocking production deployment

---

## 📊 TRENUTNA SITUACIJA

### ✅ ŠTA RADI (COMPLETED)

**Firmware (T-Watch S3)**:
- ✅ Firmware kompletiran sa LilyGoLib bibliotekom
- ✅ WiFi povezivanje
- ✅ MQTT klijent implementiran
- ✅ Device registration (šalje na startup)
- ✅ Heartbeat (šalje svakih 30s)
- ✅ Touch UI sa LVGL
- ✅ Vibration motor control
- ✅ Prikazivanje notifikacija na display-u
- ✅ Touch acknowledgement (šalje MQTT ACK)

**Backend**:
- ✅ MQTT servis implementiran
- ✅ Subscribe na device registration (`obedio/device/register`)
- ✅ Subscribe na device heartbeat (`obedio/device/heartbeat`)
- ✅ Subscribe na watch acknowledgement (`obedio/watch/+/acknowledge`)
- ✅ Service request CRUD API
- ✅ WebSocket broadcast za frontend

**Database**:
- ✅ Device table sa type, status, battery, rssi
- ✅ ServiceRequest table
- ✅ CrewMember table
- ✅ Button press creates service request

---

## ❌ ŠTA NE RADI (MISSING)

### 1. **Backend → Watch Notification Flow** 🔴 KRITIČNO
**Problem**: Kada se kreira service request, backend NE šalje notifikaciju na watch!

**Trenutno ponašanje**:
```
Button Press → Backend → Database → WebSocket to Frontend ✅
                                  ↘ MQTT to Watch ❌ MISSING!
```

**Što treba**:
```
Button Press → Backend → Database → WebSocket to Frontend ✅
                                  ↘ MQTT to Watch ✅ NEEDS IMPLEMENTATION
```

**Files affected**:
- `backend/src/routes/service-requests.ts` - POST `/` endpoint
- `backend/src/services/mqtt.service.ts` - dodati `publishWatchNotification()` metod

---

### 2. **Watch Acknowledgement Processing** 🔴 KRITIČNO
**Problem**: Backend prima ACK od watch-a ali ga NE procesira!

**Trenutno ponašanje**:
```typescript
// mqtt.service.ts linija 119
this.TOPICS.WATCH_ACKNOWLEDGE,  // Subscribes ✅
```

Ali u `handleMessage()` metodi (linija 136+):
```typescript
// Nema handling za watch acknowledgement! ❌
```

**Što treba**:
- Kada watch pošalje ACK, backend mora update service request status
- Broadcast update preko WebSocket-a na frontend

**Files affected**:
- `backend/src/services/mqtt.service.ts` - dodati `handleWatchAcknowledgement()` metod

---

### 3. **Crew Member → Device Assignment** 🟠 HIGH
**Problem**: Ne znamo kako je watch assigned crew member-u!

**Database check needed**:
```prisma
model CrewMember {
  id         String
  firstName  String
  lastName   String
  deviceId   String?  // ❓ Da li ovo postoji?
  device     Device?  // ❓ Da li je relationship setup?
}
```

**Što treba proveriti**:
1. Da li `CrewMember` ima `deviceId` field?
2. Da li postoji relationship `CrewMember → Device`?
3. Kada assignujemo watch crew member-u, da li update-ujemo ovo u bazi?

**Files to check**:
- `backend/prisma/schema.prisma`
- `backend/src/routes/crew.ts` - crew assignment logic

---

### 4. **Service Request → Crew Member Assignment** 🟠 HIGH
**Problem**: Kada se kreira service request, mora se odrediti ko je assigned!

**Trenutno**:
```typescript
// service-requests.ts
router.post('/', validate(CreateServiceRequestSchema), async (req, res) => {
  const request = await dbService.createServiceRequest(req.body);
  // ❌ Ne određuje ko je assigned crew member!
});
```

**Što treba**:
- Button press mora da sadrži location
- Location mora da ima default assigned crew member
- Ili: Smart assignment logic (ko je on-duty, ko je najbliži, itd.)

**Files affected**:
- `backend/src/services/database.ts` - `createServiceRequest()` metod
- `backend/prisma/schema.prisma` - proveriti relationships

---

## 🎯 ACTION ITEMS - PRIORITIZED

### **FAZA 1: Kritični Backend Changes** (4-6 hours)

#### Task 1.1: Proveriti Database Schema
**Time**: 30 min
**File**: `backend/prisma/schema.prisma`

**Actions**:
1. Proveriti da li `CrewMember` ima `deviceId` field
2. Proveriti relationship između `CrewMember` i `Device`
3. Ako ne postoji, dodati:
   ```prisma
   model CrewMember {
     deviceId  String? @unique
     device    Device? @relation(fields: [deviceId], references: [id])
   }

   model Device {
     assignedCrewMemberId  String? @unique
     assignedCrewMember    CrewMember?
   }
   ```
4. Ako je potrebna izmena, napraviti migration:
   ```bash
   npx prisma migrate dev --name add_crew_device_relationship
   ```

---

#### Task 1.2: Implementirati `publishWatchNotification()` u MQTT Service
**Time**: 1 hour
**File**: `backend/src/services/mqtt.service.ts`

**Implementation**:
```typescript
/**
 * Publish notification to crew member's watch
 */
async publishWatchNotification(
  deviceId: string,
  notification: {
    requestId: string;
    location: string;
    message: string;
    guest?: string;
    priority: string;
    timestamp: string;
  }
): Promise<void> {
  if (!this.client || !this.isConnected) {
    console.error('❌ Cannot publish: MQTT not connected');
    return;
  }

  const topic = `obedio/watch/${deviceId}/notification`;
  const payload = JSON.stringify(notification);

  this.client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ Failed to publish to ${topic}:`, err);
    } else {
      console.log(`✅ Published notification to ${topic}`);
    }
  });
}
```

**Location**: Dodati posle `publish()` metoda (oko linije 250)

---

#### Task 1.3: Integracija sa Service Request Creation
**Time**: 1 hour
**File**: `backend/src/routes/service-requests.ts`

**Current code** (linija 22-29):
```typescript
router.post('/', validate(CreateServiceRequestSchema), async (req, res) => {
  const request = await dbService.createServiceRequest(req.body);
  websocketService.emitServiceRequestCreated(request);
  res.status(201).json({ success: true, data: request });
});
```

**New code**:
```typescript
import { mqttService } from '../services/mqtt.service';

router.post('/', validate(CreateServiceRequestSchema), async (req, res) => {
  const request = await dbService.createServiceRequest(req.body);

  // Broadcast to frontend via WebSocket
  websocketService.emitServiceRequestCreated(request);

  // NEW: Send notification to assigned crew member's watch
  if (request.assignedTo) {
    // Find crew member's assigned device
    const crewMember = await prisma.crewMember.findUnique({
      where: { id: request.assignedTo },
      include: { device: true }
    });

    if (crewMember?.device && crewMember.device.type === 'watch') {
      await mqttService.publishWatchNotification(crewMember.device.id, {
        requestId: request.id,
        location: request.location?.name || 'Unknown Location',
        message: request.message || 'Service request',
        guest: request.guest ? `${request.guest.firstName} ${request.guest.lastName}` : undefined,
        priority: request.priority,
        timestamp: new Date().toISOString()
      });
    }
  }

  res.status(201).json({ success: true, data: request });
});
```

---

#### Task 1.4: Implementirati Watch Acknowledgement Handling
**Time**: 1.5 hours
**File**: `backend/src/services/mqtt.service.ts`

**Add to `handleMessage()` metod** (oko linije 180):
```typescript
// Handle watch acknowledgement
if (topic.includes('/acknowledge')) {
  await this.handleWatchAcknowledgement(message);
  return;
}
```

**Implementacija metoda**:
```typescript
/**
 * Handle watch acknowledgement from crew member
 */
private async handleWatchAcknowledgement(message: any): Promise<void> {
  console.log('✅ Watch acknowledgement received:', message);

  try {
    const { requestId, deviceId, acknowledgedAt } = message;

    if (!requestId) {
      console.error('❌ Watch ACK missing requestId');
      return;
    }

    // Update service request status to 'accepted'
    const request = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'accepted',
        acceptedAt: acknowledgedAt ? new Date(acknowledgedAt) : new Date()
      },
      include: {
        location: true,
        guest: true
      }
    });

    console.log(`✅ Service request ${requestId} marked as accepted`);

    // Broadcast update to frontend via WebSocket
    if (this.io) {
      this.io.emit('service-request:updated', request);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: 'SERVICE_REQUEST',
        action: 'Service request acknowledged via watch',
        details: `Request acknowledged by device ${deviceId}`,
        userId: request.assignedTo,
        metadata: { requestId, deviceId }
      }
    });

  } catch (error) {
    console.error('❌ Error handling watch acknowledgement:', error);
  }
}
```

---

#### Task 1.5: Export mqttService Instance
**Time**: 15 min
**File**: `backend/src/services/mqtt.service.ts`

**Na kraju fajla** (trenutno linija 890+):
```typescript
export const mqttService = new MQTTService();
export default mqttService;
```

**Proveriti da je** exportovan kao singleton!

---

### **FAZA 2: Smart Assignment Logic** (2-3 hours)

#### Task 2.1: Implementirati Auto-Assignment Logic
**Time**: 2 hours
**File**: `backend/src/services/database.ts`

**Trenutna implementacija** `createServiceRequest()`:
```typescript
async createServiceRequest(data: any) {
  return await this.prisma.serviceRequest.create({
    data: {
      locationId: data.locationId,
      message: data.message,
      priority: data.priority || 'normal',
      status: 'pending',
      // ❌ assignedTo nije automatski setovan!
    }
  });
}
```

**Nova implementacija**:
```typescript
async createServiceRequest(data: any) {
  let assignedCrewMemberId = data.assignedTo;

  // If no crew member assigned, use smart assignment
  if (!assignedCrewMemberId && data.locationId) {
    assignedCrewMemberId = await this.findBestCrewMember(data.locationId);
  }

  return await this.prisma.serviceRequest.create({
    data: {
      locationId: data.locationId,
      guestId: data.guestId,
      message: data.message,
      priority: data.priority || 'normal',
      status: 'pending',
      assignedTo: assignedCrewMemberId,  // ✅ Auto-assigned!
    },
    include: {
      location: true,
      guest: true
    }
  });
}

/**
 * Find best available crew member for service request
 */
private async findBestCrewMember(locationId: string): Promise<string | null> {
  // Strategy 1: Find crew member assigned to this location
  const location = await this.prisma.location.findUnique({
    where: { id: locationId },
    include: {
      crewMembers: {
        where: {
          status: 'on_duty',
          device: { isNot: null }  // Must have assigned device
        }
      }
    }
  });

  if (location?.crewMembers && location.crewMembers.length > 0) {
    // Return first available crew member
    return location.crewMembers[0].id;
  }

  // Strategy 2: Find any available crew member
  const availableCrew = await this.prisma.crewMember.findFirst({
    where: {
      status: 'on_duty',
      device: { isNot: null }
    }
  });

  return availableCrew?.id || null;
}
```

---

#### Task 2.2: Update Prisma Schema - Location → CrewMember Relationship
**Time**: 30 min
**File**: `backend/prisma/schema.prisma`

**Check if exists**:
```prisma
model Location {
  assignedCrewMembers  CrewMember[]  // ❓ Da li postoji?
}

model CrewMember {
  assignedLocations  Location[]  // ❓ Da li postoji?
}
```

**If missing, add**:
```prisma
model Location {
  crewMembers  CrewMember[]
}

model CrewMember {
  assignedLocationIds  String[]  // Array of location IDs
  assignedLocations    Location[]  @relation(references: [id])
}
```

Ili explicit many-to-many:
```prisma
model CrewLocation {
  id            String   @id @default(cuid())
  crewMemberId  String
  locationId    String
  crewMember    CrewMember @relation(fields: [crewMemberId], references: [id])
  location      Location   @relation(fields: [locationId], references: [id])

  @@unique([crewMemberId, locationId])
}
```

---

### **FAZA 3: Frontend Updates** (1-2 hours)

#### Task 3.1: Update Crew Assignment UI
**Time**: 1 hour
**File**: `src/components/crew-member-details-dialog.tsx`

**Check**:
- Da li postoji UI za assignment device-a crew member-u?
- Da li se čuva u bazi kada se assignuje?

**Implementation** (ako ne postoji):
```typescript
// Add device dropdown in crew member dialog
<Select
  value={selectedDeviceId}
  onValueChange={(deviceId) => assignDeviceToCrewMember(crewMember.id, deviceId)}
>
  <SelectTrigger>
    <SelectValue placeholder="Assign watch device" />
  </SelectTrigger>
  <SelectContent>
    {availableWatches.map(device => (
      <SelectItem key={device.id} value={device.id}>
        {device.name} ({device.id})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

#### Task 3.2: Test Watch Notification Display
**Time**: 30 min

**Manual testing**:
1. Start OBEDIO system
2. Upload firmware to T-Watch S3
3. Assign watch to crew member "Chloe Anderson"
4. Create service request (via button or web UI)
5. **Verify**:
   - ✅ Watch receives notification
   - ✅ Watch vibrates
   - ✅ Watch displays location, message, priority
   - ✅ "TAP TO ACK" button appears

---

### **FAZA 4: Testing & Debugging** (2-3 hours)

#### Task 4.1: End-to-End Integration Test
**Time**: 1 hour

**Test Scenario 1: Button → Watch Flow**
1. Press button on ESP32
2. Backend receives button press
3. Creates service request
4. Assigns to crew member with watch
5. Sends MQTT notification to watch
6. Watch displays notification and vibrates
7. Crew taps to acknowledge
8. Backend receives acknowledgement
9. Updates service request status
10. Frontend reflects updated status

**Expected MQTT messages**:
```
📤 obedio/button/{buttonId}/press
   → Backend creates service request
📤 obedio/watch/{watchId}/notification
   → Watch displays notification
📤 obedio/watch/{watchId}/acknowledge
   → Backend updates status
```

---

#### Task 4.2: Error Handling & Edge Cases
**Time**: 1 hour

**Test scenarios**:
1. ❓ What if crew member has no device assigned?
   - Expected: Service request created but no notification sent
   - Log warning: "No device assigned to crew member"

2. ❓ What if watch is offline?
   - Expected: MQTT publishes to topic (QoS 1)
   - Watch receives when back online

3. ❓ What if acknowledgement never arrives?
   - Expected: Service request stays in 'pending' state
   - Frontend shows "Awaiting acknowledgement"

4. ❓ What if multiple crew members assigned?
   - Expected: Send notification to all assigned crew watches

---

#### Task 4.3: Serial Monitor Debugging
**Time**: 30 min

**Watch Serial Output** should show:
```
📥 Received message on topic: obedio/watch/TWATCH-64E8337A0BAC/notification
🔔 New Service Request notification!
Request ID: cma1b2c3d4e5f6
Location: Master Suite
Message: Guest needs assistance
Priority: urgent
🔊 Vibrating: 3 pulses
```

**Backend Serial Output** should show:
```
✅ MQTT connected successfully
✅ Subscribed to obedio/watch/+/acknowledge
📥 MQTT message: obedio/button/BTN-AABBCCDD/press
✅ Service request created: sr_12345
✅ Published notification to obedio/watch/TWATCH-64E8337A0BAC/notification
📥 MQTT message: obedio/watch/TWATCH-64E8337A0BAC/acknowledge
✅ Service request sr_12345 marked as accepted
```

---

## 📋 CHECKLIST - Completion Criteria

### Backend Changes
- [ ] Database schema ima `CrewMember.deviceId` field
- [ ] Database schema ima relationship `CrewMember ↔ Device`
- [ ] `mqttService.publishWatchNotification()` implementiran
- [ ] Service request creation integrisana sa MQTT
- [ ] Watch acknowledgement handling implementiran
- [ ] mqttService exportovan kao singleton
- [ ] Smart assignment logic implementiran

### Frontend Changes
- [ ] Device assignment UI u crew member dialog
- [ ] Device assignment API call implementiran

### Testing
- [ ] Watch prima notification kada se kreira service request
- [ ] Watch vibrira (1 puls za normal, 3 za urgent)
- [ ] Watch prikazuje location, message, priority
- [ ] Touch acknowledgement šalje MQTT poruku
- [ ] Backend prima ACK i update-uje status
- [ ] Frontend prikazuje updated status

---

## ⏱️ ESTIMATED TIME

| Faza | Tasks | Estimated Time |
|------|-------|----------------|
| **Faza 1** | Kritični backend changes | 4-6 hours |
| **Faza 2** | Smart assignment logic | 2-3 hours |
| **Faza 3** | Frontend updates | 1-2 hours |
| **Faza 4** | Testing & debugging | 2-3 hours |
| **TOTAL** | | **9-14 hours** |

**Conservative estimate**: 2 full work days
**Optimistic estimate**: 1.5 work days

---

## 🚀 HOW TO START

### Option 1: Full Implementation (Recommended)
```bash
# Start with Faza 1
# Implement all 5 tasks sequentially
# Test after each task
```

### Option 2: MVP Approach (Fastest)
```bash
# Skip smart assignment (Faza 2)
# Manually assign crew member when creating service request
# Focus on Faza 1 Tasks 1.2, 1.3, 1.4
```

### Option 3: Testing First
```bash
# Upload firmware to watch
# Manually send MQTT test message:
mosquitto_pub -h localhost -t "obedio/watch/TWATCH-64E8337A0BAC/notification" \
  -m '{"requestId":"test", "location":"Test Room", "message":"Test", "priority":"normal"}'
# Verify watch displays correctly
# Then implement backend
```

---

## 📞 NEXT STEPS

**Immediate Action**:
1. ✅ Proverite database schema (Task 1.1)
2. ✅ Implementirajte `publishWatchNotification()` (Task 1.2)
3. ✅ Integrirajte sa service request creation (Task 1.3)
4. ✅ Testirajte sa manual MQTT publish prvo
5. ✅ Implementirajte watch ACK handling (Task 1.4)

**Da li želiš da:**
1. 🔵 **Počnem sa implementacijom** (Option 1 - Full Implementation)?
2. 🟢 **Prvo testiram firmware** sa manual MQTT (Option 3)?
3. 🟡 **Pregledam database schema** prvo (Task 1.1)?

---

**Created**: October 27, 2025
**Status**: 🔴 BLOCKING - Needs immediate action
**Priority**: P0 - Critical for production deployment
