package com.obedio.app.domain.repository

import com.obedio.app.domain.model.AuthInfo
import com.obedio.app.domain.model.User

interface AuthRepository {
    suspend fun login(username: String, password: String): Result<AuthInfo>
    suspend fun verifyToken(): Boolean
    suspend fun logout()
    suspend fun getCurrentUser(): User?
    suspend fun refreshToken(): Result<String>
}