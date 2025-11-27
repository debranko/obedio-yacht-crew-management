package com.example.obediowear2.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import com.example.obediowear2.data.model.ShakeSensitivity
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlin.math.sqrt

/**
 * Detects shake gestures using the accelerometer.
 * Used for "Shake to Delegate" feature.
 */
class ShakeDetector(
    private val context: Context,
    private var sensitivity: ShakeSensitivity = ShakeSensitivity.MEDIUM
) : SensorEventListener {

    companion object {
        private const val TAG = "ShakeDetector"
        private const val SHAKE_TIME_WINDOW_MS = 500L  // Time window for shake detection
        private const val MIN_TIME_BETWEEN_SHAKES_MS = 1000L  // Cooldown between shakes
    }

    private val sensorManager: SensorManager =
        context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

    private val accelerometer: Sensor? =
        sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

    // Shake detected flow
    private val _shakeDetected = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val shakeDetected = _shakeDetected.asSharedFlow()

    // State tracking
    private var lastShakeTime: Long = 0
    private var lastAcceleration: Float = SensorManager.GRAVITY_EARTH
    private var currentAcceleration: Float = SensorManager.GRAVITY_EARTH
    private var acceleration: Float = 0f

    private var isRunning = false

    /**
     * Get threshold based on sensitivity level.
     */
    private val threshold: Float
        get() = sensitivity.getThreshold()

    /**
     * Update sensitivity level.
     */
    fun setSensitivity(newSensitivity: ShakeSensitivity) {
        sensitivity = newSensitivity
        Log.d(TAG, "Shake sensitivity updated to: $newSensitivity (threshold: ${sensitivity.getThreshold()})")
    }

    /**
     * Start listening for shake events.
     */
    fun start() {
        if (isRunning) {
            Log.d(TAG, "ShakeDetector already running")
            return
        }

        accelerometer?.let { sensor ->
            sensorManager.registerListener(
                this,
                sensor,
                SensorManager.SENSOR_DELAY_UI  // ~60Hz, good balance of power and responsiveness
            )
            isRunning = true
            Log.i(TAG, "ShakeDetector started (sensitivity: $sensitivity)")
        } ?: run {
            Log.e(TAG, "No accelerometer available on this device")
        }
    }

    /**
     * Stop listening for shake events.
     */
    fun stop() {
        if (!isRunning) return

        sensorManager.unregisterListener(this)
        isRunning = false
        Log.i(TAG, "ShakeDetector stopped")
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_ACCELEROMETER) return

        // Get accelerometer values
        val x = event.values[0]
        val y = event.values[1]
        val z = event.values[2]

        // Calculate magnitude of acceleration
        lastAcceleration = currentAcceleration
        currentAcceleration = sqrt(x * x + y * y + z * z)

        // Calculate delta (change in acceleration)
        val delta = currentAcceleration - lastAcceleration

        // Apply low-pass filter to smooth readings
        acceleration = acceleration * 0.9f + delta

        // Check if shake threshold exceeded
        if (acceleration > threshold) {
            val currentTime = System.currentTimeMillis()

            // Apply cooldown to prevent multiple triggers
            if (currentTime - lastShakeTime > MIN_TIME_BETWEEN_SHAKES_MS) {
                lastShakeTime = currentTime
                onShakeDetected()
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Not used
    }

    private fun onShakeDetected() {
        Log.i(TAG, "Shake detected! (acceleration: $acceleration, threshold: $threshold)")
        _shakeDetected.tryEmit(Unit)
    }

    /**
     * Check if accelerometer is available.
     */
    fun isAvailable(): Boolean = accelerometer != null
}
