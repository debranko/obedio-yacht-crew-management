package com.example.obediowear2.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.obediowear2.data.api.ApiClient
import com.example.obediowear2.data.model.CrewMember
import com.example.obediowear2.data.model.DutyStatus
import com.example.obediowear2.data.model.Location
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel for the Roster Screen.
 * Fetches real crew data from the backend API.
 */
class RosterViewModel : ViewModel() {

    companion object {
        private const val TAG = "RosterViewModel"
    }

    private val apiService = ApiClient.instance

    private val _uiState = MutableStateFlow(RosterUiState())
    val uiState: StateFlow<RosterUiState> = _uiState.asStateFlow()

    init {
        loadInitialData()
    }

    private fun loadInitialData() {
        loadCrewMembers()
        loadDndLocations()
    }

    /**
     * Load crew members from the API.
     */
    fun loadCrewMembers() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                Log.d(TAG, "Fetching crew members from API...")
                val response = apiService.getCrewMembers(status = "on-duty")

                if (response.success) {
                    val crewMembers = response.data
                    Log.i(TAG, "✅ Loaded ${crewMembers.size} crew members")
                    _uiState.update { state ->
                        state.copy(
                            crewMembers = crewMembers,
                            isLoading = false,
                            error = null
                        )
                    }
                } else {
                    Log.w(TAG, "API returned success=false")
                    _uiState.update { it.copy(isLoading = false, error = "Failed to load crew") }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load crew members: ${e.message}", e)
                _uiState.update { state ->
                    state.copy(
                        isLoading = false,
                        error = "Network error: ${e.message}"
                    )
                }
            }
        }
    }

    /**
     * Load DND locations from the API.
     */
    private fun loadDndLocations() {
        viewModelScope.launch {
            try {
                Log.d(TAG, "Fetching DND locations from API...")
                val response = apiService.getLocations(doNotDisturb = true)

                if (response.success) {
                    val dndLocations = response.data
                    Log.i(TAG, "✅ Loaded ${dndLocations.size} DND locations")
                    _uiState.update { state ->
                        state.copy(dndLocations = dndLocations)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to load DND locations: ${e.message}", e)
                // DND locations are non-critical, don't show error
            }
        }
    }

    /**
     * Refresh data from the API.
     */
    fun refresh() {
        loadInitialData()
    }

    fun updateCrewMembers(crew: List<CrewMember>) {
        _uiState.update { state ->
            state.copy(crewMembers = crew)
        }
    }

    fun updateDndLocations(locations: List<Location>) {
        _uiState.update { state ->
            state.copy(dndLocations = locations)
        }
    }

    fun addDndLocation(location: Location) {
        _uiState.update { state ->
            state.copy(dndLocations = state.dndLocations + location)
        }
    }

    fun removeDndLocation(locationId: String) {
        _uiState.update { state ->
            state.copy(dndLocations = state.dndLocations.filter { it.id != locationId })
        }
    }
}

data class RosterUiState(
    val crewMembers: List<CrewMember> = emptyList(),
    val dndLocations: List<Location> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)
