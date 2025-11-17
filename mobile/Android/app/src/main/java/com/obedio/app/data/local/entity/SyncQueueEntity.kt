package com.obedio.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val action: SyncAction,
    val entityType: String, // SERVICE_REQUEST, GUEST, etc.
    val entityId: String,
    val data: String, // JSON payload
    val createdAt: Instant,
    val attemptCount: Int = 0,
    val lastAttemptAt: Instant? = null,
    val errorMessage: String? = null
)

enum class SyncAction {
    CREATE,
    UPDATE,
    DELETE,
    ACCEPT_REQUEST,
    COMPLETE_REQUEST,
    CANCEL_REQUEST
}