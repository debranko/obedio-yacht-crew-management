package com.example.obediowear.utils

import android.content.Context
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import android.util.Log

/**
 * Helper class for extracting device information (unique identifier, model, etc.)
 * Uses Android ID as the unique identifier since MAC addresses are restricted on modern Android.
 */
object DeviceInfoHelper {

    /**
     * Get unique device identifier (Android ID).
     * This is reliable and doesn't require special permissions.
     * Returns a 64-bit number (as 16-character hex string) that is randomly generated
     * when the user first sets up the device and remains constant for the lifetime of the device.
     */
    fun getDeviceId(context: Context): String {
        return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            ?: "unknown-device"
    }

    /**
     * Get device model name (e.g., "TicWatch Pro 3", "Galaxy Watch 4").
     */
    fun getDeviceModel(): String {
        return Build.MODEL ?: "Unknown Watch"
    }

    /**
     * Get device manufacturer (e.g., "Mobvoi", "Samsung").
     */
    fun getDeviceManufacturer(): String {
        return Build.MANUFACTURER ?: "Unknown"
    }

    /**
     * Get full device name (e.g., "Mobvoi TicWatch Pro 3").
     */
    fun getDeviceName(): String {
        val manufacturer = getDeviceManufacturer()
        val model = getDeviceModel()

        // If model already contains manufacturer name, don't duplicate
        return if (model.contains(manufacturer, ignoreCase = true)) {
            model
        } else {
            "$manufacturer $model"
        }
    }

    /**
     * Get Android version (e.g., "13", "11").
     */
    fun getAndroidVersion(): String {
        return Build.VERSION.RELEASE
    }

    /**
     * Get hardware information (e.g., "aarch64").
     */
    fun getHardwareInfo(): String {
        return Build.HARDWARE ?: "Unknown"
    }

    /**
     * Generate a friendly device name for registration.
     * Format: "Watch - TicWatch Pro 3 (a1b2c3)"
     */
    fun generateFriendlyName(context: Context): String {
        val deviceId = getDeviceId(context)
        val deviceModel = getDeviceModel()
        val shortId = deviceId.takeLast(6) // Last 6 chars of Android ID

        return "Watch - $deviceModel ($shortId)"
    }

    /**
     * Get current battery level (0-100%).
     * Returns battery percentage using BatteryManager.
     */
    fun getBatteryLevel(context: Context): Int {
        return try {
            val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        } catch (e: Exception) {
            Log.e("DeviceInfo", "Failed to get battery level: ${e.message}")
            -1 // Return -1 on error
        }
    }

    /**
     * Get WiFi signal strength in dBm (e.g., -50 is excellent, -70 is fair, -90 is poor).
     * Returns signal strength in dBm, or -100 if WiFi is disabled/unavailable.
     */
    fun getWiFiSignalStrength(context: Context): Int {
        return try {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

            if (!wifiManager.isWifiEnabled) {
                Log.d("DeviceInfo", "WiFi is disabled")
                return -100 // WiFi disabled
            }

            val wifiInfo = wifiManager.connectionInfo
            val rssi = wifiInfo.rssi // Signal strength in dBm

            Log.d("DeviceInfo", "WiFi signal strength: ${rssi}dBm (SSID: ${wifiInfo.ssid})")
            rssi
        } catch (e: Exception) {
            Log.e("DeviceInfo", "Failed to get WiFi signal strength: ${e.message}")
            -100 // Return weak signal on error
        }
    }
}
