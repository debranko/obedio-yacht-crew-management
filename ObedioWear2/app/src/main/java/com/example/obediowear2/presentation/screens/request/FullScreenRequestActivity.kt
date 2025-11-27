package com.example.obediowear2.presentation.screens.request

import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.util.Log
import android.view.View
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.animateColor
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Text
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.obediowear2.data.api.AcceptRequestBody
import com.example.obediowear2.data.api.ApiClient
import com.example.obediowear2.data.api.DelegateRequestBody
import com.example.obediowear2.data.model.Priority
import com.example.obediowear2.data.model.ServiceRequest
import com.example.obediowear2.data.mqtt.MqttManager
import com.example.obediowear2.data.state.CurrentServingState
import com.example.obediowear2.presentation.theme.ObedioColors
import com.example.obediowear2.presentation.theme.ObedioTheme
import com.example.obediowear2.presentation.theme.ObedioTypography
import com.example.obediowear2.utils.NotificationHelper
import com.example.obediowear2.utils.PreferencesManager
import com.example.obediowear2.utils.ServerConfig
import com.example.obediowear2.utils.VibrationHelper
import com.google.gson.Gson
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Full-screen activity for incoming service requests.
 * Shows request details with accept/delegate/dismiss options.
 */
class FullScreenRequestActivity : ComponentActivity() {

    companion object {
        private const val TAG = "FullScreenRequest"
    }

    private val gson = Gson()
    private var vibrationHelper: VibrationHelper? = null
    private val activityScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val apiService = ApiClient.instance
    private var wakeLock: PowerManager.WakeLock? = null
    private var currentRequestId: String? = null  // For MQTT auto-dismiss

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Log.d(TAG, ">>> FullScreenRequestActivity onCreate - waking screen!")

        // CRITICAL: Wake up screen using PowerManager (like ObedioWear)
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "ObedioWear2:FullScreenNotification"
        )
        wakeLock?.acquire(10 * 60 * 1000L) // 10 minutes max
        Log.d(TAG, ">>> WakeLock acquired - screen should turn on")

        // Modern API for Android 8.1+ (API 27+) - REQUIRED for lock screen display
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            Log.d(TAG, ">>> setShowWhenLocked + setTurnScreenOn called (Android 8.1+)")
        }

        // Keep screen on and show over lock screen (legacy flags for older Android)
        @Suppress("DEPRECATION")
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        )

        vibrationHelper = VibrationHelper(this)

        // Parse service request from intent
        val requestJson = intent.getStringExtra("service_request")
        val serviceRequest = try {
            gson.fromJson(requestJson, ServiceRequest::class.java)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse request: ${e.message}")
            finish()
            return
        }

        // Store request ID for MQTT auto-dismiss and start observing
        currentRequestId = serviceRequest.id
        observeRequestDismissals()

        // Vibrate based on priority
        serviceRequest.let { request ->
            vibrationHelper?.vibrateForRequest(request.priority)

            // Start emergency alarm if emergency
            if (request.priority == Priority.EMERGENCY) {
                vibrationHelper?.startEmergencyVibration()
            }
        }

        setContent {
            ObedioTheme {
                FullScreenRequestScreen(
                    request = serviceRequest,
                    onAccept = { acceptRequest(serviceRequest) },
                    onDelegate = { delegateRequest(serviceRequest) },
                    onDismiss = { dismissRequest(serviceRequest) }
                )
            }
        }
    }

    private fun acceptRequest(request: ServiceRequest) {
        vibrationHelper?.stopVibration()
        vibrationHelper?.success()

        // Cancel notification immediately
        NotificationHelper.cancelNotificationForRequest(this, request.id)

        // Get crew member ID from preferences
        val crewMemberId = PreferencesManager.getCrewMemberId()

        if (crewMemberId == null) {
            Log.w(TAG, "No crew member ID configured - cannot accept")
            finish()
            return
        }

        // Call REST API to accept FIRST, only set CurrentServingState on success
        // This prevents showing ServingNow if another watch already accepted
        activityScope.launch {
            try {
                Log.d(TAG, "Accepting request ${request.id} as crew member $crewMemberId")

                val body = AcceptRequestBody(
                    crewMemberId = crewMemberId,
                    confirmed = true
                )

                val response = apiService.acceptServiceRequest(request.id, body)

                if (response.success) {
                    Log.i(TAG, "✅ Request ${request.id} accepted successfully via API")
                    // ONLY set CurrentServingState AFTER successful API response
                    // This ensures only the winning watch shows ServingNow
                    CurrentServingState.setCurrentTask(request)
                    Log.i(TAG, "✅ CurrentServingState set - will auto-navigate to ServingNow")
                } else {
                    Log.w(TAG, "⚠️ API returned success=false - request may already be accepted by another device")
                    // Don't set CurrentServingState - another watch accepted first
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to accept request via API: ${e.message}", e)
                // Don't set CurrentServingState on error
            }

            finish()
        }
    }

    private fun delegateRequest(request: ServiceRequest) {
        vibrationHelper?.stopVibration()
        vibrationHelper?.click()

        // Cancel notification immediately
        NotificationHelper.cancelNotificationForRequest(this, request.id)

        // Get current crew member ID
        val fromCrewMemberId = PreferencesManager.getCrewMemberId()

        if (fromCrewMemberId == null) {
            Log.e(TAG, "Cannot delegate request - no crew member ID configured")
            finish()
            return
        }

        // Auto-delegate: Find next available crew member via API
        // Backend handles MQTT broadcast for cross-device sync
        activityScope.launch {
            try {
                Log.d(TAG, "Delegating request ${request.id} from crew member $fromCrewMemberId")

                // Get available on-duty crew members
                val crewResponse = apiService.getCrewMembers(status = "on-duty")

                if (crewResponse.success && crewResponse.data.isNotEmpty()) {
                    // Find next available crew member (not self)
                    val nextCrewMember = crewResponse.data.firstOrNull { it.id != fromCrewMemberId }

                    if (nextCrewMember != null) {
                        val body = DelegateRequestBody(
                            toCrewMemberId = nextCrewMember.id,
                            fromCrewMemberId = fromCrewMemberId,
                            reason = "Delegated via watch"
                        )

                        val response = apiService.delegateServiceRequest(request.id, body)

                        if (response.success) {
                            Log.i(TAG, "✅ Request ${request.id} delegated to ${nextCrewMember.name}")
                        } else {
                            Log.w(TAG, "API returned success=false for delegating request")
                        }
                    } else {
                        Log.w(TAG, "No other crew members available to delegate to")
                    }
                } else {
                    Log.w(TAG, "No crew members available for delegation")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to delegate request via API: ${e.message}", e)
            }

            finish()
        }
    }

    private fun dismissRequest(request: ServiceRequest) {
        vibrationHelper?.stopVibration()
        NotificationHelper.cancelNotificationForRequest(this, request.id)
        finish()
    }

    /**
     * CRITICAL: Listen for MQTT updates when another watch accepts this request.
     * Auto-dismisses this popup so user doesn't accidentally accept on multiple watches.
     */
    private fun observeRequestDismissals() {
        lifecycleScope.launch {
            MqttManager.requestDismissedFlow.collect { dismissedRequestId ->
                if (dismissedRequestId == currentRequestId) {
                    Log.i(TAG, "🔄 Request dismissed by another device: $dismissedRequestId - auto-closing popup")
                    runOnUiThread {
                        vibrationHelper?.stopVibration()
                        currentRequestId?.let { requestId ->
                            NotificationHelper.cancelNotificationForRequest(this@FullScreenRequestActivity, requestId)
                        }
                        finish()
                    }
                }
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            // Enable sticky immersive mode for full-screen experience
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            )
            Log.d(TAG, ">>> Immersive mode enabled")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        vibrationHelper?.stopVibration()
        // Release wake lock
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
                Log.d(TAG, ">>> WakeLock released")
            }
        }
    }
}

@Composable
fun FullScreenRequestScreen(
    request: ServiceRequest,
    onAccept: () -> Unit,
    onDelegate: () -> Unit,
    onDismiss: () -> Unit
) {
    val isEmergency = request.priority == Priority.EMERGENCY
    val listState = rememberScalingLazyListState()

    // Emergency flashing border
    val infiniteTransition = rememberInfiniteTransition(label = "emergency_flash")
    val borderColor by infiniteTransition.animateColor(
        initialValue = ObedioColors.AlertRedBright,
        targetValue = Color.Transparent,
        animationSpec = infiniteRepeatable(
            animation = tween(500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "border_flash"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ObedioColors.Background)
            .then(
                if (isEmergency) {
                    Modifier.border(4.dp, borderColor, RoundedCornerShape(0.dp))
                } else {
                    Modifier
                }
            )
    ) {
        // Background location image (if available)
        request.location?.image?.let { imageUrl ->
            val fullUrl = ServerConfig.getAudioUrl(imageUrl)
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(fullUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
                alpha = 0.3f
            )
        }

        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize(),
            state = listState,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Request type badge
            item {
                RequestTypeBadge(
                    requestType = request.requestType.getDisplayName(),
                    priority = request.priority
                )
            }

            // Location
            item {
                Text(
                    text = request.location?.name ?: "Unknown Location",
                    style = ObedioTypography.headlineMedium,
                    color = ObedioColors.TextPrimary,
                    textAlign = TextAlign.Center
                )
            }

            // Guest
            request.guest?.let { guest ->
                item {
                    Text(
                        text = "Guest: ${guest.displayName}",
                        style = ObedioTypography.bodyMedium,
                        color = ObedioColors.TextSecondary
                    )
                }
            }

            // Voice transcript (HIGHLY VISIBLE)
            request.voiceTranscript?.let { transcript ->
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    VoiceTranscriptCard(transcript = transcript)
                }
            }

            // Emergency medical info
            if (isEmergency) {
                request.guest?.let { guest ->
                    guest.allergies?.let { allergies ->
                        item {
                            MedicalInfoCard(
                                label = "ALLERGIES",
                                value = allergies.joinToString(", ")
                            )
                        }
                    }
                    guest.medicalConditions?.let { conditions ->
                        item {
                            MedicalInfoCard(
                                label = "CONDITIONS",
                                value = conditions.joinToString(", ")
                            )
                        }
                    }
                }
            }

            // Action buttons
            item {
                Spacer(modifier = Modifier.height(12.dp))
                ActionButtons(
                    isEmergency = isEmergency,
                    onAccept = onAccept,
                    onDelegate = onDelegate,
                    onDismiss = onDismiss
                )
            }
        }
    }
}

@Composable
fun RequestTypeBadge(
    requestType: String,
    priority: Priority
) {
    val backgroundColor = when (priority) {
        Priority.EMERGENCY -> ObedioColors.AlertRedBright
        Priority.URGENT -> ObedioColors.UrgentAmber
        else -> ObedioColors.ChampagneGold
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundColor)
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(
            text = requestType.uppercase(),
            style = ObedioTypography.requestType,
            color = ObedioColors.Background
        )
    }
}

@Composable
fun VoiceTranscriptCard(transcript: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(ObedioColors.ChampagneGoldDim.copy(alpha = 0.15f))
            .border(1.dp, ObedioColors.ChampagneGoldDim, RoundedCornerShape(12.dp))
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "\"$transcript\"",
            style = ObedioTypography.voiceTranscript,
            color = ObedioColors.TextPrimary,
            textAlign = TextAlign.Center,
            maxLines = 4,
            overflow = TextOverflow.Ellipsis
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Play button
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Text(text = "🎤", style = ObedioTypography.bodyMedium)
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "Tap to play",
                style = ObedioTypography.labelSmall,
                color = ObedioColors.TextMuted
            )
        }
    }
}

@Composable
fun MedicalInfoCard(label: String, value: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(ObedioColors.AlertRed.copy(alpha = 0.2f))
            .padding(8.dp)
    ) {
        Text(
            text = "⚠️ $label",
            style = ObedioTypography.labelSmall,
            color = ObedioColors.AlertRedBright
        )
        Text(
            text = value,
            style = ObedioTypography.bodySmall,
            color = ObedioColors.TextPrimary
        )
    }
}

@Composable
fun ActionButtons(
    isEmergency: Boolean,
    onAccept: () -> Unit,
    onDelegate: () -> Unit,
    onDismiss: () -> Unit
) {
    if (isEmergency) {
        // Single large RESPOND NOW button for emergencies
        Button(
            onClick = onAccept,
            colors = ButtonDefaults.buttonColors(
                backgroundColor = ObedioColors.AlertRedBright
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .height(48.dp)
        ) {
            Text(
                text = "RESPOND NOW",
                style = ObedioTypography.headlineSmall,
                color = ObedioColors.TextPrimary
            )
        }
    } else {
        // Accept and Delegate row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = onAccept,
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = ObedioColors.SuccessGreen
                ),
                modifier = Modifier
                    .weight(1f)
                    .height(40.dp)
            ) {
                Text(
                    text = "ACCEPT",
                    style = ObedioTypography.labelMedium,
                    color = ObedioColors.TextPrimary
                )
            }

            Button(
                onClick = onDelegate,
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = ObedioColors.ChampagneGold
                ),
                modifier = Modifier
                    .weight(1f)
                    .height(40.dp)
            ) {
                Text(
                    text = "DELEGATE",
                    style = ObedioTypography.labelMedium,
                    color = ObedioColors.Background
                )
            }
        }

        // Dismiss button - COMMENTED OUT FOR TESTING
        // Spacer(modifier = Modifier.height(8.dp))
        // Button(
        //     onClick = onDismiss,
        //     colors = ButtonDefaults.buttonColors(
        //         backgroundColor = ObedioColors.TextMuted.copy(alpha = 0.2f)
        //     ),
        //     modifier = Modifier
        //         .fillMaxWidth()
        //         .padding(horizontal = 32.dp)
        //         .height(32.dp)
        // ) {
        //     Text(
        //         text = "DISMISS",
        //         style = ObedioTypography.labelSmall,
        //         color = ObedioColors.TextSecondary
        //     )
        // }
    }
}
