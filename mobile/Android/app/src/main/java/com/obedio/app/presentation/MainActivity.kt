package com.obedio.app.presentation

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.obedio.app.data.service.ObedioFirebaseMessagingService
import com.obedio.app.data.service.WebSocketService
import com.obedio.app.presentation.navigation.ObedioNavigation
import com.obedio.app.presentation.navigation.Screen
import com.obedio.app.presentation.theme.ObedioTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var webSocketService: WebSocketService
    
    private lateinit var navController: NavHostController
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        setContent {
            ObedioTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    navController = rememberNavController()
                    
                    // Handle deep links and notifications
                    LaunchedEffect(Unit) {
                        handleIntent(intent)
                    }
                    
                    ObedioNavigation(navController = navController)
                }
            }
        }
        
        // Connect WebSocket
        connectWebSocket()
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIntent(it) }
    }
    
    private fun handleIntent(intent: Intent) {
        // Handle notification clicks
        when (intent.getStringExtra(ObedioFirebaseMessagingService.EXTRA_NOTIFICATION_TYPE)) {
            "service_request" -> {
                val requestId = intent.getStringExtra(ObedioFirebaseMessagingService.EXTRA_SERVICE_REQUEST_ID)
                if (requestId != null) {
                    navigateToServiceRequest(requestId)
                }
            }
        }
        
        // Handle deep links
        intent.data?.let { uri ->
            when {
                uri.pathSegments.firstOrNull() == "service-request" -> {
                    val requestId = uri.pathSegments.getOrNull(1)
                    if (requestId != null) {
                        navigateToServiceRequest(requestId)
                    }
                }
            }
        }
    }
    
    private fun navigateToServiceRequest(requestId: String) {
        if (::navController.isInitialized) {
            navController.navigate(Screen.ServiceRequestDetail.createRoute(requestId)) {
                // Clear back stack to dashboard
                popUpTo(Screen.Dashboard.route) {
                    saveState = true
                }
                launchSingleTop = true
                restoreState = true
            }
        }
    }
    
    private fun connectWebSocket() {
        lifecycleScope.launch {
            webSocketService.connect().collect { event ->
                when (event) {
                    is WebSocketService.WebSocketEvent.Connected -> {
                        Timber.d("WebSocket connected")
                    }
                    is WebSocketService.WebSocketEvent.ServiceRequestCreated -> {
                        // Handle new service request
                        // The repository will be updated via the event
                    }
                    is WebSocketService.WebSocketEvent.EmergencyAlert -> {
                        // Show emergency notification if app is in foreground
                    }
                    is WebSocketService.WebSocketEvent.Error -> {
                        Timber.e("WebSocket error: ${event.error}")
                    }
                    else -> {
                        // Handle other events
                    }
                }
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        webSocketService.disconnect()
    }
}