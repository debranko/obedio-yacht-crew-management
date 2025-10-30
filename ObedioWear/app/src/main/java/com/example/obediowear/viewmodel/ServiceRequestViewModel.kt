package com.example.obediowear.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.obediowear.data.api.AcceptRequestBody
import com.example.obediowear.data.api.ApiClient
import com.example.obediowear.data.model.CrewMember
import com.example.obediowear.data.model.ServiceRequest
import com.example.obediowear.data.model.Status
import com.example.obediowear.data.websocket.WebSocketManager
import com.example.obediowear.utils.VibrationHelper
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * ViewModel for managing service requests and WebSocket connection
 */
class ServiceRequestViewModel(application: Application) : AndroidViewModel(application) {

    private val apiService = ApiClient.instance
    private val vibrationHelper = VibrationHelper(application.applicationContext)

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

    // WebSocket connection status
    val connectionStatus = WebSocketManager.connectionStatus

    // Hardcoded crew member ID for MVP (replace with login system later)
    private val currentCrewMemberId = "test-crew-123"

    init {
        // Connect to WebSocket
        connectWebSocket()

        // Listen for incoming service requests
        listenForNewRequests()

        // Listen for request updates
        listenForRequestUpdates()

        // Load crew members for delegation
        loadCrewMembers()
    }

    /**
     * Connect to WebSocket server
     */
    private fun connectWebSocket() {
        WebSocketManager.connect()
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
                    status = "on_duty",
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

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            try {
                val response = apiService.acceptServiceRequest(
                    requestId = request.id,
                    body = AcceptRequestBody(crewMemberId = currentCrewMemberId)
                )

                if (response.success) {
                    // Wait for WebSocket confirmation (handled in listenForRequestUpdates)
                    // UI will close automatically when status changes
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
                    // Wait for WebSocket confirmation
                    // UI will close automatically when status changes
                } else {
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

    override fun onCleared() {
        super.onCleared()
        WebSocketManager.disconnect()
    }
}
