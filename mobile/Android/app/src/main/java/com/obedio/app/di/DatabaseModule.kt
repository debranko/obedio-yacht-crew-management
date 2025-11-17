package com.obedio.app.di

import android.content.Context
import com.obedio.app.data.local.dao.*
import com.obedio.app.data.local.database.ObedioDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideObedioDatabase(
        @ApplicationContext context: Context
    ): ObedioDatabase {
        return ObedioDatabase.getInstance(context)
    }

    @Provides
    fun provideServiceRequestDao(database: ObedioDatabase): ServiceRequestDao {
        return database.serviceRequestDao()
    }

    @Provides
    fun provideGuestDao(database: ObedioDatabase): GuestDao {
        return database.guestDao()
    }

    @Provides
    fun provideLocationDao(database: ObedioDatabase): LocationDao {
        return database.locationDao()
    }

    @Provides
    fun provideSyncQueueDao(database: ObedioDatabase): SyncQueueDao {
        return database.syncQueueDao()
    }
}