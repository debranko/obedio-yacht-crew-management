package com.obedio.app.data.api.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LoginRequestDto(
    @Json(name = "username") val username: String,
    @Json(name = "password") val password: String
)

@JsonClass(generateAdapter = true)
data class AuthResponseDto(
    @Json(name = "success") val success: Boolean,
    @Json(name = "data") val data: AuthDataDto?
)

@JsonClass(generateAdapter = true)
data class AuthDataDto(
    @Json(name = "user") val user: UserDto,
    @Json(name = "token") val token: String,
    @Json(name = "refreshToken") val refreshToken: String?
)

@JsonClass(generateAdapter = true)
data class UserDto(
    @Json(name = "id") val id: String,
    @Json(name = "username") val username: String,
    @Json(name = "name") val name: String,
    @Json(name = "email") val email: String,
    @Json(name = "role") val role: String,
    @Json(name = "department") val department: String?,
    @Json(name = "avatar") val avatar: String?
)

@JsonClass(generateAdapter = true)
data class VerifyResponseDto(
    @Json(name = "success") val success: Boolean,
    @Json(name = "valid") val valid: Boolean,
    @Json(name = "user") val user: UserDto?
)