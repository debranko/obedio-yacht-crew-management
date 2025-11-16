package com.obedio.app.presentation.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.obedio.app.domain.model.User
import com.obedio.app.domain.repository.AuthRepository
import com.obedio.app.domain.repository.UserPreferencesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val currentUser: User? = null,
    val theme: AppTheme = AppTheme.SYSTEM,
    val notificationsEnabled: Boolean = true,
    val backgroundSyncEnabled: Boolean = true,
    val syncIntervalMinutes: Int = 15,
    val offlineMode: Boolean = false,
    val biometricEnabled: Boolean = false,
    val biometricAvailable: Boolean = false,
    val isLoading: Boolean = false
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userPreferencesRepository: UserPreferencesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadSettings()
    }

    private fun loadSettings() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            // Load current user
            val user = authRepository.getCurrentUser()
            
            // Load preferences
            userPreferencesRepository.getUserPreferences().collect { preferences ->
                _uiState.update {
                    it.copy(
                        currentUser = user,
                        theme = preferences.theme,
                        notificationsEnabled = preferences.notificationsEnabled,
                        backgroundSyncEnabled = preferences.backgroundSyncEnabled,
                        syncIntervalMinutes = preferences.syncIntervalMinutes,
                        offlineMode = preferences.offlineMode,
                        biometricEnabled = preferences.biometricEnabled,
                        biometricAvailable = checkBiometricAvailability(),
                        isLoading = false
                    )
                }
            }
        }
    }

    fun setTheme(theme: AppTheme) {
        viewModelScope.launch {
            userPreferencesRepository.setTheme(theme)
            _uiState.update { it.copy(theme = theme) }
        }
    }

    fun toggleNotifications() {
        viewModelScope.launch {
            val enabled = !_uiState.value.notificationsEnabled
            userPreferencesRepository.setNotificationsEnabled(enabled)
            _uiState.update { it.copy(notificationsEnabled = enabled) }
        }
    }

    fun toggleBackgroundSync() {
        viewModelScope.launch {
            val enabled = !_uiState.value.backgroundSyncEnabled
            userPreferencesRepository.setBackgroundSyncEnabled(enabled)
            _uiState.update { it.copy(backgroundSyncEnabled = enabled) }
        }
    }

    fun toggleOfflineMode() {
        viewModelScope.launch {
            val enabled = !_uiState.value.offlineMode
            userPreferencesRepository.setOfflineMode(enabled)
            _uiState.update { it.copy(offlineMode = enabled) }
        }
    }

    fun toggleBiometric() {
        viewModelScope.launch {
            val enabled = !_uiState.value.biometricEnabled
            userPreferencesRepository.setBiometricEnabled(enabled)
            _uiState.update { it.copy(biometricEnabled = enabled) }
        }
    }

    fun clearCache() {
        viewModelScope.launch {
            // TODO: Implement cache clearing
            // This would clear Room database cache, image cache, etc.
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }

    private fun checkBiometricAvailability(): Boolean {
        // TODO: Implement biometric availability check
        return false
    }
}