package com.obedio.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import androidx.work.WorkManager
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber
import javax.inject.Inject

@HiltAndroidApp
class ObedioApp : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override fun onCreate() {
        super.onCreate()
        
        // Initialize Timber for logging
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
        
        // Initialize WorkManager
        // WorkManager initialization is now handled automatically by Hilt
        
        // Create notification channels
        createNotificationChannels()
        
        Timber.d("Obedio App initialized")
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)
            
            // Service Request Channel
            val serviceChannel = NotificationChannel(
                CHANNEL_SERVICE_REQUESTS,
                "Service Requests",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for new service requests"
                enableVibration(true)
                enableLights(true)
            }
            
            // Emergency Channel
            val emergencyChannel = NotificationChannel(
                CHANNEL_EMERGENCY,
                "Emergency Alerts",
                NotificationManager.IMPORTANCE_MAX
            ).apply {
                description = "Emergency notifications requiring immediate attention"
                enableVibration(true)
                enableLights(true)
                setBypassDnd(true)
            }
            
            // Messages Channel
            val messagesChannel = NotificationChannel(
                CHANNEL_MESSAGES,
                "Messages",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Crew messages and communications"
                enableVibration(true)
            }
            
            // System Channel
            val systemChannel = NotificationChannel(
                CHANNEL_SYSTEM,
                "System",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "System notifications and updates"
            }
            
            notificationManager.createNotificationChannels(
                listOf(serviceChannel, emergencyChannel, messagesChannel, systemChannel)
            )
        }
    }

    companion object {
        const val CHANNEL_SERVICE_REQUESTS = "service_requests"
        const val CHANNEL_EMERGENCY = "emergency"
        const val CHANNEL_MESSAGES = "messages"
        const val CHANNEL_SYSTEM = "system"
    }
}