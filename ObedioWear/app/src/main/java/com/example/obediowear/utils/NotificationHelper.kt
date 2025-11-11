package com.example.obediowear.utils

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.example.obediowear.R
import com.example.obediowear.data.model.ServiceRequest
import com.example.obediowear.presentation.FullScreenIncomingRequestActivity
import com.google.gson.Gson

/**
 * Helper class for creating full-screen notifications for incoming service requests.
 * Mimics WhatsApp call-style notifications that wake up the screen.
 */
object NotificationHelper {

    private const val CHANNEL_ID = "service_request_channel"
    private const val CHANNEL_NAME = "Service Requests"
    private const val NOTIFICATION_ID = 1001

    private val gson = Gson()

    /**
     * Initialize notification channel (required for Android O+)
     */
    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming service requests from guests"
                setShowBadge(true)
                enableVibration(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Show full-screen notification for incoming service request.
     * This will wake up the screen and show the request like a WhatsApp call.
     */
    fun showFullScreenNotification(context: Context, request: ServiceRequest) {
        // Create intent for full-screen activity
        val fullScreenIntent = Intent(context, FullScreenIncomingRequestActivity::class.java).apply {
            // Add flags to ensure the activity is displayed correctly
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            // Pass service request data as JSON
            putExtra("service_request", gson.toJson(request))
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            0,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Build notification title and text
        val title = when (request.priority.name.lowercase()) {
            "emergency" -> "🚨 EMERGENCY REQUEST"
            "urgent" -> "⚡ URGENT REQUEST"
            else -> "Service Request"
        }

        val guestName = request.guest?.let {
            "${it.firstName} ${it.lastName}".trim()
        } ?: "Guest"

        val location = request.location?.name ?: request.notes ?: "Unknown location"
        val text = "$guestName at $location"

        // Create notification
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification) // You'll need to add this icon
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setOngoing(true) // Can't swipe away
            .setFullScreenIntent(fullScreenPendingIntent, true) // KEY: Full-screen intent
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()

        // Show notification
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    /**
     * Cancel the current notification (called when request is accepted/dismissed)
     */
    fun cancelNotification(context: Context) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID)
    }
}
