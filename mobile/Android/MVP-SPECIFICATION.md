# OBEDIO ANDROID MVP SPECIFICATION

**Verzija**: 1.0
**Datum**: 2025-11-09
**Scope**: MVP Phase 1 (6-8 nedelja)

---

## 🎯 MVP CILJ

Kreirati funkcionalnu Android aplikaciju koja omogućava crew članovima da:
- Primaju i odgovaraju na service zahteve
- Pregledaju osnovne informacije o gostima
- Rade offline sa osnovnom sinhronizacijom

---

## 📱 MVP EKRANI

### 1. Login Screen
**Funkcionalnosti**:
- [x] Username/password login
- [x] Remember me checkbox
- [x] Error handling sa retry
- [ ] ~~Biometric login~~ (Phase 2)

**API Calls**:
- `POST /api/auth/login`
- `GET /api/auth/verify`

### 2. Dashboard Screen
**Funkcionalnosti**:
- [x] Lista aktivnih service requestova
- [x] Pull to refresh
- [x] Broj pending zahteva
- [x] Quick accept button
- [ ] ~~Guest status cards~~ (Phase 2)

**API Calls**:
- `GET /api/service-requests`
- WebSocket: `service-request:created`

### 3. Service Request List
**Funkcionalnosti**:
- [x] Sortirani po prioritetu i vremenu
- [x] Color coding (red/orange/blue)
- [x] Search/filter po lokaciji
- [x] Swipe to accept
- [ ] ~~Voice playback~~ (Phase 2)

**API Calls**:
- `GET /api/service-requests`
- `PUT /api/service-requests/{id}/accept`
- `PUT /api/service-requests/{id}/complete`

### 4. Service Request Detail
**Funkcionalnosti**:
- [x] Guest ime i lokacija
- [x] Request detalji i notes
- [x] Accept/Complete buttons
- [x] Timer od creation time
- [ ] ~~Guest photo~~ (Phase 2)
- [ ] ~~Delegate option~~ (Phase 2)

**API Calls**:
- `GET /api/service-requests/{id}`
- `GET /api/guests/{id}` (basic info)

### 5. Guest Detail (Basic)
**Funkcionalnosti**:
- [x] Guest osnovne informacije
- [x] Alergije i dietary restrictions
- [x] Current location/cabin
- [ ] ~~Service history~~ (Phase 2)
- [ ] ~~Preferences~~ (Phase 2)

**API Calls**:
- `GET /api/guests/{id}`

### 6. Settings Screen
**Funkcionalnosti**:
- [x] Logout
- [x] Theme toggle (dark/light)
- [x] Notification settings
- [x] App version info
- [ ] ~~Language selection~~ (Phase 2)

**API Calls**:
- `POST /api/auth/logout`

---

## 🔔 MVP NOTIFIKACIJE

### Push Notifications (FCM)
1. **New Service Request**
   - Title: "New Request - {Location}"
   - Body: "{Priority} - {Brief message}"
   - Actions: View, Accept

2. **Emergency Request**
   - Title: "🚨 EMERGENCY - {Location}"
   - Body: "Immediate assistance needed"
   - Sound: Custom alarm
   - Vibration: Long pattern

---

## 💾 MVP OFFLINE FEATURES

### Cached Data
- Guest lista (osnovne info)
- Locations lista
- Poslednih 50 service requestova

### Offline Actions Queue
- Accept request
- Complete request
- Create note

### Sync Strategy
- Auto-sync on network restore
- Manual sync button
- Conflict resolution: Server wins

---

## 🏗️ TEHNIČKA IMPLEMENTACIJA

### Data Models
```kotlin
// Simplified for MVP
data class ServiceRequest(
    val id: String,
    val guestName: String,
    val location: String,
    val message: String,
    val priority: Priority,
    val status: Status,
    val createdAt: Instant,
    val assignedTo: String?
)

data class Guest(
    val id: String,
    val firstName: String,
    val lastName: String,
    val cabin: String,
    val allergies: List<String>,
    val dietaryRestrictions: List<String>
)
```

### Repository Pattern
```kotlin
interface ServiceRequestRepository {
    fun getActiveRequests(): Flow<List<ServiceRequest>>
    suspend fun acceptRequest(id: String): Result<ServiceRequest>
    suspend fun completeRequest(id: String): Result<ServiceRequest>
}

class ServiceRequestRepositoryImpl(
    private val api: ObedioApi,
    private val dao: ServiceRequestDao
) : ServiceRequestRepository {
    // Offline-first implementation
}
```

### Navigation Graph
```
LoginScreen
    ↓ (success)
DashboardScreen ←→ ServiceRequestList
    ↓              ↓
    ↓         ServiceRequestDetail
    ↓              ↓
    ↓         GuestDetail
    ↓
SettingsScreen
```

---

## ✅ MVP ACCEPTANCE CRITERIA

### Funkcionalni
1. Crew može da se uloguje sa username/password
2. Može da vidi sve aktivne service zahteve
3. Može da prihvati zahtev jednim klikom
4. Može da označi zahtev kao završen
5. Prima push notifikacije za nove zahteve
6. App radi osnovne funkcije bez interneta

### Nefunkcionalni
1. Cold start < 3 sekunde
2. Lista se učitava < 1 sekunda
3. Smooth scrolling (60fps)
4. Crash rate < 0.1%
5. Podrška za Android 7.0+
6. APK size < 15MB

### Out of Scope za MVP
- Voice features
- MQTT integration
- Crew messaging
- Analytics
- Custom widgets
- Biometric login
- Multi-language
- Tablet layout

---

## 🧪 MVP TEST SCENARIOS

### Critical User Flows
1. **Login → View Requests → Accept → Complete**
   - Happy path test
   - Network failure handling
   - Token expiry handling

2. **Receive Notification → Open App → Handle Request**
   - Background/foreground scenarios
   - Deep link handling

3. **Offline Usage**
   - Accept request offline
   - Sync when online
   - Conflict handling

### Edge Cases
- Multiple rapid accepts
- Large request lists (100+)
- Poor network conditions
- Device rotation
- App backgrounding

---

## 📅 MVP MILESTONES

### Nedelja 1-2: Setup & Auth
- Project setup
- CI/CD pipeline
- Authentication flow
- Basic navigation

### Nedelja 3-4: Core Features
- Service request list
- Request details
- Accept/Complete logic
- Basic offline support

### Nedelja 5-6: Polish & Testing
- Push notifications
- Error handling
- Performance optimization
- UI polish

### Nedelja 7-8: QA & Release
- Bug fixes
- Beta testing
- Documentation
- Release preparation

---

**Next Steps**: 
1. Approve MVP scope
2. Setup development environment
3. Begin Sprint 1

**Questions for Stakeholders**:
1. Prioritet za offline vs real-time?
2. Da li svi crew imaju Android 7.0+?
3. Custom branding za MVP?