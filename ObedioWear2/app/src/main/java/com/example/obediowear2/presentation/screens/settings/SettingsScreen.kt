package com.example.obediowear2.presentation.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.Switch
import androidx.wear.compose.material.SwitchDefaults
import androidx.wear.compose.material.Text
import com.example.obediowear2.data.model.ShakeSensitivity
import com.example.obediowear2.data.model.VibrationLevel
import com.example.obediowear2.presentation.theme.ObedioColors
import com.example.obediowear2.presentation.theme.ObedioTypography
import com.example.obediowear2.viewmodel.SettingsViewModel

/**
 * Settings screen with all configuration options.
 */
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = viewModel(),
    onBackClick: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberScalingLazyListState()

    ScalingLazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(ObedioColors.Background),
        state = listState,
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 32.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        // Header
        item {
            Text(
                text = "SETTINGS",
                style = ObedioTypography.headlineMedium,
                color = ObedioColors.ChampagneGold,
                modifier = Modifier.padding(bottom = 12.dp)
            )
        }

        // ============ NOTIFICATIONS ============
        item {
            SectionHeader(title = "Notifications")
        }

        item {
            SettingsToggle(
                label = "Emergency Sound",
                checked = uiState.emergencySoundEnabled,
                onCheckedChange = { viewModel.setEmergencySoundEnabled(it) }
            )
        }

        item {
            SettingsToggle(
                label = "DND Alerts",
                checked = uiState.dndAlertsEnabled,
                onCheckedChange = { viewModel.setDndAlertsEnabled(it) }
            )
        }

        item {
            SettingsSelector(
                label = "Vibration",
                value = uiState.vibrationLevel.getDisplayName(),
                onClick = { viewModel.cycleVibrationLevel() }
            )
        }

        // ============ SHAKE TO DELEGATE ============
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SectionHeader(title = "Shake to Delegate")
        }

        item {
            SettingsToggle(
                label = "Enable",
                checked = uiState.shakeToDelegate,
                onCheckedChange = { viewModel.setShakeToDelegate(it) }
            )
        }

        if (uiState.shakeToDelegate) {
            item {
                SettingsSelector(
                    label = "Sensitivity",
                    value = uiState.shakeSensitivity.getDisplayName(),
                    onClick = { viewModel.cycleShakeSensitivity() }
                )
            }

            item {
                SettingsToggle(
                    label = "Confirmation",
                    checked = uiState.shakeConfirmationRequired,
                    onCheckedChange = { viewModel.setShakeConfirmationRequired(it) }
                )
            }
        }

        // ============ CONNECTION ============
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SectionHeader(title = "Connection")
        }

        item {
            SettingsInfo(
                label = "Server IP",
                value = uiState.serverIp
            )
        }

        item {
            SettingsInfo(
                label = "MQTT Port",
                value = uiState.mqttPort.toString()
            )
        }

        item {
            SettingsInfo(
                label = "API Port",
                value = uiState.apiPort.toString()
            )
        }

        // ============ BATTERY ============
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SectionHeader(title = "Battery")
        }

        item {
            SettingsInfo(
                label = "Low Warning",
                value = "${uiState.lowBatteryThreshold}%"
            )
        }

        // ============ PROFILE ============
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SectionHeader(title = "Profile")
        }

        item {
            SettingsInfo(
                label = "Crew Member",
                value = uiState.crewMemberName ?: "Not assigned"
            )
        }

        item {
            SettingsInfo(
                label = "Device ID",
                value = uiState.deviceId?.takeLast(8) ?: "Unknown"
            )
        }

        // ============ ABOUT ============
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SectionHeader(title = "About")
        }

        item {
            SettingsInfo(
                label = "App Version",
                value = "2.0.0"
            )
        }
    }
}

@Composable
fun SectionHeader(title: String) {
    Text(
        text = title,
        style = ObedioTypography.labelMedium,
        color = ObedioColors.TextMuted,
        modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
    )
}

@Composable
fun SettingsToggle(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(ObedioColors.TextMuted.copy(alpha = 0.1f))
            .clickable { onCheckedChange(!checked) }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = ObedioTypography.bodyMedium,
            color = ObedioColors.TextPrimary
        )

        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = ObedioColors.ChampagneGold,
                checkedTrackColor = ObedioColors.ChampagneGoldDim
            )
        )
    }
}

@Composable
fun SettingsSelector(
    label: String,
    value: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(ObedioColors.TextMuted.copy(alpha = 0.1f))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = ObedioTypography.bodyMedium,
            color = ObedioColors.TextPrimary
        )

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = value,
                style = ObedioTypography.bodySmall,
                color = ObedioColors.ChampagneGold
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "›",
                style = ObedioTypography.bodyMedium,
                color = ObedioColors.TextMuted
            )
        }
    }
}

@Composable
fun SettingsInfo(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = ObedioTypography.bodySmall,
            color = ObedioColors.TextSecondary
        )

        Text(
            text = value,
            style = ObedioTypography.bodySmall,
            color = ObedioColors.TextPrimary
        )
    }
}
