package com.obedio.app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ServiceRequestDto(
    @Json(name = "id") val id: String,
    @Json(name = "guestId") val guestId: String?,
    @Json(name = "guestName") val guestName: String?,
    @Json(name = "locationId") val locationId: String?,
    @Json(name = "guestCabin") val guestCabin: String?,
    @Json(name = "requestType") val requestType: String,
    @Json(name = "status") val status: String,
    @Json(name = "priority") val priority: String,
    @Json(name = "message") val message: String?,
    @Json(name = "notes") val notes: String?,
    @Json(name = "voiceTranscript") val voiceTranscript: String?,
    @Json(name = "voiceAudioUrl") val voiceAudioUrl: String?,
    @Json(name = "assignedToId") val assignedToId: String?,
    @Json(name = "assignedTo") val assignedTo: String?,
    @Json(name = "categoryId") val categoryId: String?,
    @Json(name = "acceptedAt") val acceptedAt: String?,
    @Json(name = "createdAt") val createdAt: String,
    @Json(name = "updatedAt") val updatedAt: String,
    @Json(name = "completedAt") val completedAt: String?,
    @Json(name = "guest") val guest: GuestDto?,
    @Json(name = "location") val location: LocationDto?
)

@JsonClass(generateAdapter = true)
data class AcceptRequestDto(
    @Json(name = "crewMemberId") val crewMemberId: String
)