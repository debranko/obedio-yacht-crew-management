package com.obedio.app.domain.repository

import com.obedio.app.domain.model.Guest
import kotlinx.coroutines.flow.Flow

interface GuestRepository {
    fun getGuests(): Flow<List<Guest>>
    suspend fun getGuest(id: String): Result<Guest>
    suspend fun refreshGuests()
    suspend fun searchGuests(query: String): List<Guest>
    suspend fun updateGuestStatus(guestId: String, status: String): Result<Guest>
}