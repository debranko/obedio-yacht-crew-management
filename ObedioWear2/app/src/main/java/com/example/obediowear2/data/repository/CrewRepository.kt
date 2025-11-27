package com.example.obediowear2.data.repository

import android.util.Log
import com.example.obediowear2.data.api.ApiClient
import com.example.obediowear2.data.model.CrewMember
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for crew member operations.
 */
class CrewRepository {

    private val api = ApiClient.instance

    companion object {
        private const val TAG = "CrewRepository"
    }

    /**
     * Get on-duty crew members.
     */
    suspend fun getOnDutyCrew(): Result<List<CrewMember>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getCrewMembers(status = "on-duty")
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch crew"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching crew: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Get all crew members.
     */
    suspend fun getAllCrew(): Result<List<CrewMember>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getCrewMembers()
            if (response.success) {
                Result.success(response.data)
            } else {
                Result.failure(Exception("Failed to fetch all crew"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching all crew: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Get next on-duty crew member for delegation (round-robin).
     */
    suspend fun getNextOnDutyCrew(currentCrewId: String): CrewMember? {
        return try {
            val result = getOnDutyCrew()
            if (result.isSuccess) {
                val onDutyCrew = result.getOrNull() ?: return null
                val currentIndex = onDutyCrew.indexOfFirst { it.id == currentCrewId }

                if (onDutyCrew.size > 1 && currentIndex >= 0) {
                    val nextIndex = (currentIndex + 1) % onDutyCrew.size
                    onDutyCrew[nextIndex]
                } else if (onDutyCrew.isNotEmpty() && currentIndex < 0) {
                    onDutyCrew.first()
                } else {
                    null
                }
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting next crew: ${e.message}", e)
            null
        }
    }
}
