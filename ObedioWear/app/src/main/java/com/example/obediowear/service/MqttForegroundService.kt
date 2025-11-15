package com.example.obediowear.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.obediowear.R
import com.example.obediowear.data.mqtt.MqttManager
import com.example.obediowear.presentation.MainActivity
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collectLatest
import kotlin.math.min
import kotlin.math.pow

/**
 * Foreground service that maintains persistent MQTT connection.
 * Required by Android 8+ to prevent system from killing background connections.
 *
 * This ensures crew members ALWAYS receive service request notifications.
 */
class MqttForegroundService : Service() {

    companion object {
        private const val TAG = "MqttForegroundService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "mqtt_connection"

        // Reconnection settings
        private const val MAX_RECONNECT_ATTEMPTS = 10
        private const val BASE_BACKOFF_MS = 2000L // 2 seconds
        private const val MAX_BACKOFF_MS = 60000L // 60 seconds
        private const val RESET_AFTER_MS = 300000L // 5 minutes - reset counter after successful connection

        fun start(context: Context) {
            val intent = Intent(context, MqttForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, MqttForegroundService::class.java)
            context.stopService(intent)
        }
    }

    private val serviceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var wakeLock: PowerManager.WakeLock? = null
    private var reconnectJob: Job? = null
    private var reconnectAttempts = 0
    private var lastSuccessfulConnection = 0L

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")

        // Acquire partial wake lock to prevent deep sleep from killing MQTT
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "ObedioWear:MqttService"
        )
        wakeLock?.acquire()
        Log.d(TAG, "Partial wake lock acquired - preventing deep sleep")

        // Create notification channel for Android 8+
        createNotificationChannel()

        // Start as foreground service with notification
        val notification = createNotification("Connecting...")
        startForeground(NOTIFICATION_ID, notification)

        // Connect to MQTT broker
        connectToMqtt()

        // Monitor connection status
        monitorConnectionStatus()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Service started")
        return START_STICKY // Restart service if killed by system
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null // Not a bound service
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed - disconnecting MQTT")

        // Cancel all coroutines
        reconnectJob?.cancel()
        serviceScope.cancel()

        // Disconnect MQTT
        MqttManager.disconnect()

        // Release wake lock
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
                Log.d(TAG, "Wake lock released")
            }
        }
    }

    /**
     * Connect to MQTT broker
     */
    private fun connectToMqtt() {
        try {
            MqttManager.connect(applicationContext)
            Log.i(TAG, "MQTT connection initiated")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect to MQTT: ${e.message}", e)
            scheduleReconnect()
        }
    }

    /**
     * Monitor MQTT connection status and update notification/handle reconnection.
     */
    private fun monitorConnectionStatus() {
        serviceScope.launch {
            MqttManager.connectionStatus.collectLatest { status ->
                when (status) {
                    MqttManager.ConnectionStatus.CONNECTED -> {
                        Log.i(TAG, "✅ MQTT Connected")
                        updateNotification("Connected • Listening")

                        // Reset reconnect counter on successful connection
                        reconnectAttempts = 0
                        lastSuccessfulConnection = System.currentTimeMillis()
                        reconnectJob?.cancel()
                    }
                    MqttManager.ConnectionStatus.CONNECTING -> {
                        Log.d(TAG, "🔄 MQTT Connecting...")
                        updateNotification("Connecting...")
                    }
                    MqttManager.ConnectionStatus.DISCONNECTED -> {
                        Log.w(TAG, "❌ MQTT Disconnected")
                        updateNotification("Disconnected • Reconnecting...")
                        scheduleReconnect()
                    }
                }
            }
        }
    }

    /**
     * Schedule reconnection with exponential backoff.
     */
    private fun scheduleReconnect() {
        // Cancel existing reconnect job
        reconnectJob?.cancel()

        // Reset counter if we've been connected for a while
        val timeSinceLastSuccess = System.currentTimeMillis() - lastSuccessfulConnection
        if (timeSinceLastSuccess > RESET_AFTER_MS && reconnectAttempts > 0) {
            Log.d(TAG, "Resetting reconnect counter (stable for ${timeSinceLastSuccess}ms)")
            reconnectAttempts = 0
        }

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            Log.e(TAG, "Max reconnect attempts reached. Waiting 5 minutes before retry...")
            updateNotification("Connection lost • Retrying in 5 min")

            reconnectJob = serviceScope.launch {
                delay(RESET_AFTER_MS) // Wait 5 minutes
                reconnectAttempts = 0 // Reset counter
                connectToMqtt()
            }
            return
        }

        reconnectAttempts++

        // Exponential backoff: min(BASE * 2^attempts, MAX)
        val backoffMs = min(
            BASE_BACKOFF_MS * 2.0.pow(reconnectAttempts - 1).toLong(),
            MAX_BACKOFF_MS
        )

        Log.d(TAG, "Scheduling reconnect attempt $reconnectAttempts in ${backoffMs}ms...")
        updateNotification("Reconnecting in ${backoffMs / 1000}s (attempt $reconnectAttempts)")

        reconnectJob = serviceScope.launch {
            delay(backoffMs)
            connectToMqtt()
        }
    }

    /**
     * Create notification channel (required for Android 8+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "MQTT Connection",
                NotificationManager.IMPORTANCE_LOW // Low importance = no sound/vibration
            ).apply {
                description = "Maintains connection to receive service requests"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Create notification for foreground service
     */
    private fun createNotification(statusText: String): Notification {
        // Intent to open app when notification is tapped
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("OBEDIO Crew")
            .setContentText(statusText)
            .setSmallIcon(R.drawable.ic_launcher_foreground) // Use your app icon
            .setOngoing(true) // Cannot be dismissed by user
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW) // Low priority = discreet
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    /**
     * Update existing notification text
     */
    private fun updateNotification(statusText: String) {
        val notification = createNotification(statusText)
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
}
