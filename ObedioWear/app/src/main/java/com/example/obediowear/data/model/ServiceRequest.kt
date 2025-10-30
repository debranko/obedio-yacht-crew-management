package com.example.obediowear.data.model

import com.google.gson.annotations.SerializedName

data class ServiceRequest(
    @SerializedName("id")
    val id: String,

    @SerializedName("requestType")
    val requestType: RequestType,

    @SerializedName("priority")
    val priority: Priority,

    @SerializedName("status")
    val status: Status,

    @SerializedName("notes")
    val notes: String?,

    @SerializedName("voiceTranscript")
    val voiceTranscript: String?,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("guest")
    val guest: Guest?,

    @SerializedName("location")
    val location: Location?,

    @SerializedName("assignedCrew")
    val assignedCrew: CrewMember?
)

enum class Priority {
    @SerializedName("low")
    LOW,
    @SerializedName("normal")
    NORMAL,
    @SerializedName("urgent")
    URGENT,
    @SerializedName("emergency")
    EMERGENCY
}

enum class Status {
    @SerializedName("pending")
    PENDING,
    @SerializedName("accepted")
    ACCEPTED,
    @SerializedName("completed")
    COMPLETED,
    @SerializedName("cancelled")
    CANCELLED
}

enum class RequestType {
    @SerializedName("call")
    CALL,
    @SerializedName("service")
    SERVICE,
    @SerializedName("emergency")
    EMERGENCY
}
