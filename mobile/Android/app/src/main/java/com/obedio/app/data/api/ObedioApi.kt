package com.obedio.app.data.api

import com.obedio.app.data.api.dto.*
import retrofit2.http.*

interface ObedioApi {
    
    // Authentication
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequestDto): AuthResponseDto
    
    @GET("auth/verify")
    suspend fun verifyToken(): VerifyResponseDto
    
    @POST("auth/logout")
    suspend fun logout()
    
    // Service Requests
    @GET("service-requests")
    suspend fun getServiceRequests(
        @Query("status") status: String? = null,
        @Query("priority") priority: String? = null,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null
    ): List<ServiceRequestDto>
    
    @GET("service-requests/{id}")
    suspend fun getServiceRequest(@Path("id") id: String): ServiceRequestDto
    
    @POST("service-requests")
    suspend fun createServiceRequest(@Body request: ServiceRequestDto): ServiceRequestDto
    
    @PUT("service-requests/{id}")
    suspend fun updateServiceRequest(
        @Path("id") id: String,
        @Body request: ServiceRequestDto
    ): ServiceRequestDto
    
    @PUT("service-requests/{id}/accept")
    suspend fun acceptServiceRequest(
        @Path("id") id: String,
        @Body request: AcceptRequestDto
    ): ServiceRequestDto
    
    @PUT("service-requests/{id}/complete")
    suspend fun completeServiceRequest(@Path("id") id: String): ServiceRequestDto
    
    @POST("service-requests/{id}/cancel")
    suspend fun cancelServiceRequest(@Path("id") id: String): ServiceRequestDto
    
    // Guests
    @GET("guests")
    suspend fun getGuests(
        @Query("status") status: String? = null,
        @Query("type") type: String? = null,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null
    ): List<GuestDto>
    
    @GET("guests/{id}")
    suspend fun getGuest(@Path("id") id: String): GuestDto
    
    // Locations
    @GET("locations")
    suspend fun getLocations(): List<LocationDto>
    
    @GET("locations/{id}")
    suspend fun getLocation(@Path("id") id: String): LocationDto
}