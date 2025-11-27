package com.example.obediowear.data.api

import com.example.obediowear.data.model.CrewMember
import com.example.obediowear.data.model.ServiceRequest
import com.google.gson.JsonElement
import com.google.gson.annotations.SerializedName
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Generic wrapper for all API responses from the backend.
 */
data class ApiResponse<T>(
    val success: Boolean,
    val data: T,
    val pagination: JsonElement? = null
)

/**
 * Data class for the POST body when accepting a request.
 */
data class AcceptRequestBody(
    @SerializedName("crewMemberId")
    val crewMemberId: String,
    @SerializedName("confirmed")
    val confirmed: Boolean = false
)

/**
 * Data class for updating yacht GPS location.
 */
data class UpdateYachtLocationBody(
    @SerializedName("latitude")
    val latitude: Double,
    @SerializedName("longitude")
    val longitude: Double,
    @SerializedName("accuracy")
    val accuracy: Float? = null,
    @SerializedName("locationUpdatedAt")
    val locationUpdatedAt: String
)

/**
 * Data class for device heartbeat/telemetry updates.
 */
data class DeviceHeartbeatBody(
    @SerializedName("macAddress")
    val macAddress: String,
    @SerializedName("batteryLevel")
    val batteryLevel: Int,
    @SerializedName("signalStrength")
    val signalStrength: Int,
    @SerializedName("status")
    val status: String = "online",
    @SerializedName("lastSeen")
    val lastSeen: String
)

/**
 * Retrofit interface for the OBEDIO backend API.
 */
interface ApiService {

    /**
     * Fetches a list of service requests, typically filtered by status.
     */
    @GET("api/service-requests")
    suspend fun getServiceRequests(
        @Query("status") status: String = "pending",
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 25
    ): ApiResponse<List<ServiceRequest>>

    /**
     * Accepts a service request on behalf of a crew member.
     */
    @PUT("api/service-requests/{id}/accept")
    suspend fun acceptServiceRequest(
        @Path("id") requestId: String,
        @Body body: AcceptRequestBody
    ): ApiResponse<ServiceRequest>

    /**
     * Fetches a list of crew members, typically filtered by duty status and department.
     */
    @GET("api/crew/members")
    suspend fun getCrewMembers(
        @Query("status") status: String = "on-duty",
        @Query("department") department: String = "Interior"
    ): ApiResponse<List<CrewMember>>

    /**
     * Fetches ALL crew members without filters.
     * Uses existing backend endpoint GET /api/crew
     */
    @GET("api/crew")
    suspend fun getAllCrewMembers(): ApiResponse<List<CrewMember>>

    /**
     * Updates yacht GPS location from watch.
     */
    @PUT("api/yacht-settings")
    suspend fun updateYachtLocation(
        @Body body: UpdateYachtLocationBody
    ): ApiResponse<JsonElement>

    /**
     * Gets current user's assigned device (watch).
     * Used to discover device ID on app launch.
     * @deprecated Use getDeviceByMacAddress instead (no auth required)
     */
    @GET("api/devices/me")
    suspend fun getMyDevice(): ApiResponse<JsonElement>

    /**
     * Get device by MAC address (Android ID).
     * No authentication required - uses MAC address as identifier.
     * Uses public /discover endpoint that doesn't require auth.
     */
    @GET("api/devices/discover")
    suspend fun getDeviceByMacAddress(
        @Query("macAddress") macAddress: String
    ): ApiResponse<JsonElement>

    /**
     * Sends device heartbeat with telemetry (battery, signal strength, status).
     * No authentication required - uses MAC address as identifier.
     * Uses public /heartbeat endpoint that doesn't require auth.
     */
    @PUT("api/devices/heartbeat")
    suspend fun sendDeviceHeartbeat(
        @Body body: DeviceHeartbeatBody
    ): ApiResponse<JsonElement>

    /**
     * Completes a service request (Finish button).
     */
    @PUT("api/service-requests/{id}/complete")
    suspend fun completeServiceRequest(
        @Path("id") requestId: String
    ): ApiResponse<ServiceRequest>
}
