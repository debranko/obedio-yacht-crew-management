package com.example.obediowear2.presentation.screens.pending

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Text
import com.example.obediowear2.data.model.Priority
import com.example.obediowear2.data.model.RadarBlip
import com.example.obediowear2.data.model.RequestType
import com.example.obediowear2.presentation.theme.ObedioColors

/**
 * Pending Requests Screen - Shows list of all pending service requests.
 * User taps a card to view full details of that request.
 */
@Composable
fun PendingRequestsScreen(
    pendingRequests: List<RadarBlip>,
    onRequestClick: (RadarBlip) -> Unit,
    onBackClick: () -> Unit = {}
) {
    val listState = rememberScalingLazyListState()

    ScalingLazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(ObedioColors.Background),
        state = listState,
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 28.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Header
        item {
            Text(
                text = "Pending",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = ObedioColors.ChampagneGold,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        // Empty state
        if (pendingRequests.isEmpty()) {
            item {
                Text(
                    text = "No pending requests",
                    fontSize = 14.sp,
                    color = ObedioColors.TextMuted,
                    modifier = Modifier.padding(top = 16.dp)
                )
            }
        }

        // Request cards
        items(pendingRequests) { request ->
            RequestCard(
                request = request,
                onClick = { onRequestClick(request) }
            )
        }
    }
}

@Composable
private fun RequestCard(
    request: RadarBlip,
    onClick: () -> Unit
) {
    val cardBackground = when (request.priority) {
        Priority.EMERGENCY -> ObedioColors.AlertRedBright.copy(alpha = 0.2f)
        Priority.URGENT -> ObedioColors.UrgentAmber.copy(alpha = 0.15f)
        else -> ObedioColors.ChampagneGoldDim
    }

    val borderColor = when (request.priority) {
        Priority.EMERGENCY -> ObedioColors.AlertRedBright
        Priority.URGENT -> ObedioColors.UrgentAmber
        else -> ObedioColors.ChampagneGold.copy(alpha = 0.5f)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(cardBackground)
            .clickable { onClick() }
            .padding(12.dp)
    ) {
        // Request type with icon
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Start
        ) {
            Text(
                text = getRequestTypeIcon(request.requestType),
                fontSize = 16.sp
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = request.requestType.getDisplayName(),
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = borderColor
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Location
        Text(
            text = request.locationName,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = ObedioColors.TextPrimary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )

        // Guest name
        request.guestName?.let { name ->
            Text(
                text = name,
                fontSize = 12.sp,
                color = ObedioColors.TextSecondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        // Voice indicator
        if (request.hasVoiceMessage) {
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🎤",
                    fontSize = 12.sp
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Voice message",
                    fontSize = 11.sp,
                    color = ObedioColors.TextMuted
                )
            }
        }
    }
}

private fun getRequestTypeIcon(type: RequestType): String {
    return when (type) {
        RequestType.CALL -> "📞"
        RequestType.VOICE -> "🎤"
        RequestType.LIGHTS -> "💡"
        RequestType.PREPARE_FOOD -> "🍽"
        RequestType.BRING_DRINKS -> "🍸"
        RequestType.EMERGENCY -> "🚨"
        RequestType.DND -> "🔕"
        RequestType.SERVICE -> "🔔"
    }
}
