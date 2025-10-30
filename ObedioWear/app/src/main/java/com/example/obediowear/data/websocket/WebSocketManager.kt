package com.example.obediowear.data.websocket

import android.util.Log
import com.example.obediowear.data.model.ServiceRequest
import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import java.net.URISyntaxException

/**
 * Manages the WebSocket connection and event handling using Socket.IO.
 */
object WebSocketManager {

    private const val TAG = "WebSocketManager"

    private const val SERVER_URL = "http://192.168.5.152:8080"

    enum class ConnectionStatus { CONNECTING, CONNECTED, DISCONNECTED }

    private var socket: Socket? = null
    private val gson = Gson()

    // Connection status flow - starts with DISCONNECTED
    private val _connectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    // Flow for newly created service requests
    private val _newRequestFlow = MutableSharedFlow<ServiceRequest>()
    val newRequestFlow = _newRequestFlow.asSharedFlow()

    // Flow for updated service requests
    private val _updatedRequestFlow = MutableSharedFlow<ServiceRequest>()
    val updatedRequestFlow = _updatedRequestFlow.asSharedFlow()

    /**
     * Initializes and connects the Socket.IO client.
     */
    fun connect() {
        if (socket?.connected() == true) {
            Log.d(TAG, "Already connected.")
            return
        }

        try {
            // Configure socket options for auto-reconnection
            val opts = IO.Options().apply {
                reconnection = true
                reconnectionAttempts = 5
                reconnectionDelay = 1000
                reconnectionDelayMax = 5000
            }

            socket = IO.socket(SERVER_URL, opts)

            // Register event listeners
            setupEventListeners()

            // Initiate connection
            _connectionStatus.value = ConnectionStatus.CONNECTING
            socket?.connect()
            Log.d(TAG, "Connecting to WebSocket server...")

        } catch (e: URISyntaxException) {
            Log.e(TAG, "WebSocket connection error: ${e.message}")
            _connectionStatus.value = ConnectionStatus.DISCONNECTED
        }
    }

    /**
     * Sets up listeners for all relevant WebSocket events.
     */
    private fun setupEventListeners() {
        socket?.on(Socket.EVENT_CONNECT) {
            _connectionStatus.value = ConnectionStatus.CONNECTED
            Log.i(TAG, "WebSocket Connected!")
        }

        socket?.on(Socket.EVENT_DISCONNECT) {
            _connectionStatus.value = ConnectionStatus.DISCONNECTED
            Log.w(TAG, "WebSocket Disconnected!")
        }

        socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
            Log.e(TAG, "WebSocket Connection Error: ${args.firstOrNull()}")
        }

        socket?.on("service-request:created") { args ->
            Log.d(TAG, "Received 'service-request:created' event")
            args.firstOrNull()?.let {
                try {
                    val request = gson.fromJson(it.toString(), ServiceRequest::class.java)
                    _newRequestFlow.tryEmit(request)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing new service request: ${e.message}")
                }
            }
        }

        socket?.on("service-request:updated") { args ->
            Log.d(TAG, "Received 'service-request:updated' event")
            args.firstOrNull()?.let {
                try {
                    val request = gson.fromJson(it.toString(), ServiceRequest::class.java)
                    _updatedRequestFlow.tryEmit(request)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing updated service request: ${e.message}")
                }
            }
        }
    }

    /**
     * Disconnects the WebSocket client.
     */
    fun disconnect() {
        socket?.disconnect()
        Log.d(TAG, "Disconnecting from WebSocket server...")
    }
}
