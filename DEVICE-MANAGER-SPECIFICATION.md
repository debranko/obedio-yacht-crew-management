# 📱 Device Manager - Complete Specification

## 🎯 Overview

**Device Manager** centralizes management of all IoT devices on yacht:
- **Smart Buttons (ESP32)** - Guest service call buttons
- **Smart Watches** - Crew wearable devices (Apple Watch, Android, ESP32)
- **Repeaters** - LoRa/WiFi signal boosters
- **Mobile Apps** - iOS & Android crew apps

---

## 🔘 1. SMART BUTTONS (ESP32-Based)

### **Device Information**
- **Device ID:** BTN-001, BTN-002, etc.
- **Name:** User-defined (e.g., "Master Cabin - Bedside")
- **Status:** Online, Offline, Low Battery, Error
- **Location Assignment:** Select from Locations database
- **Battery Level:** 0-100%
- **Signal Strength:** RSSI in dBm
- **Connection Type:** LoRa (868/915/433 MHz) or WiFi
- **Last Seen:** Timestamp of last communication
- **Firmware Version:** e.g., v1.2.3

---

### **Button Actions (Configurable)**

Each button supports multiple touch/press patterns:

| **Action** | **Description** | **Configurable Behavior** |
|------------|----------------|---------------------------|
| **Single Press** | Quick tap | Service call type (Normal/Urgent/Emergency) |
| **Double Press** | Two quick taps | Custom action (e.g., "Housekeeping", "Beverage", "Butler") |
| **Touch** | Capacitive touch | Custom action |
| **Double Touch** | Two quick touches | Custom action |
| **Press & Hold** | Hold 2-3 seconds | Voice recording (if mic enabled) |
| **Shake to Call** | Physical shake detected | Emergency/Priority call |

**Device Manager Settings:**
```json
{
  "buttonActions": {
    "singlePress": {
      "enabled": true,
      "action": "service_call",
      "requestType": "normal",
      "message": "Guest needs assistance"
    },
    "doublePress": {
      "enabled": true,
      "action": "service_call",
      "requestType": "urgent",
      "message": "Urgent request"
    },
    "touch": {
      "enabled": false,
      "action": "custom"
    },
    "doubleTouch": {
      "enabled": false,
      "action": "custom"
    },
    "pressHold": {
      "enabled": true,
      "action": "voice_recording",
      "minDuration": 2000 // milliseconds
    },
    "shake": {
      "enabled": true,
      "action": "emergency_call",
      "requestType": "emergency",
      "sensitivity": "medium" // low, medium, high
    }
  }
}
```

---

### **Audio Settings**

| **Setting** | **Options** | **Description** |
|-------------|-------------|----------------|
| **Microphone** | Enabled / Disabled | Voice recording capability |
| **Microphone Gain** | 0-100% | Input volume sensitivity |
| **Speaker Volume** | 0-100% | Confirmation beep/feedback volume |
| **Voice Feedback** | Enabled / Disabled | Audio confirmation on button press |

---

### **LED Settings**

| **Setting** | **Options** | **Description** |
|-------------|-------------|----------------|
| **LED Ring** | Enabled / Disabled | Visual feedback ring |
| **LED Brightness** | 0-100% | Brightness level |
| **LED Pattern** | Solid / Blink / Pulse | Visual feedback style |
| **LED Color - Idle** | RGB color picker | Color when not in use |
| **LED Color - Active** | RGB color picker | Color when call sent |
| **LED Color - Confirmed** | RGB color picker | Color when call accepted |
| **LED Color - Low Battery** | RGB color picker | Color when battery < 20% |

---

### **Virtual Button Simulator Integration**

**Requirement:** ESP32 Simulator widget must sync with Device Manager settings.

**Flow:**
1. User changes button action in Device Manager (e.g., Double Press → "Housekeeping")
2. Backend updates database
3. WebSocket broadcasts change to all clients
4. ESP32 Simulator refreshes button configuration
5. Simulator respects new action mapping

**API Sync:**
```typescript
// GET /api/devices/:id/config
{
  "deviceId": "BTN-001",
  "locationId": "master-bedroom-id",
  "actions": { /* button actions config */ },
  "audio": { /* audio settings */ },
  "led": { /* LED settings */ }
}
```

---

## ⌚ 2. SMART WATCHES

### **Device Types**
1. **Apple Watch (iOS)** - WatchOS app
2. **Android Watch** - Wear OS app
3. **ESP32 Watch** - Custom hardware watch

### **Device Information**
- **Device ID:** WCH-001, WCH-002, etc.
- **Watch Number:** 1, 2, 3, ..., 65 (max 65 watches)
- **Watch Type:** iOS / Android / ESP32
- **Assigned Crew Member:** Select from Crew database
- **Status:** Online, Offline, Low Battery
- **Battery Level:** 0-100%
- **Signal Strength:** RSSI in dBm
- **Connection Type:** WiFi / Bluetooth / LoRa (ESP32 only)
- **Last Seen:** Timestamp
- **GPS Location:** Lat/Lon (for ESP32 & smartwatches)
- **Firmware/OS Version:** WatchOS 10.2, Wear OS 4.0, ESP32 v1.0.0

---

### **Watch Capabilities**

| **Feature** | **Apple Watch** | **Android Watch** | **ESP32 Watch** |
|-------------|----------------|-------------------|-----------------|
| **Service Requests** | View & Accept | View & Accept | View & Accept |
| **GPS Location** | ✅ | ✅ | ✅ |
| **Timezone Detection** | ✅ | ✅ | ✅ |
| **Heart Rate Monitor** | ✅ | ✅ | ❌ |
| **Push Notifications** | ✅ | ✅ | ✅ (MQTT) |
| **Voice Commands** | ✅ (Siri) | ✅ (Google) | ❌ |
| **Battery Monitoring** | ✅ | ✅ | ✅ |

---

### **Settings for Each Watch**

```json
{
  "watchId": "WCH-001",
  "watchNumber": 1,
  "watchType": "ios",
  "crewMemberId": "crew-maria-001",
  "notifications": {
    "serviceRequests": true,
    "emergencyCalls": true,
    "systemAlerts": true,
    "vibration": true,
    "sound": false
  },
  "permissions": {
    "acceptRequests": true,
    "viewAllRequests": false, // or only assigned
    "viewGuestInfo": true,
    "viewLocationDetails": true
  },
  "gps": {
    "enabled": true,
    "reportInterval": 300 // seconds (5 min)
  }
}
```

---

## 📡 3. REPEATERS (Signal Boosters)

### **Device Information**
- **Device ID:** RPT-001, RPT-002, etc.
- **Name:** "Main Deck Repeater", "Bridge Deck Repeater"
- **Location:** Select from Locations database
- **Status:** Online, Offline, Error
- **Connected Devices:** Count of devices using this repeater
- **Uptime:** Days/Hours online
- **Last Seen:** Timestamp

---

### **Frequency & Connection Settings**

| **Setting** | **Options** | **Description** |
|-------------|-------------|----------------|
| **Frequency** | 868 MHz (EU) / 433 MHz (Asia) / 915 MHz (US) | LoRa operating frequency |
| **Transmission Power** | 10-30 dBm | Signal strength |
| **Spreading Factor** | SF7 - SF12 | LoRa range/speed tradeoff |
| **Bandwidth** | 125/250/500 kHz | LoRa channel width |
| **Connection Type** | LoRa / WiFi / Both | Dual-mode support |

---

### **Power Source Settings**

| **Power Source** | **Description** | **Backup** |
|------------------|----------------|------------|
| **AC Power** | Main electrical grid | UPS recommended |
| **UPS Power** | Uninterruptible Power Supply | Battery backup |
| **PoE** | Power over Ethernet | Network cable power |

**Monitoring:**
```json
{
  "powerSource": "UPS",
  "voltage": 12.5, // V
  "current": 0.8,  // A
  "batteryBackup": true,
  "batteryLevel": 95, // % (if UPS)
  "estimatedRuntime": 240 // minutes on battery
}
```

---

### **Signal Monitoring**

| **Metric** | **Unit** | **Description** |
|------------|----------|----------------|
| **RSSI** | dBm | Received Signal Strength Indicator |
| **SNR** | dB | Signal-to-Noise Ratio |
| **Packet Loss** | % | Percentage of lost packets |
| **Latency** | ms | Average message delay |

**Repeater Coverage Map:**
- Shows which devices are connected to which repeater
- Visual signal strength heatmap
- Devices list per repeater

---

### **Connected Devices List**

**For each repeater, show:**
```
Repeater: RPT-001 (Main Deck)
├── BTN-001 (Master Cabin) - RSSI: -45 dBm
├── BTN-003 (VIP Cabin) - RSSI: -52 dBm
├── WCH-005 (Crew Watch #5) - RSSI: -38 dBm
└── ... (24 devices total)
```

---

## 📱 4. MOBILE APPS (iOS & Android)

### **Separate Tab/Page**

**Device Manager → Mobile Apps Tab**

### **App Information**
- **App ID:** APP-IOS-001, APP-AND-001
- **Platform:** iOS / Android
- **Version:** App version (e.g., 1.2.3)
- **User/Crew Member:** Assigned crew
- **Device Model:** iPhone 14 Pro, Samsung Galaxy S23
- **OS Version:** iOS 17.2, Android 14
- **Installation Date:** When app was installed
- **Last Active:** Timestamp of last app usage
- **Push Token:** For notifications
- **Permissions:** Granted permissions list

---

### **App Capabilities**

| **Feature** | **iOS App** | **Android App** |
|-------------|-------------|-----------------|
| **Service Requests** | View, Accept, Complete | View, Accept, Complete |
| **Guest Management** | View, Edit (if permitted) | View, Edit (if permitted) |
| **Location Management** | View | View |
| **Crew Roster** | View | View |
| **Notifications** | Push, Local | Push, Local |
| **Offline Mode** | ✅ | ✅ |
| **Biometric Login** | Face ID, Touch ID | Fingerprint, Face Unlock |

---

### **App Settings**

```json
{
  "appId": "APP-IOS-001",
  "platform": "ios",
  "userId": "user-maria-001",
  "crewMemberId": "crew-maria-001",
  "permissions": {
    "viewServiceRequests": true,
    "acceptRequests": true,
    "completeRequests": true,
    "viewGuests": true,
    "editGuests": false,
    "viewLocations": true,
    "editLocations": false
  },
  "notifications": {
    "enabled": true,
    "serviceRequests": true,
    "emergencyCalls": true,
    "systemAlerts": false,
    "sound": true,
    "vibration": true,
    "badge": true
  }
}
```

---

## 🗂️ Device Manager UI Structure

### **Main Page Layout**

```
┌─────────────────────────────────────────────────┐
│  Device Manager                     [+ Add Device] │
├─────────────────────────────────────────────────┤
│  Tabs:                                          │
│  [Smart Buttons] [Watches] [Repeaters] [Apps]  │
├─────────────────────────────────────────────────┤
│  Filters & Search:                              │
│  [Search...] [Status▾] [Location▾] [Type▾]     │
├─────────────────────────────────────────────────┤
│  Device List (Table/Grid)                       │
│  ┌──────────────────────────────────────────┐  │
│  │ BTN-001 | Master Cabin    | 🟢 85% 📶    │  │
│  │ BTN-002 | VIP Cabin       | 🟢 72% 📶    │  │
│  │ BTN-003 | Sun Deck        | 🔴 15% 📶    │  │
│  │ ...                                       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

### **Smart Buttons Tab**

**Columns:**
- Device ID
- Name
- Location
- Status (Online/Offline/Low Battery)
- Battery %
- Signal Strength (RSSI + bars)
- Connection (LoRa 868 / WiFi)
- Last Seen
- Actions (Edit, Test, Delete)

**Actions:**
- **+ Add Button** - Register new ESP32 button
- **Edit** - Configure button actions, LED, audio
- **Test** - Send test signal to button (LED blink)
- **View Logs** - Activity history
- **Delete** - Unregister device

---

### **Watches Tab**

**Columns:**
- Watch #
- Type (iOS/Android/ESP32)
- Assigned Crew
- Status
- Battery %
- Signal
- GPS Location (if available)
- Last Active

**Actions:**
- **+ Add Watch** - Register new watch
- **Edit** - Configure permissions, notifications
- **View Location** - Show on map
- **Unassign** - Remove crew assignment

---

### **Repeaters Tab**

**Columns:**
- Repeater ID
- Name
- Location
- Frequency (868/915/433 MHz)
- Power Source (AC/UPS/PoE)
- Connected Devices (count)
- Signal Quality
- Status
- Uptime

**Actions:**
- **+ Add Repeater** - Register new repeater
- **Edit** - Configure frequency, power
- **View Devices** - List connected devices
- **Signal Map** - Coverage visualization

---

### **Mobile Apps Tab**

**Columns:**
- App ID
- Platform (iOS/Android)
- Assigned Crew
- App Version
- Device Model
- Last Active
- Push Enabled
- Status

**Actions:**
- **View Details** - App info, permissions
- **Revoke Access** - Disable app
- **Send Notification** - Test push

---

## 🔧 Device Configuration Modal

### **Smart Button Configuration**

```
┌─────────────────────────────────────────────┐
│  Configure Button: BTN-001                  │
├─────────────────────────────────────────────┤
│  📍 Basic Info                              │
│    Name: [Master Cabin - Bedside         ]  │
│    Location: [Master Bedroom            ▾]  │
│    Status: 🟢 Online                        │
│                                             │
│  🎯 Button Actions                          │
│    Single Press:     [Service Call - Normal]│
│    Double Press:     [Service Call - Urgent]│
│    Touch:            [Disabled             ]│
│    Double Touch:     [Disabled             ]│
│    Press & Hold:     [Voice Recording      ]│
│    Shake to Call:    [Emergency Call       ]│
│                                             │
│  🎤 Audio Settings                          │
│    Microphone:       [✓] Enabled            │
│    Mic Gain:         [████████░░] 80%       │
│    Speaker Volume:   [██████░░░░] 60%       │
│                                             │
│  💡 LED Settings                            │
│    LED Ring:         [✓] Enabled            │
│    Brightness:       [████████░░] 80%       │
│    Idle Color:       [🔵 Blue]              │
│    Active Color:     [🟢 Green]             │
│    Confirmed Color:  [🟠 Orange]            │
│                                             │
│  📊 Status Info                             │
│    Battery:          85% 🔋                 │
│    Signal:           -42 dBm 📶📶📶📶      │
│    Connection:       LoRa 868 MHz           │
│    Firmware:         v1.2.3                 │
│    Last Seen:        2 minutes ago          │
│                                             │
│  [Test Button] [Save] [Cancel]              │
└─────────────────────────────────────────────┘
```

---

## 🔄 Real-Time Sync with ESP32 Simulator

### **Requirements:**

1. **Device Manager changes → Simulator updates**
   - User edits BTN-001 in Device Manager
   - Changes button action (Double Press → "Housekeeping")
   - ESP32 Simulator widget auto-refreshes
   - Double press now creates "Housekeeping" request

2. **Simulator → Device Manager link**
   - Simulator shows "Device: BTN-001" dropdown
   - Loads configuration from Device Manager
   - Respects all button action mappings
   - Shows current battery, signal, connection type

3. **API Endpoints:**
   ```
   GET /api/devices/:id/config
   PUT /api/devices/:id/config
   POST /api/devices/:id/test-signal
   GET /api/devices/:id/logs
   ```

4. **WebSocket Events:**
   ```
   device.config.updated → Simulator refreshes
   device.status.changed → Update UI (battery, signal)
   device.button.pressed → Log button event
   ```

---

## 📋 Database Schema Updates Needed

### **Device Model (Expand existing)**

```prisma
model Device {
  id              String    @id @default(cuid())
  deviceId        String    @unique  // BTN-001, WCH-001, RPT-001
  name            String
  type            String    // "smart_button", "watch", "repeater", "mobile_app"
  subType         String?   // "ios", "android", "esp32"
  status          String    @default("active") // "online", "offline", "low_battery", "error"
  
  // Location
  locationId      String?
  location        Location? @relation(fields: [locationId], references: [id])
  
  // Assignment
  crewMemberId    String?
  crewMember      CrewMember? @relation(fields: [crewMemberId], references: [id])
  
  // Status
  batteryLevel    Int?      // 0-100
  signalStrength  Int?      // RSSI in dBm
  connectionType  String?   // "lora_868", "lora_915", "lora_433", "wifi"
  lastSeen        DateTime?
  
  // Configuration (JSON)
  config          Json?     // Button actions, LED, audio, etc.
  
  // Metadata
  firmwareVersion String?
  hardwareVersion String?
  macAddress      String?
  ipAddress       String?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  assignments     DeviceAssignment[]
  logs            DeviceLog[]
}

model DeviceLog {
  id         String   @id @default(cuid())
  deviceId   String
  device     Device   @relation(fields: [deviceId], references: [id])
  
  eventType  String   // "button_press", "battery_low", "offline", "config_change"
  eventData  Json?    // Additional event details
  
  createdAt  DateTime @default(now())
}
```

---

## 🛠️ Implementation Checklist

### **Phase 1: Backend**
- [ ] Update Prisma schema (Device, DeviceLog models)
- [ ] Run migration
- [ ] Implement device routes (CRUD)
- [ ] Add device configuration endpoints
- [ ] Add device testing endpoint (send test signal)
- [ ] Add device logs endpoint
- [ ] WebSocket events for device updates

### **Phase 2: Frontend - Data Layer**
- [ ] Create React Query hooks (useDevices, useDeviceConfig)
- [ ] Create device mutations (create, update, delete, test)
- [ ] Device service API client

### **Phase 3: Frontend - UI**
- [ ] Device Manager page with tabs
- [ ] Smart Buttons tab (list + config modal)
- [ ] Watches tab (list + config modal)
- [ ] Repeaters tab (list + config modal)
- [ ] Mobile Apps tab (list + details modal)
- [ ] Add Device wizard
- [ ] Device configuration modal
- [ ] Device testing UI
- [ ] Device logs viewer

### **Phase 4: ESP32 Simulator Integration**
- [ ] Connect simulator to Device Manager API
- [ ] Load button config from database
- [ ] Respect button action mappings
- [ ] Show device status (battery, signal, connection)
- [ ] Auto-refresh on config changes

### **Phase 5: Seed Data**
- [ ] Add sample smart buttons to seed
- [ ] Add sample watches to seed
- [ ] Add sample repeaters to seed
- [ ] Link devices to locations & crew

---

## 🎯 Next Steps

**Please review this specification and let me know:**

1. ✅ Does this match your vision?
2. ✅ Any changes or additions needed?
3. ✅ Priority order for implementation?
4. ✅ Any specific UI/UX preferences?

Once approved, I'll implement this **"from one go"** with full production-ready code! 🚀
