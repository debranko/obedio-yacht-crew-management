package com.example.obediowear2

import android.app.Application
import android.util.Log
import com.example.obediowear2.data.api.ApiClient
import com.example.obediowear2.service.MqttForegroundService
import com.example.obediowear2.service.TelemetryService
import com.example.obediowear2.utils.DeviceInfoHelper
import com.example.obediowear2.utils.NotificationHelper
import com.example.obediowear2.utils.PreferencesManager
import com.example.obediowear2.utils.ServerConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Main Application class for ObedioWear2.
 * Initializes global dependencies.
 */
class ObedioWear2Application : Application() {

    companion object {
        private const val TAG = "ObedioWear2App"

        lateinit var instance: ObedioWear2Application
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        Log.i(TAG, "ObedioWear2 Application starting...")

        // Initialize server configuration
        ServerConfig.init(this)
        Log.i(TAG, "Server config initialized: ${ServerConfig.getBaseUrl()}")

        // Initialize preferences manager
        PreferencesManager.init(this)
        Log.i(TAG, "Preferences manager initialized")

        // Create notification channels
        NotificationHelper.createNotificationChannels(this)
        Log.i(TAG, "Notification channels created")

        // Start MQTT foreground service for real-time notifications
        MqttForegroundService.start(this)
        Log.i(TAG, "MQTT foreground service started")

        // Start telemetry service for device heartbeat (battery, signal, status)
        TelemetryService.start(this, intervalMs = 30_000L)  // 30 second heartbeat
        Log.i(TAG, "Telemetry service started (30s interval)")

        // Discover device and fetch crew member ID
        discoverDevice()

        Log.i(TAG, "ObedioWear2 Application ready")
    }

    /**
     * Discover this device from the backend and fetch assigned crew member ID.
     * This ensures the crew member ID is available for accepting requests.
     */
    private fun discoverDevice() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val deviceId = DeviceInfoHelper.getDeviceId(this@ObedioWear2Application)
                Log.d(TAG, "Discovering device with ID: $deviceId")

                val response = ApiClient.instance.getDeviceByMacAddress(deviceId)

                if (response.success && response.data != null) {
                    val deviceData = response.data.asJsonObject

                    // Extract and store auth token (critical for API authentication)
                    if (deviceData.has("authToken") && !deviceData.get("authToken").isJsonNull) {
                        val authToken = deviceData.get("authToken").asString
                        PreferencesManager.setAuthToken(authToken)
                        Log.i(TAG, "🔑 Auth token received and stored")
                    } else {
                        Log.w(TAG, "⚠️ No auth token in discovery response - API calls may fail")
                    }

                    // Check for crewMemberId directly (from heartbeat response format)
                    if (deviceData.has("crewMemberId") && !deviceData.get("crewMemberId").isJsonNull) {
                        val crewMemberId = deviceData.get("crewMemberId").asString
                        PreferencesManager.setCrewMemberId(crewMemberId)
                        Log.i(TAG, "✅ Device discovered - Crew member ID: $crewMemberId")
                    }
                    // Check for nested crewmember object (from discover endpoint)
                    else if (deviceData.has("crewmember") && !deviceData.get("crewmember").isJsonNull) {
                        val crewMember = deviceData.getAsJsonObject("crewmember")
                        val crewMemberId = crewMember.get("id")?.asString
                        val crewMemberName = crewMember.get("name")?.asString ?: "Unknown"

                        if (crewMemberId != null) {
                            PreferencesManager.setCrewMemberId(crewMemberId)
                            PreferencesManager.setCrewMemberName(crewMemberName)
                            Log.i(TAG, "✅ Device discovered - Crew member: $crewMemberName ($crewMemberId)")
                        }
                    }
                    // Also check for nested assignedCrewMember object (from device detail response)
                    else if (deviceData.has("assignedCrewMember") && !deviceData.get("assignedCrewMember").isJsonNull) {
                        val crewMember = deviceData.getAsJsonObject("assignedCrewMember")
                        val crewMemberId = crewMember.get("id")?.asString
                        val crewMemberName = crewMember.get("name")?.asString ?: "Unknown"

                        if (crewMemberId != null) {
                            PreferencesManager.setCrewMemberId(crewMemberId)
                            PreferencesManager.setCrewMemberName(crewMemberName)
                            Log.i(TAG, "✅ Device discovered - Crew member: $crewMemberName ($crewMemberId)")
                        }
                    } else {
                        Log.w(TAG, "Device found but not assigned to any crew member")
                    }
                } else {
                    Log.w(TAG, "Device not found in backend - may need to be registered")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to discover device: ${e.message}", e)
            }
        }
    }
}
