package com.obedio.app.domain.repository

import com.obedio.app.domain.model.Location
import kotlinx.coroutines.flow.Flow

interface LocationRepository {
    fun getLocations(): Flow<List<Location>>
    suspend fun getLocation(id: String): Result<Location>
    suspend fun refreshLocations()
    suspend fun updateDndStatus(locationId: String, enabled: Boolean): Result<Location>
}