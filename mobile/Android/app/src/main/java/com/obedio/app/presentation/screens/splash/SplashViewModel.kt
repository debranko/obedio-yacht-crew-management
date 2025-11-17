package com.obedio.app.presentation.screens.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.obedio.app.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class AuthState {
    UNKNOWN,
    AUTHENTICATED,
    UNAUTHENTICATED
}

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _authState = MutableStateFlow(AuthState.UNKNOWN)
    val authState: StateFlow<AuthState> = _authState

    fun checkAuthState() {
        viewModelScope.launch {
            // Simulate a short delay for branding
            delay(1500)
            
            val isAuthenticated = authRepository.verifyToken()
            if (isAuthenticated) {
                _authState.value = AuthState.AUTHENTICATED
            } else {
                _authState.value = AuthState.UNAUTHENTICATED
            }
        }
    }
}