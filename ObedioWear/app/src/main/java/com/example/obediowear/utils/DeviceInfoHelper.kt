package com.example.obediowear.utils

import android.content.Context
import android.os.Build
import android.provider.Settings

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
}
