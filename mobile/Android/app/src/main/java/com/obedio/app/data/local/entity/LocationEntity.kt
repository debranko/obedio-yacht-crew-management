package com.obedio.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "locations")
data class LocationEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val type: String, // CABIN, DECK, PUBLIC_AREA, etc.
    val deck: String?,
    val description: String?,
    val imageUrl: String?,
    val isDndEnabled: Boolean = false,
    val sortOrder: Int = 0,
    val lastSyncedAt: Instant
)