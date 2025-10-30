package com.example.obediowear.utils

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.example.obediowear.data.model.Priority

/**
 * Helper class for vibration patterns based on request priority
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
    fun vibrateForRequest(priority: Priority) {
        if (!vibrator.hasVibrator()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val pattern = when (priority) {
                Priority.EMERGENCY -> longArrayOf(
                    0, 400, 200, 400, 200, 400  // Long bursts (3x)
                )
                Priority.URGENT -> longArrayOf(
                    0, 250, 150, 250, 150, 250  // Medium bursts (3x)
                )
                else -> longArrayOf(
                    0, 150, 100, 150  // Short bursts (2x)
                )
            }

            val effect = VibrationEffect.createWaveform(pattern, -1) // -1 = no repeat
            vibrator.vibrate(effect)
        } else {
            // Fallback for older devices
            @Suppress("DEPRECATION")
            vibrator.vibrate(500)
        }
    }
}
