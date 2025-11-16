package com.obedio.app.data.local.dao

import androidx.room.*
import com.obedio.app.data.local.entity.LocationEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface LocationDao {
    
    @Query("SELECT * FROM locations ORDER BY sortOrder, name")
    fun getAllLocations(): Flow<List<LocationEntity>>
    
    @Query("SELECT * FROM locations WHERE type = :type ORDER BY sortOrder, name")
    fun getLocationsByType(type: String): Flow<List<LocationEntity>>
    
    @Query("SELECT * FROM locations WHERE id = :id")
    suspend fun getLocationById(id: String): LocationEntity?
    
    @Query("SELECT * FROM locations WHERE deck = :deck ORDER BY sortOrder, name")
    fun getLocationsByDeck(deck: String): Flow<List<LocationEntity>>
    
    @Query("SELECT * FROM locations WHERE isDndEnabled = 1")
    fun getDndEnabledLocations(): Flow<List<LocationEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(location: LocationEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(locations: List<LocationEntity>)
    
    @Update
    suspend fun update(location: LocationEntity)
    
    @Query("UPDATE locations SET isDndEnabled = :enabled WHERE id = :id")
    suspend fun updateDndStatus(id: String, enabled: Boolean)
    
    @Delete
    suspend fun delete(location: LocationEntity)
    
    @Query("DELETE FROM locations")
    suspend fun deleteAll()
}