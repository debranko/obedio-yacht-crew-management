package com.example.obediowear.utils

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.os.Looper
import android.util.Log
import com.google.android.gms.location.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Manages GPS location tracking on Wear OS.
 * Provides high-accuracy location updates for yacht positioning.
 */
class GPSLocationManager(private val context: Context) {

    private val TAG = "GPSLocationManager"

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    private var locationCallback: LocationCallback? = null

    // Current location state
    private val _currentLocation = MutableStateFlow<Location?>(null)
    val currentLocation: StateFlow<Location?> = _currentLocation.asStateFlow()

    // GPS status
    private val _isTracking = MutableStateFlow(false)
    val isTracking: StateFlow<Boolean> = _isTracking.asStateFlow()

    /**
     * Start GPS tracking with high accuracy.
     * Updates every 30 seconds or when yacht moves 10 meters.
     */
    @SuppressLint("MissingPermission")
    fun startTracking() {
        if (_isTracking.value) {
            Log.d(TAG, "GPS tracking already active")
            return
        }

        Log.i(TAG, "Starting GPS tracking...")

        // Configure location request for yacht use case
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            30_000L // Update every 30 seconds
        ).apply {
            setMinUpdateDistanceMeters(10f) // Update if yacht moves 10+ meters
            setGranularity(Granularity.GRANULARITY_PERMISSION_LEVEL)
            setWaitForAccurateLocation(true)
        }.build()

        // Create callback for location updates
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    _currentLocation.value = location
                    Log.i(TAG, "📍 GPS updated: ${location.latitude}, ${location.longitude} (accuracy: ${location.accuracy}m)")
                }
            }

            override fun onLocationAvailability(availability: LocationAvailability) {
                if (!availability.isLocationAvailable) {
                    Log.w(TAG, "⚠️ GPS location not available")
                }
            }
        }

        // Request location updates
        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback!!,
                Looper.getMainLooper()
            ).addOnSuccessListener {
                _isTracking.value = true
                Log.i(TAG, "✅ GPS tracking started")
            }.addOnFailureListener { exception ->
                Log.e(TAG, "❌ Failed to start GPS tracking: ${exception.message}", exception)
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "❌ GPS permission not granted: ${e.message}")
        }
    }

    /**
     * Stop GPS tracking to save battery.
     */
    fun stopTracking() {
        if (!_isTracking.value) {
            Log.d(TAG, "GPS tracking not active")
            return
        }

        Log.i(TAG, "Stopping GPS tracking...")

        locationCallback?.let {
            fusedLocationClient.removeLocationUpdates(it)
        }

        _isTracking.value = false
        Log.i(TAG, "✅ GPS tracking stopped")
    }

    /**
     * Get last known location immediately (no waiting for update).
     */
    @SuppressLint("MissingPermission")
    fun getLastKnownLocation(callback: (Location?) -> Unit) {
        try {
            fusedLocationClient.lastLocation
                .addOnSuccessListener { location ->
                    if (location != null) {
                        _currentLocation.value = location
                        Log.d(TAG, "📍 Last known location: ${location.latitude}, ${location.longitude}")
                    } else {
                        Log.w(TAG, "No last known location available")
                    }
                    callback(location)
                }
                .addOnFailureListener { exception ->
                    Log.e(TAG, "Failed to get last known location: ${exception.message}")
                    callback(null)
                }
        } catch (e: SecurityException) {
            Log.e(TAG, "GPS permission not granted: ${e.message}")
            callback(null)
        }
    }
}
