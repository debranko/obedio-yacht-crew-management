package com.obedio.app.domain.repository

import com.obedio.app.domain.model.ServiceRequest
import kotlinx.coroutines.flow.Flow

interface ServiceRequestRepository {
    fun getActiveRequests(): Flow<List<ServiceRequest>>
    suspend fun getServiceRequest(id: String): Result<ServiceRequest>
    suspend fun acceptRequest(id: String, crewId: String): Result<ServiceRequest>
    suspend fun completeRequest(id: String): Result<ServiceRequest>
    suspend fun createRequest(request: ServiceRequest): Result<ServiceRequest>
}