package com.example.obediowear2.utils

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import android.util.Log

/**
 * Helper class for extracting device information (unique identifier, model, battery, signal, etc.)
 */
object DeviceInfoHelper {

    private const val TAG = "DeviceInfoHelper"

    /**
     * Get unique device identifier (Android ID).
     */
    fun getDeviceId(context: Context): String {
        return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            ?: "unknown-device"
    }

    /**
     * Get device model name (e.g., "TicWatch Pro 5").
     */
    fun getDeviceModel(): String {
        return Build.MODEL ?: "Unknown Watch"
    }

    /**
     * Get device manufacturer (e.g., "Mobvoi").
     */
    fun getDeviceManufacturer(): String {
        return Build.MANUFACTURER ?: "Unknown"
    }

    /**
     * Get full device name (e.g., "Mobvoi TicWatch Pro 5").
     */
    fun getDeviceName(): String {
        val manufacturer = getDeviceManufacturer()
        val model = getDeviceModel()

        return if (model.contains(manufacturer, ignoreCase = true)) {
            model
        } else {
            "$manufacturer $model"
        }
    }

    /**
     * Get Android version (e.g., "13").
     */
    fun getAndroidVersion(): String {
        return Build.VERSION.RELEASE
    }

    /**
     * Generate a friendly device name for registration.
     * Format: "Watch - TicWatch Pro 5 (a1b2c3)"
     */
    fun generateFriendlyName(context: Context): String {
        val deviceId = getDeviceId(context)
        val deviceModel = getDeviceModel()
        val shortId = deviceId.takeLast(6)

        return "Watch - $deviceModel ($shortId)"
    }

    /**
     * Get current battery level (0-100%).
     */
    fun getBatteryLevel(context: Context): Int {
        return try {
            val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get battery level: ${e.message}")
            -1
        }
    }

    /**
     * Check if device is currently charging.
     */
    fun isCharging(context: Context): Boolean {
        return try {
            val batteryStatus: Intent? = IntentFilter(Intent.ACTION_BATTERY_CHANGED).let { filter ->
                context.registerReceiver(null, filter)
            }

            val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            status == BatteryManager.BATTERY_STATUS_CHARGING ||
                    status == BatteryManager.BATTERY_STATUS_FULL
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get charging status: ${e.message}")
            false
        }
    }

    /**
     * Get WiFi signal strength in dBm.
     * Returns -100 if WiFi is disabled/unavailable.
     */
    @Suppress("DEPRECATION")
    fun getWiFiSignalStrength(context: Context): Int {
        return try {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

            if (!wifiManager.isWifiEnabled) {
                Log.d(TAG, "WiFi is disabled")
                return -100
            }

            val wifiInfo = wifiManager.connectionInfo
            val rssi = wifiInfo.rssi

            Log.d(TAG, "WiFi signal strength: ${rssi}dBm")
            rssi
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get WiFi signal strength: ${e.message}")
            -100
        }
    }

    /**
     * Get signal strength description.
     */
    fun getSignalDescription(rssi: Int): String {
        return when {
            rssi >= -50 -> "Excellent"
            rssi >= -60 -> "Good"
            rssi >= -70 -> "Fair"
            rssi >= -80 -> "Weak"
            else -> "Poor"
        }
    }

    /**
     * Get battery level description.
     */
    fun getBatteryDescription(level: Int): String {
        return when {
            level >= 80 -> "Full"
            level >= 50 -> "Good"
            level >= 20 -> "Low"
            else -> "Critical"
        }
    }
}
