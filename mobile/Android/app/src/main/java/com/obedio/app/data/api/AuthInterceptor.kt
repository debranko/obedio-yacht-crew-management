package com.obedio.app.data.api

import com.obedio.app.data.local.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthInterceptor @Inject constructor() : Interceptor {
    
    @Inject
    lateinit var tokenManager: TokenManager
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Skip auth for login endpoint
        if (originalRequest.url.encodedPath.contains("auth/login")) {
            return chain.proceed(originalRequest)
        }
        
        // Get token from secure storage
        val token = runBlocking { tokenManager.getAccessToken() }
        
        val request = if (!token.isNullOrBlank()) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }
        
        val response = chain.proceed(request)
        
        // Handle 401 Unauthorized
        if (response.code == 401) {
            // Token might be expired, try to refresh
            val newToken = runBlocking { tokenManager.refreshToken() }
            
            if (newToken != null) {
                // Retry with new token
                response.close()
                val newRequest = originalRequest.newBuilder()
                    .header("Authorization", "Bearer $newToken")
                    .build()
                return chain.proceed(newRequest)
            } else {
                // Refresh failed, clear session and redirect to login
                runBlocking { tokenManager.clearTokens() }
            }
        }
        
        return response
    }
}