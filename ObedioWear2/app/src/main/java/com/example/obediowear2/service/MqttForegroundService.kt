package com.example.obediowear2.service

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
import com.example.obediowear2.R
import com.example.obediowear2.data.mqtt.MqttManager
import com.example.obediowear2.presentation.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Foreground service to maintain MQTT connection.
 * Keeps the connection alive even when the app is in background.
 */
class MqttForegroundService : Service() {

    companion object {
        private const val TAG = "MqttForegroundService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "mqtt_service_channel"
        private const val CHANNEL_NAME = "MQTT Connection"
        private const val WAKE_LOCK_TAG = "ObedioWear2:MqttWakeLock"
        private const val WAKE_LOCK_TIMEOUT_MS = 5 * 60 * 1000L  // 5 minutes

        /**
         * Start the MQTT foreground service.
         * Call this from Application.onCreate() to establish MQTT connection.
         */
        fun start(context: Context) {
            Log.i(TAG, "Starting MqttForegroundService...")
            val intent = Intent(context, MqttForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        /**
         * Stop the MQTT foreground service.
         */
        fun stop(context: Context) {
            Log.i(TAG, "Stopping MqttForegroundService...")
            context.stopService(Intent(context, MqttForegroundService::class.java))
        }
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var wakeLock: PowerManager.WakeLock? = null
    private var wakeLockRenewalJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "MqttForegroundService created")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "MqttForegroundService starting...")

        // Start as foreground service
        startForeground(NOTIFICATION_ID, createNotification())

        // Acquire wake lock with timed renewal (battery optimization)
        acquireWakeLockWithRenewal()

        // Connect to MQTT
        MqttManager.connect(this)

        return START_STICKY  // Restart if killed
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        Log.i(TAG, "MqttForegroundService destroying...")

        // Cancel wake lock renewal
        wakeLockRenewalJob?.cancel()

        // Release wake lock
        releaseWakeLock()

        // Disconnect MQTT
        MqttManager.disconnect()
    }

    /**
     * Acquire wake lock with timed renewal to optimize battery.
     * Instead of holding indefinitely, renew every 5 minutes.
     */
    private fun acquireWakeLockWithRenewal() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                WAKE_LOCK_TAG
            )
            wakeLock?.acquire(WAKE_LOCK_TIMEOUT_MS)
            Log.d(TAG, "Wake lock acquired (${WAKE_LOCK_TIMEOUT_MS / 1000}s)")

            // Schedule renewal
            wakeLockRenewalJob = serviceScope.launch {
                while (isActive) {
                    delay(4 * 60 * 1000L)  // Renew at 4 minutes (before 5 min expiry)
                    renewWakeLock()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to acquire wake lock: ${e.message}", e)
        }
    }

    private fun renewWakeLock() {
        try {
            wakeLock?.let { lock ->
                if (lock.isHeld) {
                    lock.release()
                }
                lock.acquire(WAKE_LOCK_TIMEOUT_MS)
                Log.d(TAG, "Wake lock renewed")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to renew wake lock: ${e.message}", e)
        }
    }

    private fun releaseWakeLock() {
        try {
            wakeLock?.let { lock ->
                if (lock.isHeld) {
                    lock.release()
                    Log.d(TAG, "Wake lock released")
                }
            }
            wakeLock = null
        } catch (e: Exception) {
            Log.e(TAG, "Failed to release wake lock: ${e.message}", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW  // Low importance for silent notification
            ).apply {
                description = "Maintains connection to Obedio server"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Obedio Radar")
            .setContentText("Listening for service requests")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
