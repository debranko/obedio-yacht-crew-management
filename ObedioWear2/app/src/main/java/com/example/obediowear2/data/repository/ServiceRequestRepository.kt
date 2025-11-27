package com.example.obediowear2.data.repository

import android.util.Log
import com.example.obediowear2.data.api.AcceptRequestBody
import com.example.obediowear2.data.api.ApiClient
import com.example.obediowear2.data.api.DelegateRequestBody
import com.example.obediowear2.data.model.ServiceRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for service request operations.
 */
class ServiceRequestRepository {

    private val api = ApiClient.instance

    companion object {
        private const val TAG = "ServiceRequestRepo"
    }

    /**
     * Get pending service requests.
     */
    suspend fun getPendingRequests(): Result<List<ServiceRequest>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getServiceRequests(status = "pending")
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch requests"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching requests: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Accept a service request.
     */
    suspend fun acceptRequest(
        requestId: String,
        crewMemberId: String
    ): Result<ServiceRequest> = withContext(Dispatchers.IO) {
        try {
            val body = AcceptRequestBody(crewMemberId = crewMemberId, confirmed = true)
            val response = api.acceptServiceRequest(requestId, body)
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to accept request"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error accepting request: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Complete a service request.
     */
    suspend fun completeRequest(requestId: String): Result<ServiceRequest> = withContext(Dispatchers.IO) {
        try {
            val response = api.completeServiceRequest(requestId)
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to complete request"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error completing request: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Delegate a service request to another crew member.
     */
    suspend fun delegateRequest(
        requestId: String,
        fromCrewMemberId: String,
        toCrewMemberId: String,
        reason: String? = null
    ): Result<ServiceRequest> = withContext(Dispatchers.IO) {
        try {
            val body = DelegateRequestBody(
                toCrewMemberId = toCrewMemberId,
                fromCrewMemberId = fromCrewMemberId,
                reason = reason
            )
            val response = api.delegateServiceRequest(requestId, body)
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to delegate request"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error delegating request: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Cancel/dismiss a service request.
     */
    suspend fun cancelRequest(requestId: String): Result<ServiceRequest> = withContext(Dispatchers.IO) {
        try {
            val response = api.cancelServiceRequest(requestId)
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to cancel request"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error canceling request: ${e.message}", e)
            Result.failure(e)
        }
    }
}
