# ⌚ Watch → Server → Time/LoRa Architecture

## 🎯 Concept Overview

**Goal:** Crew wearable devices (Apple Watch, Android Watch, ESP32 custom watch) automatically detect yacht location via GPS, send timezone + geolocation data to server, which then:
1. **Updates system time** for all users based on yacht's current timezone
2. **Changes LoRa frequency** if yacht crosses regulatory boundaries (EU/US/Asia)

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────┐
│  Wearable Device (Watch)             │
│  • Apple Watch (GPS + Cellular)      │
│  • Android Watch (GPS + Cellular)    │
│  • ESP32 Custom Watch (GPS + LoRa)   │
│                                      │
│  Built-in Sensors:                   │
│  ├─ GPS (lat/lon coordinates)        │
│  ├─ Timezone auto-detect             │
│  └─ Cellular/WiFi connectivity       │
└──────────────────────────────────────┘
              │
              │ HTTPS/WebSocket
              │ POST /api/yacht/location
              ↓
┌──────────────────────────────────────┐
│  Backend Server (Node.js)            │
│                                      │
│  Location Service:                   │
│  ├─ Receive GPS coordinates          │
│  ├─ Reverse geocoding                │
│  ├─ Detect timezone (IANA format)    │
│  └─ Detect regulatory region         │
│                                      │
│  Time Management:                    │
│  ├─ Update system timezone           │
│  ├─ Broadcast to all clients         │
│  └─ Log timezone changes             │
│                                      │
│  LoRa Frequency Manager:             │
│  ├─ Determine region (EU/US/Asia)    │
│  ├─ Select frequency (868/915/433)   │
│  └─ Send config to ESP32 buttons     │
└──────────────────────────────────────┘
              │
              │ UPDATE
              ↓
┌──────────────────────────────────────┐
│  PostgreSQL Database                 │
│                                      │
│  yacht_location:                     │
│  ├─ latitude                         │
│  ├─ longitude                        │
│  ├─ timezone (IANA)                  │
│  ├─ lora_region (EU868/US915/...)    │
│  ├─ lora_frequency                   │
│  └─ updated_at                       │
└──────────────────────────────────────┘
              │
              │ BROADCAST
              ↓
┌──────────────────────────────────────┐
│  All Connected Clients               │
│  • Web Dashboard                     │
│  • Mobile Apps (iOS/Android)         │
│  • Other Watches                     │
│  • ESP32 Butler Buttons              │
│                                      │
│  Updates:                            │
│  ├─ Display correct local time       │
│  └─ Use correct LoRa frequency       │
└──────────────────────────────────────┘
```

---

## 📡 Data Flow

### **1. Watch Sends Location**

```javascript
// Apple Watch / Android Watch / ESP32 Custom
const payload = {
  device_id: "watch-crew-001",
  crew_id: "crew-isabella",
  gps: {
    latitude: 43.7384, // Monaco
    longitude: 7.4246,
    accuracy: 10, // meters
    altitude: 5, // meters above sea level
    timestamp: "2025-10-20T01:23:00Z"
  },
  timezone: "Europe/Monaco", // Auto-detected by watch OS
  battery_level: 85
};

// Send to server
POST https://api.obedio.com/api/yacht/location
Headers: {
  "Authorization": "Bearer <crew_token>",
  "Content-Type": "application/json"
}
Body: payload
```

### **2. Server Processes Location**

```javascript
// Backend: /api/yacht/location
app.post('/api/yacht/location', async (req, res) => {
  const { gps, timezone, device_id } = req.body;
  
  // 1. Reverse Geocoding (GPS → Country/Region)
  const location = await reverseGeocode(gps.latitude, gps.longitude);
  // Result: { country: "Monaco", region: "Europe", city: "Monte Carlo" }
  
  // 2. Determine LoRa Frequency Region
  const loraRegion = determineLoRaRegion(location.country);
  // EU: 868 MHz, US: 915 MHz, Asia: 433 MHz
  
  // 3. Update Database
  await db.query(`
    UPDATE yacht_settings 
    SET 
      latitude = $1,
      longitude = $2,
      timezone = $3,
      lora_region = $4,
      lora_frequency = $5,
      updated_at = NOW()
    WHERE yacht_id = $6
  `, [
    gps.latitude,
    gps.longitude,
    timezone,
    loraRegion.code, // "EU868"
    loraRegion.frequency, // 868000000 Hz
    req.yacht_id
  ]);
  
  // 4. Broadcast Update to All Clients
  io.emit('yacht:location_update', {
    timezone: timezone,
    loraRegion: loraRegion,
    location: location
  });
  
  // 5. Send LoRa Config to ESP32 Buttons
  if (loraRegion.changed) {
    await updateLoRaButtonsFrequency(loraRegion.frequency);
  }
  
  res.json({ success: true, timezone, loraRegion });
});
```

### **3. LoRa Frequency Determination**

```javascript
function determineLoRaRegion(country) {
  const EU_COUNTRIES = [
    'Monaco', 'France', 'Italy', 'Spain', 'Greece', 
    'Croatia', 'Malta', 'Portugal', 'Turkey', ...
  ];
  
  const US_COUNTRIES = [
    'United States', 'Canada', 'Mexico', 'Bahamas',
    'Jamaica', 'Cayman Islands', 'Brazil', ...
  ];
  
  const ASIA_COUNTRIES = [
    'China', 'Japan', 'Singapore', 'UAE', 
    'Thailand', 'Malaysia', 'Indonesia', ...
  ];
  
  if (EU_COUNTRIES.includes(country)) {
    return {
      code: 'EU868',
      frequency: 868000000, // Hz
      max_power: 25, // mW ERP
      duty_cycle: 0.01, // 1%
      channels: [868100000, 868300000, 868500000]
    };
  }
  
  if (US_COUNTRIES.includes(country)) {
    return {
      code: 'US915',
      frequency: 915000000, // Hz
      max_power: 30, // dBm EIRP
      duty_cycle: null, // No duty cycle in US
      channels: [902300000, 903900000, 904100000, ...] // 64 channels
    };
  }
  
  if (ASIA_COUNTRIES.includes(country)) {
    return {
      code: 'AS433',
      frequency: 433000000, // Hz
      max_power: 10, // mW
      duty_cycle: 0.10, // 10%
      channels: [433050000, 433175000, 433400000]
    };
  }
  
  // Default fallback
  return {
    code: 'EU868',
    frequency: 868000000
  };
}
```

### **4. Timezone Update Broadcast**

```javascript
// Server broadcasts to all connected clients via WebSocket
io.on('connection', (socket) => {
  socket.on('yacht:location_update', (data) => {
    // All dashboards, apps, watches update their time
    const { timezone } = data;
    
    // Client-side: Update displayed time
    document.getElementById('clock').timezone = timezone;
    
    // Update all time-dependent widgets
    updateDutyTimer(timezone);
    updateShiftSchedule(timezone);
    updateWeatherWidget(timezone);
  });
});
```

---

## ⌚ Watch Implementation

### **Apple Watch (WatchOS)**

```swift
// WatchOS App
import CoreLocation
import HealthKit

class LocationManager: NSObject, CLLocationManagerDelegate {
    let locationManager = CLLocationManager()
    
    func startTracking() {
        locationManager.delegate = self
        locationManager.requestAlwaysAuthorization()
        locationManager.startUpdatingLocation()
    }
    
    func locationManager(_ manager: CLLocationManager, 
                        didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        let timezone = TimeZone.current.identifier // "Europe/Monaco"
        
        let payload: [String: Any] = [
            "device_id": "watch-\(WKInterfaceDevice.current().name)",
            "crew_id": currentCrewId,
            "gps": [
                "latitude": location.coordinate.latitude,
                "longitude": location.coordinate.longitude,
                "accuracy": location.horizontalAccuracy,
                "altitude": location.altitude,
                "timestamp": ISO8601DateFormatter().string(from: location.timestamp)
            ],
            "timezone": timezone,
            "battery_level": WKInterfaceDevice.current().batteryLevel * 100
        ]
        
        sendToServer(payload)
    }
    
    func sendToServer(_ payload: [String: Any]) {
        guard let url = URL(string: "https://api.obedio.com/api/yacht/location") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // Handle response
        }.resume()
    }
}
```

### **Android Watch (Wear OS)**

```kotlin
// Wear OS App
import android.location.LocationManager
import android.location.LocationListener

class YachtLocationTracker(context: Context) : LocationListener {
    private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    
    fun startTracking() {
        locationManager.requestLocationUpdates(
            LocationManager.GPS_PROVIDER,
            60000, // 1 minute interval
            10.0f, // 10 meters
            this
        )
    }
    
    override fun onLocationChanged(location: Location) {
        val timezone = TimeZone.getDefault().id // "Europe/Monaco"
        
        val payload = JSONObject().apply {
            put("device_id", "watch-${Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)}")
            put("crew_id", currentCrewId)
            put("gps", JSONObject().apply {
                put("latitude", location.latitude)
                put("longitude", location.longitude)
                put("accuracy", location.accuracy)
                put("altitude", location.altitude)
                put("timestamp", Instant.now().toString())
            })
            put("timezone", timezone)
            put("battery_level", getBatteryLevel())
        }
        
        sendToServer(payload)
    }
    
    private fun sendToServer(payload: JSONObject) {
        val client = OkHttpClient()
        val request = Request.Builder()
            .url("https://api.obedio.com/api/yacht/location")
            .addHeader("Authorization", "Bearer $authToken")
            .post(payload.toString().toRequestBody("application/json".toMediaType()))
            .build()
            
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                // Handle response
            }
        })
    }
}
```

### **ESP32 Custom Watch**

```cpp
// ESP32 Custom Watch Firmware
#include <TinyGPS++.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

TinyGPSPlus gps;
HardwareSerial SerialGPS(1);

void setup() {
    SerialGPS.begin(9600, SERIAL_8N1, 16, 17); // GPS on pins 16/17
    WiFi.begin(ssid, password);
}

void loop() {
    while (SerialGPS.available() > 0) {
        gps.encode(SerialGPS.read());
    }
    
    if (gps.location.isUpdated()) {
        sendLocationToServer();
    }
    
    delay(60000); // Every minute
}

void sendLocationToServer() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin("https://api.obedio.com/api/yacht/location");
        http.addHeader("Authorization", "Bearer " + String(authToken));
        http.addHeader("Content-Type", "application/json");
        
        // Detect timezone (simplified - use lookup table)
        String timezone = detectTimezone(gps.location.lat(), gps.location.lng());
        
        StaticJsonDocument<512> doc;
        doc["device_id"] = "esp32-watch-" + WiFi.macAddress();
        doc["crew_id"] = crewId;
        
        JsonObject gpsObj = doc.createNestedObject("gps");
        gpsObj["latitude"] = gps.location.lat();
        gpsObj["longitude"] = gps.location.lng();
        gpsObj["accuracy"] = gps.hdop.hdop();
        gpsObj["altitude"] = gps.altitude.meters();
        gpsObj["timestamp"] = getISOTimestamp();
        
        doc["timezone"] = timezone;
        doc["battery_level"] = getBatteryPercentage();
        
        String payload;
        serializeJson(doc, payload);
        
        int httpCode = http.POST(payload);
        
        if (httpCode == 200) {
            // Success
            String response = http.getString();
            updateLocalTimezone(response);
        }
        
        http.end();
    }
}

String detectTimezone(float lat, float lon) {
    // Simplified timezone detection based on coordinates
    // In production, use proper timezone lookup library
    if (lon >= -10 && lon <= 40) return "Europe/Monaco";
    if (lon >= -125 && lon <= -65) return "America/New_York";
    // ... more zones
    return "UTC";
}
```

---

## 🗄️ Database Schema

```sql
-- Yacht location and settings table
CREATE TABLE yacht_settings (
    id SERIAL PRIMARY KEY,
    yacht_id VARCHAR(50) UNIQUE NOT NULL,
    yacht_name VARCHAR(100),
    
    -- Current Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50) DEFAULT 'UTC', -- IANA timezone (e.g., "Europe/Monaco")
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    
    -- LoRa Configuration
    lora_region VARCHAR(20), -- "EU868", "US915", "AS433"
    lora_frequency BIGINT, -- Frequency in Hz
    lora_max_power INTEGER, -- Max power in mW or dBm
    lora_duty_cycle DECIMAL(5, 4), -- e.g., 0.01 = 1%
    
    -- Metadata
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(50), -- device_id that sent update
    
    CONSTRAINT valid_timezone CHECK (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$')
);

-- Location history for analytics
CREATE TABLE yacht_location_history (
    id SERIAL PRIMARY KEY,
    yacht_id VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    lora_region VARCHAR(20),
    device_id VARCHAR(100), -- Which watch sent this
    crew_id VARCHAR(50),
    timestamp TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (yacht_id) REFERENCES yacht_settings(yacht_id)
);

CREATE INDEX idx_location_history_yacht ON yacht_location_history(yacht_id, timestamp DESC);
```

---

## ⚙️ Settings UI (Phase 2)

```typescript
// Settings Page Component
interface TimezoneSettings {
  mode: 'auto' | 'manual';
  manual_timezone?: string;
  auto_update_interval: number; // minutes
  require_crew_confirmation: boolean;
}

function TimezoneSettingsPage() {
  const [settings, setSettings] = useState<TimezoneSettings>({
    mode: 'auto',
    auto_update_interval: 1,
    require_crew_confirmation: false
  });
  
  return (
    <Card>
      <h2>Timezone & LoRa Settings</h2>
      
      {/* Mode Selection */}
      <RadioGroup value={settings.mode} onChange={(mode) => setSettings({...settings, mode})}>
        <Radio value="auto">
          <h3>Automatic (Recommended)</h3>
          <p>Yacht timezone updates automatically based on crew watch GPS</p>
        </Radio>
        
        <Radio value="manual">
          <h3>Manual Override</h3>
          <p>Manually select timezone - useful for shore-based management</p>
        </Radio>
      </RadioGroup>
      
      {settings.mode === 'manual' && (
        <Select 
          value={settings.manual_timezone}
          onChange={(tz) => setSettings({...settings, manual_timezone: tz})}
        >
          <option value="Europe/Monaco">Europe/Monaco (UTC+1/+2)</option>
          <option value="America/New_York">America/New_York (UTC-5/-4)</option>
          <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
          {/* ... more timezones */}
        </Select>
      )}
      
      {/* Auto Update Interval */}
      <div>
        <label>Update Interval</label>
        <input 
          type="number" 
          value={settings.auto_update_interval}
          onChange={(e) => setSettings({...settings, auto_update_interval: parseInt(e.target.value)})}
        />
        <span>minutes</span>
      </div>
      
      {/* LoRa Status Display */}
      <Card>
        <h3>LoRa Configuration</h3>
        <p>Current Region: <strong>{currentLoRaRegion}</strong></p>
        <p>Frequency: <strong>{currentFrequency} MHz</strong></p>
        <p>Last Updated: <strong>{lastUpdate}</strong></p>
      </Card>
    </Card>
  );
}
```

---

## 🔐 Security Considerations

1. **Authentication:** Only authenticated crew watches can update location
2. **Rate Limiting:** Max 1 update per minute per device
3. **Validation:** GPS coordinates must be within reasonable yacht operating areas
4. **Encryption:** All communication over HTTPS/WSS
5. **Audit Log:** Track which device updated timezone/location

---

## 📊 Benefits

✅ **Automatic Time Sync** - No manual timezone changes needed  
✅ **LoRa Compliance** - Always use correct frequency for region  
✅ **Multi-Watch Support** - Works with Apple, Android, ESP32  
✅ **Real-time Updates** - Instant broadcast to all devices  
✅ **Location Tracking** - Know where yacht is at all times  
✅ **Analytics** - Historical location data for voyage planning  

---

## 🚀 Implementation Timeline

**Phase 1 (Current):**
- ✅ Clock widget with auto timezone
- ⏳ Backend API endpoint for location updates
- ⏳ Database schema

**Phase 2 (Next):**
- Watch apps (Apple, Android, ESP32)
- Settings page for timezone management
- LoRa frequency auto-configuration

**Phase 3 (Future):**
- Geofencing alerts (entering/leaving marinas)
- Voyage tracking dashboard
- Compliance reporting

---

**Status:** Architecture documented, ready for implementation!
