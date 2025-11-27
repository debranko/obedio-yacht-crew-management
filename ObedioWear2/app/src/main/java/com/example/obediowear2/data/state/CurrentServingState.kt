package com.example.obediowear2.data.state

import android.util.Log
import com.example.obediowear2.data.model.ServiceRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Application-scoped singleton to hold the currently serving task.
 * This allows sharing state between FullScreenRequestActivity and ServingNowScreen
 * since they use different Activity-scoped ViewModels.
 */
object CurrentServingState {

    private const val TAG = "CurrentServingState"

    private val _currentTask = MutableStateFlow<ServiceRequest?>(null)
    val currentTask: StateFlow<ServiceRequest?> = _currentTask.asStateFlow()

    private val _taskStartTime = MutableStateFlow<Long>(0)
    val taskStartTime: StateFlow<Long> = _taskStartTime.asStateFlow()

    /**
     * Set the current task being served.
     * Called from FullScreenRequestActivity when accepting a request.
     */
    fun setCurrentTask(task: ServiceRequest) {
        Log.i(TAG, "Setting current task: ${task.id} at ${task.location?.name}")
        _currentTask.value = task
        _taskStartTime.value = System.currentTimeMillis()
    }

    /**
     * Clear the current task (completed or cancelled).
     */
    fun clearCurrentTask() {
        Log.i(TAG, "Clearing current task")
        _currentTask.value = null
        _taskStartTime.value = 0
    }

    /**
     * Check if there's an active task.
     */
    fun hasActiveTask(): Boolean = _currentTask.value != null

    /**
     * Get elapsed time in milliseconds since task started.
     */
    fun getElapsedTime(): Long {
        val startTime = _taskStartTime.value
        return if (startTime > 0) System.currentTimeMillis() - startTime else 0
    }
}
