# Setup Instructions - Obedio Minimal Android App

## Quick Start

### 1. Konfiguracija Backend URL-ova

Otvori fajl: `app/src/main/java/com/obedio/minimal/data/AppConfig.kt`

Izmeni URL-ove da odgovaraju tvom backend serveru:

```kotlin
object AppConfig {
    // Za Android Emulator (localhost)
    const val API_BASE_URL = "http://10.0.2.2:5001"
    const val WEBSOCKET_URL = "http://10.0.2.2:5001"
    const val MQTT_BROKER_URL = "tcp://10.0.2.2:1883"

    // Za pravi Android uređaj (koristi IP adresu računara)
    // const val API_BASE_URL = "http://192.168.1.100:5001"
    // const val WEBSOCKET_URL = "http://192.168.1.100:5001"
    // const val MQTT_BROKER_URL = "tcp://192.168.1.100:1883"
}
```

**Važno:**
- `10.0.2.2` = localhost na Android emulatoru
- Za fizički uređaj koristi stvarnu IP adresu računara (proveri sa `ipconfig`)

### 2. Backend Server Requirements

Tvoj backend server mora imati:

✅ **Health Check Endpoint:**
```javascript
// Express.js primer
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

✅ **WebSocket Server (Socket.IO):**
```javascript
const io = require('socket.io')(server, {
  cors: { origin: "*" }
});
```

✅ **MQTT Broker:**
```bash
# Instalacija Mosquitto na Windows
choco install mosquitto

# Pokreni broker
mosquitto -v -p 1883
```

### 3. Otvori Projekat u Android Studio

1. Pokreni Android Studio
2. File → Open
3. Izaberi folder: `mobile/Android V2 minimal`
4. Čekaj da se Gradle sync završi (~2 minuta)

### 4. Pokreni Backend Server

Pre pokretanja aplikacije, pokreni backend:

```bash
cd backend
npm install
npm run dev
```

Proveri da server radi na: `http://localhost:5001`

### 5. Pokreni Aplikaciju

U Android Studio:
1. Izaberi emulator ili povezan uređaj
2. Klikni **Run** (zelena play ikonica)
3. Aplikacija će se instalirati i pokrenuti

## Testiranje Konekcije

### Test 1: API Health Check

U browseru otvori:
```
http://localhost:5001/api/health
```

Trebalo bi da vidiš:
```json
{
  "status": "ok",
  "timestamp": "2025-..."
}
```

### Test 2: WebSocket Connection

Otvori browser console na web aplikaciji:
```javascript
// Browser console
const socket = io('http://localhost:5001');
socket.on('connect', () => console.log('Connected!'));
```

### Test 3: MQTT Broker

```bash
# Test MQTT sa mosquitto_pub/sub
mosquitto_sub -h localhost -t "obedio/#"
```

## Troubleshooting

### Problem: "Unable to connect to server"

**Proverite:**
1. Da li backend server radi? (`http://localhost:5001/api/health`)
2. Da li koristite pravu IP adresu?
   - Emulator: `10.0.2.2`
   - Fizički uređaj: IP adresa računara (ne `localhost`)
3. Da li firewall blokira port 5001?

**Kako naći IP adresu računara:**
```bash
# Windows
ipconfig

# Traži "IPv4 Address" (npr. 192.168.1.100)
```

### Problem: "MQTT Connection Failed"

**Rešenje:**
1. Proveri da li Mosquitto broker radi:
   ```bash
   netstat -an | findstr 1883
   ```
2. Ako ne radi, pokreni:
   ```bash
   mosquitto -v -p 1883
   ```
3. Proveri firewall

### Problem: "WebSocket disconnects immediately"

**Rešenje:**
1. Proveri backend logove za greške
2. Proveri da li Socket.IO server radi
3. Proveri CORS podešavanja:
   ```javascript
   const io = require('socket.io')(server, {
     cors: { origin: "*" }
   });
   ```

### Problem: App crashes on startup

**Rešenje:**
1. Proveri Android Studio Logcat:
   ```
   View → Tool Windows → Logcat
   ```
2. Filtriraj po "Error" nivou
3. Traži stack trace

## Build za Produkciju

### Debug APK (za testiranje)

```bash
cd "mobile/Android V2 minimal"
./gradlew assembleDebug
```

APK lokacija:
```
app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (za distribuciju)

1. Kreiraj keystore:
```bash
keytool -genkey -v -keystore obedio-minimal.keystore -alias obedio -keyalg RSA -keysize 2048 -validity 10000
```

2. Build release:
```bash
./gradlew assembleRelease
```

3. Sign APK u Android Studio:
   - Build → Generate Signed Bundle / APK
   - APK
   - Izaberi keystore
   - Release build

## Instalacija na Uređaj

### Via Android Studio
1. Povežu uređaj sa USB-om
2. Omogući "USB Debugging" na telefonu
3. Run u Android Studio

### Via ADB
```bash
# Instalacija
adb install app/build/outputs/apk/debug/app-debug.apk

# Proveri da je instalirana
adb shell pm list packages | findstr obedio
```

### Via APK fajl
1. Kopiraj APK na telefon
2. Otvori fajl menadžer
3. Tap na APK
4. Allow "Install from unknown sources"
5. Install

## Konfiguracija za različite okruženja

### Development (Local)
```kotlin
const val API_BASE_URL = "http://10.0.2.2:5001"
```

### Staging (Test Server)
```kotlin
const val API_BASE_URL = "http://test-server.obedio.com:5001"
```

### Production (Live Server)
```kotlin
const val API_BASE_URL = "https://api.obedio.com"
const val WEBSOCKET_URL = "https://api.obedio.com"
const val MQTT_BROKER_URL = "ssl://mqtt.obedio.com:8883"
```

## Port Forwarding (Napredna opcija)

Ako koristiš emulator i želiš da pristupis lokalnom serveru:

```bash
# Forward port 5001
adb forward tcp:5001 tcp:5001

# Forward port 1883 (MQTT)
adb forward tcp:1883 tcp:1883
```

Zatim u AppConfig:
```kotlin
const val API_BASE_URL = "http://localhost:5001"
```

## Debugging

### Android Studio Logcat

Filter po tag-u:
```
WebSocketService|MqttService|NetworkChecker
```

### ADB Logcat

```bash
# Prati sve logove
adb logcat

# Filtriraj po tag-u
adb logcat -s WebSocketService

# Clear logove
adb logcat -c
```

## Dodatni Resursi

- [Socket.IO Android Client](https://socket.io/docs/v4/client-installation/)
- [Eclipse Paho MQTT](https://www.eclipse.org/paho/index.php?page=clients/android/index.php)
- [Jetpack Compose Docs](https://developer.android.com/jetpack/compose)

## Podrška

Za pitanja ili probleme, kontaktiraj development tim ili proveri:
- `README.md` - Detaljna dokumentacija
- Backend dokumentacija u `backend/README.md`
