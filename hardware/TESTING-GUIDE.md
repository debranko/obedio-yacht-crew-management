# OBEDIO ESP32 Testing Guide

**Version**: 1.0
**Date**: October 24, 2025
**Purpose**: Comprehensive testing procedures for ESP32 hardware

---

## 📋 Test Checklist

### Pre-Deployment Tests (Lab)
- [ ] Power-on test
- [ ] WiFi connectivity test
- [ ] MQTT connection test
- [ ] Button functionality test
- [ ] Display test (watch only)
- [ ] Vibration test (watch only)
- [ ] Battery test
- [ ] Range test
- [ ] Load test
- [ ] Integration test with backend

### Post-Deployment Tests (On-site)
- [ ] Installation test
- [ ] Signal strength test
- [ ] End-to-end workflow test
- [ ] User acceptance test
- [ ] 24-hour stability test

---

## 🔋 Test 1: Power-On Test

### ESP32 Button

**Objective**: Verify device powers on and initializes correctly

**Procedure**:
1. Connect ESP32 to USB power
2. Open Serial Monitor (115200 baud)
3. Observe boot sequence

**Expected Output**:
```
========================================
OBEDIO ESP32 Button - Starting...
========================================
Device ID: BTN-XX:XX:XX:XX:XX:XX
Location ID: [uuid]
Firmware Version: 1.0.0
```

**Pass Criteria**:
- ✅ Device boots without errors
- ✅ Device ID generated from MAC
- ✅ Location ID loaded correctly
- ✅ Firmware version displayed

**Fail Actions**:
- ❌ Brownout detector error → Check power supply (needs 5V 500mA minimum)
- ❌ Preference init failed → Flash file system corrupted, reflash firmware
- ❌ Stuck in boot loop → Check GPIO pins not shorted to GND

### ESP32 Watch

**Additional Checks**:
- [ ] OLED display initializes
- [ ] Initial screen appears (OBEDIO logo)
- [ ] No I2C errors

**Expected Output**:
```
========================================
OBEDIO ESP32 Watch - Starting...
========================================
Crew ID: [uuid]
Crew Name: John Doe
```

Plus visual confirmation on OLED display.

---

## 📡 Test 2: WiFi Connectivity Test

**Objective**: Verify device connects to WiFi network

**Procedure**:
1. Ensure WiFi router is powered on
2. Monitor serial output during boot
3. Record connection time
4. Check IP address assignment

**Expected Output**:
```
🔌 Connecting to WiFi...
SSID: Blagojevic
............
✅ WiFi connected!
IP Address: 192.168.1.xxx
Signal Strength (RSSI): -45 dBm
```

**Pass Criteria**:
- ✅ Connects within 10 seconds
- ✅ RSSI better than -75 dBm
- ✅ Valid IP address assigned
- ✅ No disconnections during 5 minute test

**Troubleshooting**:
| Problem | RSSI | Solution |
|---------|------|----------|
| Weak signal | -76 to -85 dBm | Move closer to AP or add WiFi extender |
| No signal | -90 dBm or worse | Check WiFi is 2.4GHz, not 5GHz |
| Intermittent | Fluctuating | Check for interference, metal objects |

**Test Commands**:
```cpp
// Add to setup() for testing:
Serial.print("RSSI: ");
Serial.print(WiFi.RSSI());
Serial.println(" dBm");

Serial.print("Channel: ");
Serial.println(WiFi.channel());

Serial.print("Gateway: ");
Serial.println(WiFi.gatewayIP());
```

---

## 🔌 Test 3: MQTT Connection Test

**Objective**: Verify device connects to MQTT broker

**Procedure**:
1. Ensure Mosquitto broker is running
   ```bash
   docker ps | findstr mosquitto
   ```
2. Open MQTT Monitor at http://localhost:8888
3. Monitor serial output
4. Observe connection in MQTT Monitor

**Expected Output (Serial)**:
```
🔌 Connecting to MQTT broker...
Broker: 192.168.1.100:1883
Attempting MQTT connection as: obedio-button-BTN-XX...
✅ MQTT connected!
```

**Expected Output (MQTT Monitor)**:
- New client appears: `obedio-button-BTN-XX...` or `obedio-watch-XX...`

**Pass Criteria**:
- ✅ Connects within 5 seconds
- ✅ Client appears in MQTT Monitor
- ✅ No connection errors
- ✅ Maintains connection for 5 minutes

**MQTT State Codes**:
```
-4 = MQTT_CONNECTION_TIMEOUT     - Server didn't respond
-3 = MQTT_CONNECTION_LOST        - Network problem
-2 = MQTT_CONNECT_FAILED         - Can't connect
-1 = MQTT_DISCONNECTED           - Cleanly disconnected
 0 = MQTT_CONNECTED              - Success!
 1 = MQTT_CONNECT_BAD_PROTOCOL   - Wrong protocol version
 2 = MQTT_CONNECT_BAD_CLIENT_ID  - Invalid client ID
 3 = MQTT_CONNECT_UNAVAILABLE    - Server unavailable
 4 = MQTT_CONNECT_BAD_CREDENTIALS - Wrong user/pass
 5 = MQTT_CONNECT_UNAUTHORIZED   - Not authorized
```

**Test with MQTT Explorer** (optional):
1. Download [MQTT Explorer](http://mqtt-explorer.com/)
2. Connect to: `192.168.1.100:1883`
3. Verify you see `obedio/button/...` or `obedio/crew/...` topics

---

## 🔘 Test 4: Button Functionality Test

### Single Press Test

**Objective**: Verify single button press detection

**Procedure**:
1. Press MAIN button once, quickly
2. Release within 300ms
3. Observe serial output
4. Check MQTT Monitor

**Expected Output (Serial)**:
```
🔘 Button pressed: main
🔘 Single press detected
📤 Publishing MQTT message:
Topic: obedio/button/BTN-XX.../press
Payload: {"deviceId":"...", "pressType":"single", ...}
✅ Message published successfully!
```

**Expected Output (MQTT Monitor)**:
- New message appears
- Topic: `obedio/button/{deviceId}/press`
- Payload contains:
  - `pressType`: "single"
  - `button`: "main"
  - `locationId`: Valid UUID
  - `battery`: 0-100
  - `rssi`: -20 to -90 dBm

**Pass Criteria**:
- ✅ Press detected within 50ms
- ✅ Message published within 200ms
- ✅ LED blinks once
- ✅ Correct data in payload

### Double Press Test

**Procedure**:
1. Press MAIN button twice, quickly
2. Keep both presses under 300ms
3. Time between presses: < 400ms

**Expected Output**:
```
🔘 Button pressed: main
🔘 Double press detected
📤 Publishing MQTT message:
Payload: {..., "pressType":"double", ...}
```

**Pass Criteria**:
- ✅ Detects double press correctly
- ✅ Does NOT send two single press events
- ✅ `pressType` is "double"

### Long Press Test

**Procedure**:
1. Press and HOLD MAIN button
2. Hold for at least 2 seconds
3. Release

**Expected Output**:
```
🔘 Button pressed: main
🔘 Long press detected
📤 Publishing MQTT message:
Payload: {..., "pressType":"long", ...}
```

**Pass Criteria**:
- ✅ Detects after 2000ms (± 100ms)
- ✅ Publishes immediately on 2s threshold
- ✅ LED stays on during hold

### Multi-Button Test

**Procedure**:
1. Test all 5 buttons individually:
   - MAIN (GPIO 21)
   - AUX1 (GPIO 19)
   - AUX2 (GPIO 18)
   - AUX3 (GPIO 5)
   - AUX4 (GPIO 17)

**Pass Criteria**:
- ✅ Each button produces unique event
- ✅ Button name in payload matches physical button
- ✅ No cross-talk between buttons
- ✅ All buttons have same response time

### Bounce Test

**Objective**: Verify debounce logic prevents multiple triggers

**Procedure**:
1. Press button VERY rapidly 10 times in 2 seconds
2. Count messages in MQTT Monitor

**Expected Result**:
- Should see ~10 messages, NOT 20+ (each press creates ONE message)
- No "phantom" presses

**Pass Criteria**:
- ✅ Message count matches button press count (± 1)
- ✅ No duplicate messages within 50ms

---

## 📺 Test 5: Display Test (Watch Only)

### OLED Initialization Test

**Procedure**:
1. Power on watch
2. Observe display boot sequence

**Expected Behavior**:
1. Display turns on (backlight visible)
2. "OBEDIO" logo appears
3. "Connecting..." message
4. Home screen appears within 10 seconds

**Pass Criteria**:
- ✅ Display initializes without I2C errors
- ✅ All pixels working (no dead pixels)
- ✅ Text is clear and readable
- ✅ No flickering

### Screen Mode Test

**Test all display modes**:

1. **Home Screen** - Shows time, crew name, status
2. **Requests List** - Shows pending requests
3. **Request Detail** - Shows full request info
4. **Settings** - Shows configuration options

**Procedure**:
1. Press SELECT button to cycle through modes
2. Verify each screen displays correctly

**Pass Criteria**:
- ✅ All screens render correctly
- ✅ Text is readable
- ✅ No text overflow
- ✅ Transitions are smooth

### Screen Timeout Test

**Procedure**:
1. Wake display (press any button)
2. Do not touch for 30 seconds
3. Observe display

**Expected Behavior**:
- Display turns off after 30 seconds (± 2s)
- Pressing any button wakes it up
- Content restored correctly

---

## 📳 Test 6: Vibration Test (Watch Only)

### Vibration Patterns Test

**Test all alert patterns**:

**Normal Priority**:
1. Send normal service request
2. Observe: 1 long vibration (500ms)

**Urgent Priority**:
1. Send urgent service request
2. Observe: 3 long vibrations with pauses

**Emergency Priority**:
1. Send emergency service request
2. Observe: 5 rapid vibrations (continuous pattern)

**Pass Criteria**:
- ✅ Motor activates
- ✅ Pattern matches priority level
- ✅ Vibration strength is noticeable
- ✅ No excessive noise

**Troubleshooting**:
- Weak vibration → Check transistor/motor connection
- No vibration → Test motor with 3.3V directly
- Constant vibration → GPIO pin stuck HIGH

---

## 🔋 Test 7: Battery Test

### Battery Level Reporting Test

**Procedure**:
1. Connect to battery power (no USB)
2. Monitor battery level in serial output
3. Cross-check with multimeter

**Test Points**:
| Battery Voltage | Expected % | Tolerance |
|-----------------|------------|-----------|
| 4.2V (full) | 100% | ± 5% |
| 3.9V | 75% | ± 10% |
| 3.7V (nominal) | 50% | ± 10% |
| 3.4V | 25% | ± 10% |
| 3.0V (empty) | 0% | ± 5% |

**Calibration**:
If readings are incorrect, adjust voltage divider ratio in firmware.

### Battery Life Test (Extended)

**Button (Target: 3-6 months)**:

**Test Setup**:
1. Fully charge battery
2. Configure deep sleep (optional)
3. Record start time and voltage
4. Simulate normal usage:
   - 10 button presses per day
   - 100ms awake per press
   - Deep sleep between presses

**Accelerated Test** (24 hours):
- Press button every 5 minutes
- Extrapolate battery life

**Formula**:
```
Estimated life (days) = (Battery mAh × 24h) / (Avg current × hours)

Example:
(2200mAh × 24h) / (0.01mA × 24h) = ~9,000 days (deep sleep)
(2200mAh × 24h) / (1.0mA × 24h) = ~92 days (always on)
```

**Watch (Target: 8-10 hours active)**:

**Test Setup**:
1. Fully charge battery
2. Enable display timeout
3. Simulate active use:
   - Check time every 10 minutes
   - Receive 3 notifications per hour
   - Navigate menus for 2 minutes/hour

**Pass Criteria**:
- Button: > 90 days (3 months) minimum
- Watch: > 8 hours active use

### Charging Test

**Procedure**:
1. Deplete battery to < 20%
2. Connect to USB charger
3. Monitor TP4056 LED
4. Measure charge time

**Expected Behavior**:
- TP4056 RED LED on → Charging
- TP4056 BLUE/GREEN LED on → Charged
- Charge time: ~2-3 hours for 2200mAh

**Pass Criteria**:
- ✅ Charging starts automatically
- ✅ Full charge within 4 hours
- ✅ Device operates while charging
- ✅ LED indicator works

---

## 📶 Test 8: Range Test

**Objective**: Determine maximum reliable distance from WiFi router

**Equipment**:
- ESP32 device
- Laptop with serial monitor
- Measuring tape or app
- WiFi analyzer app (optional)

**Procedure**:
1. Start at 1 meter from router
2. Press button, verify message received
3. Move 5 meters away
4. Repeat test
5. Continue until connection fails
6. Record maximum distance

**Test Pattern**:
- 1m, 5m, 10m, 15m, 20m, 25m, 30m, 40m, 50m

**Record for each distance**:
- RSSI (dBm)
- Success rate (out of 10 button presses)
- Reconnection time if disconnected

**Typical Results**:
| Distance | RSSI | Success Rate |
|----------|------|--------------|
| 1m | -20 dBm | 100% |
| 10m | -50 dBm | 100% |
| 20m | -65 dBm | 100% |
| 30m | -72 dBm | 95% |
| 40m | -78 dBm | 80% (marginal) |
| 50m | -85 dBm | 50% (unreliable) |

**Pass Criteria**:
- ✅ Minimum 20m range in open space
- ✅ Minimum 10m range through walls
- ✅ RSSI better than -75 dBm at installation location

**Solutions for Poor Range**:
- Add WiFi extenders/mesh network
- Use external antenna on ESP32
- Relocate WiFi router
- Reduce interference (metal obstacles)

---

## ⚡ Test 9: Load Test

**Objective**: Verify system handles multiple simultaneous connections

**Scenario 1: Multiple Buttons**:
1. Connect 5 buttons simultaneously
2. Press all buttons within 1 second
3. Verify all messages arrive

**Expected**:
- All 5 messages in MQTT Monitor
- No packet loss
- Messages arrive within 2 seconds

**Scenario 2: Rapid Button Presses**:
1. Press button 20 times rapidly (1 press/second)
2. Count messages in MQTT Monitor

**Expected**:
- 20 messages received
- No messages dropped
- Sequence numbers increment correctly

**Scenario 3: Multiple Watches**:
1. Connect 3 watches
2. Send broadcast notification
3. Verify all watches receive and display

**Pass Criteria**:
- ✅ No packet loss
- ✅ All devices receive messages
- ✅ Response time < 500ms per message
- ✅ MQTT broker stable (no crashes)

---

## 🔄 Test 10: Integration Test with Backend

**Objective**: End-to-end workflow test

### Button → Backend → Watch Flow

**Procedure**:
1. Open Obedio web app (http://localhost:5173)
2. Open MQTT Monitor (http://localhost:8888)
3. Have watch ready
4. Press button on ESP32 button device

**Expected Flow**:
```
[ESP32 Button]
    ↓ MQTT: obedio/button/{id}/press
[Mosquitto Broker]
    ↓ Subscribe
[Backend Service]
    ↓ Process message
    ↓ Create service request in database
    ↓ MQTT: obedio/crew/{id}/notification
[Mosquitto Broker]
    ↓ Subscribe
[ESP32 Watch]
    ↓ Display notification
    ↓ Vibrate alert
```

**Verification Points**:

1. **MQTT Monitor**:
   - [ ] Button press message appears
   - [ ] Watch notification message appears

2. **Backend Logs**:
   - [ ] "📥 MQTT message: obedio/button/..."
   - [ ] "✅ Service request created: ..."
   - [ ] "📤 Notification sent to crew: ..."

3. **Web App**:
   - [ ] New service request appears in list
   - [ ] Status = "pending"
   - [ ] Location, guest, type correct

4. **ESP32 Watch**:
   - [ ] Vibrates
   - [ ] Shows notification
   - [ ] Request details correct

**Timing Test**:
- Button press → Watch notification: < 2 seconds

**Pass Criteria**:
- ✅ Complete flow works
- ✅ Data integrity maintained
- ✅ No errors in any component
- ✅ Timing meets requirements

### Watch → Backend Flow (Acknowledge)

**Procedure**:
1. Press SELECT button on watch
2. Acknowledge a service request
3. Verify in web app

**Expected Flow**:
```
[ESP32 Watch]
    ↓ MQTT: obedio/crew/{id}/acknowledge
[Mosquitto Broker]
    ↓ Subscribe
[Backend Service]
    ↓ Update service request status
    ↓ WebSocket broadcast to frontend
[Web App]
    ↓ Status changes to "acknowledged"
```

**Verification**:
- [ ] Request status updates in web app
- [ ] Timestamp recorded
- [ ] Crew member name shown

---

## 🏠 Test 11: Installation Test (On-Site)

### Button Installation

**Pre-Installation Checklist**:
- [ ] WiFi signal strength test at location (RSSI > -70 dBm)
- [ ] Wall mounting hardware ready
- [ ] Button firmware configured with correct Location ID
- [ ] Battery charged or USB power available

**Installation Steps**:
1. Mount button in cabin
2. Power on device
3. Wait for WiFi connection
4. Test button press
5. Verify notification received

**Acceptance Test**:
- Guest presses button
- Crew member receives notification on watch
- Service completed
- Guest satisfied

### Watch Distribution

**Per-Watch Setup**:
- [ ] Configure with crew member UUID
- [ ] Set crew member name
- [ ] Adjust watch strap
- [ ] Show basic operation

**Training Checklist**:
- [ ] How to wake screen
- [ ] How to view requests
- [ ] How to acknowledge request
- [ ] How to charge device
- [ ] Battery life expectations

---

## 📊 Test 12: 24-Hour Stability Test

**Objective**: Verify devices are stable over extended period

**Setup**:
1. Install all devices
2. Configure monitoring
3. Let run for 24 hours
4. Review logs next day

**Monitoring**:
- Button: Press every hour (manually or automated)
- Watch: Receive notification every hour
- Backend: Check logs for errors
- MQTT: Monitor connection status

**Success Metrics**:
- ✅ 0 disconnections
- ✅ 0 crashes/reboots
- ✅ < 1% packet loss
- ✅ Consistent response times
- ✅ No memory leaks
- ✅ Battery drain as expected

**Log Analysis**:
```bash
# Check for disconnect events
docker logs obedio-mosquitto | findstr "disconnected"

# Check backend errors
docker logs obedio-backend | findstr "error\|ERROR"

# Count MQTT messages
docker logs obedio-mosquitto | findstr "PUBLISH" | wc -l
```

---

## 📝 Test Report Template

### Test Summary

**Date**: [Date]
**Tester**: [Name]
**Firmware Version**: [Version]
**Hardware Version**: [Version]

| Test | Status | Notes |
|------|--------|-------|
| Power-On | ✅ / ❌ | |
| WiFi Connection | ✅ / ❌ | RSSI: ___ dBm |
| MQTT Connection | ✅ / ❌ | |
| Button Single Press | ✅ / ❌ | |
| Button Double Press | ✅ / ❌ | |
| Button Long Press | ✅ / ❌ | |
| Display Test | ✅ / ❌ | |
| Vibration Test | ✅ / ❌ | |
| Battery Test | ✅ / ❌ | Duration: ___ hours |
| Range Test | ✅ / ❌ | Max range: ___ m |
| Integration Test | ✅ / ❌ | |

**Overall Result**: ✅ PASS / ❌ FAIL

**Issues Found**:
1. [Issue description]
2. [Issue description]

**Recommendations**:
1. [Recommendation]
2. [Recommendation]

**Sign-off**:
- Tester: _______________
- Date: _______________

---

## 🎯 Acceptance Criteria Summary

### ESP32 Button

- [ ] Boots successfully every time
- [ ] Connects to WiFi within 10 seconds
- [ ] Connects to MQTT within 5 seconds
- [ ] All 5 buttons respond correctly
- [ ] Single/double/long press detection works
- [ ] Messages arrive within 500ms
- [ ] Battery lasts > 90 days (with deep sleep)
- [ ] Range > 20m in open space
- [ ] LED feedback works
- [ ] No false triggers

### ESP32 Watch

- [ ] Boots successfully every time
- [ ] OLED display initializes
- [ ] All screens display correctly
- [ ] Connects to WiFi within 10 seconds
- [ ] Connects to MQTT within 5 seconds
- [ ] Receives notifications reliably
- [ ] Vibration patterns work
- [ ] Battery lasts > 8 hours active use
- [ ] Buttons navigate UI correctly
- [ ] Screen timeout works

### System Integration

- [ ] End-to-end flow works
- [ ] Button → Watch < 2 seconds
- [ ] No message loss
- [ ] Multiple devices work simultaneously
- [ ] 24-hour stability test passes
- [ ] User acceptance test passes

---

**All tests passed? Congratulations! Your OBEDIO hardware is ready for deployment! 🎉**

---

*Document Version: 1.0*
*Last Updated: October 24, 2025*
*OBEDIO Development Team*
