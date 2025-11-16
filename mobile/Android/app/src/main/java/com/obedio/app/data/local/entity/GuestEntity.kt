package com.obedio.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant

@Entity(tableName = "guests")
data class GuestEntity(
    @PrimaryKey
    val id: String,
    val firstName: String,
    val lastName: String,
    val title: String?,
    val cabin: String?,
    val locationId: String?,
    val status: String, // ONBOARD, DEPARTED
    val type: String?, // VIP, OWNER, CHARTER_GUEST, etc.
    val allergies: String?, // JSON array as string
    val dietaryRestrictions: String?, // JSON array as string
    val preferences: String?, // JSON object as string
    val notes: String?,
    val photoUrl: String?,
    val phoneNumber: String?,
    val email: String?,
    val arrivalDate: String?,
    val departureDate: String?,
    val lastSyncedAt: Instant
)