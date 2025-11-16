package com.obedio.app.data.repository

import com.obedio.app.data.api.ObedioApi
import com.obedio.app.data.api.dto.LocationDto
import com.obedio.app.data.local.dao.LocationDao
import com.obedio.app.data.local.entity.LocationEntity
import com.obedio.app.domain.model.Location
import com.obedio.app.domain.model.LocationType
import com.obedio.app.domain.repository.LocationRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationRepositoryImpl @Inject constructor(
    private val api: ObedioApi,
    private val locationDao: LocationDao
) : LocationRepository {

    override fun getLocations(): Flow<List<Location>> = flow {
        // First emit cached data
        val cachedLocations = locationDao.getAllLocations().map { entities -> entities.map { mapEntityToLocation(it) } }
        emit(cachedLocations.first())
        
        // Then fetch fresh data
        try {
            val freshLocations = api.getLocations()
            val entities = freshLocations.map { mapDtoToEntity(it) }
            locationDao.insertAll(entities)
        } catch (e: Exception) {
            // Network failure, already sent cached data
        }
    }

    override suspend fun getLocation(id: String): Result<Location> = withContext(Dispatchers.IO) {
        try {
            val freshLocation = api.getLocation(id)
            locationDao.insert(mapDtoToEntity(freshLocation))
            Result.success(mapDtoToLocation(freshLocation))
        } catch (e: Exception) {
            val cachedLocation = locationDao.getLocationById(id)
            if (cachedLocation != null) {
                Result.success(mapEntityToLocation(cachedLocation))
            } else {
                Result.failure(e)
            }
        }
    }

    override suspend fun refreshLocations() = withContext(Dispatchers.IO) {
        val locations = api.getLocations()
        val entities = locations.map { mapDtoToEntity(it) }
        locationDao.deleteAll()
        locationDao.insertAll(entities)
    }

    override suspend fun updateDndStatus(locationId: String, enabled: Boolean): Result<Location> = withContext(Dispatchers.IO) {
        try {
            // Note: API does not seem to have a DND update endpoint.
            // This will only update the local database.
            // For a real-world scenario, we'd need a `PUT /locations/{id}/dnd` endpoint.
            locationDao.updateDndStatus(locationId, enabled)
            val updated = locationDao.getLocationById(locationId)
                ?: return@withContext Result.failure(Exception("Location not found after update"))
            Result.success(mapEntityToLocation(updated))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun mapDtoToLocation(dto: LocationDto): Location {
        return Location(
            id = dto.id,
            name = dto.name,
            type = mapLocationType(dto.type),
            deck = dto.floor, // Backend uses 'floor' instead of 'deck'
            description = dto.description,
            imageUrl = dto.image, // Backend uses 'image' instead of 'imageUrl'
            isDndEnabled = dto.doNotDisturb, // Backend uses 'doNotDisturb'
            sortOrder = 0 // Backend doesn't provide sortOrder, use default
        )
    }

    private fun mapEntityToLocation(entity: LocationEntity): Location {
        return Location(
            id = entity.id,
            name = entity.name,
            type = mapLocationType(entity.type),
            deck = entity.deck,
            description = entity.description,
            imageUrl = entity.imageUrl,
            isDndEnabled = entity.isDndEnabled,
            sortOrder = entity.sortOrder
        )
    }

    private fun mapDtoToEntity(dto: LocationDto): LocationEntity {
        return LocationEntity(
            id = dto.id,
            name = dto.name,
            type = dto.type,
            deck = dto.floor, // Backend uses 'floor' instead of 'deck'
            description = dto.description,
            imageUrl = dto.image, // Backend uses 'image' instead of 'imageUrl'
            isDndEnabled = dto.doNotDisturb, // Backend uses 'doNotDisturb'
            sortOrder = 0, // Backend doesn't provide sortOrder, use default
            lastSyncedAt = Instant.now()
        )
    }

    private fun mapLocationType(type: String): LocationType {
        return try {
            LocationType.valueOf(type.uppercase().replace("-", "_"))
        } catch (e: IllegalArgumentException) {
            LocationType.OTHER
        }
    }
}