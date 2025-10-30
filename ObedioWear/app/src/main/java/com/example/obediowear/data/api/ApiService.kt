package com.example.obediowear.data.api

import com.example.obediowear.data.model.CrewMember
import com.example.obediowear.data.model.ServiceRequest
import com.google.gson.JsonElement
import com.google.gson.annotations.SerializedName
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
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
    val crewMemberId: String
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
    @POST("api/service-requests/{id}/accept")
    suspend fun acceptServiceRequest(
        @Path("id") requestId: String,
        @Body body: AcceptRequestBody
    ): ApiResponse<ServiceRequest>

    /**
     * Fetches a list of crew members, typically filtered by duty status and department.
     */
    @GET("api/crew/members")
    suspend fun getCrewMembers(
        @Query("status") status: String = "on_duty",
        @Query("department") department: String = "Interior"
    ): ApiResponse<List<CrewMember>>
}
