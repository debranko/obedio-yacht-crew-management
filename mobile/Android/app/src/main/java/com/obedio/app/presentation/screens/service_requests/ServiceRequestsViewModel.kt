package com.obedio.app.presentation.screens.service_requests

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.obedio.app.domain.model.Priority
import com.obedio.app.domain.model.ServiceRequest
import com.obedio.app.domain.model.ServiceStatus
import com.obedio.app.domain.repository.ServiceRequestRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ServiceRequestFilter(
    val status: ServiceStatus? = null,
    val priority: Priority? = null,
    val locationId: String? = null,
    val assignedToMe: Boolean = false
)

data class ServiceRequestsUiState(
    val isLoading: Boolean = false,
    val requests: List<ServiceRequest> = emptyList(),
    val filter: ServiceRequestFilter = ServiceRequestFilter(),
    val activeFilters: Int = 0,
    val errorMessage: String? = null
)

@HiltViewModel
class ServiceRequestsViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ServiceRequestsUiState())
    val uiState: StateFlow<ServiceRequestsUiState> = _uiState.asStateFlow()
    
    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()
    
    val filteredRequests: StateFlow<List<ServiceRequest>> = _uiState.map { state ->
        filterRequests(state.requests, state.filter)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )
    
    init {
        loadRequests()
        observeServiceRequests()
    }
    
    private fun loadRequests() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                serviceRequestRepository.getActiveRequests()
                    .collect { requests ->
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                requests = requests,
                                errorMessage = null
                            )
                        }
                    }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = e.message
                    )
                }
            }
        }
    }
    
    fun refresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                // Just reload - the Flow will update automatically
                loadRequests()
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(errorMessage = e.message)
                }
            } finally {
                _isRefreshing.value = false
            }
        }
    }
    
    fun updateFilter(filter: ServiceRequestFilter) {
        val activeFilters = listOfNotNull(
            filter.status,
            filter.priority,
            filter.locationId,
            if (filter.assignedToMe) 1 else null
        ).size
        
        _uiState.update { 
            it.copy(
                filter = filter,
                activeFilters = activeFilters
            )
        }
    }
    
    fun acceptRequest(requestId: String) {
        viewModelScope.launch {
            try {
                serviceRequestRepository.acceptRequest(requestId, getCurrentUserId()!!)
                // Request will be updated via WebSocket
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(errorMessage = "Failed to accept request: ${e.message}")
                }
            }
        }
    }
    
    fun completeRequest(requestId: String) {
        viewModelScope.launch {
            try {
                serviceRequestRepository.completeRequest(requestId)
                // Request will be updated via WebSocket
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(errorMessage = "Failed to complete request: ${e.message}")
                }
            }
        }
    }
    
    private fun observeServiceRequests() {
        viewModelScope.launch {
            // This is now handled by the repository's flow
        }
    }
    
    private fun filterRequests(
        requests: List<ServiceRequest>,
        filter: ServiceRequestFilter
    ): List<ServiceRequest> {
        return requests.filter { request ->
            val matchesStatus = filter.status?.let { request.status == it } ?: true
            val matchesPriority = filter.priority?.let { request.priority == it } ?: true
            val matchesLocation = filter.locationId?.let { request.locationId == it } ?: true
            val matchesAssignment = if (filter.assignedToMe) {
                request.assignedToId == getCurrentUserId()
            } else true
            
            matchesStatus && matchesPriority && matchesLocation && matchesAssignment
        }.sortedWith(
            compareByDescending<ServiceRequest> { it.priority.ordinal }
                .thenByDescending { it.createdAt }
        )
    }
    
    private fun getCurrentUserId(): String? {
        // TODO: Get from AuthRepository/UserPreferences
        return null
    }
}