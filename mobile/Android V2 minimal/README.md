# Obedio Minimal - Android V2

Minimalna Android aplikacija za prikaz statusa konekcije sa Obedio sistemom.

## Opis

Ovo je **potpuno nova, minimalna verzija** Android aplikacije koja prikazuje samo status konekcije sa backend sistemom. Za razliku od pune verzije (Android V1), ova aplikacija:

- ✅ Prikazuje status WebSocket konekcije
- ✅ Prikazuje status MQTT broker konekcije
- ✅ Prikazuje status Backend API dostupnosti
- ✅ Omogućava refresh svih konekcija
- ✅ Real-time update statusa
- ❌ NEMA offline režima
- ❌ NEMA push notifikacija
- ❌ NEMA kompleksnih funkcionalnosti (service requests, gosti, itd.)

## Tehnički Stack

- **Kotlin** - Programski jezik
- **Jetpack Compose** - Moderni UI framework
- **ViewModel + StateFlow** - State management
- **Socket.IO** - WebSocket konekcija
- **Eclipse Paho MQTT** - MQTT broker konekcija
- **OkHttp** - API health check

## Struktura Projekta

```
app/
├── src/main/
│   ├── java/com/obedio/minimal/
│   │   ├── MainActivity.kt              # Entry point
│   │   ├── data/
│   │   │   ├── AppConfig.kt             # Konfiguracija URL-ova
│   │   │   └── ConnectionStatus.kt      # Data modeli
│   │   ├── services/
│   │   │   ├── NetworkChecker.kt        # API health check
│   │   │   ├── WebSocketService.kt      # Socket.IO servis
│   │   │   └── MqttService.kt           # MQTT servis
│   │   ├── viewmodel/
│   │   │   └── ConnectionViewModel.kt   # Business logika
│   │   └── ui/
│   │       ├── ConnectionStatusScreen.kt # Glavni UI ekran
│   │       └── theme/                   # Material 3 tema
│   ├── res/                             # Resursi (strings, colors, etc.)
│   └── AndroidManifest.xml
├── build.gradle.kts                     # App dependencies
└── proguard-rules.pro
```

## Poređenje sa Punom Verzijom (V1)

| Karakteristika | Android V1 (Full) | Android V2 (Minimal) |
|----------------|-------------------|----------------------|
| Broj ekrana | 8 ekrana | 1 ekran |
| Linije koda | ~8,000 | ~650 |
| Offline režim | ✅ Room database | ❌ |
| Push notifikacije | ✅ FCM | ❌ |
| Service requests | ✅ Full CRUD | ❌ |
| Guest management | ✅ | ❌ |
| API endpoints | 25+ | 1 (health check) |
| Dependencies | 20+ | 7 |

## Konfiguracija

Podesi URL-ove svog backend servera u fajlu `AppConfig.kt`:

```kotlin
object AppConfig {
    // Backend API URL
    const val API_BASE_URL = "http://10.0.2.2:5001"

    // WebSocket URL
    const val WEBSOCKET_URL = "http://10.0.2.2:5001"

    // MQTT Broker
    const val MQTT_BROKER_URL = "tcp://10.0.2.2:1883"
}
```

**Napomena:** `10.0.2.2` je specijalna IP adresa koja predstavlja `localhost` na Android emulatoru. Za pravi uređaj, koristi stvarnu IP adresu računara (npr. `192.168.1.100`).

## Instalacija

### 1. Otvori projekat u Android Studio

```bash
cd "mobile/Android V2 minimal"
```

Otvori folder u Android Studio.

### 2. Sync Gradle

Android Studio će automatski pozvati Gradle sync. Ako ne, klikni na:
- **File → Sync Project with Gradle Files**

### 3. Pokreni aplikaciju

- Izaberi emulator ili povežan uređaj
- Klikni na **Run** (zelena play dugme) ili pritisni `Shift + F10`

## Zahtevi

- **Android Studio** Hedgehog (2023.1.1) ili noviji
- **Android SDK** 24+ (Android 7.0)
- **Kotlin** 1.9.20
- **Java** 17

## Build Proces

### Debug Build

```bash
./gradlew assembleDebug
```

APK će biti u: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build

```bash
./gradlew assembleRelease
```

APK će biti u: `app/build/outputs/apk/release/app-release.apk`

## Instalacija na Uređaj preko ADB

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Kako Funkcionira

1. **Aplikacija se pokrene** → ConnectionViewModel se inicijalizuje
2. **startMonitoring()** pokreće sve servise:
   - WebSocketService se konektuje na Socket.IO server
   - MqttService se konektuje na MQTT broker
   - NetworkChecker proverava API health endpoint
3. **StateFlow emit-uje status** → UI se automatski ažurira
4. **Periodic check** - API se proverava svakih 10 sekundi
5. **User tap "Refresh"** → Svi servisi se ponovo konektuju

## UI Elementi

### Status Boje

- 🟢 **Zelena** (CONNECTED) - Servis je povezan
- 🔵 **Plava** (CONNECTING) - Servis se konektuje
- ⚪ **Siva** (DISCONNECTED) - Servis je diskonektovan
- 🔴 **Crvena** (ERROR) - Greška u konekciji

### Header Card

- Prikazuje "System Online" ako su svi servisi povezani
- Prikazuje "Partial Connection" ako neki servis nije dostupan

### Connection Cards

Svaki servis ima karticu sa:
- Status dot (obojeni indikator)
- Ikonica servisa
- Naziv servisa
- Status poruka
- Error detalji (ako postoje)
- Vreme poslednje uspešne konekcije

## Logovanje

Aplikacija koristi Android `Log` za debug informacije:

```bash
# Prati logove
adb logcat -s WebSocketService MqttService NetworkChecker
```

## Troubleshooting

### Problem: Ne mogu da se povežem na server

**Rešenje:** Proveri da li koristiš pravu IP adresu:
- **Emulator:** `10.0.2.2` (predstavlja localhost)
- **Fizički uređaj:** IP adresa računara u istoj mreži (npr. `192.168.1.100`)

### Problem: MQTT connection failed

**Rešenje:**
1. Proveri da li MQTT broker radi: `netstat -an | findstr 1883`
2. Proveri firewall pravila
3. Proveri da li broker dozvoljava anonymous konekcije

### Problem: WebSocket disconnects immediately

**Rešenje:**
1. Proveri da li backend server podržava WebSocket
2. Proveri backend logove za greške
3. Uveri se da koristiš `http://` URL (ne `ws://`)

### Problem: API health check fails

**Rešenje:**
1. Proveri da li endpoint `/api/health` postoji
2. Testuj u browseru: `http://localhost:5001/api/health`
3. Proveri CORS podešavanja na backend-u

## Dependencies

Minimalni set biblioteka:

```kotlin
// Core
androidx.core:core-ktx
androidx.lifecycle:lifecycle-runtime-ktx
androidx.activity:activity-compose

// Jetpack Compose
androidx.compose.ui:ui
androidx.compose.material3:material3

// ViewModel
androidx.lifecycle:lifecycle-viewmodel-compose

// Socket.IO
io.socket:socket.io-client:2.1.0

// MQTT
org.eclipse.paho:org.eclipse.paho.client.mqttv3:1.2.5
org.eclipse.paho:org.eclipse.paho.android.service:1.1.1

// HTTP
com.squareup.okhttp3:okhttp:4.12.0
```

**Ukupno:** ~7 glavnih dependencija (vs 20+ u punoj verziji)

## Performance

- **APK Size:** ~8 MB (vs ~25 MB u punoj verziji)
- **RAM Usage:** ~80 MB (vs ~150 MB u punoj verziji)
- **Build Time:** ~20 sekundi (vs ~45 sekundi)
- **Startup Time:** ~0.5 sekundi

## Budući Razvoj (Opciono)

Ako želiš da dodaš funkcionalnosti kasnije:

1. **Login ekran** - Dodaj autentifikaciju
2. **Notifikacije** - Integriši FCM
3. **Event log** - Prikazuj primljene MQTT/WebSocket poruke
4. **Ping test** - Dodaj latency merenje
5. **Connection history** - Graf uptime-a

## Licenca

Ovo je interni projekat za Obedio sistem.

## Autor

Razvijeno za Obedio Yacht Management System - Minimal Connection Monitor v2.0

---

**Napomena:** Ovo je minimalna verzija namenjena SAMO za proveru statusa konekcije. Za punu funkcionalnost crew management sistema, koristi Android V1 (Full) aplikaciju.
