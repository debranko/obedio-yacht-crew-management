package com.obedio.app.domain.model

import java.time.Instant

data class ServiceRequest(
    val id: String,
    val guestName: String,
    val guestId: String?,
    val location: String,
    val locationId: String?,
    val message: String?,
    val notes: String?,
    val priority: Priority,
    val requestType: RequestType,
    val status: ServiceStatus,
    val createdAt: Instant,
    val acceptedAt: Instant?,
    val completedAt: Instant?,
    val assignedTo: String?,
    val assignedToId: String?
)

enum class Priority {
    LOW,
    NORMAL,
    URGENT,
    EMERGENCY
}

enum class RequestType {
    CALL,
    SERVICE,
    EMERGENCY,
    VOICE,
    DND,
    LIGHTS,
    PREPARE_FOOD,
    BRING_DRINKS
}

enum class ServiceStatus {
    PENDING,
    IN_PROGRESS,
    SERVING,
    COMPLETED,
    CANCELLED
}