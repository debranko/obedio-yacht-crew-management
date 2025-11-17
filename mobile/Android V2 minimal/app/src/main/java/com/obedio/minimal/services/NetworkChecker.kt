package com.obedio.minimal.services

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.obedio.minimal.data.AppConfig
import com.obedio.minimal.data.ConnectionState
import com.obedio.minimal.data.ServiceStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * Checks network connectivity and API health
 */
class NetworkChecker(private val context: Context) {

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(AppConfig.CONNECTION_TIMEOUT_MS, TimeUnit.MILLISECONDS)
        .readTimeout(AppConfig.CONNECTION_TIMEOUT_MS, TimeUnit.MILLISECONDS)
        .build()

    /**
     * Check if device has internet connection
     */
    fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false

        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    /**
     * Check API health endpoint
     */
    suspend fun checkApiHealth(): ServiceStatus = withContext(Dispatchers.IO) {
        try {
            if (!isNetworkAvailable()) {
                return@withContext ServiceStatus(
                    state = ConnectionState.DISCONNECTED,
                    message = "No internet connection",
                    errorDetails = "Device is offline"
                )
            }

            val request = Request.Builder()
                .url("${AppConfig.API_BASE_URL}${AppConfig.HEALTH_CHECK_PATH}")
                .get()
                .build()

            val response = httpClient.newCall(request).execute()

            if (response.isSuccessful) {
                ServiceStatus(
                    state = ConnectionState.CONNECTED,
                    message = "API is reachable",
                    lastConnected = System.currentTimeMillis()
                )
            } else {
                ServiceStatus(
                    state = ConnectionState.ERROR,
                    message = "API returned error",
                    errorDetails = "HTTP ${response.code}"
                )
            }
        } catch (e: Exception) {
            ServiceStatus(
                state = ConnectionState.ERROR,
                message = "Cannot reach API",
                errorDetails = e.message ?: "Unknown error"
            )
        }
    }
}
