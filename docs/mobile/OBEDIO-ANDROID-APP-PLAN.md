# OBEDIO ANDROID APP - KOMPLETAN PLAN RAZVOJA

**Datum**: 2025-11-09
**Projekt**: Obedio Yacht Crew Management - Android Aplikacija
**Verzija**: 1.0

---

## 📱 1. ARHITEKTURA I TEHNOLOGIJE

### 1.1 Android Tech Stack
- **Jezik**: Kotlin (100% Kotlin)
- **Min SDK**: 24 (Android 7.0) - pokriva 98%+ uređaja
- **Target SDK**: 34 (Android 14)
- **Build System**: Gradle KTS sa Version Catalogs

### 1.2 Arhitektonski Pattern
**MVVM + Clean Architecture**
```
presentation/
├── ui/           # Jetpack Compose UI
├── viewmodel/    # ViewModels sa StateFlow
└── navigation/   # Navigation Compose

domain/
├── model/        # Domain modeli
├── repository/   # Repository interfejsi
└── usecase/      # Business logic

data/
├── api/          # Retrofit servisi
├── local/        # Room database
├── repository/   # Repository implementacije
└── mapper/       # DTO to Domain mapperi
```

### 1.3 Ključne Biblioteke
```kotlin
// UI
- Jetpack Compose (latest stable)
- Material 3 Design System
- Accompanist za dodatne UI komponente

// Networking
- Retrofit 2 + OkHttp
- Moshi za JSON parsing
- Socket.IO client za real-time
- Paho MQTT za MQTT komunikaciju

// Local Storage
- Room Database
- DataStore za preferences
- Encrypted SharedPreferences

// Dependency Injection
- Hilt

// Async
- Coroutines + Flow
- WorkManager za background sync

// Ostalo
- Coil za slike
- Timber za logging
- LeakCanary (debug)
```

---

## 🎯 2. KLJUČNE FUNKCIONALNOSTI

### 2.1 Za Crew Članove
1. **Dashboard**
   - Pregled aktivnih service requestova
   - Guest status (onboard/departed)
   - DND status po kabinama
   - Brze akcije

2. **Service Requests**
   - Lista zahteva sa prioritetima
   - Accept/Complete/Delegate akcije
   - Voice request playback
   - Push notifikacije za nove zahteve
   - Timer za serving timeout

3. **Guest Management**
   - Pretraga gostiju
   - Pregled detalja, preferencija, alergija
   - Service history po gostu
   - Quick actions (call, message)

4. **Duty Roster**
   - Pregled rasporeda smjena
   - Swap requests
   - Availability management

5. **Messages**
   - Inter-crew messaging
   - Broadcast poruke
   - Read receipts

### 2.2 Za Chief Stewardess/Admin
1. **Crew Management**
   - Status tracking (on/off duty)
   - Performance metrics
   - Assignment pregled

2. **Analytics**
   - Response time statistike
   - Service request trenidovi
   - Crew performance

3. **Device Management**
   - Smart button status
   - Battery monitoring
   - Location assignments

### 2.3 Posebne Funkcionalnosti
1. **Quick Actions Widget**
   - Accept najbliži request
   - Toggle duty status
   - Emergency alert

2. **Voice Features**
   - Voice-to-text za notes
   - Audio playback za voice requests

3. **Offline Mode**
   - Cached guest data
   - Queued actions
   - Auto-sync kada se vrati konekcija

---

## 🔌 3. API INTEGRACIJA

### 3.1 REST API Setup
```kotlin
// Retrofit configuration
interface ObedioApi {
    // Auth
    @POST("auth/login")
    suspend fun login(@Body credentials: LoginRequest): ApiResponse<AuthData>
    
    // Service Requests
    @GET("service-requests")
    suspend fun getServiceRequests(): List<ServiceRequestDTO>
    
    @PUT("service-requests/{id}/accept")
    suspend fun acceptRequest(
        @Path("id") id: String,
        @Body data: AcceptRequest
    ): ServiceRequestDTO
}

// Repository pattern
class ServiceRequestRepository(
    private val api: ObedioApi,
    private val dao: ServiceRequestDao
) {
    fun getActiveRequests() = flow {
        emit(dao.getActiveRequests()) // Emit cached
        val fresh = api.getServiceRequests()
        dao.insertAll(fresh)
        emit(fresh) // Emit fresh
    }
}
```

### 3.2 WebSocket Integration
```kotlin
class WebSocketService {
    private val socket = IO.socket("ws://yacht.local:8080")
    
    fun connect() {
        socket.on("service-request:created") { args ->
            // Handle new request
        }
        
        socket.on("crew:status-changed") { args ->
            // Update crew status
        }
    }
}
```

### 3.3 MQTT Client
```kotlin
class MqttService {
    private val client = MqttAndroidClient(
        context, 
        "tcp://yacht.local:1883", 
        "android-${deviceId}"
    )
    
    fun subscribeToTopics() {
        client.subscribe("obedio/service/+", 1)
        client.subscribe("obedio/emergency/alert", 2)
    }
}
```

---

## 🔐 4. AUTENTIFIKACIJA I SIGURNOST

### 4.1 Login Flow
1. **Biometric Login** (nakon prvog login-a)
2. **Username/Password** sa remember me
3. **JWT Token Management**:
   - Secure storage u EncryptedSharedPreferences
   - Auto-refresh prije isteka
   - Interceptor za dodavanje u headers

### 4.2 Session Management
```kotlin
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Chain): Response {
        val token = tokenManager.getAccessToken()
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer $token")
            .build()
        
        val response = chain.proceed(request)
        
        if (response.code == 401) {
            // Refresh token ili logout
        }
        
        return response
    }
}
```

### 4.3 Sigurnosne Mjere
- Certificate pinning za produkciju
- Obfuskacija sa R8/ProGuard
- Enkripcija lokalne baze
- Biometric authentication
- Screen recording prevention (za sensitive data)

---

## 📡 5. REAL-TIME FUNKCIONALNOSTI

### 5.1 Push Notifikacije (FCM)
```kotlin
class NotificationService : FirebaseMessagingService() {
    override fun onMessageReceived(message: RemoteMessage) {
        when (message.data["type"]) {
            "service_request" -> showServiceRequestNotification()
            "emergency" -> showEmergencyAlert()
            "message" -> showMessageNotification()
        }
    }
}
```

### 5.2 Service Request Notifikacije
- **Heads-up notification** za urgent/emergency
- **Quick actions**: Accept, View, Delegate
- **Custom zvuk** po prioritetu
- **Vibration patterns**
- **LED indikator** (ako je dostupan)

### 5.3 Background Sync
```kotlin
class SyncWorker : CoroutineWorker() {
    override suspend fun doWork(): Result {
        // Sync offline actions
        syncPendingActions()
        
        // Update cached data
        updateGuestData()
        updateCrewStatus()
        
        return Result.success()
    }
}
```

---

## 🎨 6. UI/UX KONCEPT

### 6.1 Design Sistem
- **Material You (Material 3)** sa dynamic colors
- **Dark/Light theme** sa auto-switch
- **Custom theme** za yacht branding

### 6.2 Ključni Ekrani

#### Dashboard
```
┌─────────────────────────┐
│ Good morning, Sophie    │
│ 3 active requests       │
├─────────────────────────┤
│ ┌─────────┬───────────┐ │
│ │ URGENT  │ Suite 201 │ │
│ │ 2 min   │ Drinks    │ │
│ └─────────┴───────────┘ │
│                         │
│ ┌─────────┬───────────┐ │
│ │ NORMAL  │ Cabin 105 │ │
│ │ 5 min   │ Service   │ │
│ └─────────┴───────────┘ │
├─────────────────────────┤
│ [+] Accept Nearest      │
└─────────────────────────┘
```

#### Service Request Detail
```
┌─────────────────────────┐
│ ← Suite 201 - Mr. Smith │
├─────────────────────────┤
│ 🔴 URGENT REQUEST       │
│                         │
│ "Please bring ice and   │
│ champagne"              │
│                         │
│ ⏱️ Requested 3 min ago  │
│ 📍 Upper Deck, Suite    │
│ 👤 John Smith (VIP)     │
│                         │
│ ⚠️ Allergies: Shellfish │
├─────────────────────────┤
│ [ACCEPT]   [DELEGATE]   │
└─────────────────────────┘
```

### 6.3 Gesture i Animacije
- **Swipe to accept/complete** requests
- **Pull to refresh** sa custom animacijom
- **Shared element transitions** između ekrana
- **Subtle micro-interactions**

---

## 💾 7. OFFLINE FUNKCIONALNOSTI

### 7.1 Offline-First Strategija
```kotlin
// Room database entities
@Entity
data class ServiceRequestEntity(
    @PrimaryKey val id: String,
    val guestName: String,
    val location: String,
    val status: String,
    val priority: String,
    val cachedAt: Long,
    val syncStatus: SyncStatus
)

enum class SyncStatus {
    SYNCED, PENDING_SYNC, SYNC_ERROR
}
```

### 7.2 Konflikt Rezolucija
- **Last-write-wins** za većinu podataka
- **Server-authoritative** za kritične akcije
- **Retry queue** za failed operations
- **Konflikt notifikacije** za user

### 7.3 Data Caching Strategy
- **Guests**: Cache 24h, background refresh
- **Service Requests**: Real-time sync
- **Crew Status**: Cache 1h
- **Static Data**: Cache 7 dana

---

## 🚀 8. RAZVOJNI ROADMAP

### Faza 1: MVP (6-8 nedelja)
**Cilj**: Osnovna funkcionalnost za crew članove

- [ ] Setup projekta i arhitekture
- [ ] Login i autentifikacija
- [ ] Service request lista i detalji
- [ ] Accept/Complete funkcionalnost
- [ ] Basic push notifikacije
- [ ] Guest pregled (read-only)

### Faza 2: Enhanced (4-6 nedelja)
**Cilj**: Real-time i offline podrška

- [ ] WebSocket integracija
- [ ] Offline mode sa Room
- [ ] Voice request playback
- [ ] Duty roster pregled
- [ ] Inter-crew messaging

### Faza 3: Advanced (4-6 nedelja)
**Cilj**: Napredne funkcionalnosti

- [ ] MQTT integracija
- [ ] Widget za quick actions
- [ ] Analytics dashboard
- [ ] Biometric login
- [ ] Performance optimizacije

### Faza 4: Premium (4 nedelje)
**Cilj**: Premium features i polish

- [ ] AI-powered insights
- [ ] Voice commands
- [ ] Wear OS companion app
- [ ] Custom yacht branding
- [ ] Beta testing i bugfixes

---

## 📊 9. TEHNIČKI ZAHTJEVI

### 9.1 Performance Ciljevi
- **App startup**: < 2s (cold start)
- **Screen transitions**: < 300ms
- **Network requests**: < 3s timeout
- **Battery drain**: < 5% na sat aktivnog korišćenja

### 9.2 Device Podrška
- **Telefoni**: 5"+ ekrani
- **Tableti**: Optimizovan layout
- **Foldables**: Kontinuitet između ekrana
- **Wear OS**: Companion app (Faza 4)

### 9.3 Network Optimizacija
- **Request batching** za bulk operacije
- **Image compression** i lazy loading
- **Bandwidth detection** i adaptive quality
- **Connection retry** sa exponential backoff

---

## 🧪 10. TESTING STRATEGIJA

### 10.1 Test Piramida
```
         /\
        /UI\        5% - UI/E2E tests
       /----\
      /Integr\      15% - Integration tests  
     /--------\
    /   Unit   \    80% - Unit tests
   /____________\
```

### 10.2 Test Coverage Ciljevi
- **Unit tests**: 80%+ coverage
- **Critical paths**: 100% E2E coverage
- **Regression suite**: Automated
- **Performance tests**: Key user journeys

### 10.3 QA Proces
1. **Development**: Unit tests (TDD)
2. **PR Review**: Automated CI tests
3. **Staging**: Manual + automated tests
4. **Production**: Smoke tests + monitoring

---

## 📝 DODATNE NAPOMENE

### Integracija sa Postojećim Sistemom
- Backend API je spreman (120+ endpoints)
- WebSocket i MQTT već rade
- Web app može služiti kao UX referenca
- Koordinacija sa IoT timom za ESP32 devices

### Yacht-Specific Zahtjevi
- Rad u maritimskim uslovima (vlaga, vibracije)
- Podrška za više jezika (crew je internacionalan)
- Timezone handling (yacht putuje)
- Offline rad kada nema internet na moru

### Skalabilnost
- Multi-yacht podrška (fleet management)
- White-label mogućnost
- Modularnost za custom features po yacht-u
- Cloud/on-premise deployment opcije

---

**Dokument pripremio**: AI Arhitekt
**Status**: DRAFT - Spreman za review
**Sledeći korak**: Prezentacija stakeholder-ima