package com.obedio.app.data.local.dao

import androidx.room.*
import com.obedio.app.data.local.entity.SyncQueueEntity
import com.obedio.app.data.local.entity.SyncAction
import kotlinx.coroutines.flow.Flow

@Dao
interface SyncQueueDao {
    
    @Query("SELECT * FROM sync_queue ORDER BY createdAt ASC")
    suspend fun getAllPendingSync(): List<SyncQueueEntity>
    
    @Query("SELECT * FROM sync_queue WHERE attemptCount < :maxAttempts ORDER BY createdAt ASC LIMIT :limit")
    suspend fun getPendingSyncWithRetries(maxAttempts: Int = 3, limit: Int = 10): List<SyncQueueEntity>
    
    @Query("SELECT COUNT(*) FROM sync_queue")
    fun getPendingCount(): Flow<Int>
    
    @Query("SELECT * FROM sync_queue WHERE id = :id")
    suspend fun getSyncItemById(id: Long): SyncQueueEntity?
    
    @Insert
    suspend fun insert(syncItem: SyncQueueEntity): Long
    
    @Update
    suspend fun update(syncItem: SyncQueueEntity)
    
    @Query("UPDATE sync_queue SET attemptCount = attemptCount + 1, lastAttemptAt = :attemptTime, errorMessage = :error WHERE id = :id")
    suspend fun updateAttempt(id: Long, attemptTime: java.time.Instant, error: String?)
    
    @Delete
    suspend fun delete(syncItem: SyncQueueEntity)
    
    @Query("DELETE FROM sync_queue WHERE id = :id")
    suspend fun deleteById(id: Long)
    
    @Query("DELETE FROM sync_queue WHERE entityType = :entityType AND entityId = :entityId")
    suspend fun deleteByEntity(entityType: String, entityId: String)
    
    @Query("DELETE FROM sync_queue WHERE attemptCount >= :maxAttempts")
    suspend fun deleteFailedItems(maxAttempts: Int = 3)
    
    @Query("DELETE FROM sync_queue")
    suspend fun deleteAll()
}