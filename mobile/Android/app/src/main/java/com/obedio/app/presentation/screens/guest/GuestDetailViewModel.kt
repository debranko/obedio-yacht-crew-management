package com.obedio.app.presentation.screens.guest

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.obedio.app.domain.model.Guest
import com.obedio.app.domain.repository.GuestRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GuestDetailUiState(
    val isLoading: Boolean = false,
    val guest: Guest? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class GuestDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val guestRepository: GuestRepository
) : ViewModel() {

    private val guestId: String = checkNotNull(savedStateHandle["guestId"])
    
    private val _uiState = MutableStateFlow(GuestDetailUiState())
    val uiState: StateFlow<GuestDetailUiState> = _uiState.asStateFlow()

    init {
        loadGuest(guestId)
    }

    fun loadGuest(id: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            guestRepository.getGuest(id)
                .fold(
                    onSuccess = { guest ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                guest = guest,
                                errorMessage = null
                            )
                        }
                    },
                    onFailure = { exception ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                errorMessage = exception.message ?: "Failed to load guest"
                            )
                        }
                    }
                )
        }
    }

    fun updateGuestStatus(status: String) {
        viewModelScope.launch {
            val currentGuest = _uiState.value.guest ?: return@launch
            
            _uiState.update { it.copy(isLoading = true) }
            
            guestRepository.updateGuestStatus(currentGuest.id, status)
                .fold(
                    onSuccess = { updatedGuest ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                guest = updatedGuest,
                                errorMessage = null
                            )
                        }
                    },
                    onFailure = { exception ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                errorMessage = exception.message ?: "Failed to update guest status"
                            )
                        }
                    }
                )
        }
    }
}