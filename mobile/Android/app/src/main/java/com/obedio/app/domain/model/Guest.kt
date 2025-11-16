package com.obedio.app.domain.model

import java.time.LocalDate

data class Guest(
    val id: String,
    val firstName: String,
    val lastName: String,
    val title: String? = null,
    val cabin: String? = null,
    val locationId: String? = null,
    val status: GuestStatus,
    val type: GuestType? = null,
    val allergies: List<String> = emptyList(),
    val dietaryRestrictions: List<String> = emptyList(),
    val preferences: GuestPreferences? = null,
    val notes: String? = null,
    val photoUrl: String? = null,
    val phoneNumber: String? = null,
    val email: String? = null,
    val arrivalDate: LocalDate? = null,
    val departureDate: LocalDate? = null
)

enum class GuestStatus {
    ONBOARD,
    DEPARTED
}

enum class GuestType {
    OWNER,
    VIP,
    CHARTER_GUEST,
    FRIENDS_FAMILY,
    VISITOR,
    CREW_GUEST
}

data class GuestPreferences(
    val pillowType: String? = null,
    val roomTemperature: Int? = null,
    val wakeUpTime: String? = null,
    val favoriteSnacks: List<String> = emptyList(),
    val favoriteDrinks: List<String> = emptyList(),
    val musicPreference: String? = null,
    val newspaperPreference: String? = null,
    val specialRequests: List<String> = emptyList()
)