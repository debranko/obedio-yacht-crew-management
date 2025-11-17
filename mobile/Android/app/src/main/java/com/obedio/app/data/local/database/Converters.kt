package com.obedio.app.data.local.database

import androidx.room.TypeConverter
import com.obedio.app.data.local.entity.SyncAction
import com.obedio.app.data.local.entity.SyncStatus
import java.time.Instant

class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): Instant? {
        return value?.let { Instant.ofEpochMilli(it) }
    }

    @TypeConverter
    fun dateToTimestamp(instant: Instant?): Long? {
        return instant?.toEpochMilli()
    }

    @TypeConverter
    fun fromSyncStatus(status: SyncStatus): String {
        return status.name
    }

    @TypeConverter
    fun toSyncStatus(status: String): SyncStatus {
        return SyncStatus.valueOf(status)
    }

    @TypeConverter
    fun fromSyncAction(action: SyncAction): String {
        return action.name
    }

    @TypeConverter
    fun toSyncAction(action: String): SyncAction {
        return SyncAction.valueOf(action)
    }
}