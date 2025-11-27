package com.example.obediowear2.data.model

import com.google.gson.annotations.SerializedName

data class ServiceRequest(
    @SerializedName("id")
    val id: String = "",

    @SerializedName("requestType")
    val requestType: RequestType = RequestType.SERVICE,

    @SerializedName("priority")
    val priority: Priority = Priority.NORMAL,

    @SerializedName("status")
    val status: Status = Status.PENDING,

    @SerializedName("notes")
    val notes: String? = null,

    @SerializedName("voiceTranscript")
    val voiceTranscript: String? = null,

    @SerializedName("voiceAudioUrl")
    val audioUrl: String? = null,

    @SerializedName("createdAt")
    val createdAt: String = "",

    @SerializedName("acknowledgedAt")
    val acknowledgedAt: String? = null,

    @SerializedName("completedAt")
    val completedAt: String? = null,

    @SerializedName("guest")
    val guest: Guest? = null,

    @SerializedName("location")
    val location: Location? = null,

    @SerializedName("crewmember")
    val assignedCrew: CrewMember? = null
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
    @SerializedName("serving")
    SERVING,
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
    EMERGENCY,
    @SerializedName("voice")
    VOICE,
    @SerializedName("dnd")
    DND,
    @SerializedName("lights")
    LIGHTS,
    @SerializedName("prepare_food")
    PREPARE_FOOD,
    @SerializedName("bring_drinks")
    BRING_DRINKS;

    fun getIcon(): String = when (this) {
        CALL -> "phone"
        VOICE -> "mic"
        LIGHTS -> "lightbulb"
        PREPARE_FOOD -> "restaurant"
        BRING_DRINKS -> "local_bar"
        EMERGENCY -> "warning"
        DND -> "do_not_disturb"
        SERVICE -> "room_service"
    }

    fun getDisplayName(): String = when (this) {
        CALL -> "Service Call"
        VOICE -> "Voice Request"
        LIGHTS -> "Lights"
        PREPARE_FOOD -> "Prepare Food"
        BRING_DRINKS -> "Bring Drinks"
        EMERGENCY -> "Emergency"
        DND -> "Do Not Disturb"
        SERVICE -> "Service"
    }
}
