package com.obedio.app.data.local.dao

import androidx.room.*
import com.obedio.app.data.local.entity.GuestEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface GuestDao {
    
    @Query("SELECT * FROM guests ORDER BY firstName, lastName")
    fun getAllGuests(): Flow<List<GuestEntity>>
    
    @Query("SELECT * FROM guests WHERE status = 'ONBOARD' ORDER BY firstName, lastName")
    fun getOnboardGuests(): Flow<List<GuestEntity>>
    
    @Query("SELECT * FROM guests WHERE id = :id")
    suspend fun getGuestById(id: String): GuestEntity?
    
    @Query("SELECT * FROM guests WHERE firstName LIKE :query OR lastName LIKE :query OR cabin LIKE :query")
    fun searchGuests(query: String): Flow<List<GuestEntity>>
    
    @Query("SELECT * FROM guests WHERE type = :type")
    fun getGuestsByType(type: String): Flow<List<GuestEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(guest: GuestEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(guests: List<GuestEntity>)
    
    @Update
    suspend fun update(guest: GuestEntity)
    
    @Delete
    suspend fun delete(guest: GuestEntity)
    
    @Query("DELETE FROM guests")
    suspend fun deleteAll()
    
    @Query("UPDATE guests SET status = :status WHERE id = :id")
    suspend fun updateGuestStatus(id: String, status: String)
}