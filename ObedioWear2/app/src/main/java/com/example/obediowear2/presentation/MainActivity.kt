package com.example.obediowear2.presentation

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.snapshotFlow
import com.example.obediowear2.data.state.CurrentServingState
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.example.obediowear2.presentation.components.PageIndicator
import com.example.obediowear2.presentation.navigation.MainPager
import com.example.obediowear2.presentation.theme.ObedioColors
import com.example.obediowear2.presentation.theme.ObedioTheme
import com.example.obediowear2.utils.VibrationHelper

/**
 * Main Activity for ObedioWear2.
 * Hosts the HorizontalPager with Roster, Radar, and Serving Now screens.
 */
class MainActivity : ComponentActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    // Permission launcher for Android 12+ vibration permission
    private val vibrationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            Log.w(TAG, "Vibration permission denied - haptic feedback won't work")
        } else {
            Log.i(TAG, "✅ Vibration permission granted")
        }
    }

    // Permission launcher for Location (for device tracking)
    private val locationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            Log.w(TAG, "Location permission denied - GPS tracking disabled")
        } else {
            Log.i(TAG, "✅ Location permission granted - GPS tracking enabled")
        }
    }

    // Permission launcher for Notifications (Android 13+)
    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            Log.w(TAG, "⚠️ Notification permission denied - notifications won't work!")
        } else {
            Log.i(TAG, "✅ Notification permission granted - full-screen notifications enabled")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        // Request all necessary permissions
        requestAllPermissions()

        setContent {
            ObedioTheme {
                MainScreen()
            }
        }
    }

    /**
     * Request all necessary permissions for the app to work properly.
     */
    private fun requestAllPermissions() {
        // 1. Request battery optimization exemption for reliable MQTT connection
        requestBatteryOptimizationExemption()

        // 2. Request vibration permission for Android 12+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.VIBRATE
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                Log.i(TAG, "Requesting vibration permission...")
                vibrationPermissionLauncher.launch(Manifest.permission.VIBRATE)
            }
        }

        // 3. Request Location permission for device tracking
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            Log.i(TAG, "Requesting location permission...")
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }

        // 4. Request Notification permission for Android 13+ (CRITICAL for notifications!)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                Log.w(TAG, "Requesting notification permission...")
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                Log.i(TAG, "✅ Notification permission already granted")
            }
        }

        // 5. Request Full-Screen Intent permission for Android 14+ (CRITICAL for wake-up notifications!)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (!notificationManager.canUseFullScreenIntent()) {
                Log.w(TAG, "⚠️ Full-screen intent permission not granted - redirecting to settings")
                try {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                        Uri.parse("package:$packageName")
                    )
                    startActivity(intent)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to open full-screen intent settings: ${e.message}")
                }
            } else {
                Log.i(TAG, "✅ Full-screen intent permission granted")
            }
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
                Log.i(TAG, "Requesting battery optimization exemption...")
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    startActivity(intent)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to request battery exemption: ${e.message}")
                }
            } else {
                Log.i(TAG, "✅ Battery optimization already disabled")
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MainScreen() {
    val context = LocalContext.current
    val vibrationHelper = remember { VibrationHelper(context) }
    val coroutineScope = rememberCoroutineScope()

    // Pager state - start on center page (Radar Home)
    val pagerState = rememberPagerState(initialPage = 1) { 3 }

    // Observe CurrentServingState for auto-navigation to ServingNow
    val currentTask by CurrentServingState.currentTask.collectAsState()

    // AUTO-NAVIGATE to ServingNow (page 2) when a task is accepted
    LaunchedEffect(currentTask) {
        if (currentTask != null && pagerState.currentPage != 2) {
            Log.i("MainActivity", "Auto-navigating to ServingNow - task accepted: ${currentTask?.id}")
            coroutineScope.launch {
                pagerState.animateScrollToPage(2)  // Navigate to ServingNow
            }
        }
    }

    // Haptic feedback on page changes
    LaunchedEffect(pagerState) {
        snapshotFlow { pagerState.currentPage }.collect { page ->
            when (page) {
                1 -> vibrationHelper.doubleClick()  // Center/home page
                else -> vibrationHelper.click()     // Side pages
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ObedioColors.Background)
    ) {
        // Main pager content
        MainPager(pagerState = pagerState)

        // Page indicator at bottom
        PageIndicator(
            currentPage = pagerState.currentPage,
            pageCount = 3,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 8.dp)
        )
    }
}
