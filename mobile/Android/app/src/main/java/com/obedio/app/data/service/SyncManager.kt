package com.obedio.app.data.service

import android.content.Context
import androidx.work.*
import com.obedio.app.data.api.ObedioApi
import com.obedio.app.data.local.dao.ServiceRequestDao
import com.obedio.app.data.local.dao.SyncQueueDao
import com.obedio.app.data.local.entity.SyncAction
import com.obedio.app.data.local.entity.SyncStatus
import com.obedio.app.data.local.entity.SyncQueueEntity
import com.obedio.app.data.local.TokenManager
import com.squareup.moshi.Moshi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import timber.log.Timber
import java.time.Duration
import java.time.Instant
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncManager @Inject constructor(
    private val context: Context,
    private val syncQueueDao: SyncQueueDao,
    private val serviceRequestDao: ServiceRequestDao,
    private val api: ObedioApi,
    private val tokenManager: TokenManager,
    private val moshi: Moshi
) {
    
    companion object {
        const val SYNC_WORK_TAG = "obedio_sync"
        const val PERIODIC_SYNC_WORK = "periodic_sync"
        const val ONE_TIME_SYNC_WORK = "one_time_sync"
        private const val MAX_RETRY_ATTEMPTS = 3
    }
    
    fun schedulePeriodiodicSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()
            
        val periodicWork = PeriodicWorkRequestBuilder<SyncWorker>(
            15, TimeUnit.MINUTES,
            5, TimeUnit.MINUTES // Flex interval
        )
            .setConstraints(constraints)
            .addTag(SYNC_WORK_TAG)
            .build()
            
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            PERIODIC_SYNC_WORK,
            ExistingPeriodicWorkPolicy.KEEP,
            periodicWork
        )
    }
    
    fun triggerOneTimeSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
            
        val oneTimeWork = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .addTag(SYNC_WORK_TAG)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                WorkRequest.MIN_BACKOFF_MILLIS,
                TimeUnit.MILLISECONDS
            )
            .build()
            
        WorkManager.getInstance(context).enqueueUniqueWork(
            ONE_TIME_SYNC_WORK,
            ExistingWorkPolicy.REPLACE,
            oneTimeWork
        )
    }
    
    suspend fun processSyncQueue(): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val token = tokenManager.getAccessToken()
            if (token.isNullOrBlank()) {
                return@withContext Result.failure(Exception("No auth token"))
            }
            
            val pendingItems = syncQueueDao.getPendingSyncWithRetries(MAX_RETRY_ATTEMPTS)
            var successCount = 0
            
            pendingItems.forEach { syncItem ->
                try {
                    when (syncItem.action) {
                        SyncAction.ACCEPT_REQUEST -> processAcceptRequest(syncItem)
                        SyncAction.COMPLETE_REQUEST -> processCompleteRequest(syncItem)
                        SyncAction.CANCEL_REQUEST -> processCancelRequest(syncItem)
                        SyncAction.CREATE -> processCreateEntity(syncItem)
                        SyncAction.UPDATE -> processUpdateEntity(syncItem)
                        SyncAction.DELETE -> processDeleteEntity(syncItem)
                    }
                    
                    // Success - remove from queue
                    syncQueueDao.deleteById(syncItem.id)
                    successCount++
                    
                    // Update local entity sync status
                    updateEntitySyncStatus(syncItem.entityType, syncItem.entityId, SyncStatus.SYNCED)
                    
                } catch (e: Exception) {
                    Timber.e(e, "Failed to sync item: ${syncItem.id}")
                    
                    // Update attempt count and error
                    syncQueueDao.updateAttempt(
                        id = syncItem.id,
                        attemptTime = Instant.now(),
                        error = e.message
                    )
                    
                    // If max attempts reached, update entity status to error
                    if (syncItem.attemptCount >= MAX_RETRY_ATTEMPTS - 1) {
                        updateEntitySyncStatus(syncItem.entityType, syncItem.entityId, SyncStatus.SYNC_ERROR)
                    }
                }
            }
            
            // Clean up failed items that exceeded max attempts
            syncQueueDao.deleteFailedItems(MAX_RETRY_ATTEMPTS)
            
            Result.success(successCount)
        } catch (e: Exception) {
            Timber.e(e, "Sync queue processing failed")
            Result.failure(e)
        }
    }
    
    suspend fun queueServiceRequestAccept(requestId: String, userId: String) {
        val data = mapOf("userId" to userId)
        val json = moshi.adapter<Map<String, String>>(Map::class.java).toJson(data)
        
        val syncItem = SyncQueueEntity(
            action = SyncAction.ACCEPT_REQUEST,
            entityType = "SERVICE_REQUEST",
            entityId = requestId,
            data = json,
            createdAt = Instant.now()
        )
        
        syncQueueDao.insert(syncItem)
        
        // Update local status immediately
        serviceRequestDao.updateSyncStatus(requestId, SyncStatus.PENDING_SYNC)
    }
    
    suspend fun queueServiceRequestComplete(requestId: String) {
        val syncItem = SyncQueueEntity(
            action = SyncAction.COMPLETE_REQUEST,
            entityType = "SERVICE_REQUEST",
            entityId = requestId,
            data = "{}",
            createdAt = Instant.now()
        )
        
        syncQueueDao.insert(syncItem)
        serviceRequestDao.updateSyncStatus(requestId, SyncStatus.PENDING_SYNC)
    }
    
    private suspend fun processAcceptRequest(syncItem: SyncQueueEntity) {
        val data = moshi.adapter<Map<String, String>>(Map::class.java).fromJson(syncItem.data)
        val userId = data?.get("userId") ?: throw Exception("No userId in sync data")
        
        api.acceptServiceRequest(
            syncItem.entityId,
            com.obedio.app.data.api.dto.AcceptRequestDto(userId)
        )
    }
    
    private suspend fun processCompleteRequest(syncItem: SyncQueueEntity) {
        api.completeServiceRequest(syncItem.entityId)
    }
    
    private suspend fun processCancelRequest(syncItem: SyncQueueEntity) {
        api.cancelServiceRequest(syncItem.entityId)
    }
    
    private suspend fun processCreateEntity(syncItem: SyncQueueEntity) {
        when (syncItem.entityType) {
            "SERVICE_REQUEST" -> {
                val request = moshi.adapter(com.obedio.app.data.api.dto.ServiceRequestDto::class.java)
                    .fromJson(syncItem.data)
                    ?: throw Exception("Failed to parse service request")
                api.createServiceRequest(request)
            }
            // Add other entity types as needed
        }
    }
    
    private suspend fun processUpdateEntity(syncItem: SyncQueueEntity) {
        when (syncItem.entityType) {
            "SERVICE_REQUEST" -> {
                val request = moshi.adapter(com.obedio.app.data.api.dto.ServiceRequestDto::class.java)
                    .fromJson(syncItem.data)
                    ?: throw Exception("Failed to parse service request")
                api.updateServiceRequest(syncItem.entityId, request)
            }
            // Add other entity types as needed
        }
    }
    
    private suspend fun processDeleteEntity(syncItem: SyncQueueEntity) {
        // Implement delete operations if needed
    }
    
    private suspend fun updateEntitySyncStatus(entityType: String, entityId: String, status: SyncStatus) {
        when (entityType) {
            "SERVICE_REQUEST" -> serviceRequestDao.updateSyncStatus(entityId, status)
            // Add other entity types as needed
        }
    }
}

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters,
    private val syncManager: SyncManager
) : CoroutineWorker(appContext, workerParams) {
    
    override suspend fun doWork(): Result {
        Timber.d("Starting sync work")
        
        return try {
            val result = syncManager.processSyncQueue()
            
            result.fold(
                onSuccess = { count ->
                    Timber.d("Synced $count items successfully")
                    Result.success()
                },
                onFailure = { error ->
                    Timber.e(error, "Sync failed")
                    if (runAttemptCount < 3) {
                        Result.retry()
                    } else {
                        Result.failure()
                    }
                }
            )
        } catch (e: Exception) {
            Timber.e(e, "Unexpected sync error")
            Result.failure()
        }
    }
}