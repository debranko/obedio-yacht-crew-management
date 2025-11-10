package com.example.obediowear.presentation

import android.content.Context
import android.os.Bundle
import android.os.PowerManager
import android.util.Log
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
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
import androidx.wear.compose.material.*
import com.example.obediowear.data.model.Priority
import com.example.obediowear.data.model.ServiceRequest
import com.example.obediowear.utils.NotificationHelper
import com.example.obediowear.utils.VibrationHelper
import com.google.gson.Gson

/**
 * Full-screen activity that appears when a service request notification arrives.
 * Mimics WhatsApp call screen with large Accept/Delegate buttons.
 */
class FullScreenIncomingRequestActivity : ComponentActivity() {

    private val gson = Gson()
    private var serviceRequest: ServiceRequest? = null
    private lateinit var vibrationHelper: VibrationHelper
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Wake up screen using PowerManager
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "ObedioWear:FullScreenNotification"
        )
        wakeLock?.acquire(10 * 60 * 1000L) // 10 minutes max
        Log.d("FullScreen", "WakeLock acquired - screen should turn on")

        // Wake up screen and show over lock screen (Android 8.0+ way)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        // Keep screen on while activity is visible
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Dismiss keyguard
        @Suppress("DEPRECATION")
        window.addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)

        vibrationHelper = VibrationHelper(applicationContext)

        // Parse service request from intent
        val requestJson = intent.getStringExtra("service_request")
        if (requestJson != null) {
            try {
                serviceRequest = gson.fromJson(requestJson, ServiceRequest::class.java)
                Log.d("FullScreen", "Showing full-screen notification for request: ${serviceRequest?.id}")

                // Vibrate on launch
                serviceRequest?.priority?.let { priority ->
                    vibrationHelper.vibrateForRequest(priority)
                }
            } catch (e: Exception) {
                Log.e("FullScreen", "Failed to parse service request: ${e.message}", e)
                finish()
                return
            }
        } else {
            Log.e("FullScreen", "No service request data provided")
            finish()
            return
        }

        setContent {
            FullScreenIncomingRequestScreen(
                request = serviceRequest!!,
                onAccept = ::handleAccept,
                onDelegate = ::handleDelegate
            )
        }
    }

    private fun handleAccept() {
        Log.i("FullScreen", "User accepted request from full-screen notification")

        // Cancel notification
        NotificationHelper.cancelNotification(this)

        // Launch main app with accept action
        val intent = android.content.Intent(this, MainActivity::class.java).apply {
            flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("action", "accept")
            putExtra("request_id", serviceRequest?.id)
        }
        startActivity(intent)
        finish()
    }

    private fun handleDelegate() {
        Log.i("FullScreen", "User wants to delegate request from full-screen notification")

        // Cancel notification
        NotificationHelper.cancelNotification(this)

        // Launch main app with delegate action
        val intent = android.content.Intent(this, MainActivity::class.java).apply {
            flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("action", "delegate")
            putExtra("request_id", serviceRequest?.id)
        }
        startActivity(intent)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        // Release wake lock
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
                Log.d("FullScreen", "WakeLock released")
            }
        }
    }
}

@Composable
fun FullScreenIncomingRequestScreen(
    request: ServiceRequest,
    onAccept: () -> Unit,
    onDelegate: () -> Unit
) {
    // Background color based on priority
    val backgroundColor = when (request.priority) {
        Priority.EMERGENCY -> Color(0xFFD32F2F) // Red
        Priority.URGENT -> Color(0xFFFF6F00) // Orange
        else -> Color(0xFF1976D2) // Blue
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundColor),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Priority indicator
            Text(
                text = when (request.priority) {
                    Priority.EMERGENCY -> "🚨 EMERGENCY"
                    Priority.URGENT -> "⚡ URGENT"
                    else -> "Service Request"
                },
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Guest name
            val guestName = request.guest?.let {
                "${it.firstName} ${it.lastName}".trim()
            } ?: "Guest"

            Text(
                text = guestName,
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Location
            Text(
                text = request.location?.name ?: request.notes ?: "Unknown location",
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 14.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Accept button
            Button(
                onClick = onAccept,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = Color(0xFF4CAF50) // Green
                )
            ) {
                Text(
                    text = "Accept",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Delegate button
            Button(
                onClick = onDelegate,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = Color(0xFF757575) // Gray
                )
            ) {
                Text(
                    text = "Delegate",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}
