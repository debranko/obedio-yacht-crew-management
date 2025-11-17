package com.obedio.minimal.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.obedio.minimal.data.SystemConnectionStatus
import com.obedio.minimal.services.MqttService
import com.obedio.minimal.services.NetworkChecker
import com.obedio.minimal.services.WebSocketService
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for managing connection status
 */
class ConnectionViewModel(application: Application) : AndroidViewModel(application) {

    private val networkChecker = NetworkChecker(application)
    private val webSocketService = WebSocketService()
    private val mqttService = MqttService(application)

    private val _systemStatus = MutableStateFlow(SystemConnectionStatus())
    val systemStatus: StateFlow<SystemConnectionStatus> = _systemStatus.asStateFlow()

    private var isMonitoring = false

    init {
        startMonitoring()
    }

    /**
     * Start monitoring all connections
     */
    fun startMonitoring() {
        if (isMonitoring) return
        isMonitoring = true

        // Connect services
        connectAll()

        // Monitor status changes
        viewModelScope.launch {
            webSocketService.status.collect { wsStatus ->
                _systemStatus.value = _systemStatus.value.copy(
                    websocket = wsStatus,
                    lastUpdated = System.currentTimeMillis()
                )
            }
        }

        viewModelScope.launch {
            mqttService.status.collect { mqttStatus ->
                _systemStatus.value = _systemStatus.value.copy(
                    mqtt = mqttStatus,
                    lastUpdated = System.currentTimeMillis()
                )
            }
        }

        // Periodic API health check (every 10 seconds)
        viewModelScope.launch {
            while (isMonitoring) {
                val apiStatus = networkChecker.checkApiHealth()
                _systemStatus.value = _systemStatus.value.copy(
                    api = apiStatus,
                    lastUpdated = System.currentTimeMillis()
                )
                delay(10_000) // Check every 10 seconds
            }
        }
    }

    /**
     * Connect all services
     */
    fun connectAll() {
        viewModelScope.launch {
            webSocketService.connect()
            mqttService.connect()

            // Initial API check
            val apiStatus = networkChecker.checkApiHealth()
            _systemStatus.value = _systemStatus.value.copy(
                api = apiStatus,
                lastUpdated = System.currentTimeMillis()
            )
        }
    }

    /**
     * Disconnect all services
     */
    fun disconnectAll() {
        webSocketService.disconnect()
        mqttService.disconnect()
    }

    /**
     * Refresh all connection statuses
     */
    fun refresh() {
        viewModelScope.launch {
            // Check API immediately
            val apiStatus = networkChecker.checkApiHealth()
            _systemStatus.value = _systemStatus.value.copy(
                api = apiStatus,
                lastUpdated = System.currentTimeMillis()
            )

            // Reconnect services if needed
            if (!webSocketService.isConnected()) {
                webSocketService.connect()
            }
            if (!mqttService.isConnected()) {
                mqttService.connect()
            }
        }
    }

    /**
     * Stop monitoring
     */
    fun stopMonitoring() {
        isMonitoring = false
        disconnectAll()
    }

    override fun onCleared() {
        super.onCleared()
        stopMonitoring()
    }
}
