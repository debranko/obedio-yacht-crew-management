# OBEDIO Hardware & Mobile Setup Guide 📱⚙️

Complete guide for ESP32 firmware and mobile applications.

---

## 📦 What's Included

### 1. ESP32 Smart Button Firmware ✅ COMPLETE
**Location:** `firmware/esp32-smart-button/`

**Features:**
- WiFi connectivity
- MQTT communication
- Button press detection (single, double, long press)
- Shake detection for emergencies (MPU6050)
- Battery monitoring
- LED status indicators
- Deep sleep power management

**Hardware Requirements:**
- ESP32-DevKitC or similar board
- MPU6050 Accelerometer/Gyroscope module
- Push button
- LED (built-in or external)
- Optional: Battery monitoring circuit (voltage divider)

### 2. iOS App ⚠️ STRUCTURE CREATED
**Location:** `mobile/ios/OBEDIO/`

**Features:**
- Service request monitoring & actions
- Guest list with details
- Duty roster view
- Real-time updates
- Push notifications ready

**Files Created:**
- `ContentView.swift` - Main app UI with tabs
- `Models.swift` - Data models (ServiceRequest, Guest, Crew)

**Status:** Core structure created, needs full implementation

### 3. Android App ⏳ TO BE IMPLEMENTED
**Location:** `mobile/android/OBEDIO/`

**Recommended Stack:**
- Kotlin + Jetpack Compose
- Retrofit for API calls
- Socket.IO for real-time updates
- Material Design 3

**Status:** Structure needs to be created

### 4. Apple Watch App ⏳ TO BE IMPLEMENTED
**Location:** `mobile/ios/OBEDIO-Watch/`

**Features:**
- Service request notifications
- Quick accept/complete actions
- On-duty status display
- Haptic feedback for emergencies

**Status:** Needs implementation

### 5. Android Wear App ⏳ TO BE IMPLEMENTED
**Location:** `mobile/android/OBEDIO-Wear/`

**Features:**
- Service request notifications
- Quick actions
- Duty status display

**Status:** Needs implementation

---

## 🔧 ESP32 Firmware Setup

### Hardware Assembly

#### Pin Connections

```
ESP32 Pin    Component
---------------------------
GPIO 4       Push Button (with pull-up)
GPIO 2       LED (built-in or external)
GPIO 34      Battery Voltage (ADC)
GPIO 21      I2C SDA (MPU6050)
GPIO 22      I2C SCL (MPU6050)
3.3V         MPU6050 VCC
GND          MPU6050 GND, Button GND
```

#### Circuit Diagram

```
                    ESP32
                   +-----+
Button ----[10kΩ]--|GPIO4|
                   |     |
LED   ------[330Ω]--|GPIO2|
                   |     |
Battery --[Divider]|GPIO34|
                   |     |
MPU6050 SDA--------|GPIO21|
MPU6050 SCL--------|GPIO22|
                   +-----+
```

**Battery Voltage Divider:**
```
Battery+ ----[100kΩ]---- ADC Pin (GPIO34) ----[100kΩ]---- GND
```

### Software Setup

#### 1. Install PlatformIO

```bash
# Install PlatformIO Core
pip install platformio

# Or install Visual Studio Code + PlatformIO extension
# https://platformio.org/install/ide?install=vscode
```

#### 2. Configure WiFi & MQTT

Edit `firmware/esp32-smart-button/src/main.cpp`:

```cpp
// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* MQTT_BROKER = "192.168.1.100";  // Your server IP
const int MQTT_PORT = 1883;
const char* MQTT_USER = "admin";
const char* MQTT_PASSWORD = "YOUR_PASSWORD";

// Device identification
const char* DEVICE_ID = "BTN-001";           // Unique ID
const char* LOCATION_ID = "master-suite";    // Cabin location
```

#### 3. Build & Upload

```bash
# Navigate to project directory
cd firmware/esp32-smart-button

# Build firmware
platformio run

# Upload to ESP32 (connect via USB)
platformio run --target upload

# Monitor serial output
platformio device monitor
```

#### 4. Testing

**Serial Monitor Output:**
```
OBEDIO Smart Button v1.0
================================
[BUTTON] Button initialized
[MPU6050] Initialized successfully
[WiFi] Connecting to MyWiFi
[WiFi] Connected!
[WiFi] IP address: 192.168.1.150
[MQTT] Attempting connection... connected!
[MQTT] Subscribed to config topic
[SYSTEM] Initialization complete!
================================

[BUTTON] Single click detected
[MQTT] Published button press: {"deviceId":"BTN-001","locationId":"master-suite",...}
```

**Test Button Functions:**
- **Single Click** → Normal service request
- **Double Click** → High priority request
- **Long Press (1s)** → Normal request
- **Shake Device** → Emergency request

### MQTT Topics

**Published by ESP32:**
```
obedio/devices/button-press    - Button press events
obedio/devices/status          - Device status (heartbeat every 60s)
```

**Subscribed by ESP32:**
```
obedio/devices/config          - Configuration updates
```

**Message Format:**
```json
{
  "deviceId": "BTN-001",
  "locationId": "master-suite",
  "pressType": "single",
  "priority": "normal",
  "timestamp": 12345678,
  "batteryLevel": 85,
  "signalStrength": -45
}
```

### Battery Monitoring

**Battery Status Interpretation:**
```
100%  = 4.2V (fully charged)
50%   = 3.7V (half charged)
0%    = 3.0V (empty, needs charging)
```

**Low Battery Alert:**
- Firmware sends status every 60 seconds
- Backend monitors battery level
- Alert sent when < 20%

### Troubleshooting

#### WiFi Won't Connect
```cpp
// Check credentials
Serial.println(WIFI_SSID);
Serial.println(WIFI_PASSWORD);

// Try fixed IP if DHCP fails
WiFi.config(IPAddress(192,168,1,150),
            IPAddress(192,168,1,1),
            IPAddress(255,255,255,0));
```

#### MQTT Connection Failed
```
// Verify broker is running
mosquitto -v

// Test with mosquitto_pub
mosquitto_pub -h localhost -t test -m "hello"
```

#### MPU6050 Not Found
```
// Check I2C connections
i2cdetect -y 1

// Expected output: 0x68 (MPU6050 address)
```

#### Button Not Responding
```cpp
// Verify pull-up resistor
pinMode(BUTTON_PIN, INPUT_PULLUP);

// Test with simpler code
if (digitalRead(BUTTON_PIN) == LOW) {
  Serial.println("Button pressed!");
}
```

---

## 📱 iOS App Setup

### Prerequisites

- macOS with Xcode 15+
- iOS 17+ target device or simulator
- Apple Developer account (for device testing)

### Project Structure

```
mobile/ios/OBEDIO/
├── ContentView.swift          ✅ Main UI with tabs
├── Models.swift               ✅ Data models
├── OBEDIOViewModel.swift      ⏳ Network & state management
├── APIService.swift           ⏳ REST API client
├── WebSocketService.swift     ⏳ Real-time updates
├── NotificationService.swift  ⏳ Push notifications
└── Info.plist                 ⏳ App configuration
```

### Complete Implementation Steps

#### 1. Create Xcode Project

```bash
# In Xcode:
File → New → Project
Choose: iOS → App
Product Name: OBEDIO
Interface: SwiftUI
Language: Swift
```

#### 2. Add Dependencies (Package.swift)

```swift
dependencies: [
    .package(url: "https://github.com/socketio/socket.io-client-swift", from: "16.0.0"),
    .package(url: "https://github.com/Alamofire/Alamofire", from: "5.8.0")
]
```

#### 3. Implement OBEDIOViewModel.swift

```swift
import Foundation
import Combine

@MainActor
class OBEDIOViewModel: ObservableObject {
    @Published var serviceRequests: [ServiceRequest] = []
    @Published var guests: [Guest] = []
    @Published var onDutyCrew: [CrewMember] = []
    @Published var nextShiftCrew: [CrewMember] = []
    @Published var isLoading = false
    @Published var isConnected = false
    @Published var currentUser: User?

    private let apiService = APIService()
    private let wsService = WebSocketService()

    var pendingRequestsCount: Int {
        serviceRequests.filter { $0.status == .pending }.count
    }

    func connect() {
        Task {
            await login()
            await refreshAll()
            wsService.connect()
            setupWebSocketListeners()
        }
    }

    private func login() async {
        // Implement authentication
    }

    func refreshAll() async {
        async let requests = refreshServiceRequests()
        async let guests = refreshGuests()
        async let duty = refreshDutyRoster()

        await (requests, guests, duty)
    }

    func refreshServiceRequests() async {
        // Fetch from API
        isLoading = true
        serviceRequests = await apiService.fetchServiceRequests()
        isLoading = false
    }

    func acceptRequest(_ id: String) {
        Task {
            await apiService.acceptServiceRequest(id)
            await refreshServiceRequests()
        }
    }

    // ... implement other methods
}
```

#### 4. Configure Info.plist

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>

<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

#### 5. Enable Push Notifications

```swift
import UserNotifications

UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
    if granted {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
}
```

### Testing

```bash
# Run in simulator
Command + R

# Run on physical device
1. Connect iPhone via USB
2. Select device in Xcode
3. Click Run (Command + R)
4. Trust developer certificate on device
```

---

## 🤖 Android App Setup

### Prerequisites

- Android Studio Electric Eel+
- Android SDK 24+
- Kotlin 1.9+

### Project Structure (Recommended)

```
mobile/android/OBEDIO/
├── app/
│   ├── src/main/
│   │   ├── java/com/obedio/app/
│   │   │   ├── MainActivity.kt
│   │   │   ├── ui/
│   │   │   │   ├── ServiceRequestsScreen.kt
│   │   │   │   ├── GuestsScreen.kt
│   │   │   │   └── DutyRosterScreen.kt
│   │   │   ├── viewmodel/
│   │   │   │   └── OBEDIOViewModel.kt
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   ├── api/
│   │   │   │   └── repository/
│   │   │   └── services/
│   │   │       ├── APIService.kt
│   │   │       └── WebSocketService.kt
│   │   └── res/
│   └── build.gradle.kts
└── build.gradle.kts
```

### Dependencies (build.gradle.kts)

```kotlin
dependencies {
    // Jetpack Compose
    implementation("androidx.compose.ui:ui:1.5.4")
    implementation("androidx.compose.material3:material3:1.1.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("io.socket:socket.io-client:2.1.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

### Quick Implementation

#### MainActivity.kt

```kotlin
@Composable
fun OBEDIOApp() {
    val viewModel: OBEDIOViewModel = viewModel()

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Filled.Notifications, "Requests") },
                    label = { Text("Requests") },
                    selected = true,
                    onClick = { /* Navigate */ }
                )
                // ... other tabs
            }
        }
    ) { paddingValues ->
        ServiceRequestsScreen(
            viewModel = viewModel,
            modifier = Modifier.padding(paddingValues)
        )
    }
}
```

---

## ⌚ Apple Watch App

### Setup

1. Add Watch App target in Xcode
2. Enable communication with iPhone app
3. Implement WatchConnectivity

### Minimal Implementation

```swift
// Watch App - ServiceRequestView.swift
struct ServiceRequestView: View {
    @StateObject var viewModel = WatchViewModel()

    var body: some View {
        List(viewModel.requests) { request in
            VStack(alignment: .leading) {
                Text(request.guestName)
                    .font(.headline)
                Text(request.location)
                    .font(.caption)

                Button("Accept") {
                    viewModel.accept(request.id)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .navigationTitle("Requests")
    }
}
```

---

## 🛠️ Development Workflow

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Flash ESP32 Firmware

```bash
cd firmware/esp32-smart-button
platformio run --target upload
platformio device monitor
```

### 3. Run Mobile App

**iOS:**
```bash
# Open Xcode project
open mobile/ios/OBEDIO.xcodeproj

# Or use command line
xcodebuild -scheme OBEDIO -sdk iphonesimulator
```

**Android:**
```bash
cd mobile/android
./gradlew installDebug
```

### 4. Test End-to-End

1. Press ESP32 button
2. Watch serial monitor for MQTT publish
3. Check backend logs for message received
4. Verify mobile app shows new service request
5. Accept request on mobile app
6. Verify real-time update via WebSocket

---

## 📊 Production Deployment

### ESP32 Firmware

**OTA Updates:**
```cpp
// Add to main.cpp
#include <ArduinoOTA.h>

void setupOTA() {
    ArduinoOTA.setHostname("obedio-btn-001");
    ArduinoOTA.setPassword("your-ota-password");
    ArduinoOTA.begin();
}

void loop() {
    ArduinoOTA.handle();
    // ... rest of code
}
```

**Flash Multiple Devices:**
```bash
# Script to flash multiple ESP32s
for i in {1..10}; do
    sed -i "s/DEVICE_ID = \"BTN-.*\"/DEVICE_ID = \"BTN-00$i\"/" src/main.cpp
    platformio run --target upload
    echo "Flashed BTN-00$i. Swap device and press Enter..."
    read
done
```

### Mobile Apps

**iOS:**
1. Archive in Xcode
2. Upload to App Store Connect
3. Submit for review
4. TestFlight for beta testing

**Android:**
1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Submit for review
4. Internal/closed testing tracks

---

## 🎯 Next Steps

### Immediate
- ✅ ESP32 firmware complete
- ✅ iOS app structure created
- ⏳ Complete iOS app implementation
- ⏳ Create Android app
- ⏳ Create Watch apps

### Future Enhancements
- Battery optimization (deep sleep)
- Mesh networking (ESP-NOW)
- LoRa long-range communication
- Offline mode with local storage
- Voice control integration
- NFC pairing

---

## 📞 Support

**Hardware Issues:** Check ESP32 serial monitor output
**App Issues:** Check Xcode/Android Studio logs
**Backend Issues:** Check server logs at `backend/logs/`

**Common Problems:**
- WiFi won't connect → Check SSID/password
- MQTT fails → Verify broker is running
- App won't compile → Update dependencies
- No real-time updates → Check WebSocket connection

---

**Hardware & Mobile Setup - PARTIAL IMPLEMENTATION COMPLETE!** 🎉

ESP32 firmware is fully functional. Mobile apps have core structure but need full implementation.

---

*Last Updated: 2025-01-24*
*ESP32 Firmware: v1.0.0 (Complete)*
*iOS App: Structure Created (Needs Implementation)*
*Android App: Not Started*
*Watch Apps: Not Started*
