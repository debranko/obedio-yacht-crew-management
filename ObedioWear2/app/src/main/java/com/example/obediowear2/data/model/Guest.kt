package com.example.obediowear2.data.model

import com.google.gson.annotations.SerializedName

data class Guest(
    @SerializedName("id")
    val id: String = "",

    @SerializedName("firstName")
    val firstName: String = "",

    @SerializedName("lastName")
    val lastName: String = "",

    @SerializedName("preferredName")
    val preferredName: String? = null,

    @SerializedName("photo")
    val photo: String? = null,

    @SerializedName("allergies")
    val allergies: String? = null,

    @SerializedName("medicalConditions")
    val medicalConditions: String? = null,

    @SerializedName("emergencyContact")
    val emergencyContact: EmergencyContact? = null
) {
    val displayName: String
        get() = preferredName ?: if (firstName.isNotEmpty() || lastName.isNotEmpty()) "$firstName $lastName".trim() else "Guest"

    val fullName: String
        get() = "$firstName $lastName".trim()
}

data class EmergencyContact(
    @SerializedName("name")
    val name: String,

    @SerializedName("phone")
    val phone: String,

    @SerializedName("relationship")
    val relationship: String?
)
