package com.example.obediowear.presentation

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.wear.compose.material.*
import com.example.obediowear.data.websocket.WebSocketManager
import com.example.obediowear.presentation.theme.ObedioWearTheme
import com.example.obediowear.ui.components.IncomingRequestScreen
import com.example.obediowear.viewmodel.ServiceRequestViewModel

/**
 * Main Activity for OBEDIO Crew Watch App
 * Displays incoming service requests in full-screen overlay
 */
class MainActivity : ComponentActivity() {

    private val viewModel: ServiceRequestViewModel by viewModels()

    // Permission launcher for Android 12+ vibration permission
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            // Vibration permission denied - app will still work but no vibration
        }
    }

    // Permission launcher for Location (GPS tracking)
    private val locationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            // Location permission denied - GPS tracking won't work
            android.util.Log.w("MainActivity", "Location permission denied - GPS tracking disabled")
        } else {
            android.util.Log.i("MainActivity", "Location permission granted - GPS tracking enabled")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        // Request vibration permission for Android 12+
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.VIBRATE
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                permissionLauncher.launch(Manifest.permission.VIBRATE)
            }
        }

        // Request Location permission for GPS tracking
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }

        setTheme(android.R.style.Theme_DeviceDefault)

        setContent {
            ObedioApp(viewModel = viewModel)
        }
    }
}

/**
 * Main app composable
 */
@Composable
fun ObedioApp(viewModel: ServiceRequestViewModel) {
    ObedioWearTheme {
        val currentRequest by viewModel.currentRequest.collectAsState()
        val crewMembers by viewModel.crewMembers.collectAsState()
        val connectionStatus by viewModel.connectionStatus.collectAsState()

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colors.background)
        ) {
            if (currentRequest != null) {
                // Show incoming request full-screen overlay
                IncomingRequestScreen(
                    request = currentRequest!!,
                    crewMembers = crewMembers,
                    onAccept = { viewModel.acceptRequest() },
                    onDelegate = { crewId -> viewModel.delegateRequest(crewId) },
                    onDismiss = { viewModel.dismissRequest() }
                )
            } else {
                // Show placeholder/home screen when no request
                HomeScreen(connectionStatus = connectionStatus)
            }
        }
    }
}

/**
 * Home screen shown when no incoming request
 */
@Composable
fun HomeScreen(connectionStatus: WebSocketManager.ConnectionStatus) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // App branding
        Text(
            text = "OBEDIO",
            color = Color(0xFFD4AF37), // Gold
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Crew Watch",
            color = Color.White.copy(alpha = 0.7f),
            fontSize = 12.sp,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Connection status indicator
        val (statusText, statusColor) = when (connectionStatus) {
            WebSocketManager.ConnectionStatus.CONNECTED -> "Connected" to Color(0xFF10B981) // Green
            WebSocketManager.ConnectionStatus.CONNECTING -> "Connecting..." to Color(0xFFF59E0B) // Amber
            WebSocketManager.ConnectionStatus.DISCONNECTED -> "Disconnected" to Color(0xFFEF4444) // Red
        }

        Row(
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(statusColor, shape = androidx.compose.foundation.shape.CircleShape)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = statusText,
                color = Color.White.copy(alpha = 0.8f),
                fontSize = 11.sp
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Status message
        Text(
            text = "Waiting for service requests...",
            color = Color.White.copy(alpha = 0.5f),
            fontSize = 10.sp,
            textAlign = TextAlign.Center
        )
    }
}
