package com.example.obediowear2.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.obediowear2.data.api.ApiClient
import com.example.obediowear2.data.model.ShakeSensitivity
import com.example.obediowear2.data.model.VibrationLevel
import com.example.obediowear2.utils.DeviceInfoHelper
import com.example.obediowear2.utils.PreferencesManager
import com.example.obediowear2.utils.ServerConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel for the Settings Screen.
 * Loads and persists all settings via PreferencesManager.
 */
class SettingsViewModel(application: Application) : AndroidViewModel(application) {

    companion object {
        private const val TAG = "SettingsViewModel"
    }

    private val apiService = ApiClient.instance

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadSettings()
        loadDeviceProfile()
    }

    /**
     * Load all settings from SharedPreferences
     */
    private fun loadSettings() {
        try {
            _uiState.update { state ->
                state.copy(
                    // Notification settings
                    emergencySoundEnabled = PreferencesManager.getEmergencySoundEnabled(),
                    dndAlertsEnabled = PreferencesManager.getDndAlertsEnabled(),
                    vibrationLevel = PreferencesManager.getVibrationLevel(),

                    // Shake settings
                    shakeToDelegate = PreferencesManager.getShakeToDelegate(),
                    shakeSensitivity = PreferencesManager.getShakeSensitivity(),
                    shakeConfirmationRequired = PreferencesManager.getShakeConfirmationRequired(),

                    // Connection settings (from ServerConfig)
                    serverIp = ServerConfig.getServerIp(),
                    mqttPort = ServerConfig.getMqttPort(),
                    apiPort = ServerConfig.getApiPort(),

                    // Battery settings
                    lowBatteryThreshold = PreferencesManager.getLowBatteryThreshold(),

                    // Profile
                    crewMemberName = PreferencesManager.getCrewMemberName(),
                    deviceId = PreferencesManager.getDeviceId()
                )
            }
            Log.i(TAG, "Settings loaded from preferences")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load settings: ${e.message}")
        }
    }

    /**
     * Load device profile from API based on device ID
     */
    private fun loadDeviceProfile() {
        viewModelScope.launch {
            try {
                val context = getApplication<Application>()
                val deviceId = DeviceInfoHelper.getDeviceId(context)

                // Store device ID
                PreferencesManager.setDeviceId(deviceId)
                _uiState.update { it.copy(deviceId = deviceId) }

                Log.d(TAG, "Discovering device with ID: $deviceId")

                // Try to discover this device from the backend
                val response = apiService.getDeviceByMacAddress(deviceId)

                if (response.success && response.data != null) {
                    // Parse the device response to get crew member info
                    val deviceData = response.data.asJsonObject

                    // Get assigned crew member if any
                    // API returns "crewmember" (lowercase) and "crewMemberId"
                    if (deviceData.has("crewmember") && !deviceData.get("crewmember").isJsonNull) {
                        val crewMember = deviceData.getAsJsonObject("crewmember")
                        val crewMemberId = crewMember.get("id")?.asString
                        // Backend sends CrewMember with single "name" field, not firstName/lastName
                        val crewMemberName = crewMember.get("name")?.asString ?: "Unknown"

                        if (crewMemberId != null) {
                            PreferencesManager.setCrewMemberId(crewMemberId)
                            PreferencesManager.setCrewMemberName(crewMemberName)

                            _uiState.update { state ->
                                state.copy(
                                    crewMemberName = crewMemberName,
                                    crewMemberId = crewMemberId
                                )
                            }

                            Log.i(TAG, "✅ Device discovered - Crew member: $crewMemberName ($crewMemberId)")
                        }
                    } else if (deviceData.has("crewMemberId") && !deviceData.get("crewMemberId").isJsonNull) {
                        // Fallback: if crewmember object is missing but crewMemberId exists
                        val crewMemberId = deviceData.get("crewMemberId")?.asString
                        if (crewMemberId != null) {
                            PreferencesManager.setCrewMemberId(crewMemberId)
                            Log.i(TAG, "✅ Device discovered - Crew member ID: $crewMemberId (no name available)")
                        }
                    } else {
                        Log.i(TAG, "Device found but not assigned to any crew member")
                    }
                } else {
                    Log.w(TAG, "Device not found in backend - may need to be registered")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load device profile: ${e.message}", e)
            }
        }
    }

    fun setEmergencySoundEnabled(enabled: Boolean) {
        _uiState.update { it.copy(emergencySoundEnabled = enabled) }
        PreferencesManager.setEmergencySoundEnabled(enabled)
    }

    fun setDndAlertsEnabled(enabled: Boolean) {
        _uiState.update { it.copy(dndAlertsEnabled = enabled) }
        PreferencesManager.setDndAlertsEnabled(enabled)
    }

    fun cycleVibrationLevel() {
        _uiState.update { state ->
            val newLevel = when (state.vibrationLevel) {
                VibrationLevel.LOW -> VibrationLevel.MEDIUM
                VibrationLevel.MEDIUM -> VibrationLevel.HIGH
                VibrationLevel.HIGH -> VibrationLevel.LOW
            }
            PreferencesManager.setVibrationLevel(newLevel)
            state.copy(vibrationLevel = newLevel)
        }
    }

    fun setShakeToDelegate(enabled: Boolean) {
        _uiState.update { it.copy(shakeToDelegate = enabled) }
        PreferencesManager.setShakeToDelegate(enabled)
    }

    fun cycleShakeSensitivity() {
        _uiState.update { state ->
            val newSensitivity = when (state.shakeSensitivity) {
                ShakeSensitivity.LOW -> ShakeSensitivity.MEDIUM
                ShakeSensitivity.MEDIUM -> ShakeSensitivity.HIGH
                ShakeSensitivity.HIGH -> ShakeSensitivity.LOW
            }
            PreferencesManager.setShakeSensitivity(newSensitivity)
            state.copy(shakeSensitivity = newSensitivity)
        }
    }

    fun setShakeConfirmationRequired(required: Boolean) {
        _uiState.update { it.copy(shakeConfirmationRequired = required) }
        PreferencesManager.setShakeConfirmationRequired(required)
    }

    /**
     * Refresh device profile from API
     */
    fun refreshProfile() {
        loadDeviceProfile()
    }
}

data class SettingsUiState(
    // Notifications
    val emergencySoundEnabled: Boolean = true,
    val dndAlertsEnabled: Boolean = true,
    val vibrationLevel: VibrationLevel = VibrationLevel.MEDIUM,

    // Shake to Delegate
    val shakeToDelegate: Boolean = true,
    val shakeSensitivity: ShakeSensitivity = ShakeSensitivity.MEDIUM,
    val shakeConfirmationRequired: Boolean = true,

    // Connection
    val serverIp: String = "10.10.0.207",
    val mqttPort: Int = 1883,
    val apiPort: Int = 8081,

    // Battery
    val lowBatteryThreshold: Int = 20,

    // Profile
    val crewMemberName: String? = null,
    val crewMemberId: String? = null,
    val deviceId: String? = null
)
