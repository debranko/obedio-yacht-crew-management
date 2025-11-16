package com.obedio.app.data.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.obedio.app.domain.repository.ServiceRequestRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@AndroidEntryPoint
class NotificationActionReceiver : BroadcastReceiver() {

    @Inject
    lateinit var serviceRequestRepository: ServiceRequestRepository
    
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return
        
        val action = intent.action
        val requestId = intent.getStringExtra(ObedioFirebaseMessagingService.EXTRA_SERVICE_REQUEST_ID)
        
        if (requestId == null) {
            Timber.e("No service request ID in notification action")
            return
        }
        
        Timber.d("Notification action received: $action for request $requestId")
        
        when (action) {
            ObedioFirebaseMessagingService.ACTION_ACCEPT -> {
                handleAcceptAction(context, requestId)
            }
            ObedioFirebaseMessagingService.ACTION_VIEW -> {
                handleViewAction(context, requestId)
            }
        }
    }
    
    private fun handleAcceptAction(context: Context, requestId: String) {
        scope.launch {
            try {
                // TODO: Get current user ID from auth repository
                val userId = "current_user_id" // This should come from TokenManager
                
                serviceRequestRepository.acceptRequest(requestId, userId)
                    .fold(
                        onSuccess = {
                            Timber.d("Service request $requestId accepted successfully")
                            // TODO: Show success notification
                        },
                        onFailure = { error ->
                            Timber.e(error, "Failed to accept service request $requestId")
                            // TODO: Show error notification
                        }
                    )
            } catch (e: Exception) {
                Timber.e(e, "Error accepting service request from notification")
            }
        }
    }
    
    private fun handleViewAction(context: Context, requestId: String) {
        // Launch the app with deep link to service request detail
        val intent = Intent(context, com.obedio.app.presentation.MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(ObedioFirebaseMessagingService.EXTRA_SERVICE_REQUEST_ID, requestId)
            putExtra(ObedioFirebaseMessagingService.EXTRA_NOTIFICATION_TYPE, "service_request")
        }
        context.startActivity(intent)
    }
}