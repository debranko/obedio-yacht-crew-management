package com.example.obediowear2.haptics

import android.content.Context
import com.example.obediowear2.data.model.Priority
import com.example.obediowear2.data.model.VibrationLevel
import com.example.obediowear2.utils.VibrationHelper

/**
 * Centralized haptic feedback manager for the app.
 * Provides consistent haptic patterns for various interactions.
 */
class HapticFeedbackManager(context: Context) {

    private val vibrationHelper = VibrationHelper(context)
    private var vibrationLevel: VibrationLevel = VibrationLevel.MEDIUM

    /**
     * Update the vibration intensity level.
     */
    fun setVibrationLevel(level: VibrationLevel) {
        vibrationLevel = level
    }

    // ============ NAVIGATION HAPTICS ============

    /**
     * Rotary tick - subtle detent feeling.
     * Use when rotary crown moves one step.
     */
    fun onRotaryTick() {
        vibrationHelper.tick()
    }

    /**
     * Page snap - satisfying click on page change.
     * Use when pager settles on a new page.
     */
    fun onPageSnap() {
        vibrationHelper.click()
    }

    /**
     * Home page reached - double click confirmation.
     * Use when returning to center/radar page.
     */
    fun onHomePage() {
        vibrationHelper.doubleClick()
    }

    /**
     * Edge bounce - boundary warning.
     * Use when user tries to scroll past first/last page.
     */
    fun onEdgeBounce() {
        vibrationHelper.heavyClick()
    }

    /**
     * List item focus - selection feedback.
     * Use when scrolling through list items.
     */
    fun onListItemFocus() {
        vibrationHelper.tick()
    }

    // ============ NOTIFICATION HAPTICS ============

    /**
     * New request notification.
     * Pattern varies by priority.
     */
    fun onNewRequest(priority: Priority) {
        vibrationHelper.vibrateForRequest(priority, vibrationLevel)
    }

    /**
     * Start emergency alarm (continuous).
     * Use for emergency requests.
     */
    fun startEmergencyAlarm() {
        vibrationHelper.startEmergencyVibration()
    }

    /**
     * Stop any ongoing vibration.
     */
    fun stopVibration() {
        vibrationHelper.stopVibration()
    }

    // ============ ACTION HAPTICS ============

    /**
     * Success feedback.
     * Use after successful actions (accept, delegate, complete).
     */
    fun onSuccess() {
        vibrationHelper.success()
    }

    /**
     * Button click feedback.
     * Use for button presses.
     */
    fun onButtonClick() {
        vibrationHelper.click()
    }

    /**
     * Error/warning feedback.
     * Use for errors or blocked actions.
     */
    fun onError() {
        vibrationHelper.heavyClick()
    }

    // ============ SHAKE DETECTION ============

    /**
     * Shake detected feedback.
     * Use when shake gesture is detected.
     */
    fun onShakeDetected() {
        vibrationHelper.doubleClick()
    }
}
