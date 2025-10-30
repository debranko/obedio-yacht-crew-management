# 📱 OBEDIO Wear OS App - Technical Specification
## TicWatch Pro 5 - Incoming Request Notification MVP

**Datum**: October 27, 2025
**Device**: TicWatch Pro 5 (Wear OS 3+)
**Backend**: Node.js + Express + Socket.IO + PostgreSQL
**Frontend**: Kotlin + Jetpack Compose for Wear OS

---

## 🎯 MVP SCOPE

**SAMO jedna funkcionalnost**: Prikazivanje incoming service request sa Accept/Delegate buttons.

**Out of scope za MVP**:
- Login screen (hardcoded crew member ID za testiranje)
- Home screen sa duty timer
- Request history
- Crew roster
- Settings

---

## 📊 CURRENT SYSTEM ANALYSIS

### **1. Backend Architecture**

#### **API Endpoints** (backend/src/routes/service-requests.ts)

```typescript
// Get all service requests (with filters)
GET /api/service-requests
Query params:
  - status: 'pending' | 'accepted' | 'completed' | 'cancelled'
  - priority: 'low' | 'normal' | 'urgent' | 'emergency'
  - page: number (default: 1)
  - limit: number (default: 25)

Response:
{
  success: true,
  data: ServiceRequest[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// Create service request (triggered by button press)
POST /api/service-requests
Body: {
  requestType: 'call' | 'service' | 'emergency',
  guestId?: string,
  locationId: string,
  priority: 'low' | 'normal' | 'urgent' | 'emergency',
  notes?: string,
  voiceTranscript?: string  // Voice-to-text output from server
}

Response:
{
  success: true,
  data: ServiceRequest
}

// Accept service request
POST /api/service-requests/:id/accept
Body: {
  crewMemberId: string
}

Response:
{
  success: true,
  data: ServiceRequest
}

// Complete service request
POST /api/service-requests/:id/complete

Response:
{
  success: true,
  data: ServiceRequest
}
```

#### **WebSocket Events** (backend/src/services/websocket.ts)

Server broadcasts these events to ALL connected clients:

```typescript
// New service request created
Event: 'service-request:created'
Payload: ServiceRequest {
  id: string,
  requestType: 'call' | 'service' | 'emergency',
  guestId?: string,
  locationId?: string,
  priority: 'low' | 'normal' | 'urgent' | 'emergency',
  status: 'pending' | 'accepted' | 'completed' | 'cancelled',
  notes?: string,
  voiceTranscript?: string,
  assignedToId?: string,  // Crew member ID assigned
  acceptedAt?: DateTime,
  completedAt?: DateTime,
  createdAt: DateTime,
  updatedAt: DateTime,
  // Relations (expanded):
  guest?: {
    id: string,
    firstName: string,
    lastName: string,
    preferredName?: string,
    photo?: string
  },
  location?: {
    id: string,
    name: string,
    type: string,
    floor?: string,
    image?: string  // 🎨 IMPORTANT: Location image for background!
  },
  assignedCrew?: {
    id: string,
    name: string,
    position: string
  }
}

// Service request updated (accepted/reassigned)
Event: 'service-request:updated'
Payload: ServiceRequest (same structure)

// Service request completed
Event: 'service-request:completed'
Payload: ServiceRequest (same structure)
```

#### **Database Schema** (backend/prisma/schema.prisma)

```prisma
model ServiceRequest {
  id          String   @id @default(cuid())
  requestType ServiceRequestType @default(call)  // call, service, emergency
  guestId     String?
  locationId  String?
  priority    ServiceRequestPriority @default(normal)  // low, normal, urgent, emergency
  status      ServiceRequestStatus @default(pending)  // pending, accepted, completed, cancelled
  notes       String?
  voiceTranscript String? // Voice-to-text from server
  assignedToId String? // FK to CrewMember
  acceptedAt  DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  guest        Guest?       @relation(fields: [guestId], references: [id])
  location     Location?    @relation(fields: [locationId], references: [id])
  assignedCrew CrewMember?  @relation(fields: [assignedToId], references: [id])
}

model Location {
  id           String   @id @default(cuid())
  name         String   @unique
  type         String   // cabin, common, service, deck
  floor        String?  // "Sun Deck", "Main Deck", "Owner's Deck", etc.
  description  String?
  image        String?  // 🎨 IMAGE URL - used for background!
  createdAt    DateTime @default(now())
}

model Guest {
  id            String   @id @default(cuid())
  firstName     String
  lastName      String
  preferredName String?
  photo         String?
  type          GuestType @default(guest)  // owner, vip, guest, partner, family
  status        GuestStatus @default(onboard)  // expected, onboard, ashore, departed
  locationId    String?

  location      Location?  @relation(fields: [locationId], references: [id])
}

model CrewMember {
  id         String   @id @default(cuid())
  name       String
  position   String
  department String
  status     CrewMemberStatus @default(active)  // active, on_duty, off_duty, on_leave

  devices          Device[]  // 🎯 Crew member can have multiple devices (watch, phone)
  assignedRequests ServiceRequest[]
}

model Device {
  id              String        @id @default(cuid())
  deviceId        String        @unique  // "WEAR-TICWATCH-ABC123"
  name            String
  type            String        // "smart_button", "watch", "repeater", "mobile_app"
  status          DeviceStatus  @default(online)

  crewMemberId    String?
  crewMember      CrewMember?  @relation(fields: [crewMemberId], references: [id])

  batteryLevel    Int?
  lastSeen        DateTime?
  firmwareVersion String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

### **2. Frontend (Web App) Flow**

**How incoming requests are displayed** (src/components/incoming-request-dialog.tsx):

1. **WebSocket connection** (src/services/websocket.ts):
   - Frontend connects to `ws://localhost:8080` (or production URL)
   - Listens for `service-request:created` event

2. **Hook: useIncomingRequests()** (line 497-626):
   - Monitors `serviceRequests` array
   - Detects new pending requests (created after initialization)
   - Shows full-screen dialog for new requests
   - Repeat interval configurable (default: 60s)

3. **Dialog UI**:
   - Full-screen overlay with location background image (blurred/dimmed)
   - Priority indicator (emergency = red, urgent = amber, normal = accent)
   - Location name + Guest name
   - Voice transcript (if available) with play button
   - **Two primary buttons**: ACCEPT and DELEGATE
   - **Forward button**: Forward to other teams (Galley, Engineering, etc.)

4. **Actions**:
   ```typescript
   // Accept request
   acceptServiceRequest(requestId, crewMemberName)
   → Calls backend API: POST /api/service-requests/:id/accept
   → WebSocket broadcasts: service-request:updated
   → Dialog closes

   // Delegate to another crew member
   delegateServiceRequest(requestId, toCrewMemberName)
   → Updates assignedToId in database
   → WebSocket broadcasts: service-request:updated
   → Dialog closes
   ```

---

## 🎯 WEAR OS APP REQUIREMENTS

### **MVP Features**

1. **WebSocket Connection**
   - Connect to backend WebSocket server
   - Listen for `service-request:created` events
   - Handle reconnection if connection drops

2. **Full-Screen Incoming Request Notification**
   - Triggered when new request arrives
   - Display format:
     ```
     ┌─────────────────────────────┐
     │  [Location Image - blurred] │ ← Background
     │                             │
     │  🔔 NEW REQUEST             │ ← Priority badge
     │                             │
     │  Master Bedroom             │ ← Location (large font)
     │  Leonardo DiCaprio          │ ← Guest (if exists)
     │                             │
     │  "Extra towels please"      │ ← Voice transcript (if exists)
     │                             │
     │  Priority: 🔴 URGENT        │ ← Priority indicator
     │                             │
     │  ┌──────────┐  ┌──────────┐│
     │  │ ACCEPT   │  │ DELEGATE ││ ← Buttons
     │  └──────────┘  └──────────┘│
     └─────────────────────────────┘
     ```

   - Vibration pattern (3 short bursts for urgent/emergency)
   - Optional sound (configurable)
   - Full-screen overlay (like incoming call)
   - Stays on screen until user interacts

3. **Accept Button**
   - Calls: `POST /api/service-requests/:id/accept`
   - Body: `{ crewMemberId: "crew-123" }`
   - Shows success toast: "Request accepted"
   - Closes full-screen notification

4. **Delegate Button**
   - Opens bottom sheet with list of on-duty crew members
   - Fetches crew list from: `GET /api/crew/members?status=on_duty`
   - User selects crew member
   - Calls: `POST /api/service-requests/:id/accept` with selected crewMemberId
   - Shows success toast: "Delegated to [Name]"
   - Closes full-screen notification

---

## 🔧 TECHNICAL IMPLEMENTATION

### **Architecture**

```
┌─────────────────────────────────────┐
│  OBEDIO Backend (Node.js)           │
│  - REST API (Express)               │
│  - WebSocket (Socket.IO)            │
│  - Database (PostgreSQL + Prisma)   │
└─────────────────────────────────────┘
           ↓                ↓
     [REST API]      [WebSocket]
           ↓                ↓
┌─────────────────────────────────────┐
│  TicWatch Pro 5 (Wear OS)           │
│  - Kotlin                           │
│  - Jetpack Compose for Wear         │
│  - Retrofit (REST client)           │
│  - Socket.IO Android Client         │
│  - Coil (Image loading)             │
└─────────────────────────────────────┘
```

---

### **Android/Wear OS Project Structure**

```
wear-os-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/obedio/crewwatch/
│   │   │   │   ├── MainActivity.kt                 # Entry point
│   │   │   │   ├── data/
│   │   │   │   │   ├── model/
│   │   │   │   │   │   ├── ServiceRequest.kt       # Data models
│   │   │   │   │   │   ├── Location.kt
│   │   │   │   │   │   ├── Guest.kt
│   │   │   │   │   │   └── CrewMember.kt
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── ApiService.kt           # Retrofit API interface
│   │   │   │   │   │   └── ApiClient.kt            # Retrofit setup
│   │   │   │   │   ├── websocket/
│   │   │   │   │   │   └── WebSocketManager.kt     # Socket.IO client
│   │   │   │   │   └── repository/
│   │   │   │   │       └── ServiceRequestRepository.kt
│   │   │   │   ├── ui/
│   │   │   │   │   ├── theme/
│   │   │   │   │   │   ├── Color.kt
│   │   │   │   │   │   ├── Theme.kt
│   │   │   │   │   │   └── Type.kt
│   │   │   │   │   ├── components/
│   │   │   │   │   │   └── IncomingRequestScreen.kt  # Full-screen notification UI
│   │   │   │   │   └── screens/
│   │   │   │   │       └── MainScreen.kt              # Placeholder (for future)
│   │   │   │   ├── viewmodel/
│   │   │   │   │   └── ServiceRequestViewModel.kt     # State management
│   │   │   │   └── utils/
│   │   │   │       ├── VibrationHelper.kt
│   │   │   │       └── NotificationHelper.kt
│   │   │   ├── res/
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   └── colors.xml
│   │   │   │   └── drawable/
│   │   │   │       └── ic_launcher.xml
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   └── build.gradle.kts
├── gradle/
└── build.gradle.kts
```

---

### **Dependencies (build.gradle.kts)**

```kotlin
dependencies {
    // Wear OS
    implementation("androidx.wear:wear:1.3.0")
    implementation("com.google.android.support:wearable:2.9.0")

    // Jetpack Compose for Wear OS
    implementation("androidx.wear.compose:compose-material:1.3.1")
    implementation("androidx.wear.compose:compose-foundation:1.3.1")
    implementation("androidx.wear.compose:compose-navigation:1.3.1")

    // Lifecycle & ViewModel
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    // Networking - Retrofit
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // WebSocket - Socket.IO
    implementation("io.socket:socket.io-client:2.1.0")

    // Image Loading - Coil
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // JSON parsing
    implementation("com.google.code.gson:gson:2.10.1")
}
```

---

### **API Service Interface (Retrofit)**

```kotlin
// data/api/ApiService.kt
package com.obedio.crewwatch.data.api

import com.obedio.crewwatch.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @GET("api/service-requests")
    suspend fun getServiceRequests(
        @Query("status") status: String? = null,
        @Query("priority") priority: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 25
    ): Response<ServiceRequestsResponse>

    @POST("api/service-requests/{id}/accept")
    suspend fun acceptServiceRequest(
        @Path("id") requestId: String,
        @Body body: AcceptRequestBody
    ): Response<ServiceRequestResponse>

    @GET("api/crew/members")
    suspend fun getCrewMembers(
        @Query("status") status: String? = null,
        @Query("department") department: String? = null
    ): Response<CrewMembersResponse>
}

data class AcceptRequestBody(
    val crewMemberId: String
)

data class ServiceRequestsResponse(
    val success: Boolean,
    val data: List<ServiceRequest>,
    val pagination: Pagination?
)

data class ServiceRequestResponse(
    val success: Boolean,
    val data: ServiceRequest
)

data class CrewMembersResponse(
    val success: Boolean,
    val data: List<CrewMember>
)

data class Pagination(
    val page: Int,
    val limit: Int,
    val total: Int,
    val totalPages: Int
)
```

---

### **WebSocket Manager (Socket.IO)**

```kotlin
// data/websocket/WebSocketManager.kt
package com.obedio.crewwatch.data.websocket

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import com.google.gson.Gson
import com.obedio.crewwatch.data.model.ServiceRequest
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

class WebSocketManager(private val serverUrl: String) {

    private var socket: Socket? = null
    private val gson = Gson()

    private val _serviceRequestCreated = MutableSharedFlow<ServiceRequest>()
    val serviceRequestCreated: SharedFlow<ServiceRequest> = _serviceRequestCreated.asSharedFlow()

    private val _serviceRequestUpdated = MutableSharedFlow<ServiceRequest>()
    val serviceRequestUpdated: SharedFlow<ServiceRequest> = _serviceRequestUpdated.asSharedFlow()

    private val _connectionStatus = MutableSharedFlow<Boolean>()
    val connectionStatus: SharedFlow<Boolean> = _connectionStatus.asSharedFlow()

    fun connect(crewMemberId: String) {
        try {
            val options = IO.Options().apply {
                auth = mapOf("userId" to crewMemberId)
                reconnection = true
                reconnectionAttempts = Int.MAX_VALUE
                reconnectionDelay = 1000
                timeout = 10000
            }

            socket = IO.socket(serverUrl, options)

            socket?.apply {
                on(Socket.EVENT_CONNECT) {
                    Log.d("WebSocket", "Connected to server")
                    _connectionStatus.tryEmit(true)
                }

                on(Socket.EVENT_DISCONNECT) {
                    Log.d("WebSocket", "Disconnected from server")
                    _connectionStatus.tryEmit(false)
                }

                on("service-request:created") { args ->
                    args.firstOrNull()?.let { data ->
                        try {
                            val json = gson.toJson(data)
                            val request = gson.fromJson(json, ServiceRequest::class.java)
                            Log.d("WebSocket", "New service request: ${request.id}")
                            _serviceRequestCreated.tryEmit(request)
                        } catch (e: Exception) {
                            Log.e("WebSocket", "Error parsing service request", e)
                        }
                    }
                }

                on("service-request:updated") { args ->
                    args.firstOrNull()?.let { data ->
                        try {
                            val json = gson.toJson(data)
                            val request = gson.fromJson(json, ServiceRequest::class.java)
                            Log.d("WebSocket", "Service request updated: ${request.id}")
                            _serviceRequestUpdated.tryEmit(request)
                        } catch (e: Exception) {
                            Log.e("WebSocket", "Error parsing service request update", e)
                        }
                    }
                }

                connect()
            }
        } catch (e: Exception) {
            Log.e("WebSocket", "Error connecting to WebSocket", e)
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
    }

    fun isConnected(): Boolean = socket?.connected() == true
}
```

---

### **Data Models**

```kotlin
// data/model/ServiceRequest.kt
package com.obedio.crewwatch.data.model

import com.google.gson.annotations.SerializedName
import java.util.Date

data class ServiceRequest(
    val id: String,
    val requestType: RequestType,
    val guestId: String?,
    val locationId: String?,
    val priority: Priority,
    val status: Status,
    val notes: String?,
    val voiceTranscript: String?,
    val assignedToId: String?,
    val acceptedAt: Date?,
    val completedAt: Date?,
    val createdAt: Date,
    val updatedAt: Date,

    // Expanded relations
    val guest: Guest?,
    val location: Location?,
    val assignedCrew: CrewMember?
)

enum class RequestType {
    @SerializedName("call") CALL,
    @SerializedName("service") SERVICE,
    @SerializedName("emergency") EMERGENCY
}

enum class Priority {
    @SerializedName("low") LOW,
    @SerializedName("normal") NORMAL,
    @SerializedName("urgent") URGENT,
    @SerializedName("emergency") EMERGENCY
}

enum class Status {
    @SerializedName("pending") PENDING,
    @SerializedName("accepted") ACCEPTED,
    @SerializedName("completed") COMPLETED,
    @SerializedName("cancelled") CANCELLED
}

// data/model/Location.kt
data class Location(
    val id: String,
    val name: String,
    val type: String,
    val floor: String?,
    val description: String?,
    val image: String?  // Background image URL
)

// data/model/Guest.kt
data class Guest(
    val id: String,
    val firstName: String,
    val lastName: String,
    val preferredName: String?,
    val photo: String?
)

// data/model/CrewMember.kt
data class CrewMember(
    val id: String,
    val name: String,
    val position: String,
    val department: String,
    val status: CrewStatus
)

enum class CrewStatus {
    @SerializedName("active") ACTIVE,
    @SerializedName("on_duty") ON_DUTY,
    @SerializedName("off_duty") OFF_DUTY,
    @SerializedName("on_leave") ON_LEAVE
}
```

---

### **Full-Screen Incoming Request UI (Jetpack Compose)**

```kotlin
// ui/components/IncomingRequestScreen.kt
package com.obedio.crewwatch.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import coil.compose.AsyncImage
import com.obedio.crewwatch.data.model.*

@Composable
fun IncomingRequestScreen(
    request: ServiceRequest,
    onAccept: () -> Unit,
    onDelegate: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Priority color scheme
    val priorityColor = when (request.priority) {
        Priority.EMERGENCY -> Color(0xFFEF4444)  // Red
        Priority.URGENT -> Color(0xFFF59E0B)     // Amber
        else -> Color(0xFFD4AF37)                // Gold
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Background image (location image, blurred/dimmed)
        request.location?.image?.let { imageUrl ->
            AsyncImage(
                model = imageUrl,
                contentDescription = "Location background",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
                alpha = 0.3f  // Dimmed
            )

            // Gradient overlay for better text readability
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Black.copy(alpha = 0.7f),
                                Color.Black.copy(alpha = 0.5f),
                                Color.Black.copy(alpha = 0.8f)
                            )
                        )
                    )
            )
        }

        // Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Priority badge
            Text(
                text = when (request.priority) {
                    Priority.EMERGENCY -> "🚨 EMERGENCY"
                    Priority.URGENT -> "🔔 URGENT"
                    else -> "🔔 NEW REQUEST"
                },
                color = priorityColor,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Location name (large, prominent)
            Text(
                text = request.location?.name ?: "Unknown Location",
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Guest name (if exists)
            request.guest?.let { guest ->
                Text(
                    text = guest.preferredName ?: "${guest.firstName} ${guest.lastName}",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 16.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))
            }

            // Voice transcript (if exists)
            request.voiceTranscript?.let { transcript ->
                // Parse "Voice message (3.0s): Text" format
                val text = transcript.substringAfter("): ", transcript)

                Text(
                    text = "\"$text\"",
                    color = Color.White.copy(alpha = 0.9f),
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )

                Spacer(modifier = Modifier.height(16.dp))
            }

            // Priority indicator dot
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(priorityColor, shape = CircleShape)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Action buttons
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Accept button
                Button(
                    onClick = onAccept,
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = priorityColor
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(40.dp)
                ) {
                    Text(
                        text = "ACCEPT",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Delegate button
                Button(
                    onClick = onDelegate,
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = Color.White.copy(alpha = 0.2f)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(40.dp)
                ) {
                    Text(
                        text = "DELEGATE",
                        fontSize = 14.sp,
                        color = Color.White
                    )
                }
            }
        }
    }
}
```

---

## 🔔 VIBRATION & SOUND

```kotlin
// utils/VibrationHelper.kt
package com.obedio.crewwatch.utils

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.obedio.crewwatch.data.model.Priority

class VibrationHelper(private val context: Context) {

    private val vibrator: Vibrator by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    fun vibrateForRequest(priority: Priority) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val pattern = when (priority) {
                Priority.EMERGENCY -> longArrayOf(0, 300, 200, 300, 200, 300)  // Long bursts
                Priority.URGENT -> longArrayOf(0, 200, 100, 200, 100, 200)     // Medium bursts
                else -> longArrayOf(0, 100, 100, 100)                          // Short bursts
            }

            val effect = VibrationEffect.createWaveform(pattern, -1)  // -1 = no repeat
            vibrator.vibrate(effect)
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(500)  // Fallback
        }
    }
}
```

---

## 🚀 NEXT STEPS

### **Phase 1: Setup** (You completed this!)
- ✅ Install Android Studio
- ✅ Enable Developer Mode on TicWatch Pro 5
- ✅ Connect TicWatch via ADB over WiFi

### **Phase 2: Create Project** (Next!)
1. Create new "Empty Wear OS App" project in Android Studio
2. Configure build.gradle dependencies
3. Setup project structure (packages, files)

### **Phase 3: Implement Backend Communication**
1. Create ApiService interface (Retrofit)
2. Create WebSocketManager (Socket.IO)
3. Create data models (ServiceRequest, Location, Guest, etc.)
4. Test WebSocket connection from emulator

### **Phase 4: Implement UI**
1. Create IncomingRequestScreen composable
2. Add vibration helper
3. Add image loading (Coil)
4. Test on emulator first

### **Phase 5: Integrate & Test**
1. Connect real backend WebSocket
2. Test incoming request flow
3. Test Accept button → API call
4. Test Delegate button → crew list → API call
5. Deploy to TicWatch Pro 5

---

## 🐛 TROUBLESHOOTING

### Backend API Issues
- **CORS errors**: Add TicWatch IP to backend CORS whitelist
- **WebSocket connection fails**: Check firewall, try polling transport first
- **401 Unauthorized**: Implement JWT authentication (phase 2)

### Wear OS Issues
- **ADB connection drops**: Use persistent `adb connect` with static IP
- **App doesn't install**: Check Wear OS version (must be 3.0+)
- **WebSocket not connecting**: Test with web browser Socket.IO client first

---

## 📝 NOTES

1. **Hardcoded crew member ID for MVP**:
   - For testing, hardcode `crewMemberId = "test-crew-123"`
   - Later: implement login screen with QR code or username/password

2. **Image loading optimization**:
   - Use Coil's disk cache
   - Preload location images when app starts
   - Fallback to solid color if image fails to load

3. **Battery optimization**:
   - WebSocket connection uses ~2-3% battery/hour
   - TicWatch Pro 5's FSTN display can show basic status when AMOLED is off
   - Consider showing duty timer on FSTN display (future feature)

4. **Delegate crew list**:
   - For MVP, fetch all on-duty crew from: `GET /api/crew/members?status=on_duty&department=Interior`
   - Later: add smart filtering (closest crew, same floor, etc.)

---

## ✅ MVP COMPLETE WHEN:

- [  ] TicWatch receives incoming service request via WebSocket
- [  ] Full-screen notification appears with location background
- [  ] Shows location name + guest name (if exists)
- [  ] Shows voice transcript (if exists)
- [  ] Vibration pattern plays based on priority
- [  ] "Accept" button calls API and closes notification
- [  ] "Delegate" button shows crew list
- [  ] Selecting crew member calls API and closes notification
- [  ] Backend receives accept/delegate and updates request status
- [  ] Frontend web app sees updated status (WebSocket broadcast)

**Timeline**: 2-3 days for MVP implementation.

---

**READY TO START CODING?** 🚀
