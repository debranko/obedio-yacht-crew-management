package com.obedio.app.presentation.screens.service_request_detail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.obedio.app.data.local.TokenManager
import com.obedio.app.domain.model.ServiceRequest
import com.obedio.app.domain.repository.ServiceRequestRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ServiceRequestDetailUiState(
    val isLoading: Boolean = false,
    val serviceRequest: ServiceRequest? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class ServiceRequestDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val serviceRequestRepository: ServiceRequestRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val requestId: String = checkNotNull(savedStateHandle["requestId"])
    
    private val _uiState = MutableStateFlow(ServiceRequestDetailUiState())
    val uiState: StateFlow<ServiceRequestDetailUiState> = _uiState.asStateFlow()

    init {
        loadServiceRequest(requestId)
        observeServiceRequestUpdates()
    }

    fun loadServiceRequest(id: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            serviceRequestRepository.getServiceRequest(id)
                .fold(
                    onSuccess = { request ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                serviceRequest = request,
                                errorMessage = null
                            )
                        }
                    },
                    onFailure = { exception ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                errorMessage = exception.message ?: "Failed to load service request"
                            )
                        }
                    }
                )
        }
    }

    fun acceptRequest() {
        viewModelScope.launch {
            val currentUserId = tokenManager.getUserId() ?: run {
                _uiState.update {
                    it.copy(errorMessage = "User ID not available")
                }
                return@launch
            }
            _uiState.update { it.copy(isLoading = true) }

            serviceRequestRepository.acceptRequest(requestId, currentUserId)
                .fold(
                    onSuccess = { updatedRequest ->
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                serviceRequest = updatedRequest,
                                errorMessage = null
                            )
                        }
                    },
                    onFailure = { exception ->
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                errorMessage = exception.message ?: "Failed to accept request"
                            )
                        }
                    }
                )
        }
    }

    fun completeRequest() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            serviceRequestRepository.completeRequest(requestId)
                .fold(
                    onSuccess = { updatedRequest ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                serviceRequest = updatedRequest,
                                errorMessage = null
                            )
                        }
                    },
                    onFailure = { exception ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                errorMessage = exception.message ?: "Failed to complete request"
                            )
                        }
                    }
                )
        }
    }

    fun cancelRequest() {
        viewModelScope.launch {
            // TODO: Implement cancel request when API endpoint is available
            _uiState.update { 
                it.copy(errorMessage = "Cancel functionality not implemented")
            }
        }
    }

    private fun observeServiceRequestUpdates() {
        viewModelScope.launch {
            // TODO: Observe real-time updates via WebSocket
            // For now, we'll poll or rely on manual refresh
        }
    }
}