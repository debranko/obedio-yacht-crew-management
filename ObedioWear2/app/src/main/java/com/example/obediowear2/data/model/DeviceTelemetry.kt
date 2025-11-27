package com.example.obediowear2.data.model

import com.google.gson.annotations.SerializedName

/**
 * Device telemetry data sent to backend.
 */
data class DeviceTelemetry(
    @SerializedName("deviceId")
    val deviceId: String,

    @SerializedName("batteryLevel")
    val batteryLevel: Int,           // 0-100

    @SerializedName("isCharging")
    val isCharging: Boolean,

    @SerializedName("signalStrength")
    val signalStrength: Int,         // dBm (-30 to -90)

    @SerializedName("status")
    val status: String,              // "online" | "offline"

    @SerializedName("lastSeen")
    val lastSeen: String,            // ISO timestamp

    @SerializedName("crewMemberId")
    val crewMemberId: String? = null
)

/**
 * Service update received via MQTT when request status changes.
 */
data class ServiceUpdate(
    @SerializedName("requestId")
    val requestId: String = "",      // Empty for clear-all action

    @SerializedName("status")
    val status: String,              // "serving" | "completed" | "deleted"

    @SerializedName("assignedTo")
    val assignedTo: String? = null,  // Crew member name

    @SerializedName("assignedToId")
    val assignedToId: String? = null, // Crew member ID

    @SerializedName("acknowledgedAt")
    val acknowledgedAt: String? = null,

    @SerializedName("action")
    val action: String? = null       // "clear-all" for bulk deletion
)

/**
 * DND status update received via MQTT.
 */
data class DndUpdate(
    @SerializedName("locationId")
    val locationId: String,

    @SerializedName("locationName")
    val locationName: String,

    @SerializedName("doNotDisturb")
    val doNotDisturb: Boolean,

    @SerializedName("activatedAt")
    val activatedAt: String?
)
