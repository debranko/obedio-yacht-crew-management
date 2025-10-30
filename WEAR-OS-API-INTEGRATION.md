# OBEDIO Wear OS API Integration Guide

## Overview

This document provides complete API integration instructions for the OBEDIO Wear OS companion application. The Wear OS app communicates with the OBEDIO backend to display service requests, crew assignments, and allow crew members to accept/complete tasks directly from their smartwatch.

**Backend API Base URL:** `http://localhost:8080/api` (development)
**Production URL:** `https://your-domain.com/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [WebSocket Real-Time Updates](#websocket-real-time-updates)
3. [Service Requests API](#service-requests-api)
4. [Crew Members API](#crew-members-api)
5. [Activity Logging](#activity-logging)
6. [Error Handling](#error-handling)
7. [Wear OS Specific Considerations](#wear-os-specific-considerations)

---

## 1. Authentication

### Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "crew_member_username",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmh0hz4e80000uphkoxq30cl3",
    "username": "olivia_taylor",
    "name": "Olivia Taylor",
    "email": "olivia@obedio.com",
    "role": "crew",
    "department": "Interior"
  }
}
```

**Wear OS Implementation:**
```kotlin
// WearOS - AuthRepository.kt
suspend fun login(username: String, password: String): Result<AuthResponse> {
    val response = apiService.login(LoginRequest(username, password))

    if (response.success) {
        // Store token securely
        dataStore.saveAuthToken(response.token)
        dataStore.saveUserId(response.user.id)
        return Result.success(response)
    }

    return Result.failure(Exception(response.error ?: "Login failed"))
}
```

### Token Storage
Store the JWT token in Android DataStore (encrypted):
```kotlin
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "obedio_auth")

suspend fun saveAuthToken(token: String) {
    dataStore.edit { preferences ->
        preferences[AUTH_TOKEN_KEY] = token
    }
}
```

### Token Usage
Include token in all API requests:
```kotlin
// Add to Retrofit interceptor
class AuthInterceptor(private val dataStore: DataStore<Preferences>) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking {
            dataStore.data.first()[AUTH_TOKEN_KEY]
        }

        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer $token")
            .build()

        return chain.proceed(request)
    }
}
```

---

## 2. WebSocket Real-Time Updates

The OBEDIO backend uses Socket.IO for real-time updates. Wear OS should connect to receive live service request notifications.

**WebSocket URL:** `http://localhost:8080` (Socket.IO client connects to base URL)

### Events to Listen For

#### 1. `service-request:created`
New service request created (guest pressed button).

**Payload:**
```json
{
  "id": "sr_12345",
  "guestId": "guest_001",
  "locationId": "loc_sun_deck",
  "requestType": "call",
  "status": "pending",
  "priority": "normal",
  "createdAt": "2025-10-28T12:30:00.000Z",
  "guest": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "location": {
    "name": "Sun Deck Lounge",
    "imageUrl": "/uploads/sun-deck.jpg"
  }
}
```

**Wear OS Action:** Show notification with vibration, display on watch face.

#### 2. `service-request:updated`
Service request status changed (accepted, completed, cancelled).

**Payload:** Same as `service-request:created`

**Wear OS Action:** Update UI, remove from pending list if completed/cancelled.

#### 3. `service-request:accepted`
Another crew member accepted the request.

**Wear OS Action:** Hide "Accept" button for this request.

#### 4. `service-request:completed`
Request marked as completed.

**Wear OS Action:** Remove from active list, show completion notification.

### Wear OS WebSocket Implementation

**Add Socket.IO dependency:**
```gradle
implementation("io.socket:socket.io-client:2.1.0")
```

**WebSocket Manager:**
```kotlin
class WebSocketManager(private val authRepository: AuthRepository) {
    private var socket: Socket? = null

    fun connect() {
        val token = authRepository.getToken()

        val options = IO.Options().apply {
            auth = mapOf("token" to token)
            transports = arrayOf("websocket")
        }

        socket = IO.socket("http://localhost:8080", options)

        socket?.on(Socket.EVENT_CONNECT) {
            Log.d("WebSocket", "Connected")
        }

        socket?.on("service-request:created") { args ->
            val data = args[0] as JSONObject
            handleNewServiceRequest(data)
        }

        socket?.on("service-request:updated") { args ->
            val data = args[0] as JSONObject
            handleServiceRequestUpdate(data)
        }

        socket?.connect()
    }

    private fun handleNewServiceRequest(data: JSONObject) {
        // Parse JSON to ServiceRequest data class
        val request = parseServiceRequest(data)

        // Show notification
        notificationManager.showServiceRequestNotification(request)

        // Vibrate watch
        vibrateWatch()

        // Update UI
        serviceRequestRepository.addRequest(request)
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
    }
}
```

---

## 3. Service Requests API

### Get All Service Requests
**Endpoint:** `GET /api/service-requests`

**Query Parameters:**
- `status` (optional): `pending`, `accepted`, `completed`, `cancelled`
- `priority` (optional): `low`, `normal`, `urgent`, `emergency`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sr_12345",
      "guestId": "guest_001",
      "locationId": "loc_sun_deck",
      "requestType": "call",
      "status": "pending",
      "priority": "normal",
      "assignedToId": null,
      "assignedTo": null,
      "acceptedAt": null,
      "completedAt": null,
      "createdAt": "2025-10-28T12:30:00.000Z",
      "updatedAt": "2025-10-28T12:30:00.000Z",
      "guest": {
        "id": "guest_001",
        "firstName": "John",
        "lastName": "Doe"
      },
      "location": {
        "id": "loc_sun_deck",
        "name": "Sun Deck Lounge",
        "type": "deck",
        "imageUrl": "/uploads/sun-deck.jpg"
      }
    }
  ]
}
```

**Wear OS Usage:**
```kotlin
// Fetch pending requests on app launch
suspend fun getPendingRequests(): List<ServiceRequest> {
    val response = apiService.getServiceRequests(status = "pending")
    return response.data
}
```

### Accept Service Request
**Endpoint:** `POST /api/service-requests/:id/accept`

**Request Body:**
```json
{
  "crewMemberId": "cmh0hz4e80000uphkoxq30cl3"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sr_12345",
    "status": "accepted",
    "assignedToId": "cmh0hz4e80000uphkoxq30cl3",
    "assignedTo": "Olivia Taylor",
    "acceptedAt": "2025-10-28T12:31:00.000Z",
    ...
  }
}
```

**Wear OS Implementation:**
```kotlin
suspend fun acceptServiceRequest(requestId: String): Result<ServiceRequest> {
    val userId = authRepository.getUserId()

    val response = apiService.acceptServiceRequest(
        id = requestId,
        body = AcceptRequestBody(crewMemberId = userId)
    )

    if (response.success) {
        // Show success notification
        showToast("Request accepted")

        // Update local state
        serviceRequestRepository.updateRequest(response.data)

        return Result.success(response.data)
    }

    return Result.failure(Exception(response.error))
}
```

### Complete Service Request
**Endpoint:** `POST /api/service-requests/:id/complete`

**No Request Body Required**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sr_12345",
    "status": "completed",
    "completedAt": "2025-10-28T12:35:00.000Z",
    ...
  }
}
```

**Wear OS Implementation:**
```kotlin
suspend fun completeServiceRequest(requestId: String): Result<ServiceRequest> {
    val response = apiService.completeServiceRequest(requestId)

    if (response.success) {
        // Show completion confirmation
        showToast("Request completed")

        // Haptic feedback
        vibrateSuccess()

        // Remove from active list
        serviceRequestRepository.removeRequest(requestId)

        return Result.success(response.data)
    }

    return Result.failure(Exception(response.error))
}
```

### Cancel Service Request
**Endpoint:** `POST /api/service-requests/:id/cancel`

**No Request Body Required**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sr_12345",
    "status": "cancelled",
    ...
  }
}
```

---

## 4. Crew Members API

### Get Current Crew Member Info
**Endpoint:** `GET /api/crew/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmh0hz4e80000uphkoxq30cl3",
    "userId": "user_001",
    "name": "Olivia Taylor",
    "nickname": "Liv",
    "position": "Chief Stewardess",
    "department": "Interior",
    "status": "on-duty",
    "shift": "day",
    "email": "olivia@obedio.com",
    "phone": "+1-555-0123",
    "onBoardContact": "Radio Ch 3",
    "avatar": "/uploads/olivia.jpg",
    "color": "#C8A96B"
  }
}
```

**Wear OS Usage:**
Display crew member info on watch face, use for authentication context.

---

## 5. Activity Logging

All service request actions (accept, complete, cancel) are automatically logged to the Activity Log by the backend. No additional API calls needed from Wear OS.

**Activity Log Entry Created Automatically:**
```json
{
  "type": "SERVICE_REQUEST",
  "action": "Request Accepted",
  "details": "Olivia Taylor accepted service request from John Doe at Sun Deck Lounge",
  "userId": "cmh0hz4e80000uphkoxq30cl3",
  "locationId": "loc_sun_deck",
  "guestId": "guest_001",
  "deviceId": "watch_001",
  "metadata": {
    "requestId": "sr_12345",
    "responseTimeMs": 45000
  }
}
```

---

## 6. Error Handling

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Cannot complete request (e.g., status mismatch)
- `500 Internal Server Error` - Server error

### Common Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**Action:** Redirect to login screen, clear stored token.

**409 Conflict (Status Mismatch):**
```json
{
  "success": false,
  "error": "Cannot complete service request with status 'pending'. Only 'accepted' requests can be completed."
}
```

**Action:** Refresh service request data, show error to user.

**Wear OS Error Handling:**
```kotlin
sealed class ApiResult<T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error<T>(val code: Int, val message: String) : ApiResult<T>()
}

suspend fun <T> safeApiCall(call: suspend () -> Response<T>): ApiResult<T> {
    return try {
        val response = call()

        when (response.code()) {
            200, 201 -> ApiResult.Success(response.body()!!)
            401 -> {
                // Token expired, logout
                authRepository.logout()
                ApiResult.Error(401, "Session expired")
            }
            409 -> ApiResult.Error(409, response.message())
            else -> ApiResult.Error(response.code(), response.message())
        }
    } catch (e: Exception) {
        ApiResult.Error(0, e.message ?: "Network error")
    }
}
```

---

## 7. Wear OS Specific Considerations

### Battery Optimization

**WebSocket Connection Management:**
```kotlin
class WearOsWebSocketManager {
    private var reconnectJob: Job? = null

    fun connectWithRetry() {
        reconnectJob = viewModelScope.launch {
            while (isActive) {
                try {
                    connect()
                    break // Connected successfully
                } catch (e: Exception) {
                    Log.e("WebSocket", "Connection failed, retrying in 5s")
                    delay(5000)
                }
            }
        }
    }

    // Disconnect when screen off
    fun onScreenOff() {
        socket?.disconnect()
    }

    // Reconnect when screen on
    fun onScreenOn() {
        connectWithRetry()
    }
}
```

### Offline Support

Cache service requests locally using Room database:
```kotlin
@Entity(tableName = "service_requests")
data class ServiceRequestEntity(
    @PrimaryKey val id: String,
    val status: String,
    val guestName: String,
    val locationName: String,
    val priority: String,
    val timestamp: Long,
    val isSynced: Boolean = false
)

// Queue actions when offline
suspend fun acceptServiceRequestOffline(requestId: String) {
    // Save to local DB
    database.serviceRequestDao().markAsAccepted(requestId)

    // Queue for sync
    workManager.enqueue(
        OneTimeWorkRequestBuilder<SyncServiceRequestsWorker>()
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()
    )
}
```

### Complications (Watch Face Widgets)

**Pending Requests Count Complication:**
```kotlin
class ServiceRequestComplicationService : ComplicationProviderService() {
    override fun onComplicationRequest(
        request: ComplicationRequest,
        listener: ComplicationRequestListener
    ) {
        viewModelScope.launch {
            val pendingCount = repository.getPendingRequestsCount()

            val complicationData = ShortTextComplicationData.Builder(
                text = PlainComplicationText.Builder(pendingCount.toString()).build(),
                contentDescription = PlainComplicationText.Builder("$pendingCount pending requests").build()
            )
            .setTapAction(openAppIntent())
            .build()

            listener.onComplicationData(complicationData)
        }
    }
}
```

### Notifications

**Show incoming request notification:**
```kotlin
fun showServiceRequestNotification(request: ServiceRequest) {
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_notification)
        .setContentTitle("New Service Request")
        .setContentText("${request.guestName} at ${request.locationName}")
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setCategory(NotificationCompat.CATEGORY_MESSAGE)
        .setVibrate(longArrayOf(0, 500, 250, 500))
        .addAction(
            R.drawable.ic_check,
            "Accept",
            createAcceptPendingIntent(request.id)
        )
        .build()

    NotificationManagerCompat.from(context).notify(request.id.hashCode(), notification)
}

private fun createAcceptPendingIntent(requestId: String): PendingIntent {
    val intent = Intent(context, AcceptRequestReceiver::class.java).apply {
        putExtra("requestId", requestId)
    }

    return PendingIntent.getBroadcast(
        context,
        requestId.hashCode(),
        intent,
        PendingIntent.FLAG_IMMUTABLE
    )
}
```

---

## Complete Retrofit API Interface

```kotlin
interface ObedioApiService {
    // Authentication
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<AuthResponse>

    @GET("auth/verify")
    suspend fun verifyToken(): ApiResponse<VerifyResponse>

    // Service Requests
    @GET("service-requests")
    suspend fun getServiceRequests(
        @Query("status") status: String? = null,
        @Query("priority") priority: String? = null
    ): ApiResponse<List<ServiceRequest>>

    @GET("service-requests/{id}")
    suspend fun getServiceRequestById(@Path("id") id: String): ApiResponse<ServiceRequest>

    @POST("service-requests/{id}/accept")
    suspend fun acceptServiceRequest(
        @Path("id") id: String,
        @Body body: AcceptRequestBody
    ): ApiResponse<ServiceRequest>

    @POST("service-requests/{id}/complete")
    suspend fun completeServiceRequest(@Path("id") id: String): ApiResponse<ServiceRequest>

    @POST("service-requests/{id}/cancel")
    suspend fun cancelServiceRequest(@Path("id") id: String): ApiResponse<ServiceRequest>

    // Crew
    @GET("crew/{id}")
    suspend fun getCrewMember(@Path("id") id: String): ApiResponse<CrewMember>

    @GET("crew")
    suspend fun getAllCrewMembers(): ApiResponse<List<CrewMember>>
}

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: String?
)

data class LoginRequest(
    val username: String,
    val password: String
)

data class AcceptRequestBody(
    val crewMemberId: String
)
```

---

## Testing Endpoints

Use Postman or curl to test endpoints before implementing in Wear OS:

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "olivia_taylor", "password": "password123"}'

# Get pending requests (replace TOKEN)
curl -X GET "http://localhost:8080/api/service-requests?status=pending" \
  -H "Authorization: Bearer TOKEN"

# Accept request (replace TOKEN and IDs)
curl -X POST http://localhost:8080/api/service-requests/sr_12345/accept \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"crewMemberId": "cmh0hz4e80000uphkoxq30cl3"}'

# Complete request
curl -X POST http://localhost:8080/api/service-requests/sr_12345/complete \
  -H "Authorization: Bearer TOKEN"
```

---

## Summary

The OBEDIO Wear OS app should:

1. **Authenticate** crew members using JWT tokens
2. **Connect to WebSocket** for real-time service request notifications
3. **Display pending requests** on watch face/app
4. **Allow accepting requests** with one tap
5. **Allow completing requests** after service is done
6. **Handle offline scenarios** by queuing actions
7. **Show notifications** with vibration for urgent requests
8. **Sync automatically** when connection is restored

All backend API calls are authenticated, log activities automatically, and update the PostgreSQL database in real-time. The frontend web app and Wear OS app will always show synchronized data.

---

**Backend Running:** `http://localhost:8080/api`
**Frontend Running:** `http://localhost:5174`
**Database:** PostgreSQL (managed by Prisma ORM)

For questions or issues, check backend logs or Activity Log tab in the web app.
