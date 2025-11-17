package com.obedio.app.data.repository

import com.obedio.app.data.api.ObedioApi
import com.obedio.app.data.api.dto.LoginRequestDto
import com.obedio.app.data.local.TokenManager
import com.obedio.app.domain.model.AuthInfo
import com.obedio.app.domain.model.User
import com.obedio.app.domain.model.UserRole
import com.obedio.app.domain.repository.AuthRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: ObedioApi,
    private val tokenManager: TokenManager
) : AuthRepository {

    override suspend fun login(username: String, password: String): Result<AuthInfo> = withContext(Dispatchers.IO) {
        try {
            val response = api.login(LoginRequestDto(username, password))
            
            if (response.success && response.data != null) {
                val authData = response.data
                val user = mapDtoToUser(authData.user)
                
                // Save tokens
                tokenManager.saveTokens(authData.token, authData.refreshToken)
                tokenManager.saveUserInfo(user.id, user.role.name)
                
                Result.success(
                    AuthInfo(
                        user = user,
                        token = authData.token,
                        refreshToken = authData.refreshToken
                    )
                )
            } else {
                Result.failure(Exception("Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun verifyToken(): Boolean = withContext(Dispatchers.IO) {
        try {
            val token = tokenManager.getAccessToken()
            if (token.isNullOrBlank()) return@withContext false
            
            val response = api.verifyToken()
            response.success && response.valid
        } catch (e: Exception) {
            false
        }
    }

    override suspend fun logout() = withContext(Dispatchers.IO) {
        try {
            api.logout()
        } catch (e: Exception) {
            // Log error but proceed with local logout
        } finally {
            tokenManager.clearAll()
        }
    }

    override suspend fun getCurrentUser(): User? = withContext(Dispatchers.IO) {
        try {
            val response = api.verifyToken()
            if (response.success && response.valid && response.user != null) {
                mapDtoToUser(response.user)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    override suspend fun refreshToken(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val refreshToken = tokenManager.getRefreshToken()
            if (refreshToken.isNullOrBlank()) {
                return@withContext Result.failure(Exception("No refresh token"))
            }
            
            // TODO: Implement refresh endpoint when available
            Result.failure(Exception("Refresh not implemented"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun mapDtoToUser(dto: com.obedio.app.data.api.dto.UserDto): User {
        return User(
            id = dto.id,
            username = dto.username,
            name = dto.name,
            email = dto.email,
            role = when (dto.role.uppercase()) {
                "ADMIN" -> UserRole.ADMIN
                "CHIEF_STEWARDESS", "CHIEF-STEWARDESS" -> UserRole.CHIEF_STEWARDESS
                "STEWARDESS" -> UserRole.STEWARDESS
                "ETO" -> UserRole.ETO
                else -> UserRole.CREW
            },
            department = dto.department,
            avatar = dto.avatar
        )
    }
}