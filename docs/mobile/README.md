# Mobile Documentation

This folder contains documentation for the OBEDIO mobile applications.

## Wear OS App (ObedioWear)

The primary mobile component is a **Wear OS smartwatch application** for crew members.

### Key Features
- Real-time MQTT notifications from guest service requests
- Full-screen wake-up alerts (works from lock screen)
- Accept/Delegate/Finish workflow
- Voice transcript display
- Persistent foreground service (24/7 MQTT connection)

### Application Structure
- **Location**: `../../ObedioWear/` (separate Android Studio project)
- **Language**: Kotlin
- **Min SDK**: Android Wear OS 2.0+
- **Key Components**:
  - `MqttForegroundService.kt` - Persistent MQTT connection
  - `FullScreenIncomingRequestActivity.kt` - WhatsApp-style notifications
  - `ServiceRequestViewModel.kt` - State management

### Setup Instructions
1. Open `ObedioWear/` folder in Android Studio
2. Connect Wear OS watch via ADB
3. Build and install: `./gradlew assembleDebug`
4. Configure backend URL in watch app settings

### MQTT Integration
- **Subscribes to**: `obedio/watch/{watchDeviceId}/notification`
- **Publishes to**: `obedio/watch/{watchDeviceId}/acknowledge`
- **Broker**: Connects to backend MQTT broker (port 1883)

### Device Discovery
Watches auto-discover their device ID from backend:
```
GET /api/devices/me?macAddress={androidMacAddress}
Response: { id, deviceId, crewMember }
```

## Android Mobile App (Legacy)

A minimal Android phone app exists in `../../mobile/Android V2 minimal/` for testing purposes.

## Documentation

- **[OBEDIO-ANDROID-APP-PLAN.md](OBEDIO-ANDROID-APP-PLAN.md)** - Development roadmap and features

## Related Documentation

- [Hardware Specifications](../hardware/) - ESP32 button hardware
- [Backend Architecture](../BACKEND-ARCHITECTURE.md) - Server integration
- [API Reference](../api-reference/) - Backend API endpoints
