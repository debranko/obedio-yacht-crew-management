package com.example.obediowear2.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.obediowear2.data.api.ApiClient
import com.example.obediowear2.data.model.ServiceRequest
import com.example.obediowear2.data.mqtt.MqttManager
import com.example.obediowear2.data.state.CurrentServingState
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel for the Serving Now Screen.
 * Tracks the current task being served and handles completion via API.
 */
class ServingViewModel : ViewModel() {

    companion object {
        private const val TAG = "ServingViewModel"
    }

    private val apiService = ApiClient.instance

    private val _uiState = MutableStateFlow(ServingUiState())
    val uiState: StateFlow<ServingUiState> = _uiState.asStateFlow()

    private var timerJob: Job? = null
    private var taskStartTime: Long = 0

    init {
        observeCurrentServingState()
        observeCurrentlyServing()
        observeRequestCompleted()
    }

    /**
     * Observe the shared CurrentServingState singleton.
     * This is updated when FullScreenRequestActivity accepts a request.
     */
    private fun observeCurrentServingState() {
        viewModelScope.launch {
            CurrentServingState.currentTask.collect { task ->
                Log.i(TAG, "CurrentServingState updated: ${task?.id}")
                if (task != null && _uiState.value.currentTask?.id != task.id) {
                    // New task accepted
                    setCurrentTaskInternal(task, CurrentServingState.taskStartTime.value)
                } else if (task == null && _uiState.value.currentTask != null) {
                    // Task cleared externally
                    clearCurrentTask()
                }
            }
        }
    }

    /**
     * Listen for when THIS device accepts a request via MQTT.
     */
    private fun observeCurrentlyServing() {
        viewModelScope.launch {
            MqttManager.currentlyServingFlow.collect { update ->
                Log.i(TAG, "MQTT: Now serving: ${update.requestId}")
                // Note: Full ServiceRequest comes from CurrentServingState
            }
        }
    }

    /**
     * Listen for when a request is completed.
     */
    private fun observeRequestCompleted() {
        viewModelScope.launch {
            MqttManager.requestCompletedFlow.collect { requestId ->
                val currentTask = _uiState.value.currentTask
                if (currentTask?.id == requestId) {
                    Log.i(TAG, "Current task completed: $requestId")
                    clearCurrentTask()
                }
            }
        }
    }

    fun setCurrentTask(task: ServiceRequest?) {
        timerJob?.cancel()

        if (task != null) {
            Log.i(TAG, "Setting current task: ${task.id} at ${task.location?.name}")
            taskStartTime = System.currentTimeMillis()
            startElapsedTimer()
            // Sync with shared state
            CurrentServingState.setCurrentTask(task)
        } else {
            CurrentServingState.clearCurrentTask()
        }

        _uiState.update { state ->
            state.copy(
                currentTask = task,
                elapsedTime = if (task != null) "0:00" else "",
                error = null
            )
        }
    }

    /**
     * Internal method to set task with a specific start time.
     * Called when observing CurrentServingState.
     */
    private fun setCurrentTaskInternal(task: ServiceRequest, startTime: Long) {
        timerJob?.cancel()

        Log.i(TAG, "Setting current task (internal): ${task.id} at ${task.location?.name}")
        taskStartTime = if (startTime > 0) startTime else System.currentTimeMillis()
        startElapsedTimer()

        _uiState.update { state ->
            state.copy(
                currentTask = task,
                elapsedTime = "0:00",
                error = null
            )
        }
    }

    private fun clearCurrentTask() {
        timerJob?.cancel()
        // Also clear shared state
        CurrentServingState.clearCurrentTask()
        _uiState.update { state ->
            state.copy(
                currentTask = null,
                elapsedTime = "",
                isCompleting = false
            )
        }
    }

    private fun startElapsedTimer() {
        timerJob = viewModelScope.launch {
            while (true) {
                val elapsed = System.currentTimeMillis() - taskStartTime
                val minutes = (elapsed / 60000).toInt()
                val seconds = ((elapsed % 60000) / 1000).toInt()

                _uiState.update { state ->
                    state.copy(elapsedTime = "$minutes:${seconds.toString().padStart(2, '0')}")
                }

                delay(1000)
            }
        }
    }

    /**
     * Complete the current task via API.
     */
    fun completeTask() {
        val task = _uiState.value.currentTask ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isCompleting = true, error = null) }

            try {
                Log.d(TAG, "Completing task: ${task.id}")
                val response = apiService.completeServiceRequest(task.id)

                if (response.success) {
                    Log.i(TAG, "✅ Task completed successfully: ${task.id}")

                    // Send MQTT acknowledgment
                    MqttManager.acknowledgeRequest(task.id, "complete")

                    clearCurrentTask()
                } else {
                    Log.w(TAG, "API returned success=false for completing task")
                    _uiState.update { it.copy(isCompleting = false, error = "Failed to complete task") }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to complete task: ${e.message}", e)
                _uiState.update { it.copy(
                    isCompleting = false,
                    error = "Network error: ${e.message}"
                )}
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
    }
}

data class ServingUiState(
    val currentTask: ServiceRequest? = null,
    val elapsedTime: String = "",
    val isCompleting: Boolean = false,
    val error: String? = null
)
