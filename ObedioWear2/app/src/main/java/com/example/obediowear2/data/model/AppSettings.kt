package com.example.obediowear2.data.model

/**
 * User settings for the Obedio Wear app.
 * Persisted locally using DataStore.
 */
data class AppSettings(
    // Notifications
    val vibrationIntensity: VibrationLevel = VibrationLevel.MEDIUM,
    val emergencySoundEnabled: Boolean = true,
    val dndAlertsEnabled: Boolean = true,

    // Shake to Delegate
    val shakeToDelegate: Boolean = true,
    val shakeSensitivity: ShakeSensitivity = ShakeSensitivity.MEDIUM,
    val shakeConfirmationRequired: Boolean = true,

    // Connection
    val serverIp: String = "10.10.0.207",
    val mqttPort: Int = 1883,
    val apiPort: Int = 8081,

    // Battery & Telemetry
    val telemetryInterval: Long = 60_000L,  // 60 seconds
    val lowBatteryThreshold: Int = 20,

    // Profile
    val crewMemberId: String? = null,
    val crewMemberName: String? = null,
    val deviceId: String? = null
)

enum class VibrationLevel {
    LOW, MEDIUM, HIGH;

    fun getAmplitude(): Int = when (this) {
        LOW -> 80
        MEDIUM -> 150
        HIGH -> 255
    }

    fun getDisplayName(): String = when (this) {
        LOW -> "Low"
        MEDIUM -> "Medium"
        HIGH -> "High"
    }
}

enum class ShakeSensitivity {
    LOW, MEDIUM, HIGH;

    fun getThreshold(): Float = when (this) {
        LOW -> 15f      // Vigorous shake needed
        MEDIUM -> 12f   // Normal shake
        HIGH -> 8f      // Light shake
    }

    fun getDisplayName(): String = when (this) {
        LOW -> "Low (vigorous)"
        MEDIUM -> "Medium"
        HIGH -> "High (sensitive)"
    }
}

enum class TelemetryInterval(val millis: Long, val displayName: String) {
    FAST(30_000L, "30 seconds"),
    NORMAL(60_000L, "1 minute"),
    SLOW(300_000L, "5 minutes")
}
