package com.example.obediowear2.presentation.screens.serving

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Text
import com.example.obediowear2.data.model.ServiceRequest
import com.example.obediowear2.presentation.theme.ObedioColors
import com.example.obediowear2.presentation.theme.ObedioTypography
import com.example.obediowear2.viewmodel.ServingViewModel

/**
 * Serving Now Screen - Shows the currently active task.
 */
@Composable
fun ServingNowScreen(
    viewModel: ServingViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberScalingLazyListState()

    ScalingLazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(ObedioColors.Background),
        state = listState,
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 32.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Header
        item {
            Text(
                text = "SERVING NOW",
                style = ObedioTypography.headlineMedium,
                color = ObedioColors.ChampagneGold,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        // Current task or empty state
        if (uiState.currentTask != null) {
            item {
                ActiveTaskCard(
                    task = uiState.currentTask!!,
                    elapsedTime = uiState.elapsedTime,
                    onCompleteClick = { viewModel.completeTask() }
                )
            }
        } else {
            item {
                EmptyTaskState()
            }
        }
    }
}

@Composable
fun ActiveTaskCard(
    task: ServiceRequest,
    elapsedTime: String,
    onCompleteClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(ObedioColors.ChampagneGoldDim.copy(alpha = 0.1f))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Request type badge
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(4.dp))
                .background(ObedioColors.ChampagneGold)
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Text(
                text = task.requestType.getDisplayName().uppercase(),
                style = ObedioTypography.labelSmall,
                color = ObedioColors.Background
            )
        }

        // Location
        Text(
            text = task.location?.name ?: "Unknown Location",
            style = ObedioTypography.bodyLarge,
            color = ObedioColors.TextPrimary
        )

        // Guest
        task.guest?.let { guest ->
            Text(
                text = "Guest: ${guest.displayName}",
                style = ObedioTypography.bodySmall,
                color = ObedioColors.TextSecondary
            )
        }

        // Voice transcript (if available)
        task.voiceTranscript?.let { transcript ->
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "\"$transcript\"",
                style = ObedioTypography.voiceTranscript,
                color = ObedioColors.TextPrimary,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(ObedioColors.Background)
                    .padding(8.dp)
            )
        }

        // Elapsed time
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = elapsedTime,
                style = ObedioTypography.labelMedium,
                color = ObedioColors.TextMuted
            )

            // Complete button
            Button(
                onClick = onCompleteClick,
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = ObedioColors.SuccessGreen
                ),
                modifier = Modifier.size(width = 80.dp, height = 32.dp)
            ) {
                Text(
                    text = "DONE",
                    style = ObedioTypography.labelSmall,
                    color = ObedioColors.TextPrimary
                )
            }
        }
    }
}

@Composable
fun EmptyTaskState() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "✓",
            style = ObedioTypography.displayMedium,
            color = ObedioColors.SuccessGreen
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "No active tasks",
            style = ObedioTypography.bodyMedium,
            color = ObedioColors.TextSecondary
        )
        Text(
            text = "You're all caught up!",
            style = ObedioTypography.bodySmall,
            color = ObedioColors.TextMuted
        )
    }
}
