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
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.obediowear.R
import com.example.obediowear.data.mqtt.MqttManager
import com.example.obediowear.presentation.MainActivity

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

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")

        // Create notification channel for Android 8+
        createNotificationChannel()

        // Start as foreground service with notification
        val notification = createNotification("Connecting...")
        startForeground(NOTIFICATION_ID, notification)

        // Connect to MQTT broker
        connectToMqtt()
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
        MqttManager.disconnect()
    }

    /**
     * Connect to MQTT broker
     */
    private fun connectToMqtt() {
        try {
            MqttManager.connect(applicationContext)

            // Update notification when connected
            // Note: We could observe MqttManager.connectionStatus here
            // and update notification accordingly, but keeping it simple for now
            updateNotification("Connected • Listening")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect to MQTT: ${e.message}", e)
            updateNotification("Connection failed")
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
