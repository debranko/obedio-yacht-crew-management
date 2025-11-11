package com.example.obediowear.data.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {

    private const val BASE_URL = "http://192.168.5.150:8080/"

    // JWT Token for Sophie Laurent (Chief Stewardess) - expires 7 days from issue
    private const val AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWhyanc5aWIwMDAwMTRtaHdrNGdxdzB0IiwidXNlcklkIjoiY21ocmp3OWliMDAwMDE0bWh3azRncXcwdCIsInVzZXJuYW1lIjoic29waGllLmxhdXJlbnQiLCJyb2xlIjoiY2hpZWZfc3Rld2FyZGVzcyIsImlhdCI6MTc2Mjg2NjYxNSwiZXhwIjoxNzYzNDcxNDE1fQ.VsgA6N2ee4Q2Qo85dfFJC99P_JV0OBnObYs9eQ5MwvM"

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
