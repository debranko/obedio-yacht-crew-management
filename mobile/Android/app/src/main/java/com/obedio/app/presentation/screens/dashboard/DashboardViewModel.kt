package com.obedio.app.presentation.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.obedio.app.domain.model.ServiceRequest
import com.obedio.app.domain.repository.AuthRepository
import com.obedio.app.domain.repository.ServiceRequestRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val serviceRequestRepository: ServiceRequestRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    val activeRequests: StateFlow<List<ServiceRequest>> = serviceRequestRepository
        .getActiveRequests()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    init {
        loadUserInfo()
        observeServiceRequests()
    }

    private fun loadUserInfo() {
        viewModelScope.launch {
            try {
                val user = authRepository.getCurrentUser()
                _uiState.update { it.copy(
                    userName = user?.name ?: "User",
                    userRole = user?.role?.name ?: ""
                )}
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    errorMessage = "Failed to load user info"
                )}
            }
        }
    }

    private fun observeServiceRequests() {
        viewModelScope.launch {
            serviceRequestRepository.getActiveRequests()
                .catch { e ->
                    _uiState.update { it.copy(
                        isLoading = false,
                        errorMessage = "Failed to load requests: ${e.message}"
                    )}
                }
                .collect { requests ->
                    _uiState.update { it.copy(
                        isLoading = false,
                        errorMessage = null
                    )}
                }
        }
    }

    fun acceptRequest(requestId: String) {
        viewModelScope.launch {
            // For MVP, we'll use a fixed crew ID. 
            // In full version, this would be the current user's crew ID
            val crewId = "current-user-crew-id" 
            
            serviceRequestRepository.acceptRequest(requestId, crewId).fold(
                onSuccess = {
                    // Will be updated via Flow
                },
                onFailure = { e ->
                    _uiState.update { it.copy(
                        errorMessage = "Failed to accept request: ${e.message}"
                    )}
                }
            )
        }
    }

    fun completeRequest(requestId: String) {
        viewModelScope.launch {
            serviceRequestRepository.completeRequest(requestId).fold(
                onSuccess = {
                    // Will be updated via Flow
                },
                onFailure = { e ->
                    _uiState.update { it.copy(
                        errorMessage = "Failed to complete request: ${e.message}"
                    )}
                }
            )
        }
    }

    fun acceptNearestRequest() {
        val nearestRequest = activeRequests.value
            .filter { it.status == com.obedio.app.domain.model.ServiceStatus.PENDING }
            .minByOrNull { it.createdAt }
        
        nearestRequest?.let { acceptRequest(it.id) }
    }

    fun refreshRequests() {
        observeServiceRequests()
    }
}

data class DashboardUiState(
    val isLoading: Boolean = true,
    val userName: String = "User",
    val userRole: String = "",
    val errorMessage: String? = null
)