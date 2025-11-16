package com.obedio.minimal.services

import android.util.Log
import com.obedio.minimal.data.AppConfig
import com.obedio.minimal.data.ConnectionState
import com.obedio.minimal.data.ServiceStatus
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject

/**
 * Manages WebSocket connection using Socket.IO
 */
class WebSocketService {

    private var socket: Socket? = null
    private val _status = MutableStateFlow(ServiceStatus())
    val status: StateFlow<ServiceStatus> = _status.asStateFlow()

    private val TAG = "WebSocketService"

    /**
     * Connect to WebSocket server
     */
    fun connect() {
        try {
            _status.value = ServiceStatus(
                state = ConnectionState.CONNECTING,
                message = "Connecting to WebSocket..."
            )

            val options = IO.Options().apply {
                reconnection = true
                reconnectionAttempts = Int.MAX_VALUE
                reconnectionDelay = AppConfig.WEBSOCKET_RECONNECT_DELAY_MS
                timeout = AppConfig.CONNECTION_TIMEOUT_MS
            }

            socket = IO.socket(AppConfig.WEBSOCKET_URL, options).apply {
                on(Socket.EVENT_CONNECT) {
                    Log.d(TAG, "WebSocket connected")
                    _status.value = ServiceStatus(
                        state = ConnectionState.CONNECTED,
                        message = "WebSocket connected",
                        lastConnected = System.currentTimeMillis()
                    )
                }

                on(Socket.EVENT_DISCONNECT) {
                    Log.d(TAG, "WebSocket disconnected")
                    _status.value = ServiceStatus(
                        state = ConnectionState.DISCONNECTED,
                        message = "WebSocket disconnected"
                    )
                }

                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    val error = args.firstOrNull()
                    Log.e(TAG, "WebSocket connection error: $error")
                    _status.value = ServiceStatus(
                        state = ConnectionState.ERROR,
                        message = "Connection error",
                        errorDetails = error?.toString() ?: "Unknown error"
                    )
                }

                on(Socket.EVENT_RECONNECT) {
                    Log.d(TAG, "WebSocket reconnecting...")
                }

                on(Socket.EVENT_RECONNECT_ERROR) { args ->
                    val error = args.firstOrNull()
                    Log.e(TAG, "WebSocket reconnection error: $error")
                }

                // Listen to any events for demo purposes
                on("service-request:created") { args ->
                    Log.d(TAG, "Received event: service-request:created")
                }
            }

            socket?.connect()

        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect WebSocket", e)
            _status.value = ServiceStatus(
                state = ConnectionState.ERROR,
                message = "Failed to connect",
                errorDetails = e.message ?: "Unknown error"
            )
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        _status.value = ServiceStatus(
            state = ConnectionState.DISCONNECTED,
            message = "Disconnected"
        )
    }

    /**
     * Check if currently connected
     */
    fun isConnected(): Boolean = socket?.connected() == true
}
