package com.example.obediowear.presentation

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
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

    // State for delegation screen
    private var showDelegationScreen by mutableStateOf(false)
    private var delegationRequestId: String? = null

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

    // Permission launcher for Notifications (Android 13+)
    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            android.util.Log.w("MainActivity", "Notification permission denied - notifications won't work!")
        } else {
            android.util.Log.i("MainActivity", "✅ Notification permission granted - full-screen notifications enabled")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        // Request battery optimization exemption for reliable MQTT connection
        requestBatteryOptimizationExemption()

        // Request vibration permission for Android 12+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
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

        // Request Notification permission for Android 13+ (CRITICAL for full-screen notifications!)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                android.util.Log.w("MainActivity", "Requesting notification permission...")
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                android.util.Log.i("MainActivity", "✅ Notification permission already granted")
            }
        }

        // Handle intent extras from FullScreenIncomingRequestActivity
        handleIntentActions()

        setTheme(android.R.style.Theme_DeviceDefault)

        setContent {
            ObedioApp(
                viewModel = viewModel,
                showDelegationScreen = showDelegationScreen,
                delegationRequestId = delegationRequestId,
                onCrewMemberSelected = { crewId ->
                    delegationRequestId?.let { requestId ->
                        viewModel.delegateRequestById(requestId, crewId)
                    }
                    showDelegationScreen = false
                    delegationRequestId = null
                },
                onDismissDelegation = {
                    showDelegationScreen = false
                    delegationRequestId = null
                }
            )
        }
    }

    /**
     * Request battery optimization exemption to keep MQTT connection alive.
     * This prevents Android from killing the foreground service during Doze mode.
     */
    private fun requestBatteryOptimizationExemption() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            val packageName = packageName

            if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                android.util.Log.i("MainActivity", "Requesting battery optimization exemption...")
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    startActivity(intent)
                } catch (e: Exception) {
                    android.util.Log.e("MainActivity", "Failed to request battery exemption: ${e.message}")
                }
            } else {
                android.util.Log.i("MainActivity", "✅ Battery optimization already disabled")
            }
        }
    }

    /**
     * Handle actions passed from FullScreenIncomingRequestActivity
     */
    private fun handleIntentActions() {
        val action = intent.getStringExtra("action")
        val requestId = intent.getStringExtra("request_id")

        android.util.Log.d("MainActivity", "Intent action: $action, requestId: $requestId")

        when (action) {
            "accept" -> {
                if (requestId != null) {
                    android.util.Log.i("MainActivity", "Accepting request $requestId")
                    viewModel.acceptRequestById(requestId)
                }
            }
            "delegate" -> {
                if (requestId != null) {
                    android.util.Log.i("MainActivity", "Delegating request $requestId - opening crew list")
                    showDelegationScreen = true
                    delegationRequestId = requestId
                }
            }
        }
    }
}

/**
 * Main app composable
 */
@Composable
fun ObedioApp(
    viewModel: ServiceRequestViewModel,
    showDelegationScreen: Boolean,
    delegationRequestId: String?,
    onCrewMemberSelected: (String) -> Unit,
    onDismissDelegation: () -> Unit
) {
    ObedioWearTheme {
        val currentRequest by viewModel.currentRequest.collectAsState()
        val crewMembers by viewModel.crewMembers.collectAsState()
        val connectionStatus by viewModel.connectionStatus.collectAsState()

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colors.background)
        ) {
            if (showDelegationScreen && delegationRequestId != null) {
                // Show crew member selection screen
                CrewMemberSelectionScreen(
                    crewMembers = crewMembers,
                    onCrewMemberSelected = onCrewMemberSelected,
                    onDismiss = onDismissDelegation
                )
            } else if (currentRequest != null) {
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
fun HomeScreen(connectionStatus: com.example.obediowear.data.mqtt.MqttManager.ConnectionStatus) {
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

        // Connection status indicator (MQTT)
        val (statusText, statusColor) = when (connectionStatus) {
            com.example.obediowear.data.mqtt.MqttManager.ConnectionStatus.CONNECTED -> "Connected" to Color(0xFF10B981) // Green
            com.example.obediowear.data.mqtt.MqttManager.ConnectionStatus.CONNECTING -> "Connecting..." to Color(0xFFF59E0B) // Amber
            com.example.obediowear.data.mqtt.MqttManager.ConnectionStatus.DISCONNECTED -> "Disconnected" to Color(0xFFEF4444) // Red
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

/**
 * Crew member selection screen for delegating requests
 */
@Composable
fun CrewMemberSelectionScreen(
    crewMembers: List<com.example.obediowear.data.model.CrewMember>,
    onCrewMemberSelected: (String) -> Unit,
    onDismiss: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF1E1E1E))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Title
        Text(
            text = "Delegate to:",
            color = Color.White,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Crew member list
        androidx.wear.compose.material.ScalingLazyColumn(
            modifier = Modifier.weight(1f),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            items(crewMembers.size) { index ->
                val crewMember = crewMembers[index]

                Button(
                    onClick = { onCrewMemberSelected(crewMember.id) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = Color(0xFF2196F3)
                    )
                ) {
                    Text(
                        text = crewMember.name,
                        fontSize = 12.sp,
                        color = Color.White,
                        maxLines = 1
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Cancel button
        Button(
            onClick = onDismiss,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                backgroundColor = Color(0xFF757575)
            )
        ) {
            Text(
                text = "Cancel",
                fontSize = 12.sp,
                color = Color.White
            )
        }
    }
}
