package com.obedio.minimal.data

/**
 * Represents the connection status of a service
 */
enum class ConnectionState {
    CONNECTED,
    DISCONNECTED,
    CONNECTING,
    ERROR
}

/**
 * Data class holding connection status for all services
 */
data class SystemConnectionStatus(
    val websocket: ServiceStatus = ServiceStatus(),
    val mqtt: ServiceStatus = ServiceStatus(),
    val api: ServiceStatus = ServiceStatus(),
    val lastUpdated: Long = System.currentTimeMillis()
)

/**
 * Status of an individual service
 */
data class ServiceStatus(
    val state: ConnectionState = ConnectionState.DISCONNECTED,
    val message: String = "Not connected",
    val lastConnected: Long? = null,
    val errorDetails: String? = null
)
