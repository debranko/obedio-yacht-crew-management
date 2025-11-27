package com.example.obediowear2.presentation.screens.radar

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material.Text
import com.example.obediowear2.data.model.RadarBlip
import com.example.obediowear2.presentation.theme.ObedioColors
import com.example.obediowear2.presentation.theme.ObedioTypography
import com.example.obediowear2.viewmodel.RadarViewModel

/**
 * Home Screen - Clean duty-focused display optimized for round watch screens.
 * Replaces the old radar visualization with practical information.
 */
@Composable
fun RadarScreen(
    viewModel: RadarViewModel = viewModel(),
    onSettingsClick: () -> Unit = {},
    onBlipClick: (RadarBlip) -> Unit = {},
    onPendingRequestsClick: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    // Pulse animation for pending requests badge
    val infiniteTransition = rememberInfiniteTransition(label = "badge_pulse")
    val badgePulse by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ObedioColors.Background),
        contentAlignment = Alignment.Center
    ) {
        // CONNECTION STATUS - Top Center
        Row(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            // Connection dot
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(
                        if (uiState.isConnected) Color(0xFF4CAF50) // Green
                        else Color(0xFFFF5252) // Red
                    )
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = if (uiState.isConnected) "Online" else "Offline",
                style = ObedioTypography.bodySmall,
                color = if (uiState.isConnected) Color(0xFF4CAF50) else Color(0xFFFF5252)
            )
        }

        // MAIN CONTENT - Center Column
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Current Time - LARGE
            Text(
                text = uiState.currentTime,
                fontSize = 48.sp,
                fontWeight = FontWeight.Light,
                color = ObedioColors.TextPrimary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Duty Status
            Text(
                text = if (uiState.isOnDuty) "ON DUTY" else "OFF DUTY",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = if (uiState.isOnDuty) ObedioColors.ChampagneGold else ObedioColors.TextSecondary,
                textAlign = TextAlign.Center
            )

            // Time info (countdown or next shift)
            uiState.dutyTimeInfo?.let { timeInfo ->
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = timeInfo,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Normal,
                    color = ObedioColors.TextSecondary,
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // PENDING REQUESTS BADGE - Tappable
            if (uiState.blips.isNotEmpty()) {
                val scale = if (uiState.blips.any { it.priority == com.example.obediowear2.data.model.Priority.EMERGENCY }) badgePulse else 1f

                Box(
                    modifier = Modifier
                        .size((60 * scale).dp, (32 * scale).dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(ObedioColors.ChampagneGold.copy(alpha = 0.2f))
                        .clickable { onPendingRequestsClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "${uiState.blips.size} pending",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = ObedioColors.ChampagneGold
                    )
                }
            }
        }

        // SETTINGS BUTTON - Bottom Center (accessible on round screen)
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 12.dp)
                .size(36.dp)
                .clip(CircleShape)
                .background(ObedioColors.ChampagneGoldDim)
                .clickable { onSettingsClick() },
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "⚙",
                fontSize = 18.sp,
                color = ObedioColors.TextPrimary
            )
        }
    }
}
