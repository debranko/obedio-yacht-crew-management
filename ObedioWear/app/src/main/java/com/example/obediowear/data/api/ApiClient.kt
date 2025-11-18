package com.example.obediowear.data.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {

    private const val BASE_URL = "http://192.168.5.152:8080/"

    // JWT Token for Sophie Laurent (Chief Stewardess) - expires 2035
    private const val AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWhyanc5aWIwMDAwMTRtaHdrNGdxdzB0IiwidXNlcklkIjoiY21ocmp3OWliMDAwMDE0bWh3azRncXcwdCIsInJvbGUiOiJjaGllZl9zdGV3YXJkZXNzIiwidXNlcm5hbWUiOiJzb3BoaWUubGF1cmVudCIsInR5cGUiOiJ3YXRjaC1hdXRoIiwiaWF0IjoxNzYyNjgyOTE0LCJleHAiOjIwNzgwNDI5MTR9.XjDtSwwlxT5tyLBDSWDUVO6sKS9taMlmce2LbDDFGNU"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    // Auth interceptor to add JWT token to all requests
    private val authInterceptor = okhttp3.Interceptor { chain ->
        val original = chain.request()
        val requestBuilder = original.newBuilder()
            .header("Authorization", "Bearer $AUTH_TOKEN")
            .method(original.method, original.body)
        chain.proceed(requestBuilder.build())
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .build()

    val instance: ApiService by lazy {
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        retrofit.create(ApiService::class.java)
    }
}
