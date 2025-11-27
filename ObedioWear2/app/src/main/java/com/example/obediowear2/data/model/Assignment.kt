package com.example.obediowear2.data.model

import com.google.gson.annotations.SerializedName

/**
 * Represents a shift assignment for a crew member.
 */
data class Assignment(
    @SerializedName("id")
    val id: String,

    @SerializedName("crewMemberId")
    val crewMemberId: String,

    @SerializedName("shift")
    val shift: Shift,

    @SerializedName("date")
    val date: String,  // ISO date format

    @SerializedName("status")
    val status: AssignmentStatus = AssignmentStatus.SCHEDULED
)

data class Shift(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("startTime")
    val startTime: String,  // HH:mm format

    @SerializedName("endTime")
    val endTime: String     // HH:mm format
) {
    /**
     * Calculate remaining time until shift ends.
     * Returns pair of (hours, minutes) remaining.
     */
    fun getRemainingTime(currentTimeMinutes: Int): Pair<Int, Int> {
        val endParts = endTime.split(":")
        val endMinutes = endParts[0].toInt() * 60 + endParts[1].toInt()

        val remaining = endMinutes - currentTimeMinutes
        if (remaining <= 0) return Pair(0, 0)

        return Pair(remaining / 60, remaining % 60)
    }
}

enum class AssignmentStatus {
    @SerializedName("scheduled")
    SCHEDULED,
    @SerializedName("active")
    ACTIVE,
    @SerializedName("completed")
    COMPLETED,
    @SerializedName("cancelled")
    CANCELLED
}
