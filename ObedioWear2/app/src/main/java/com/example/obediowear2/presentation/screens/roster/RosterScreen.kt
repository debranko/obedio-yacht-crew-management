package com.example.obediowear2.presentation.screens.roster

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Text
import com.example.obediowear2.data.model.CrewMember
import com.example.obediowear2.data.model.DutyStatus
import com.example.obediowear2.data.model.Location
import com.example.obediowear2.presentation.theme.ObedioColors
import com.example.obediowear2.presentation.theme.ObedioTypography
import com.example.obediowear2.viewmodel.RosterViewModel

/**
 * Roster Screen - Shows crew members and DND locations.
 */
@Composable
fun RosterScreen(
    viewModel: RosterViewModel = viewModel()
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
                text = "ROSTER",
                style = ObedioTypography.headlineMedium,
                color = ObedioColors.ChampagneGold,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        // Crew section
        item {
            Text(
                text = "Crew On Duty",
                style = ObedioTypography.labelMedium,
                color = ObedioColors.TextSecondary
            )
        }

        items(uiState.crewMembers) { crew ->
            CrewStatusItem(crew = crew)
        }

        // Empty state for crew
        if (uiState.crewMembers.isEmpty()) {
            item {
                Text(
                    text = "No crew on duty",
                    style = ObedioTypography.bodySmall,
                    color = ObedioColors.TextMuted
                )
            }
        }

        // DND section (if any)
        if (uiState.dndLocations.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Do Not Disturb",
                    style = ObedioTypography.labelMedium,
                    color = ObedioColors.TextSecondary
                )
            }

            items(uiState.dndLocations) { location ->
                DndStatusItem(location = location)
            }
        }
    }
}

@Composable
fun CrewStatusItem(crew: CrewMember) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Status indicator
        val statusColor = when (crew.status) {
            DutyStatus.ON_DUTY -> ObedioColors.StatusOnline
            DutyStatus.BUSY -> ObedioColors.StatusBusy
            else -> ObedioColors.StatusOffline
        }

        androidx.compose.foundation.Canvas(
            modifier = Modifier.size(8.dp)
        ) {
            drawCircle(color = statusColor)
        }

        // Name and position
        Column {
            Text(
                text = crew.name,
                style = ObedioTypography.bodyMedium,
                color = ObedioColors.TextPrimary
            )
            Text(
                text = crew.position,
                style = ObedioTypography.labelSmall,
                color = ObedioColors.TextMuted
            )
        }
    }
}

@Composable
fun DndStatusItem(location: Location) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // DND icon
        Text(
            text = "🔕",
            style = ObedioTypography.bodyMedium
        )

        // Location name
        Column {
            Text(
                text = location.name,
                style = ObedioTypography.bodyMedium,
                color = ObedioColors.TypeDnd
            )
            location.dndActivatedAt?.let { time ->
                Text(
                    text = "Since $time",
                    style = ObedioTypography.labelSmall,
                    color = ObedioColors.TextMuted
                )
            }
        }
    }
}
