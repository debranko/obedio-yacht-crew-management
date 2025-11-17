package com.obedio.app.data.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.obedio.app.ObedioApp
import com.obedio.app.R
import com.obedio.app.presentation.MainActivity
import timber.log.Timber
import java.util.concurrent.atomic.AtomicInteger

class ObedioFirebaseMessagingService : FirebaseMessagingService() {
    
    companion object {
        private val notificationId = AtomicInteger(0)
        const val EXTRA_SERVICE_REQUEST_ID = "service_request_id"
        const val EXTRA_NOTIFICATION_TYPE = "notification_type"
        const val ACTION_ACCEPT = "com.obedio.app.ACTION_ACCEPT"
        const val ACTION_VIEW = "com.obedio.app.ACTION_VIEW"
    }
    
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Timber.d("FCM Token refreshed: $token")
        // TODO: Send token to backend
        sendTokenToServer(token)
    }
    
    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        
        Timber.d("FCM message received from: ${message.from}")
        
        // Handle data payload
        if (message.data.isNotEmpty()) {
            Timber.d("Message data payload: ${message.data}")
            handleDataMessage(message.data)
        }
        
        // Handle notification payload (if sent from Firebase console)
        message.notification?.let {
            Timber.d("Message notification: ${it.title}, ${it.body}")
            showNotification(
                title = it.title ?: "Obedio",
                body = it.body ?: "",
                data = message.data
            )
        }
    }
    
    private fun handleDataMessage(data: Map<String, String>) {
        when (data["type"]) {
            "service_request" -> handleServiceRequestNotification(data)
            "emergency" -> handleEmergencyNotification(data)
            "message" -> handleMessageNotification(data)
            "crew_status" -> handleCrewStatusNotification(data)
            else -> showGenericNotification(data)
        }
    }
    
    private fun handleServiceRequestNotification(data: Map<String, String>) {
        val requestId = data["requestId"] ?: return
        val priority = data["priority"] ?: "NORMAL"
        val location = data["location"] ?: "Unknown"
        val guestName = data["guestName"] ?: "Guest"
        val message = data["message"] ?: "New service request"
        
        val title = when (priority) {
            "EMERGENCY" -> "🚨 EMERGENCY - $location"
            "URGENT" -> "🔴 URGENT - $location"
            else -> "Service Request - $location"
        }
        
        val body = "$guestName: $message"
        
        val channelId = if (priority == "EMERGENCY") {
            ObedioApp.CHANNEL_EMERGENCY
        } else {
            ObedioApp.CHANNEL_SERVICE_REQUESTS
        }
        
        showServiceRequestNotification(
            title = title,
            body = body,
            requestId = requestId,
            channelId = channelId,
            priority = priority
        )
    }
    
    private fun handleEmergencyNotification(data: Map<String, String>) {
        val location = data["location"] ?: "Unknown"
        val message = data["message"] ?: "Emergency assistance needed"
        
        showNotification(
            title = "🚨 EMERGENCY - $location",
            body = message,
            channelId = ObedioApp.CHANNEL_EMERGENCY,
            priority = NotificationCompat.PRIORITY_MAX,
            data = data
        )
    }
    
    private fun handleMessageNotification(data: Map<String, String>) {
        val from = data["from"] ?: "Crew Member"
        val message = data["message"] ?: ""
        
        showNotification(
            title = "Message from $from",
            body = message,
            channelId = ObedioApp.CHANNEL_MESSAGES,
            data = data
        )
    }
    
    private fun handleCrewStatusNotification(data: Map<String, String>) {
        val crewName = data["crewName"] ?: "Crew member"
        val status = data["status"] ?: "status changed"
        
        showNotification(
            title = "Crew Update",
            body = "$crewName is now $status",
            channelId = ObedioApp.CHANNEL_SYSTEM,
            data = data
        )
    }
    
    private fun showGenericNotification(data: Map<String, String>) {
        showNotification(
            title = data["title"] ?: "Obedio",
            body = data["body"] ?: "New notification",
            data = data
        )
    }
    
    private fun showServiceRequestNotification(
        title: String,
        body: String,
        requestId: String,
        channelId: String = ObedioApp.CHANNEL_SERVICE_REQUESTS,
        priority: String = "NORMAL"
    ) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notificationId = notificationId.incrementAndGet()
        
        // Main intent - opens the app to service request detail
        val mainIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_SERVICE_REQUEST_ID, requestId)
            putExtra(EXTRA_NOTIFICATION_TYPE, "service_request")
        }
        
        val mainPendingIntent = PendingIntent.getActivity(
            this,
            notificationId,
            mainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Accept action
        val acceptIntent = Intent(this, NotificationActionReceiver::class.java).apply {
            action = ACTION_ACCEPT
            putExtra(EXTRA_SERVICE_REQUEST_ID, requestId)
        }
        
        val acceptPendingIntent = PendingIntent.getBroadcast(
            this,
            notificationId + 1000,
            acceptIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // View action
        val viewIntent = Intent(this, NotificationActionReceiver::class.java).apply {
            action = ACTION_VIEW
            putExtra(EXTRA_SERVICE_REQUEST_ID, requestId)
        }
        
        val viewPendingIntent = PendingIntent.getBroadcast(
            this,
            notificationId + 2000,
            viewIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(mainPendingIntent)
            .setPriority(
                when (priority) {
                    "EMERGENCY" -> NotificationCompat.PRIORITY_MAX
                    "URGENT" -> NotificationCompat.PRIORITY_HIGH
                    else -> NotificationCompat.PRIORITY_DEFAULT
                }
            )
            .addAction(
                NotificationCompat.Action(
                    0, // No icon for now (TODO: Add check icon)
                    "Accept",
                    acceptPendingIntent
                )
            )
            .addAction(
                NotificationCompat.Action(
                    0, // No icon for now (TODO: Add visibility icon)
                    "View",
                    viewPendingIntent
                )
            )
        
        if (priority == "EMERGENCY") {
            notificationBuilder
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
                .setVibrate(longArrayOf(0, 1000, 500, 1000, 500, 1000))
        } else {
            notificationBuilder.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
        }
        
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
    
    private fun showNotification(
        title: String,
        body: String,
        channelId: String = ObedioApp.CHANNEL_SERVICE_REQUESTS,
        priority: Int = NotificationCompat.PRIORITY_DEFAULT,
        data: Map<String, String> = emptyMap()
    ) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notificationId = notificationId.incrementAndGet()
        
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            data.forEach { (key, value) ->
                putExtra(key, value)
            }
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            //TODO Add notification icon
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(priority)
        
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
    
    private fun sendTokenToServer(token: String) {
        // TODO: Implement sending FCM token to backend
        // This would typically be done through the UserRepository
        Timber.d("TODO: Send FCM token to server: $token")
    }
}