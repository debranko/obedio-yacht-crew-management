package com.example.obediowear.viewmodel

import android.app.Application
import android.content.Context
import android.os.BatteryManager
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.obediowear.data.api.AcceptRequestBody
import com.example.obediowear.data.api.ApiClient
import com.example.obediowear.data.api.DeviceHeartbeatBody
import com.example.obediowear.data.api.UpdateYachtLocationBody
import com.example.obediowear.data.model.CrewMember
import com.example.obediowear.data.model.ServiceRequest
import com.example.obediowear.data.model.Status
import com.example.obediowear.data.websocket.WebSocketManager
import com.example.obediowear.utils.GPSLocationManager
import com.example.obediowear.utils.VibrationHelper
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * ViewModel for managing service requests and WebSocket connection
 */
class ServiceRequestViewModel(application: Application) : AndroidViewModel(application) {

    private val apiService = ApiClient.instance
    private val vibrationHelper = VibrationHelper(application.applicationContext)
    private val gpsLocationManager = GPSLocationManager(application.applicationContext)

    // Current incoming request (null if none)
    private val _currentRequest = MutableStateFlow<ServiceRequest?>(null)
    val currentRequest: StateFlow<ServiceRequest?> = _currentRequest.asStateFlow()

    // Available crew members for delegation
    private val _crewMembers = MutableStateFlow<List<CrewMember>>(emptyList())
    val crewMembers: StateFlow<List<CrewMember>> = _crewMembers.asStateFlow()

    // Loading state
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // Error messages
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    // MQTT connection status (watch uses MQTT, not WebSocket)
    val connectionStatus = com.example.obediowear.data.mqtt.MqttManager.connectionStatus

    // Current crew member ID - discovered from device assignment (no hardcoding!)
    private var currentCrewMemberId: String? = null

    // Watch device ID - fetched from backend on init
    private var myDeviceId: String? = null

    init {
        // Watch uses MQTT ONLY for notifications (not WebSocket)
        // WebSocket is for web clients only
        // WebSocketManager.connect()

        // MQTT foreground service is started by Application class (ObedioWearApplication)
        // No need to start it here - it's already running
        Log.i("ViewModel", "ViewModel initialized - MQTT service already running from Application")

        // MQTT handles incoming requests via FullScreenIncomingRequestActivity
        // No need to listen here - MainActivity doesn't show incoming requests
        // listenForNewRequests()
        // listenForRequestUpdates()

        // Load crew members for delegation
        loadCrewMembers()

        // Discover my watch device ID from backend
        discoverMyDeviceId()

        // Start GPS tracking and periodic updates
        startGPSTracking()

        // Start device heartbeat (battery, signal strength)
        startDeviceHeartbeat()
    }

    /**
     * Fetch my watch device ID from backend using MAC address (Android ID) lookup.
     * No authentication required - uses MAC address as identifier.
     */
    private fun discoverMyDeviceId() {
        viewModelScope.launch {
            try {
                val context = getApplication<Application>().applicationContext
                val macAddress = com.example.obediowear.utils.DeviceInfoHelper.getDeviceId(context)

                Log.d("Device", "Looking up device by MAC: $macAddress")
                val response = apiService.getDeviceByMacAddress(macAddress)

                if (response.success) {
                    // Extract device ID from response (single device object, not a list)
                    val deviceData = response.data.asJsonObject
                    myDeviceId = deviceData.get("id")?.asString
                    Log.i("Device", "✅ Discovered my device ID: $myDeviceId")

                    // Also extract crew member ID if assigned
                    // API returns crewMember object, not crewMemberId directly
                    val crewMember = deviceData.getAsJsonObject("crewMember")
                    currentCrewMemberId = crewMember?.get("id")?.asString
                    if (currentCrewMemberId != null) {
                        Log.i("Device", "✅ Assigned to crew member: $currentCrewMemberId")
                    } else {
                        Log.w("Device", "⚠️ Watch not assigned to any crew member yet")
                    }
                } else {
                    Log.w("Device", "⚠️ No device found with MAC address: $macAddress")
                }
            } catch (e: Exception) {
                Log.e("Device", "❌ Error discovering device ID: ${e.message}", e)
            }
        }
    }

    /**
     * Listen for new service requests from WebSocket
     */
    private fun listenForNewRequests() {
        viewModelScope.launch {
            WebSocketManager.newRequestFlow.collect { request ->
                // Only show pending requests
                if (request.status == Status.PENDING) {
                    _currentRequest.value = request

                    // Vibrate based on priority
                    vibrationHelper.vibrateForRequest(request.priority)
                }
            }
        }
    }

    /**
     * Listen for service request updates from WebSocket
     */
    private fun listenForRequestUpdates() {
        viewModelScope.launch {
            WebSocketManager.updatedRequestFlow.collect { updatedRequest ->
                // If current request was updated to non-pending, close it
                if (_currentRequest.value?.id == updatedRequest.id &&
                    updatedRequest.status != Status.PENDING
                ) {
                    _currentRequest.value = null
                }
            }
        }
    }

    /**
     * Load crew members for delegation
     */
    private fun loadCrewMembers() {
        viewModelScope.launch {
            try {
                val response = apiService.getCrewMembers(
                    status = "on-duty",
                    department = "Interior"
                )
                if (response.success) {
                    _crewMembers.value = response.data
                }
            } catch (e: Exception) {
                // Silently fail - delegation will still work with empty list
            }
        }
    }

    /**
     * Accept current service request
     */
    fun acceptRequest() {
        val request = _currentRequest.value ?: return

        // Check if watch is assigned to a crew member
        if (currentCrewMemberId == null) {
            _errorMessage.value = "Watch not assigned to crew member"
            Log.e("Accept", "Cannot accept request - watch not assigned to crew")
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            try {
                val response = apiService.acceptServiceRequest(
                    requestId = request.id,
                    body = AcceptRequestBody(crewMemberId = currentCrewMemberId!!)
                )

                if (response.success) {
                    // Close request dialog
                    _currentRequest.value = null
                } else {
                    _errorMessage.value = "Failed to accept request"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Network error: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Accept a service request by ID (used when launched from FullScreenIncomingRequestActivity)
     */
    fun acceptRequestById(requestId: String) {
        // Check if watch is assigned to a crew member
        if (currentCrewMemberId == null) {
            Log.e("Accept", "Cannot accept request - watch not assigned to crew yet")
            // Wait a bit and retry (device ID discovery might still be in progress)
            viewModelScope.launch {
                delay(1000)
                if (currentCrewMemberId != null) {
                    acceptRequestById(requestId)
                } else {
                    Log.e("Accept", "Still not assigned after waiting - giving up")
                }
            }
            return
        }

        viewModelScope.launch {
            try {
                Log.i("Accept", "Accepting request $requestId for crew member $currentCrewMemberId")
                val response = apiService.acceptServiceRequest(
                    requestId = requestId,
                    body = AcceptRequestBody(crewMemberId = currentCrewMemberId!!, confirmed = true)
                )

                if (response.success) {
                    Log.i("Accept", "✅ Request accepted successfully")
                } else {
                    Log.e("Accept", "❌ Failed to accept request")
                }
            } catch (e: Exception) {
                Log.e("Accept", "❌ Error accepting request: ${e.message}", e)
            }
        }
    }

    /**
     * Delegate current service request to another crew member
     */
    fun delegateRequest(toCrewMemberId: String) {
        val request = _currentRequest.value ?: return

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            try {
                val response = apiService.acceptServiceRequest(
                    requestId = request.id,
                    body = AcceptRequestBody(crewMemberId = toCrewMemberId)
                )

                if (response.success) {
                    // Close request dialog
                    _currentRequest.value = null
                } else{
                    _errorMessage.value = "Failed to delegate request"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Network error: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Delegate a service request by ID to another crew member
     * (used when launched from FullScreenIncomingRequestActivity)
     */
    fun delegateRequestById(requestId: String, toCrewMemberId: String) {
        viewModelScope.launch {
            try {
                Log.i("Delegate", "Delegating request $requestId to crew member $toCrewMemberId")
                val response = apiService.acceptServiceRequest(
                    requestId = requestId,
                    body = AcceptRequestBody(crewMemberId = toCrewMemberId)
                )

                if (response.success) {
                    Log.i("Delegate", "✅ Request delegated successfully")
                } else {
                    Log.e("Delegate", "❌ Failed to delegate request")
                }
            } catch (e: Exception) {
                Log.e("Delegate", "❌ Error delegating request: ${e.message}", e)
            }
        }
    }

    /**
     * Dismiss current request manually
     */
    fun dismissRequest() {
        _currentRequest.value = null
    }

    /**
     * Clear error message
     */
    fun clearError() {
        _errorMessage.value = null
    }

    /**
     * Start GPS tracking and send periodic updates to backend.
     * Updates yacht position every 60 seconds when location changes.
     */
    private fun startGPSTracking() {
        // Start GPS tracking
        gpsLocationManager.startTracking()

        // Periodically send GPS updates to backend
        viewModelScope.launch {
            while (true) {
                delay(60_000L) // Every 60 seconds

                gpsLocationManager.currentLocation.value?.let { location ->
                    sendGPSUpdate(
                        latitude = location.latitude,
                        longitude = location.longitude,
                        accuracy = location.accuracy
                    )
                }
            }
        }
    }

    /**
     * Send GPS location update to backend.
     */
    private fun sendGPSUpdate(latitude: Double, longitude: Double, accuracy: Float) {
        viewModelScope.launch {
            try {
                val timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date())

                val response = apiService.updateYachtLocation(
                    UpdateYachtLocationBody(
                        latitude = latitude,
                        longitude = longitude,
                        accuracy = accuracy,
                        locationUpdatedAt = timestamp
                    )
                )

                if (response.success) {
                    Log.i("GPS", "📍 GPS location updated: $latitude, $longitude (±${accuracy}m)")
                } else {
                    Log.w("GPS", "⚠️ Failed to update GPS location")
                }
            } catch (e: Exception) {
                Log.e("GPS", "❌ GPS update error: ${e.message}", e)
            }
        }
    }

    /**
     * Start device heartbeat - send battery and signal strength every 30 seconds.
     * This keeps the watch status up-to-date in the device manager dashboard.
     */
    private fun startDeviceHeartbeat() {
        viewModelScope.launch {
            while (true) {
                delay(30_000L) // Every 30 seconds

                sendDeviceHeartbeat()
            }
        }
    }

    /**
     * Send device heartbeat with current battery level and signal strength.
     * Uses existing PUT /api/devices/:id endpoint (not a custom endpoint).
     */
    private fun sendDeviceHeartbeat() {
        // Skip if we don't know our device ID yet
        if (myDeviceId == null) {
            Log.d("Heartbeat", "⏳ Waiting for device ID discovery...")
            return
        }

        viewModelScope.launch {
            try {
                val context = getApplication<Application>().applicationContext

                // Get battery level
                val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

                // Signal strength: WiFi RSSI (estimate -60 dBm for now, can be improved)
                // TODO: Get actual WiFi signal strength from WifiManager
                val signalStrength = -60

                // Current timestamp
                val timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date())

                // Use existing device update endpoint (not custom /me/heartbeat)
                val response = apiService.updateDevice(
                    deviceId = myDeviceId!!,
                    body = DeviceHeartbeatBody(
                        batteryLevel = batteryLevel,
                        signalStrength = signalStrength,
                        status = "online",
                        lastSeen = timestamp
                    )
                )

                if (response.success) {
                    Log.i("Heartbeat", "📡 Device heartbeat sent: Battery ${batteryLevel}%, Signal ${signalStrength}dBm")
                } else {
                    Log.w("Heartbeat", "⚠️ Failed to send device heartbeat")
                }
            } catch (e: Exception) {
                Log.e("Heartbeat", "❌ Heartbeat error: ${e.message}", e)
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        // WebSocketManager.disconnect() // Not using WebSocket on watch
        gpsLocationManager.stopTracking()

        // Note: We DON'T stop the MQTT foreground service here
        // It should keep running even when ViewModel is cleared
        // The service will be stopped when the app is explicitly closed
    }
}
