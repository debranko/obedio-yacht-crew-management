# ObedioWear Android APK - IP & MQTT Configuration Guide

## ✅ Configuration Fixed

I've updated the Android app to use the **correct, dynamic IP configuration**.

---

## Current Server Configuration

### Backend Server
- **IP Address**: `10.10.0.207`
- **HTTP Port**: `8080`
- **MQTT Port**: `1883`
- **WebSocket Port**: `8080`

### URLs Used by Android App

From [`ServerConfig.kt`](app/src/main/java/com/example/obediowear/utils/ServerConfig.kt):

```kotlin
DEFAULT_IP = "10.10.0.207"

// HTTP API
getBaseUrl() = "http://10.10.0.207:8080/"

// MQTT Broker
getMqttUrl() = "tcp://10.10.0.207:1883"

// WebSocket
getWebSocketUrl() = "http://10.10.0.207:8080"
```

---

## Fixed Files

### 1. ✅ ServerConfig.kt
**Status**: Already correct
- Default IP: `10.10.0.207` ✅
- Dynamic configuration via SharedPreferences ✅
- Can be changed in-app without recompiling ✅

### 2. ✅ ApiClient.kt
**Status**: **FIXED** (was using wrong IP)
- **Before**: Hardcoded `192.168.5.152` ❌
- **After**: Uses `ServerConfig.getBaseUrl()` ✅
- Now matches MQTT and WebSocket configuration ✅

### 3. ✅ MqttManager.kt
**Status**: Already correct
- Uses `ServerConfig.getMqttUrl()` ✅
- MQTT broker: `tcp://10.10.0.207:1883` ✅

---

## How to Build APK in Android Studio

1. **Open Project**:
   ```
   File → Open → Select "ObedioWear" folder
   ```

2. **Sync Gradle**:
   ```
   File → Sync Project with Gradle Files
   ```

3. **Build APK**:
   ```
   Build → Build Bundle(s) / APK(s) → Build APK(s)
   ```

4. **Find APK**:
   ```
   ObedioWear/app/build/outputs/apk/debug/app-debug.apk
   ```

5. **Install on Watch**:
   ```
   adb install app-debug.apk
   ```
   Or drag & drop to connected watch in Android Studio

---

## Configuration Summary

| Component | IP/URL | Port | Protocol |
|-----------|--------|------|----------|
| Backend API | `10.10.0.207` | 8080 | HTTP |
| MQTT Broker | `10.10.0.207` | 1883 | TCP |
| WebSocket | `10.10.0.207` | 8080 | WS |
| Frontend | `10.10.0.207` | 80 | HTTP |

**All components now use the same IP: `10.10.0.207`** ✅

---

## Testing Checklist

After installing the APK:

- [ ] Open ObedioWear app on watch
- [ ] Check connection status (should show "Connected")
- [ ] Verify MQTT connection in logs
- [ ] Test receiving service request notification
- [ ] Test acknowledge button
- [ ] Verify API calls work (service requests list)

---

## Troubleshooting

### Can't Connect to Server

1. **Check network**: Watch must be on same WiFi as server (`10.10.0.207`)
2. **Test connectivity**: 
   ```bash
   adb shell
   ping 10.10.0.207
   ```
3. **Verify backend is running**:
   ```bash
   curl http://10.10.0.207:8080/health
   ```

### MQTT Connection Fails

1. **Check Mosquitto is running**:
   ```bash
   docker ps | grep mosquitto
   ```
2. **Test MQTT broker**:
   ```bash
   mosquitto_sub -h 10.10.0.207 -t '#' -v
   ```

### Wrong IP Still Showing

- The app now uses **dynamic configuration**
- IP can be changed in-app via settings dialog
- No need to recompile if IP changes

---

## Ready to Build!

The Android app configuration is now correct and consistent with:
- ✅ ESP32 firmware (`10.10.0.207`)
- ✅ Backend server (`10.10.0.207`)
- ✅ Frontend web app (`10.10.0.207`)
- ✅ MQTT broker (`10.10.0.207:1883`)

**You can now build and push the APK from Android Studio!**