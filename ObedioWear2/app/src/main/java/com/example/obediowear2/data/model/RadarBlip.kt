package com.example.obediowear2.data.model

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

/**
 * Represents a blip on the radar display.
 * Each blip corresponds to a pending service request.
 */
@Immutable
data class RadarBlip(
    val id: String,
    val angle: Float,              // Position on radar (0-360 degrees)
    val distance: Float,           // Distance from center (0.0-1.0)
    val priority: Priority,
    val requestType: RequestType,
    val locationName: String,
    val guestName: String?,
    val hasVoiceMessage: Boolean,
    val voiceTranscript: String?,
    val audioUrl: String?,
    val createdAt: Long,           // Timestamp in millis
    val isNew: Boolean = false,    // For pulse animation on new blips
    val locationImage: String? = null
) {
    companion object {
        // Color palette
        private val EMERGENCY_COLOR = Color(0xFFFF1744)  // Bright red
        private val URGENT_COLOR = Color(0xFFF59E0B)     // Amber
        private val NORMAL_COLOR = Color(0xFFD4AF37)     // Champagne gold

        /**
         * Create a RadarBlip from a ServiceRequest
         */
        fun fromServiceRequest(request: ServiceRequest, index: Int): RadarBlip {
            // Calculate angle based on index (spread evenly)
            val baseAngle = (index * 72f) % 360f // 5 positions max
            val jitter = (request.id.hashCode() % 30) - 15 // Add some randomness

            // Calculate distance based on priority (emergency closest)
            val distance = when (request.priority) {
                Priority.EMERGENCY -> 0.3f
                Priority.URGENT -> 0.5f
                else -> 0.7f
            }

            return RadarBlip(
                id = request.id,
                angle = baseAngle + jitter,
                distance = distance,
                priority = request.priority,
                requestType = request.requestType,
                locationName = request.location?.name ?: "Unknown",
                guestName = request.guest?.displayName,
                hasVoiceMessage = request.audioUrl != null,
                voiceTranscript = request.voiceTranscript,
                audioUrl = request.audioUrl,
                createdAt = System.currentTimeMillis(),
                isNew = true,
                locationImage = request.location?.image
            )
        }
    }

    val priorityColor: Color
        get() = when (priority) {
            Priority.EMERGENCY -> EMERGENCY_COLOR
            Priority.URGENT -> URGENT_COLOR
            else -> NORMAL_COLOR
        }

    val blipSize: Float
        get() = when (priority) {
            Priority.EMERGENCY -> 24f
            Priority.URGENT -> 18f
            else -> 14f
        }

    val shouldPulse: Boolean
        get() = priority == Priority.EMERGENCY || priority == Priority.URGENT || isNew
}
