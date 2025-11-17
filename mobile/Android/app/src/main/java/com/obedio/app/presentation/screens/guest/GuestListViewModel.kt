package com.obedio.app.presentation.screens.guest

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.obedio.app.domain.model.Guest
import com.obedio.app.domain.model.GuestStatus
import com.obedio.app.domain.model.GuestType
import com.obedio.app.domain.repository.GuestRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GuestFilter(
    val status: GuestStatus? = null,
    val type: GuestType? = null
)

data class GuestListUiState(
    val isLoading: Boolean = false,
    val guests: List<Guest> = emptyList(),
    val filteredGuests: List<Guest> = emptyList(),
    val filter: GuestFilter = GuestFilter(),
    val activeFilters: Int = 0,
    val errorMessage: String? = null
)

@HiltViewModel
class GuestListViewModel @Inject constructor(
    private val guestRepository: GuestRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(GuestListUiState())
    val uiState: StateFlow<GuestListUiState> = _uiState.asStateFlow()
    
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()
    
    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()
    
    init {
        loadGuests()
        
        // Combine search query and filter to update filtered guests
        combine(
            _uiState.map { it.guests },
            _searchQuery,
            _uiState.map { it.filter }
        ) { guests, query, filter ->
            filterGuests(guests, query, filter)
        }.onEach { filteredGuests ->
            _uiState.update { it.copy(filteredGuests = filteredGuests) }
        }.launchIn(viewModelScope)
    }
    
    private fun loadGuests() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            guestRepository.getGuests()
                .catch { exception ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = exception.message
                        )
                    }
                }
                .collect { guests ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            guests = guests,
                            errorMessage = null
                        )
                    }
                }
        }
    }
    
    fun refresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                guestRepository.refreshGuests()
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(errorMessage = e.message)
                }
            } finally {
                _isRefreshing.value = false
            }
        }
    }
    
    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }
    
    fun updateFilter(filter: GuestFilter) {
        val activeFilters = listOfNotNull(
            filter.status,
            filter.type
        ).size
        
        _uiState.update {
            it.copy(
                filter = filter,
                activeFilters = activeFilters
            )
        }
    }
    
    private fun filterGuests(
        guests: List<Guest>,
        query: String,
        filter: GuestFilter
    ): List<Guest> {
        return guests
            .filter { guest ->
                // Search filter
                val matchesSearch = query.isBlank() || 
                    guest.firstName.contains(query, ignoreCase = true) ||
                    guest.lastName.contains(query, ignoreCase = true) ||
                    guest.cabin?.contains(query, ignoreCase = true) == true
                
                // Status filter
                val matchesStatus = filter.status?.let { guest.status == it } ?: true
                
                // Type filter
                val matchesType = filter.type?.let { guest.type == it } ?: true
                
                matchesSearch && matchesStatus && matchesType
            }
            .sortedWith(
                compareBy<Guest> { it.status != GuestStatus.ONBOARD } // Onboard first
                    .thenBy { it.firstName }
                    .thenBy { it.lastName }
            )
    }
}