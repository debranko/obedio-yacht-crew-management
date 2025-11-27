package com.example.obediowear2.data.api

import com.example.obediowear2.data.model.Assignment
import com.example.obediowear2.data.model.CrewMember
import com.example.obediowear2.data.model.Location
import com.example.obediowear2.data.model.ServiceRequest
import com.google.gson.JsonElement
import com.google.gson.annotations.SerializedName
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Generic wrapper for all API responses.
 */
data class ApiResponse<T>(
    val success: Boolean,
    val data: T,
    val pagination: JsonElement? = null
)

/**
 * Accept request body.
 */
data class AcceptRequestBody(
    @SerializedName("crewMemberId")
    val crewMemberId: String,
    @SerializedName("confirmed")
    val confirmed: Boolean = false
)

/**
 * Delegate request body.
 */
data class DelegateRequestBody(
    @SerializedName("toCrewMemberId")
    val toCrewMemberId: String,
    @SerializedName("fromCrewMemberId")
    val fromCrewMemberId: String,
    @SerializedName("reason")
    val reason: String? = null
)

/**
 * Device heartbeat body.
 */
data class DeviceHeartbeatBody(
    @SerializedName("macAddress")
    val macAddress: String,
    @SerializedName("batteryLevel")
    val batteryLevel: Int,
    @SerializedName("isCharging")
    val isCharging: Boolean = false,
    @SerializedName("signalStrength")
    val signalStrength: Int,
    @SerializedName("status")
    val status: String = "online",
    @SerializedName("lastSeen")
    val lastSeen: String,
    @SerializedName("crewMemberId")
    val crewMemberId: String? = null
)

/**
 * Retrofit interface for the OBEDIO backend API.
 */
interface ApiService {

    // ============ SERVICE REQUESTS ============

    /**
     * Get pending service requests.
     */
    @GET("api/service-requests")
    suspend fun getServiceRequests(
        @Query("status") status: String = "pending",
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 25
    ): ApiResponse<List<ServiceRequest>>

    /**
     * Accept a service request.
     */
    @PUT("api/service-requests/{id}/accept")
    suspend fun acceptServiceRequest(
        @Path("id") requestId: String,
        @Body body: AcceptRequestBody
    ): ApiResponse<ServiceRequest>

    /**
     * Complete a service request.
     */
    @PUT("api/service-requests/{id}/complete")
    suspend fun completeServiceRequest(
        @Path("id") requestId: String
    ): ApiResponse<ServiceRequest>

    /**
     * Delegate a service request to another crew member.
     */
    @PUT("api/service-requests/{id}/delegate")
    suspend fun delegateServiceRequest(
        @Path("id") requestId: String,
        @Body body: DelegateRequestBody
    ): ApiResponse<ServiceRequest>

    /**
     * Cancel/dismiss a service request.
     */
    @PUT("api/service-requests/{id}/cancel")
    suspend fun cancelServiceRequest(
        @Path("id") requestId: String
    ): ApiResponse<ServiceRequest>

    // ============ CREW ============

    /**
     * Get crew members.
     */
    @GET("api/crew/members")
    suspend fun getCrewMembers(
        @Query("status") status: String? = null,
        @Query("department") department: String? = null
    ): ApiResponse<List<CrewMember>>

    /**
     * Get a specific crew member by ID.
     */
    @GET("api/crew/members/{id}")
    suspend fun getCrewMember(
        @Path("id") crewMemberId: String
    ): ApiResponse<CrewMember>

    // ============ ASSIGNMENTS (SHIFTS) ============

    /**
     * Get current assignment for a crew member.
     */
    @GET("api/assignments/crew/{crewMemberId}")
    suspend fun getCrewAssignment(
        @Path("crewMemberId") crewMemberId: String
    ): ApiResponse<Assignment?>

    /**
     * Get today's assignments.
     */
    @GET("api/assignments")
    suspend fun getAssignments(
        @Query("date") date: String? = null,
        @Query("crewMemberId") crewMemberId: String? = null
    ): ApiResponse<List<Assignment>>

    // ============ LOCATIONS (DND) ============

    /**
     * Get locations with DND status.
     */
    @GET("api/locations")
    suspend fun getLocations(
        @Query("doNotDisturb") doNotDisturb: Boolean? = null
    ): ApiResponse<List<Location>>

    // ============ DEVICES ============

    /**
     * Get device by MAC address.
     */
    @GET("api/devices/discover")
    suspend fun getDeviceByMacAddress(
        @Query("macAddress") macAddress: String
    ): ApiResponse<JsonElement>

    /**
     * Send device heartbeat/telemetry.
     */
    @PUT("api/devices/heartbeat")
    suspend fun sendDeviceHeartbeat(
        @Body body: DeviceHeartbeatBody
    ): ApiResponse<JsonElement>
}
