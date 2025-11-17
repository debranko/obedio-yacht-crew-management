package com.obedio.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "service_requests")
data class ServiceRequestEntity(
    @PrimaryKey
    val id: String,
    val guestName: String,
    val guestId: String?,
    val location: String,
    val locationId: String?,
    val message: String?,
    val notes: String?,
    val priority: String,
    val requestType: String,
    val status: String,
    val createdAt: Instant,
    val acceptedAt: Instant?,
    val completedAt: Instant?,
    val assignedTo: String?,
    val assignedToId: String?,
    val lastSyncedAt: Instant,
    val syncStatus: SyncStatus = SyncStatus.SYNCED
)

enum class SyncStatus {
    SYNCED,
    PENDING_SYNC,
    SYNC_ERROR
}