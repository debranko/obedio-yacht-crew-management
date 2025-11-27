package com.example.obediowear2.utils

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.example.obediowear2.data.model.ShakeSensitivity
import com.example.obediowear2.data.model.VibrationLevel

/**
 * Centralized preferences manager for all app settings.
 * Handles crew member profile, notification settings, and device configuration.
 */
object PreferencesManager {
    private const val TAG = "PreferencesManager"
    private const val PREFS_NAME = "obedio2_user_prefs"

    // Profile keys
    private const val KEY_CREW_MEMBER_ID = "crew_member_id"
    private const val KEY_CREW_MEMBER_NAME = "crew_member_name"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_AUTH_TOKEN = "auth_token"

    // Notification settings keys
    private const val KEY_EMERGENCY_SOUND = "emergency_sound_enabled"
    private const val KEY_DND_ALERTS = "dnd_alerts_enabled"
    private const val KEY_VIBRATION_LEVEL = "vibration_level"

    // Shake settings keys
    private const val KEY_SHAKE_TO_DELEGATE = "shake_to_delegate"
    private const val KEY_SHAKE_SENSITIVITY = "shake_sensitivity"
    private const val KEY_SHAKE_CONFIRMATION = "shake_confirmation_required"

    // Battery settings
    private const val KEY_LOW_BATTERY_THRESHOLD = "low_battery_threshold"

    private lateinit var prefs: SharedPreferences
    private var isInitialized = false

    /**
     * Initialize preferences manager. Call from Application.onCreate()
     */
    fun init(context: Context) {
        if (!isInitialized) {
            prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            isInitialized = true
            Log.i(TAG, "PreferencesManager initialized")
        }
    }

    private fun ensureInitialized() {
        if (!isInitialized) {
            throw IllegalStateException("PreferencesManager not initialized. Call init() first.")
        }
    }

    // ============ PROFILE ============

    /**
     * Get crew member ID (used for API calls)
     */
    fun getCrewMemberId(): String? {
        ensureInitialized()
        return prefs.getString(KEY_CREW_MEMBER_ID, null)
    }

    /**
     * Set crew member ID after device discovery
     */
    fun setCrewMemberId(id: String?) {
        ensureInitialized()
        prefs.edit().apply {
            if (id != null) {
                putString(KEY_CREW_MEMBER_ID, id)
            } else {
                remove(KEY_CREW_MEMBER_ID)
            }
            apply()
        }
        Log.i(TAG, "Crew member ID set: $id")
    }

    /**
     * Get crew member display name
     */
    fun getCrewMemberName(): String? {
        ensureInitialized()
        return prefs.getString(KEY_CREW_MEMBER_NAME, null)
    }

    /**
     * Set crew member name
     */
    fun setCrewMemberName(name: String?) {
        ensureInitialized()
        prefs.edit().apply {
            if (name != null) {
                putString(KEY_CREW_MEMBER_NAME, name)
            } else {
                remove(KEY_CREW_MEMBER_NAME)
            }
            apply()
        }
        Log.i(TAG, "Crew member name set: $name")
    }

    /**
     * Get stored device ID
     */
    fun getDeviceId(): String? {
        ensureInitialized()
        return prefs.getString(KEY_DEVICE_ID, null)
    }

    /**
     * Set device ID
     */
    fun setDeviceId(id: String) {
        ensureInitialized()
        prefs.edit().putString(KEY_DEVICE_ID, id).apply()
        Log.i(TAG, "Device ID set: $id")
    }

    /**
     * Get JWT auth token for API calls
     */
    fun getAuthToken(): String? {
        ensureInitialized()
        return prefs.getString(KEY_AUTH_TOKEN, null)
    }

    /**
     * Set JWT auth token received from device discovery
     */
    fun setAuthToken(token: String?) {
        ensureInitialized()
        prefs.edit().apply {
            if (token != null) {
                putString(KEY_AUTH_TOKEN, token)
            } else {
                remove(KEY_AUTH_TOKEN)
            }
            apply()
        }
        Log.i(TAG, "Auth token ${if (token != null) "set" else "cleared"}")
    }

    // ============ NOTIFICATION SETTINGS ============

    fun getEmergencySoundEnabled(): Boolean {
        ensureInitialized()
        return prefs.getBoolean(KEY_EMERGENCY_SOUND, true)
    }

    fun setEmergencySoundEnabled(enabled: Boolean) {
        ensureInitialized()
        prefs.edit().putBoolean(KEY_EMERGENCY_SOUND, enabled).apply()
    }

    fun getDndAlertsEnabled(): Boolean {
        ensureInitialized()
        return prefs.getBoolean(KEY_DND_ALERTS, true)
    }

    fun setDndAlertsEnabled(enabled: Boolean) {
        ensureInitialized()
        prefs.edit().putBoolean(KEY_DND_ALERTS, enabled).apply()
    }

    fun getVibrationLevel(): VibrationLevel {
        ensureInitialized()
        val ordinal = prefs.getInt(KEY_VIBRATION_LEVEL, VibrationLevel.MEDIUM.ordinal)
        return VibrationLevel.entries.getOrNull(ordinal) ?: VibrationLevel.MEDIUM
    }

    fun setVibrationLevel(level: VibrationLevel) {
        ensureInitialized()
        prefs.edit().putInt(KEY_VIBRATION_LEVEL, level.ordinal).apply()
    }

    // ============ SHAKE SETTINGS ============

    fun getShakeToDelegate(): Boolean {
        ensureInitialized()
        return prefs.getBoolean(KEY_SHAKE_TO_DELEGATE, true)
    }

    fun setShakeToDelegate(enabled: Boolean) {
        ensureInitialized()
        prefs.edit().putBoolean(KEY_SHAKE_TO_DELEGATE, enabled).apply()
    }

    fun getShakeSensitivity(): ShakeSensitivity {
        ensureInitialized()
        val ordinal = prefs.getInt(KEY_SHAKE_SENSITIVITY, ShakeSensitivity.MEDIUM.ordinal)
        return ShakeSensitivity.entries.getOrNull(ordinal) ?: ShakeSensitivity.MEDIUM
    }

    fun setShakeSensitivity(sensitivity: ShakeSensitivity) {
        ensureInitialized()
        prefs.edit().putInt(KEY_SHAKE_SENSITIVITY, sensitivity.ordinal).apply()
    }

    fun getShakeConfirmationRequired(): Boolean {
        ensureInitialized()
        return prefs.getBoolean(KEY_SHAKE_CONFIRMATION, true)
    }

    fun setShakeConfirmationRequired(required: Boolean) {
        ensureInitialized()
        prefs.edit().putBoolean(KEY_SHAKE_CONFIRMATION, required).apply()
    }

    // ============ BATTERY SETTINGS ============

    fun getLowBatteryThreshold(): Int {
        ensureInitialized()
        return prefs.getInt(KEY_LOW_BATTERY_THRESHOLD, 20)
    }

    fun setLowBatteryThreshold(threshold: Int) {
        ensureInitialized()
        prefs.edit().putInt(KEY_LOW_BATTERY_THRESHOLD, threshold.coerceIn(5, 50)).apply()
    }

    // ============ UTILITY ============

    /**
     * Clear all profile data (for logout/reset)
     */
    fun clearProfile() {
        ensureInitialized()
        prefs.edit()
            .remove(KEY_CREW_MEMBER_ID)
            .remove(KEY_CREW_MEMBER_NAME)
            .remove(KEY_AUTH_TOKEN)
            .apply()
        Log.i(TAG, "Profile cleared")
    }

    /**
     * Reset all settings to defaults
     */
    fun resetAll() {
        ensureInitialized()
        prefs.edit().clear().apply()
        Log.i(TAG, "All preferences reset")
    }
}
