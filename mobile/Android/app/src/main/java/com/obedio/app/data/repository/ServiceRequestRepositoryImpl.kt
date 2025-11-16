package com.obedio.app.data.repository

import com.obedio.app.data.api.ObedioApi
import com.obedio.app.data.api.dto.AcceptRequestDto
import com.obedio.app.data.api.dto.ServiceRequestDto
import com.obedio.app.domain.model.*
import com.obedio.app.domain.repository.ServiceRequestRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ServiceRequestRepositoryImpl @Inject constructor(
    private val api: ObedioApi
) : ServiceRequestRepository {

    override fun getActiveRequests(): Flow<List<ServiceRequest>> = flow {
        try {
            val requests = api.getServiceRequests(
                status = null, // Get all statuses for now
                priority = null,
                page = 1,
                limit = 100
            )
            
            val activeRequests = requests
                .filter { it.status.lowercase() != "completed" && it.status.lowercase() != "cancelled" }
                .map { mapDtoToServiceRequest(it) }
                .sortedWith(
                    compareByDescending<ServiceRequest> { it.priority.ordinal }
                        .thenBy { it.createdAt }
                )
            
            emit(activeRequests)
        } catch (e: Exception) {
            emit(emptyList())
            throw e
        }
    }

    override suspend fun getServiceRequest(id: String): Result<ServiceRequest> = withContext(Dispatchers.IO) {
        try {
            val dto = api.getServiceRequest(id)
            Result.success(mapDtoToServiceRequest(dto))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun acceptRequest(id: String, crewId: String): Result<ServiceRequest> = withContext(Dispatchers.IO) {
        try {
            val dto = api.acceptServiceRequest(id, AcceptRequestDto(crewId))
            Result.success(mapDtoToServiceRequest(dto))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun completeRequest(id: String): Result<ServiceRequest> = withContext(Dispatchers.IO) {
        try {
            val dto = api.completeServiceRequest(id)
            Result.success(mapDtoToServiceRequest(dto))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createRequest(request: ServiceRequest): Result<ServiceRequest> = withContext(Dispatchers.IO) {
        try {
            // This would be used if creating from the app
            // For MVP, requests come from smart buttons via MQTT
            Result.failure(NotImplementedError("Creating requests from app not implemented"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun mapDtoToServiceRequest(dto: ServiceRequestDto): ServiceRequest {
        return ServiceRequest(
            id = dto.id,
            guestName = dto.guestName ?: dto.guest?.let { "${it.firstName} ${it.lastName}" } ?: "Guest",
            guestId = dto.guestId,
            location = dto.guestCabin ?: dto.location?.name ?: "Unknown",
            locationId = dto.locationId,
            message = dto.message,
            notes = dto.notes,
            priority = mapPriority(dto.priority),
            requestType = mapRequestType(dto.requestType),
            status = mapStatus(dto.status),
            createdAt = Instant.parse(dto.createdAt),
            acceptedAt = dto.acceptedAt?.let { Instant.parse(it) },
            completedAt = dto.completedAt?.let { Instant.parse(it) },
            assignedTo = dto.assignedTo,
            assignedToId = dto.assignedToId
        )
    }

    private fun mapPriority(priority: String): Priority {
        return when (priority.lowercase()) {
            "low" -> Priority.LOW
            "normal" -> Priority.NORMAL
            "urgent" -> Priority.URGENT
            "emergency" -> Priority.EMERGENCY
            else -> Priority.NORMAL
        }
    }

    private fun mapRequestType(type: String): RequestType {
        return when (type.lowercase()) {
            "call" -> RequestType.CALL
            "service" -> RequestType.SERVICE
            "emergency" -> RequestType.EMERGENCY
            "voice" -> RequestType.VOICE
            "dnd" -> RequestType.DND
            "lights" -> RequestType.LIGHTS
            "prepare_food" -> RequestType.PREPARE_FOOD
            "bring_drinks" -> RequestType.BRING_DRINKS
            else -> RequestType.CALL
        }
    }

    private fun mapStatus(status: String): ServiceStatus {
        return when (status.lowercase()) {
            "pending" -> ServiceStatus.PENDING
            "in_progress", "in-progress" -> ServiceStatus.IN_PROGRESS
            "serving" -> ServiceStatus.SERVING
            "completed" -> ServiceStatus.COMPLETED
            "cancelled" -> ServiceStatus.CANCELLED
            else -> ServiceStatus.PENDING
        }
    }
}