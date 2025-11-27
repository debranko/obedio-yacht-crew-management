package com.example.obediowear2.data.api

import android.util.Log
import com.example.obediowear2.utils.PreferencesManager
import com.example.obediowear2.utils.ServerConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * API Client for ObedioWear2.
 * Uses dynamic ServerConfig for base URL.
 * Auth token is obtained dynamically from PreferencesManager (set during device discovery).
 */
object ApiClient {

    private const val TAG = "ApiClient"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    /**
     * Auth interceptor that dynamically reads token from PreferencesManager.
     * This allows the token to be set after device discovery.
     */
    private val authInterceptor = okhttp3.Interceptor { chain ->
        val original = chain.request()
        val requestBuilder = original.newBuilder()

        // Get token from PreferencesManager (set during device discovery)
        val token = try {
            PreferencesManager.getAuthToken()
        } catch (e: IllegalStateException) {
            // PreferencesManager not initialized yet
            Log.w(TAG, "PreferencesManager not initialized, skipping auth header")
            null
        }

        if (token != null) {
            requestBuilder.header("Authorization", "Bearer $token")
        } else {
            Log.w(TAG, "No auth token available - API calls may fail")
        }

        requestBuilder.method(original.method, original.body)
        chain.proceed(requestBuilder.build())
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    val instance: ApiService by lazy {
        val retrofit = Retrofit.Builder()
            .baseUrl(ServerConfig.getBaseUrl())
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        retrofit.create(ApiService::class.java)
    }

    /**
     * Create a new instance with updated base URL.
     * Use this after changing ServerConfig.
     */
    fun createInstance(baseUrl: String): ApiService {
        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        return retrofit.create(ApiService::class.java)
    }
}
