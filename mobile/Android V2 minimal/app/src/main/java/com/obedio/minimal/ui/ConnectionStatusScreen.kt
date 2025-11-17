package com.obedio.minimal.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.obedio.minimal.data.ConnectionState
import com.obedio.minimal.data.ServiceStatus
import com.obedio.minimal.data.SystemConnectionStatus
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectionStatusScreen(
    systemStatus: SystemConnectionStatus,
    onRefresh: () -> Unit
) {
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Obedio Connection Status") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Card
            HeaderCard(systemStatus)

            // Connection Status Cards
            ConnectionStatusCard(
                title = "WebSocket",
                icon = Icons.Default.Cloud,
                serviceStatus = systemStatus.websocket
            )

            ConnectionStatusCard(
                title = "MQTT Broker",
                icon = Icons.Default.Router,
                serviceStatus = systemStatus.mqtt
            )

            ConnectionStatusCard(
                title = "Backend API",
                icon = Icons.Default.Storage,
                serviceStatus = systemStatus.api
            )

            // Last Updated Info
            LastUpdatedCard(systemStatus.lastUpdated)

            // Refresh Button
            Button(
                onClick = onRefresh,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Refresh All")
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun HeaderCard(systemStatus: SystemConnectionStatus) {
    val allConnected = systemStatus.websocket.state == ConnectionState.CONNECTED &&
            systemStatus.mqtt.state == ConnectionState.CONNECTED &&
            systemStatus.api.state == ConnectionState.CONNECTED

    val backgroundColor by animateColorAsState(
        targetValue = if (allConnected) Color(0xFF4CAF50) else Color(0xFFFF9800),
        animationSpec = tween(500),
        label = "background"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = if (allConnected) Icons.Default.CheckCircle else Icons.Default.Warning,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(64.dp)
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = if (allConnected) "System Online" else "Partial Connection",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = if (allConnected) "All services connected" else "Some services offline",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.9f)
            )
        }
    }
}

@Composable
private fun ConnectionStatusCard(
    title: String,
    icon: ImageVector,
    serviceStatus: ServiceStatus
) {
    val statusColor = when (serviceStatus.state) {
        ConnectionState.CONNECTED -> Color(0xFF4CAF50)
        ConnectionState.CONNECTING -> Color(0xFF2196F3)
        ConnectionState.DISCONNECTED -> Color(0xFF9E9E9E)
        ConnectionState.ERROR -> Color(0xFFF44336)
    }

    val scale by animateFloatAsState(
        targetValue = if (serviceStatus.state == ConnectionState.CONNECTED) 1f else 0.95f,
        animationSpec = tween(300),
        label = "scale"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .scale(scale),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Status indicator dot
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(statusColor, CircleShape)
            )

            Spacer(Modifier.width(12.dp))

            // Icon
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.primary
            )

            Spacer(Modifier.width(16.dp))

            // Status details
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = serviceStatus.message,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (serviceStatus.errorDetails != null) {
                    Text(
                        text = serviceStatus.errorDetails,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFF44336)
                    )
                }
                if (serviceStatus.lastConnected != null) {
                    val timeStr = formatTime(serviceStatus.lastConnected)
                    Text(
                        text = "Last connected: $timeStr",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Status icon
            Icon(
                imageVector = when (serviceStatus.state) {
                    ConnectionState.CONNECTED -> Icons.Default.CheckCircle
                    ConnectionState.CONNECTING -> Icons.Default.Sync
                    ConnectionState.DISCONNECTED -> Icons.Default.Cancel
                    ConnectionState.ERROR -> Icons.Default.Error
                },
                contentDescription = null,
                tint = statusColor,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}

@Composable
private fun LastUpdatedCard(timestamp: Long) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Schedule,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = "Last updated: ${formatTime(timestamp)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private fun formatTime(timestamp: Long): String {
    val sdf = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    return sdf.format(Date(timestamp))
}
