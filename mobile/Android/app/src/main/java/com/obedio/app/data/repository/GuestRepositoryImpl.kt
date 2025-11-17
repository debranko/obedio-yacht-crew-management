package com.obedio.app.data.repository

import com.obedio.app.data.api.ObedioApi
import com.obedio.app.data.api.dto.GuestDto
import com.obedio.app.data.local.dao.GuestDao
import com.obedio.app.data.local.entity.GuestEntity
import com.obedio.app.domain.model.*
import com.obedio.app.domain.repository.GuestRepository
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.LocalDate
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GuestRepositoryImpl @Inject constructor(
    private val api: ObedioApi,
    private val guestDao: GuestDao,
    private val moshi: Moshi
) : GuestRepository {

    override fun getGuests(): Flow<List<Guest>> = flow {
        // First emit cached data
        val cachedGuests = guestDao.getAllGuests().map { entities -> entities.map { mapEntityToGuest(it) } }
        emit(cachedGuests.first())

        // Then fetch fresh data
        try {
            val freshGuests = api.getGuests()
            val entities = freshGuests.map { mapDtoToEntity(it) }
            guestDao.insertAll(entities)
            // The flow from Room will automatically emit the new list
        } catch (e: Exception) {
            // If network fails, the UI still has the cached data
            // You might want to log this error or show a non-intrusive notification
        }
    }

    override suspend fun getGuest(id: String): Result<Guest> = withContext(Dispatchers.IO) {
        try {
            // Try an aggressive refresh from network first
            val freshGuest = api.getGuest(id)
            guestDao.insert(mapDtoToEntity(freshGuest))
            Result.success(mapDtoToGuest(freshGuest))
        } catch (e: Exception) {
            // If network fails, fall back to cache
            val cachedGuest = guestDao.getGuestById(id)
            if (cachedGuest != null) {
                Result.success(mapEntityToGuest(cachedGuest))
            } else {
                Result.failure(e)
            }
        }
    }

    override suspend fun refreshGuests() = withContext(Dispatchers.IO) {
        val guests = api.getGuests()
        val entities = guests.map { mapDtoToEntity(it) }
        guestDao.deleteAll()
        guestDao.insertAll(entities)
    }

    override suspend fun searchGuests(query: String): List<Guest> = withContext(Dispatchers.IO) {
        val searchQuery = "%$query%"
        val entities = guestDao.searchGuests(searchQuery).first()
        entities.map { mapEntityToGuest(it) }
    }

    override suspend fun updateGuestStatus(guestId: String, status: String): Result<Guest> = withContext(Dispatchers.IO) {
        try {
            // API doesn't have a specific update endpoint, so we fetch and re-insert
            // This is not ideal, but it's what the current API allows
            val updatedGuestDto = api.getGuest(guestId)
            
            // Create a new DTO with the updated status to ensure consistency
            val dtoWithNewStatus = updatedGuestDto.copy(status = status)

            // Update local cache
            guestDao.updateGuestStatus(guestId, status)
            
            Result.success(mapDtoToGuest(dtoWithNewStatus))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun mapDtoToGuest(dto: GuestDto): Guest {
        // Safe parsing of dates
        val arrival = try { dto.checkInDate?.let { LocalDate.parse(it.substring(0, 10)) } } catch (e: Exception) { null }
        val departure = try { dto.checkOutDate?.let { LocalDate.parse(it.substring(0, 10)) } } catch (e: Exception) { null }

        return Guest(
            id = dto.id,
            firstName = dto.firstName,
            lastName = dto.lastName,
            title = dto.preferredName, // Use preferredName as title
            cabin = dto.locationId, // Use locationId as cabin identifier
            locationId = dto.locationId,
            status = mapGuestStatus(dto.status),
            type = mapGuestType(dto.type),
            allergies = dto.allergies ?: emptyList(),
            dietaryRestrictions = dto.dietaryRestrictions ?: emptyList(),
            preferences = dto.preferences?.let { parsePreferences(it) },
            notes = dto.notes,
            photoUrl = dto.photo,
            phoneNumber = dto.emergencyContactPhone, // Use emergency contact phone
            email = null, // Backend doesn't provide email
            arrivalDate = arrival,
            departureDate = departure
        )
    }

    private fun mapEntityToGuest(entity: GuestEntity): Guest {
        // Safe parsing of dates
        val arrival = try { entity.arrivalDate?.let { LocalDate.parse(it.substring(0, 10)) } } catch (e: Exception) { null }
        val departure = try { entity.departureDate?.let { LocalDate.parse(it.substring(0, 10)) } } catch (e: Exception) { null }

        return Guest(
            id = entity.id,
            firstName = entity.firstName,
            lastName = entity.lastName,
            title = entity.title,
            cabin = entity.cabin,
            locationId = entity.locationId,
            status = mapGuestStatus(entity.status),
            type = entity.type?.let { mapGuestType(it) },
            allergies = parseJsonArray(entity.allergies),
            dietaryRestrictions = parseJsonArray(entity.dietaryRestrictions),
            preferences = entity.preferences?.let { parsePreferences(it) },
            notes = entity.notes,
            photoUrl = entity.photoUrl,
            phoneNumber = entity.phoneNumber,
            email = entity.email,
            arrivalDate = arrival,
            departureDate = departure
        )
    }

    private fun mapDtoToEntity(dto: GuestDto): GuestEntity {
        // Convert List to JSON string for storage
        val allergiesJson = dto.allergies?.let {
            val adapter = moshi.adapter<List<String>>(Types.newParameterizedType(List::class.java, String::class.java))
            adapter.toJson(it)
        }
        val dietaryJson = dto.dietaryRestrictions?.let {
            val adapter = moshi.adapter<List<String>>(Types.newParameterizedType(List::class.java, String::class.java))
            adapter.toJson(it)
        }

        return GuestEntity(
            id = dto.id,
            firstName = dto.firstName,
            lastName = dto.lastName,
            title = dto.preferredName, // Use preferredName as title
            cabin = dto.locationId, // Use locationId as cabin
            locationId = dto.locationId,
            status = dto.status,
            type = dto.type,
            allergies = allergiesJson,
            dietaryRestrictions = dietaryJson,
            preferences = dto.preferences,
            notes = dto.notes,
            photoUrl = dto.photo,
            phoneNumber = dto.emergencyContactPhone,
            email = null, // Backend doesn't provide email
            arrivalDate = dto.checkInDate,
            departureDate = dto.checkOutDate,
            lastSyncedAt = Instant.now()
        )
    }

    private fun mapGuestStatus(status: String): GuestStatus {
        return when (status.uppercase()) {
            "ONBOARD" -> GuestStatus.ONBOARD
            "DEPARTED" -> GuestStatus.DEPARTED
            else -> GuestStatus.DEPARTED
        }
    }

    private fun mapGuestType(type: String): GuestType {
        return when (type.uppercase()) {
            "OWNER" -> GuestType.OWNER
            "VIP" -> GuestType.VIP
            "CHARTER_GUEST", "CHARTER-GUEST" -> GuestType.CHARTER_GUEST
            "FRIENDS_FAMILY", "FRIENDS-FAMILY" -> GuestType.FRIENDS_FAMILY
            "VISITOR" -> GuestType.VISITOR
            "CREW_GUEST", "CREW-GUEST" -> GuestType.CREW_GUEST
            else -> GuestType.CHARTER_GUEST
        }
    }

    private fun parseJsonArray(json: String?): List<String> {
        if (json.isNullOrBlank() || json == "[]" || json == "null") return emptyList()
        
        return try {
            val type = Types.newParameterizedType(List::class.java, String::class.java)
            val adapter = moshi.adapter<List<String>>(type)
            adapter.fromJson(json) ?: emptyList()
        } catch (e: Exception) {
            // Fallback for simple comma-separated string
            json.removeSurrounding("[", "]").split(",").map { it.trim() }
        }
    }

    private fun parsePreferences(json: String): GuestPreferences? {
        return try {
            val adapter = moshi.adapter(GuestPreferences::class.java)
            adapter.fromJson(json)
        } catch (e: Exception) {
            null
        }
    }
}