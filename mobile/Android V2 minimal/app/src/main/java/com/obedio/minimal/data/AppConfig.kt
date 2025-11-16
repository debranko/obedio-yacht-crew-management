package com.obedio.minimal.data

/**
 * Application configuration
 * ✅ CONFIGURED for your Obedio backend server
 * Backend runs on PORT 3333 (from your .env file)
 */
object AppConfig {
    // Backend API URL - Port 3333 (matches your backend .env)
    const val API_BASE_URL = "http://10.0.2.2:3333" // 10.0.2.2 = localhost for Android emulator

    // For PHYSICAL DEVICE: Uncomment and use your computer's IP address:
    // const val API_BASE_URL = "http://192.168.1.100:3333" // Replace with your actual IP

    // WebSocket URL (same port as API)
    const val WEBSOCKET_URL = "http://10.0.2.2:3333"
    // const val WEBSOCKET_URL = "http://192.168.1.100:3333" // For physical device

    // MQTT Broker settings - Port 1883 (default MQTT port)
    const val MQTT_BROKER_URL = "tcp://10.0.2.2:1883"
    // const val MQTT_BROKER_URL = "tcp://192.168.1.100:1883" // For physical device
    const val MQTT_CLIENT_ID = "obedio-minimal-android"

    // Health check endpoint
    const val HEALTH_CHECK_PATH = "/api/health"

    // Connection timeouts
    const val CONNECTION_TIMEOUT_MS = 5000L
    const val WEBSOCKET_RECONNECT_DELAY_MS = 3000L
    const val MQTT_RECONNECT_DELAY_MS = 3000L
}
