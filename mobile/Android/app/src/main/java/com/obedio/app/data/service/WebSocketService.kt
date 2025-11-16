package com.obedio.app.data.service

import com.obedio.app.BuildConfig
import com.obedio.app.data.api.dto.ServiceRequestDto
import com.obedio.app.data.local.TokenManager
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import kotlinx.coroutines.channels.ProducerScope
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import org.json.JSONObject
import timber.log.Timber
import java.net.URI
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WebSocketService @Inject constructor(
    private val tokenManager: TokenManager
) {
    private var socket: Socket? = null
    
    sealed class WebSocketEvent {
        data class ServiceRequestCreated(val request: ServiceRequestDto) : WebSocketEvent()
        data class ServiceRequestUpdated(val request: ServiceRequestDto) : WebSocketEvent()
        data class ServiceRequestCompleted(val requestId: String) : WebSocketEvent()
        data class CrewStatusChanged(val userId: String, val status: String) : WebSocketEvent()
        data class EmergencyAlert(val message: String, val location: String) : WebSocketEvent()
        data class Connected(val socketId: String) : WebSocketEvent()
        data class Disconnected(val reason: String) : WebSocketEvent()
        data class Error(val error: String) : WebSocketEvent()
    }
    
    fun connect(): Flow<WebSocketEvent> = callbackFlow {
        try {
            val token = tokenManager.getAccessToken()
            if (token.isNullOrBlank()) {
                trySend(WebSocketEvent.Error("No authentication token"))
                close()
                return@callbackFlow
            }
            
            val options = IO.Options().apply {
                auth = mapOf("token" to token)
                reconnection = true
                reconnectionDelay = 1000
                reconnectionAttempts = 5
            }
            
            socket = IO.socket(URI.create(BuildConfig.WS_URL), options).apply {
                // Connection events
                on(Socket.EVENT_CONNECT) {
                    Timber.d("WebSocket connected: ${id()}")
                    trySend(WebSocketEvent.Connected(id()))
                }
                
                on(Socket.EVENT_DISCONNECT) { args ->
                    val reason = args.firstOrNull()?.toString() ?: "Unknown"
                    Timber.d("WebSocket disconnected: $reason")
                    trySend(WebSocketEvent.Disconnected(reason))
                }
                
                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    val error = args.firstOrNull()?.toString() ?: "Connection error"
                    Timber.e("WebSocket connection error: $error")
                    trySend(WebSocketEvent.Error(error))
                }
                
                // Service request events
                on("service-request:created") { args ->
                    handleServiceRequestEvent(args, WebSocketEvent::ServiceRequestCreated)
                }
                
                on("service-request:updated") { args ->
                    handleServiceRequestEvent(args, WebSocketEvent::ServiceRequestUpdated)
                }
                
                on("service-request:completed") { args ->
                    val data = args.firstOrNull() as? JSONObject
                    val requestId = data?.getString("id")
                    if (requestId != null) {
                        trySend(WebSocketEvent.ServiceRequestCompleted(requestId))
                    }
                }
                
                // Crew events
                on("crew:status-changed") { args ->
                    val data = args.firstOrNull() as? JSONObject
                    val userId = data?.getString("userId")
                    val status = data?.getString("status")
                    if (userId != null && status != null) {
                        trySend(WebSocketEvent.CrewStatusChanged(userId, status))
                    }
                }
                
                // Emergency events
                on("emergency:alert") { args ->
                    val data = args.firstOrNull() as? JSONObject
                    val message = data?.getString("message") ?: "Emergency!"
                    val location = data?.getString("location") ?: "Unknown"
                    trySend(WebSocketEvent.EmergencyAlert(message, location))
                }
                
                connect()
            }
            
            awaitClose {
                disconnect()
            }
        } catch (e: Exception) {
            Timber.e(e, "WebSocket setup failed")
            trySend(WebSocketEvent.Error(e.message ?: "Setup failed"))
            close()
        }
    }
    
    private fun ProducerScope<WebSocketEvent>.handleServiceRequestEvent(
        args: Array<Any>,
        eventFactory: (ServiceRequestDto) -> WebSocketEvent
    ) {
        try {
            val data = args.firstOrNull() as? JSONObject
            if (data != null) {
                // Parse ServiceRequestDto from JSON
                // This is simplified - in real implementation you'd use Moshi
                val request = parseServiceRequestFromJson(data)
                trySend(eventFactory(request))
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to parse service request event")
        }
    }
    
    private fun parseServiceRequestFromJson(json: JSONObject): ServiceRequestDto {
        // Simplified parsing - in production use Moshi
        // This is a simplified parser. A real implementation would use Moshi.
        return ServiceRequestDto(
            id = json.getString("id"),
            guestId = json.optString("guestId", null),
            guest = null,
            guestName = json.optString("guestName", null),
            guestCabin = json.optString("guestCabin", null),
            locationId = json.optString("locationId", null),
            location = null,
            message = json.optString("message", null),
            notes = json.optString("notes", null),
            priority = json.getString("priority"),
            requestType = json.getString("requestType"),
            status = json.getString("status"),
            createdAt = json.getString("createdAt"),
            updatedAt = json.getString("updatedAt"),
            acceptedAt = json.optString("acceptedAt", null),
            completedAt = json.optString("completedAt", null),
            assignedToId = json.optString("assignedToId", null),
            assignedTo = null,
            categoryId = json.optString("categoryId", null),
            voiceTranscript = json.optString("voiceTranscript", null),
            voiceAudioUrl = json.optString("voiceAudioUrl", null)
        )
    }
    
    fun emit(event: String, data: Any) {
        socket?.emit(event, data)
    }
    
    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
    
    fun isConnected(): Boolean = socket?.connected() ?: false
}