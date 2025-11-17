package com.obedio.app.presentation.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.obedio.app.R
import com.obedio.app.domain.repository.AuthRepository
import com.obedio.app.domain.repository.UserPreferencesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val username: String = "",
    val password: String = "",
    val rememberMe: Boolean = false,
    val isLoading: Boolean = false,
    val isLoginSuccessful: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userPreferencesRepository: UserPreferencesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState = _uiState.asStateFlow()

    fun onUsernameChange(username: String) {
        _uiState.update { it.copy(username = username, error = null) }
    }

    fun onPasswordChange(password: String) {
        _uiState.update { it.copy(password = password, error = null) }
    }

    fun onRememberMeChange(rememberMe: Boolean) {
        _uiState.update { it.copy(rememberMe = rememberMe) }
    }

    fun login() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            if (_uiState.value.username.isBlank() || _uiState.value.password.isBlank()) {
                _uiState.update { it.copy(isLoading = false, error = "Please enter username and password") }
                return@launch
            }

            authRepository.login(_uiState.value.username, _uiState.value.password)
                .fold(
                    onSuccess = {
                        if (_uiState.value.rememberMe) {
                            // Logic to save session info if needed via preferences
                        }
                        _uiState.update {
                            it.copy(isLoading = false, isLoginSuccessful = true, error = null)
                        }
                    },
                    onFailure = { throwable ->
                        _uiState.update {
                            it.copy(isLoading = false, error = throwable.message ?: "An unknown error occurred")
                        }
                    }
                )
        }
    }
}