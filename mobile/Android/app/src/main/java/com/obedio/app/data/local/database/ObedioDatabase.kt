package com.obedio.app.data.local.database

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import android.content.Context
import com.obedio.app.data.local.dao.ServiceRequestDao
import com.obedio.app.data.local.dao.GuestDao
import com.obedio.app.data.local.dao.LocationDao
import com.obedio.app.data.local.dao.SyncQueueDao
import com.obedio.app.data.local.entity.*

@Database(
    entities = [
        ServiceRequestEntity::class,
        GuestEntity::class,
        LocationEntity::class,
        SyncQueueEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class ObedioDatabase : RoomDatabase() {
    
    abstract fun serviceRequestDao(): ServiceRequestDao
    abstract fun guestDao(): GuestDao
    abstract fun locationDao(): LocationDao
    abstract fun syncQueueDao(): SyncQueueDao
    
    companion object {
        @Volatile
        private var INSTANCE: ObedioDatabase? = null
        
        fun getInstance(context: Context): ObedioDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ObedioDatabase::class.java,
                    "obedio_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}