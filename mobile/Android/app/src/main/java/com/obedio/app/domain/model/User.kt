package com.obedio.app.domain.model

data class User(
    val id: String,
    val username: String,
    val name: String,
    val email: String,
    val role: UserRole,
    val department: String?,
    val avatar: String?
)

enum class UserRole {
    ADMIN,
    CHIEF_STEWARDESS,
    STEWARDESS,
    ETO,
    CREW
}

data class AuthInfo(
    val user: User,
    val token: String,
    val refreshToken: String?
)