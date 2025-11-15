package com.example.obediowear.utils

import android.content.Context
import android.content.SharedPreferences
import android.util.Log

/**
 * Server configuration manager for IP address settings.
 * Allows dynamic IP configuration through SharedPreferences.
 */
object ServerConfig {
    private const val TAG = "ServerConfig"
    private const val PREFS_NAME = "obedio_server_config"
    private const val KEY_SERVER_IP = "server_ip"
    private const val DEFAULT_IP = "10.10.0.207"

    private lateinit var prefs: SharedPreferences

    /**
     * Initialize the config with context
     */
    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    /**
     * Get current server IP address
     */
    fun getServerIp(): String {
        return if (::prefs.isInitialized) {
            prefs.getString(KEY_SERVER_IP, DEFAULT_IP) ?: DEFAULT_IP
        } else {
            DEFAULT_IP
        }
    }

    /**
     * Set new server IP address
     */
    fun setServerIp(ip: String) {
        if (::prefs.isInitialized) {
            prefs.edit().putString(KEY_SERVER_IP, ip).apply()
            Log.i(TAG, "Server IP updated to: $ip")
        }
    }

    /**
     * Reset to default IP
     */
    fun resetToDefault() {
        if (::prefs.isInitialized) {
            prefs.edit().remove(KEY_SERVER_IP).apply()
            Log.i(TAG, "Server IP reset to default: $DEFAULT_IP")
        }
    }

    /**
     * Get base URL for HTTP API
     */
    fun getBaseUrl(): String = "http://${getServerIp()}:8080/"

    /**
     * Get MQTT broker URL
     */
    fun getMqttUrl(): String = "tcp://${getServerIp()}:1883"

    /**
     * Get WebSocket server URL
     */
    fun getWebSocketUrl(): String = "http://${getServerIp()}:8080"
}
