package com.example.obediowear2.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.example.obediowear2.data.api.ApiClient
import com.example.obediowear2.data.api.DeviceHeartbeatBody
import com.example.obediowear2.data.mqtt.MqttManager
import com.example.obediowear2.utils.DeviceInfoHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.Instant

/**
 * Background service for reporting device telemetry (battery, signal, status).
 * Reports via both REST API and MQTT for real-time dashboard updates.
 */
class TelemetryService : Service() {

    companion object {
        private const val TAG = "TelemetryService"
        private const val DEFAULT_INTERVAL_MS = 60_000L  // 1 minute

        /**
         * Start the TelemetryService.
         * Call this from Application.onCreate() after MQTT is connected.
         */
        fun start(context: android.content.Context, intervalMs: Long = DEFAULT_INTERVAL_MS) {
            Log.i(TAG, "Starting TelemetryService with interval ${intervalMs}ms")
            val intent = Intent(context, TelemetryService::class.java).apply {
                putExtra("interval", intervalMs)
            }
            context.startService(intent)
        }

        /**
         * Stop the TelemetryService.
         */
        fun stop(context: android.content.Context) {
            Log.i(TAG, "Stopping TelemetryService")
            context.stopService(Intent(context, TelemetryService::class.java))
        }
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var telemetryJob: Job? = null
    private var intervalMs: Long = DEFAULT_INTERVAL_MS

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "TelemetryService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "TelemetryService starting...")

        // Get interval from intent if provided
        intervalMs = intent?.getLongExtra("interval", DEFAULT_INTERVAL_MS) ?: DEFAULT_INTERVAL_MS

        startTelemetryLoop()

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        telemetryJob?.cancel()
        Log.i(TAG, "TelemetryService destroyed")
    }

    private fun startTelemetryLoop() {
        telemetryJob?.cancel()

        telemetryJob = serviceScope.launch {
            while (isActive) {
                sendTelemetry()
                delay(intervalMs)
            }
        }
    }

    private suspend fun sendTelemetry() {
        try {
            val deviceId = DeviceInfoHelper.getDeviceId(this@TelemetryService)
            val batteryLevel = DeviceInfoHelper.getBatteryLevel(this@TelemetryService)
            val isCharging = DeviceInfoHelper.isCharging(this@TelemetryService)
            val signalStrength = DeviceInfoHelper.getWiFiSignalStrength(this@TelemetryService)
            val status = if (MqttManager.isConnected()) "online" else "offline"
            val timestamp = Instant.now().toString()

            Log.d(TAG, "Sending telemetry: battery=$batteryLevel%, charging=$isCharging, signal=${signalStrength}dBm")

            // 1. Send via REST API (for persistent storage)
            try {
                val heartbeatBody = DeviceHeartbeatBody(
                    macAddress = deviceId,
                    batteryLevel = batteryLevel,
                    isCharging = isCharging,
                    signalStrength = signalStrength,
                    status = status,
                    lastSeen = timestamp
                )

                ApiClient.instance.sendDeviceHeartbeat(heartbeatBody)
                Log.d(TAG, "Telemetry sent via API")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send telemetry via API: ${e.message}")
            }

            // 2. Publish via MQTT (for real-time dashboard)
            try {
                val telemetryData = mapOf(
                    "deviceId" to deviceId,
                    "batteryLevel" to batteryLevel,
                    "isCharging" to isCharging,
                    "signalStrength" to signalStrength,
                    "status" to status,
                    "lastSeen" to timestamp
                )

                MqttManager.publishTelemetry(telemetryData)
                Log.d(TAG, "Telemetry published via MQTT")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to publish telemetry via MQTT: ${e.message}")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error collecting telemetry: ${e.message}", e)
        }
    }

    /**
     * Update telemetry interval dynamically.
     */
    fun updateInterval(newIntervalMs: Long) {
        if (newIntervalMs != intervalMs) {
            intervalMs = newIntervalMs
            startTelemetryLoop()  // Restart with new interval
            Log.i(TAG, "Telemetry interval updated to ${newIntervalMs}ms")
        }
    }
}
