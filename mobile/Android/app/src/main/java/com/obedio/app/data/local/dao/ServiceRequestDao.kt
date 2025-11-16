package com.obedio.app.data.local.dao

import androidx.room.*
import com.obedio.app.data.local.entity.ServiceRequestEntity
import com.obedio.app.data.local.entity.SyncStatus
import kotlinx.coroutines.flow.Flow
import java.time.Instant

@Dao
interface ServiceRequestDao {
    
    @Query("SELECT * FROM service_requests WHERE status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY priority DESC, createdAt ASC")
    fun getActiveRequests(): Flow<List<ServiceRequestEntity>>
    
    @Query("SELECT * FROM service_requests ORDER BY createdAt DESC")
    fun getAllRequests(): Flow<List<ServiceRequestEntity>>
    
    @Query("SELECT * FROM service_requests WHERE id = :id")
    suspend fun getRequestById(id: String): ServiceRequestEntity?
    
    @Query("SELECT * FROM service_requests WHERE status = :status")
    fun getRequestsByStatus(status: String): Flow<List<ServiceRequestEntity>>
    
    @Query("SELECT * FROM service_requests WHERE assignedToId = :userId AND status NOT IN ('COMPLETED', 'CANCELLED')")
    fun getMyActiveRequests(userId: String): Flow<List<ServiceRequestEntity>>
    
    @Query("SELECT * FROM service_requests WHERE syncStatus = :syncStatus")
    suspend fun getRequestsBySyncStatus(syncStatus: SyncStatus): List<ServiceRequestEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(request: ServiceRequestEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(requests: List<ServiceRequestEntity>)
    
    @Update
    suspend fun update(request: ServiceRequestEntity)
    
    @Query("UPDATE service_requests SET status = :status, acceptedAt = :acceptedAt, assignedToId = :assignedToId, syncStatus = :syncStatus WHERE id = :id")
    suspend fun acceptRequest(id: String, status: String, acceptedAt: Instant, assignedToId: String, syncStatus: SyncStatus)
    
    @Query("UPDATE service_requests SET status = :status, completedAt = :completedAt, syncStatus = :syncStatus WHERE id = :id")
    suspend fun completeRequest(id: String, status: String, completedAt: Instant, syncStatus: SyncStatus)
    
    @Query("UPDATE service_requests SET syncStatus = :syncStatus WHERE id = :id")
    suspend fun updateSyncStatus(id: String, syncStatus: SyncStatus)
    
    @Delete
    suspend fun delete(request: ServiceRequestEntity)
    
    @Query("DELETE FROM service_requests")
    suspend fun deleteAll()
    
    @Query("DELETE FROM service_requests WHERE createdAt < :beforeDate AND status IN ('COMPLETED', 'CANCELLED')")
    suspend fun deleteOldCompletedRequests(beforeDate: Instant)
}