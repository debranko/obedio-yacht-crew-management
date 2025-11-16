package com.obedio.app.domain.model

data class Location(
    val id: String,
    val name: String,
    val type: LocationType,
    val deck: String? = null,
    val description: String? = null,
    val imageUrl: String? = null,
    val isDndEnabled: Boolean = false,
    val sortOrder: Int = 0
)

enum class LocationType {
    CABIN,
    DECK,
    PUBLIC_AREA,
    CREW_AREA,
    SERVICE_AREA,
    BRIDGE,
    ENGINE_ROOM,
    GALLEY,
    LAUNDRY,
    STORAGE,
    OTHER
}