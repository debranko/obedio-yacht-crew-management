package com.example.obediowear2.utils

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.example.obediowear2.R
import com.example.obediowear2.data.model.Priority
import com.example.obediowear2.data.model.ServiceRequest
import com.example.obediowear2.presentation.screens.request.FullScreenRequestActivity
import com.google.gson.Gson

/**
 * Helper class for creating full-screen notifications for incoming service requests.
 * Mimics WhatsApp call-style notifications that wake up the screen.
 */
object NotificationHelper {

    private const val CHANNEL_ID = "service_request_channel"
    private const val CHANNEL_NAME = "Service Requests"
    private const val EMERGENCY_CHANNEL_ID = "emergency_channel"
    private const val EMERGENCY_CHANNEL_NAME = "Emergency Alerts"

    // FIXED: Use single static notification ID (like ObedioWear)
    // This prevents race conditions with multiple notifications
    private const val NOTIFICATION_ID = 1001

    private val gson = Gson()
    private var currentRequestId: String? = null  // Track current request

    /**
     * Initialize notification channels (required for Android O+)
     */
    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Service request channel
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming service requests from guests"
                setShowBadge(true)
                enableVibration(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }

            // Emergency channel (max priority)
            val emergencyChannel = NotificationChannel(
                EMERGENCY_CHANNEL_ID,
                EMERGENCY_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical emergency notifications"
                setShowBadge(true)
                enableVibration(true)
                setBypassDnd(true)  // Bypass DND for emergencies
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }

            notificationManager.createNotificationChannel(serviceChannel)
            notificationManager.createNotificationChannel(emergencyChannel)
        }
    }

    /**
     * Show full-screen notification for incoming service request.
     */
    fun showFullScreenNotification(context: Context, request: ServiceRequest) {
        android.util.Log.d("NotificationHelper", ">>> showFullScreenNotification called for request: ${request.id}")

        // Track current request
        currentRequestId = request.id

        // Create intent for full-screen activity
        val fullScreenIntent = Intent(context, FullScreenRequestActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("service_request", gson.toJson(request))
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID,  // Use static ID
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Build notification content
        val isEmergency = request.priority == Priority.EMERGENCY
        val channelId = if (isEmergency) EMERGENCY_CHANNEL_ID else CHANNEL_ID

        val title = when (request.priority) {
            Priority.EMERGENCY -> "🚨 EMERGENCY REQUEST"
            Priority.URGENT -> "⚡ URGENT REQUEST"
            else -> "🔔 Service Request"
        }

        val guestName = request.guest?.displayName ?: "Guest"
        val location = request.location?.name ?: "Unknown location"
        val requestType = request.requestType.getDisplayName()
        val text = "$requestType from $guestName at $location"

        android.util.Log.d("NotificationHelper", ">>> Creating notification: $title - $text")

        // Create notification
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setOngoing(true)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()

        // Show notification with static ID
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)

        android.util.Log.d("NotificationHelper", ">>> Notification shown with ID: $NOTIFICATION_ID")
    }

    /**
     * Cancel notification for a specific request
     */
    fun cancelNotificationForRequest(context: Context, requestId: String) {
        // Only cancel if this is the current request
        if (currentRequestId == requestId || currentRequestId == null) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.cancel(NOTIFICATION_ID)
            currentRequestId = null
            android.util.Log.d("NotificationHelper", ">>> Notification cancelled for request: $requestId")
        }
    }

    /**
     * Cancel the current notification (static ID)
     */
    fun cancelNotification(context: Context) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID)
        currentRequestId = null
        android.util.Log.d("NotificationHelper", ">>> Current notification cancelled")
    }

    /**
     * Cancel all service request notifications
     */
    fun cancelAllNotifications(context: Context) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID)
        currentRequestId = null
    }
}
