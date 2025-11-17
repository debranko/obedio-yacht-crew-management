package com.obedio.app.domain.repository

import com.obedio.app.presentation.screens.settings.AppTheme
import kotlinx.coroutines.flow.Flow

data class UserPreferences(
    val theme: AppTheme = AppTheme.SYSTEM,
    val notificationsEnabled: Boolean = true,
    val backgroundSyncEnabled: Boolean = true,
    val syncIntervalMinutes: Int = 15,
    val offlineMode: Boolean = false,
    val biometricEnabled: Boolean = false
)

interface UserPreferencesRepository {
    fun getUserPreferences(): Flow<UserPreferences>
    
    suspend fun setTheme(theme: AppTheme)
    suspend fun setNotificationsEnabled(enabled: Boolean)
    suspend fun setBackgroundSyncEnabled(enabled: Boolean)
    suspend fun setSyncInterval(minutes: Int)
    suspend fun setOfflineMode(enabled: Boolean)
    suspend fun setBiometricEnabled(enabled: Boolean)
    
    suspend fun clearPreferences()
}