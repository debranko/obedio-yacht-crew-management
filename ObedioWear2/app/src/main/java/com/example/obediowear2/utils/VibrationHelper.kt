package com.example.obediowear2.utils

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.example.obediowear2.data.model.Priority
import com.example.obediowear2.data.model.VibrationLevel

/**
 * Helper class for vibration patterns based on request priority and settings.
 */
class VibrationHelper(private val context: Context) {

    private val vibrator: Vibrator by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager =
                context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    /**
     * Vibrate based on request priority
     */
    fun vibrateForRequest(priority: Priority, level: VibrationLevel = VibrationLevel.MEDIUM) {
        if (!vibrator.hasVibrator()) return

        val amplitude = level.getAmplitude()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val (pattern, amplitudes) = when (priority) {
                Priority.EMERGENCY -> Pair(
                    longArrayOf(0, 400, 200, 400, 200, 400, 500),
                    intArrayOf(0, amplitude, 0, amplitude, 0, amplitude, 0)
                )
                Priority.URGENT -> Pair(
                    longArrayOf(0, 250, 150, 250, 150, 250),
                    intArrayOf(0, amplitude, 0, amplitude, 0, amplitude)
                )
                else -> Pair(
                    longArrayOf(0, 150, 100, 150),
                    intArrayOf(0, amplitude, 0, amplitude)
                )
            }

            val effect = VibrationEffect.createWaveform(pattern, amplitudes, -1)
            vibrator.vibrate(effect)
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(500)
        }
    }

    /**
     * Emergency continuous vibration (repeating pattern)
     */
    fun startEmergencyVibration() {
        if (!vibrator.hasVibrator()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val pattern = longArrayOf(0, 400, 200, 400, 200, 400, 500)
            val amplitudes = intArrayOf(0, 255, 0, 255, 0, 255, 0)

            val effect = VibrationEffect.createWaveform(pattern, amplitudes, 0) // 0 = repeat from start
            vibrator.vibrate(effect)
        } else {
            @Suppress("DEPRECATION")
            val pattern = longArrayOf(0, 400, 200, 400, 200, 400, 500)
            vibrator.vibrate(pattern, 0)
        }
    }

    /**
     * Stop any ongoing vibration
     */
    fun stopVibration() {
        vibrator.cancel()
    }

    /**
     * Single tick haptic (for rotary input)
     */
    fun tick() {
        if (!vibrator.hasVibrator()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK))
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(10, 50))
        }
    }

    /**
     * Click haptic (for page snap)
     */
    fun click() {
        if (!vibrator.hasVibrator()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(25, 100))
        }
    }

    /**
     * Double click haptic (for center page/home)
     */
    fun doubleClick() {
        if (!vibrator.hasVibrator()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_DOUBLE_CLICK))
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val pattern = longArrayOf(0, 30, 50, 30)
            val amplitudes = intArrayOf(0, 100, 0, 100)
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, amplitudes, -1))
        }
    }

    /**
     * Heavy click haptic (for edge bounce)
     */
    fun heavyClick() {
        if (!vibrator.hasVibrator()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK))
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(40, 200))
        }
    }

    /**
     * Success haptic (for delegation complete, etc.)
     */
    fun success() {
        if (!vibrator.hasVibrator()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val pattern = longArrayOf(0, 50, 100, 50)
            val amplitudes = intArrayOf(0, 80, 0, 150)
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, amplitudes, -1))
        }
    }
}
