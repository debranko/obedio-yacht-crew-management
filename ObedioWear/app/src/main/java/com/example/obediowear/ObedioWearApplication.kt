package com.example.obediowear

import android.app.Application
import android.util.Log
import com.example.obediowear.service.MqttForegroundService

/**
 * Application class for OBEDIO Wear OS app.
 * Starts MQTT foreground service on app launch to ensure persistent connection.
 */
class ObedioWearApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        Log.d("ObedioApp", "Application onCreate - starting MQTT foreground service")

        // Start MQTT foreground service immediately on app launch
        // This ensures the service is running before any Activity is created
        // and persists even when Activities are in background
        MqttForegroundService.start(this)

        Log.i("ObedioApp", "✅ MQTT Foreground Service started from Application class")
    }
}
