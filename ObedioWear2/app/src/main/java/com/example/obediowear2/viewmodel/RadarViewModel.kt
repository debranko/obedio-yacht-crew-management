package com.example.obediowear2.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.obediowear2.data.api.ApiClient
import com.example.obediowear2.data.model.Assignment
import com.example.obediowear2.data.model.AssignmentStatus
import com.example.obediowear2.data.model.RadarBlip
import com.example.obediowear2.data.model.Status
import com.example.obediowear2.data.mqtt.MqttManager
import com.example.obediowear2.utils.PreferencesManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * ViewModel for the Radar Home Screen.
 * Listens to MQTT for real-time service requests and loads pending requests from API.
 */
class RadarViewModel : ViewModel() {

    companion object {
        private const val TAG = "RadarViewModel"
    }

    private val apiService = ApiClient.instance

    private val _uiState = MutableStateFlow(RadarUiState())
    val uiState: StateFlow<RadarUiState> = _uiState.asStateFlow()

    private val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())

    init {
        startTimeUpdates()
        observeMqttStatus()
        observeNewRequests()
        observeRequestDismissals()
        loadPendingRequests()
        loadDutyStatus()
    }

    /**
     * Observe MQTT connection status.
     */
    private fun observeMqttStatus() {
        viewModelScope.launch {
            MqttManager.connectionStatus.collect { status ->
                Log.d(TAG, "MQTT status: $status")
                _uiState.update { state ->
                    state.copy(
                        isConnected = status == MqttManager.ConnectionStatus.CONNECTED
                    )
                }
            }
        }
    }

    /**
     * Listen for new service requests from MQTT.
     */
    private fun observeNewRequests() {
        viewModelScope.launch {
            MqttManager.newRequestFlow.collect { request ->
                Log.i(TAG, "New service request received: ${request.id} at ${request.location?.name}")

                // Convert to blip and add to radar
                val blipIndex = _uiState.value.blips.size
                val blip = RadarBlip.fromServiceRequest(request, blipIndex)
                addBlip(blip)
            }
        }
    }

    /**
     * Listen for request dismissals (cross-device sync).
     * When another device accepts a request, remove it from our radar.
     */
    private fun observeRequestDismissals() {
        viewModelScope.launch {
            MqttManager.requestDismissedFlow.collect { requestId ->
                Log.i(TAG, "Request dismissed (handled by another device): $requestId")
                removeBlip(requestId)
            }
        }

        // Also listen for completed requests
        viewModelScope.launch {
            MqttManager.requestCompletedFlow.collect { requestId ->
                Log.i(TAG, "Request completed: $requestId")
                removeBlip(requestId)
            }
        }

        // Listen for clear-all action
        viewModelScope.launch {
            MqttManager.clearAllFlow.collect {
                Log.i(TAG, "Clear all requests received")
                clearAllBlips()
            }
        }
    }

    /**
     * Load pending service requests from the API on startup.
     */
    fun loadPendingRequests() {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Loading pending service requests from API...")
                val response = apiService.getServiceRequests(status = "pending")

                if (response.success) {
                    val pendingRequests = response.data.filter { it.status == Status.PENDING }
                    Log.i(TAG, "✅ Loaded ${pendingRequests.size} pending requests")

                    // Convert to blips
                    val blips = pendingRequests.mapIndexed { index, request ->
                        RadarBlip.fromServiceRequest(request, index).copy(isNew = false)
                    }

                    _uiState.update { state ->
                        state.copy(blips = blips)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load pending requests: ${e.message}", e)
            }
        }
    }

    private fun startTimeUpdates() {
        viewModelScope.launch {
            var secondCounter = 0
            while (true) {
                updateTime()
                secondCounter++

                // Refresh pending requests every 30 seconds (fallback sync)
                if (secondCounter >= 30) {
                    Log.d(TAG, "Periodic refresh - syncing pending requests")
                    loadPendingRequests()
                    secondCounter = 0
                }

                // Update duty info every minute (60 iterations = 60 seconds)
                if (secondCounter % 60 == 0) {
                    updateDutyInfo()
                }

                delay(1000) // Update every second
            }
        }
    }

    private fun updateTime() {
        _uiState.update { state ->
            state.copy(currentTime = timeFormat.format(Date()))
        }
    }

    fun addBlip(blip: RadarBlip) {
        _uiState.update { state ->
            // Avoid duplicates
            if (state.blips.any { it.id == blip.id }) {
                state
            } else {
                state.copy(blips = state.blips + blip)
            }
        }
    }

    fun removeBlip(blipId: String) {
        _uiState.update { state ->
            state.copy(blips = state.blips.filter { it.id != blipId })
        }
    }

    fun clearAllBlips() {
        _uiState.update { state ->
            state.copy(blips = emptyList())
        }
    }

    fun updateDutyProgress(progress: Float) {
        _uiState.update { state ->
            state.copy(dutyProgress = progress.coerceIn(0f, 1f))
        }
    }

    fun updateShiftRemaining(remaining: String?) {
        _uiState.update { state ->
            state.copy(shiftRemaining = remaining)
        }
    }

    fun updateBatteryStatus(level: Int, isCharging: Boolean) {
        _uiState.update { state ->
            state.copy(batteryLevel = level, isCharging = isCharging)
        }
    }

    // Cache the current assignment for periodic updates
    private var currentAssignment: Assignment? = null

    /**
     * Load duty status from crew schedule API.
     * Fetches the current assignment for the logged-in crew member.
     */
    private fun loadDutyStatus() {
        viewModelScope.launch {
            try {
                val crewMemberId = PreferencesManager.getCrewMemberId()
                if (crewMemberId == null) {
                    Log.w(TAG, "No crew member ID available - cannot fetch duty status")
                    _uiState.update { state ->
                        state.copy(
                            isOnDuty = false,
                            dutyTimeInfo = "Not assigned"
                        )
                    }
                    return@launch
                }

                Log.d(TAG, "Loading duty status for crew member: $crewMemberId")

                // Fetch today's date in ISO format
                val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val today = dateFormat.format(Date())

                // Fetch assignments for this crew member
                val response = apiService.getAssignments(date = today, crewMemberId = crewMemberId)

                if (response.success && response.data.isNotEmpty()) {
                    // Find active or scheduled assignment for today
                    val assignment = response.data.firstOrNull {
                        it.status == AssignmentStatus.ACTIVE || it.status == AssignmentStatus.SCHEDULED
                    }

                    if (assignment != null) {
                        currentAssignment = assignment
                        updateDutyInfoFromAssignment(assignment)
                        Log.i(TAG, "✅ Duty status loaded - Shift: ${assignment.shift.name}")
                    } else {
                        currentAssignment = null
                        _uiState.update { state ->
                            state.copy(
                                isOnDuty = false,
                                dutyTimeInfo = "Off duty today"
                            )
                        }
                        Log.i(TAG, "No active assignment for today")
                    }
                } else {
                    currentAssignment = null
                    _uiState.update { state ->
                        state.copy(
                            isOnDuty = false,
                            dutyTimeInfo = "No shift scheduled"
                        )
                    }
                    Log.i(TAG, "No assignments found for today")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load duty status: ${e.message}", e)
                // Keep previous state on error
            }
        }
    }

    /**
     * Update duty info from an assignment.
     */
    private fun updateDutyInfoFromAssignment(assignment: Assignment) {
        val calendar = Calendar.getInstance()
        val currentHour = calendar.get(Calendar.HOUR_OF_DAY)
        val currentMinute = calendar.get(Calendar.MINUTE)
        val currentTimeMinutes = currentHour * 60 + currentMinute

        // Parse shift times
        val startParts = assignment.shift.startTime.split(":")
        val startMinutes = startParts[0].toInt() * 60 + startParts[1].toInt()

        val endParts = assignment.shift.endTime.split(":")
        val endMinutes = endParts[0].toInt() * 60 + endParts[1].toInt()

        val isOnDuty = currentTimeMinutes in startMinutes until endMinutes

        val dutyTimeInfo = if (isOnDuty) {
            val (hoursRemaining, minutesRemaining) = assignment.shift.getRemainingTime(currentTimeMinutes)
            if (hoursRemaining > 0) {
                "${hoursRemaining}h ${minutesRemaining}m remaining"
            } else if (minutesRemaining > 0) {
                "${minutesRemaining}m remaining"
            } else {
                "Shift ending"
            }
        } else if (currentTimeMinutes < startMinutes) {
            "Shift starts at ${assignment.shift.startTime}"
        } else {
            "Shift ended"
        }

        _uiState.update { state ->
            state.copy(
                isOnDuty = isOnDuty,
                dutyTimeInfo = dutyTimeInfo
            )
        }
    }

    /**
     * Update duty info periodically (called from time updates).
     * Uses cached assignment to avoid repeated API calls.
     */
    private fun updateDutyInfo() {
        val assignment = currentAssignment
        if (assignment != null) {
            updateDutyInfoFromAssignment(assignment)
        }
        // If no assignment, the status was already set by loadDutyStatus()
    }

    /**
     * Refresh data - reload pending requests from API.
     */
    fun refresh() {
        loadPendingRequests()
        loadDutyStatus()
    }
}

data class RadarUiState(
    val currentTime: String = "",
    val blips: List<RadarBlip> = emptyList(),
    val sweepAngle: Float = 0f,
    val dutyProgress: Float = 0f,
    val shiftRemaining: String? = null,
    val isConnected: Boolean = false,
    val batteryLevel: Int = -1,
    val isCharging: Boolean = false,
    // New duty status fields
    val isOnDuty: Boolean = false,
    val dutyTimeInfo: String? = null,  // "2h 45m remaining" or "Next shift: 18:00"
    val shiftEndTime: Long? = null,     // Unix timestamp when shift ends
    val nextShiftTime: Long? = null     // Unix timestamp when next shift starts
)
