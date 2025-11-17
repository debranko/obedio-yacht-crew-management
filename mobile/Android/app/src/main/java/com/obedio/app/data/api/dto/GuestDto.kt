package com.obedio.app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class GuestDto(
    @Json(name = "id") val id: String,
    @Json(name = "firstName") val firstName: String,
    @Json(name = "lastName") val lastName: String,
    @Json(name = "preferredName") val preferredName: String?,
    @Json(name = "photo") val photo: String?,
    @Json(name = "type") val type: String,
    @Json(name = "status") val status: String,
    @Json(name = "nationality") val nationality: String?,
    @Json(name = "languages") val languages: List<String>?,
    @Json(name = "passportNumber") val passportNumber: String?,
    @Json(name = "locationId") val locationId: String?,
    @Json(name = "checkInDate") val checkInDate: String?,
    @Json(name = "checkOutDate") val checkOutDate: String?,
    @Json(name = "allergies") val allergies: List<String>?,
    @Json(name = "dietaryRestrictions") val dietaryRestrictions: List<String>?,
    @Json(name = "medicalConditions") val medicalConditions: List<String>?,
    @Json(name = "preferences") val preferences: String?,
    @Json(name = "notes") val notes: String?,
    @Json(name = "emergencyContactName") val emergencyContactName: String?,
    @Json(name = "emergencyContactPhone") val emergencyContactPhone: String?,
    @Json(name = "emergencyContactRelation") val emergencyContactRelation: String?,
    @Json(name = "createdAt") val createdAt: String,
    @Json(name = "updatedAt") val updatedAt: String
)

@JsonClass(generateAdapter = true)
data class LocationDto(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "type") val type: String,
    @Json(name = "floor") val floor: String?,
    @Json(name = "description") val description: String?,
    @Json(name = "image") val image: String?,
    @Json(name = "smartButtonId") val smartButtonId: String?,
    @Json(name = "doNotDisturb") val doNotDisturb: Boolean
)