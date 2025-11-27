package com.example.obediowear2.utils

import android.content.Context
import android.content.SharedPreferences
import android.util.Log

/**
 * Server configuration manager for IP address settings.
 * Allows dynamic IP configuration through SharedPreferences.
 */
object ServerConfig {
    private const val TAG = "ServerConfig"
    private const val PREFS_NAME = "obedio2_server_config"
    private const val KEY_SERVER_IP = "server_ip"
    private const val KEY_MQTT_PORT = "mqtt_port"
    private const val KEY_API_PORT = "api_port"

    private const val DEFAULT_IP = "10.10.0.207"
    private const val DEFAULT_MQTT_PORT = 1883
    private const val DEFAULT_API_PORT = 8081

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
     * Get MQTT port
     */
    fun getMqttPort(): Int {
        return if (::prefs.isInitialized) {
            prefs.getInt(KEY_MQTT_PORT, DEFAULT_MQTT_PORT)
        } else {
            DEFAULT_MQTT_PORT
        }
    }

    /**
     * Set MQTT port
     */
    fun setMqttPort(port: Int) {
        if (::prefs.isInitialized) {
            prefs.edit().putInt(KEY_MQTT_PORT, port).apply()
            Log.i(TAG, "MQTT port updated to: $port")
        }
    }

    /**
     * Get API port
     */
    fun getApiPort(): Int {
        return if (::prefs.isInitialized) {
            prefs.getInt(KEY_API_PORT, DEFAULT_API_PORT)
        } else {
            DEFAULT_API_PORT
        }
    }

    /**
     * Set API port
     */
    fun setApiPort(port: Int) {
        if (::prefs.isInitialized) {
            prefs.edit().putInt(KEY_API_PORT, port).apply()
            Log.i(TAG, "API port updated to: $port")
        }
    }

    /**
     * Reset to default values
     */
    fun resetToDefault() {
        if (::prefs.isInitialized) {
            prefs.edit()
                .remove(KEY_SERVER_IP)
                .remove(KEY_MQTT_PORT)
                .remove(KEY_API_PORT)
                .apply()
            Log.i(TAG, "Server config reset to defaults")
        }
    }

    /**
     * Get base URL for HTTP API
     */
    fun getBaseUrl(): String = "http://${getServerIp()}:${getApiPort()}/"

    /**
     * Get MQTT broker URL
     */
    fun getMqttUrl(): String = "tcp://${getServerIp()}:${getMqttPort()}"

    /**
     * Get audio URL for voice messages
     */
    fun getAudioUrl(audioPath: String): String {
        return if (audioPath.startsWith("http")) {
            audioPath
        } else {
            "http://${getServerIp()}:${getApiPort()}$audioPath"
        }
    }
}
