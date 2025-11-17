package com.obedio.app.presentation.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.obedio.app.domain.model.*
import java.time.Duration
import java.time.Instant

@Composable
fun ServiceRequestCard(
    request: ServiceRequest,
    onClick: () -> Unit,
    onAccept: (() -> Unit)? = null,
    onComplete: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = when (request.priority) {
                Priority.EMERGENCY -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.7f)
                Priority.URGENT -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = request.location,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = request.guestName,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                ServiceStatusChip(request.status)
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Message
            request.message?.let { message ->
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            }
            
            // Request type and time
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    RequestTypeIcon(request.requestType)
                    PriorityIndicator(request.priority)
                    TimeAgoText(request.createdAt)
                }
                
                // Action buttons
                when (request.status) {
                    ServiceStatus.PENDING -> {
                        onAccept?.let {
                            Button(
                                onClick = it,
                                modifier = Modifier.height(36.dp)
                            ) {
                                Text("Accept")
                            }
                        }
                    }
                    ServiceStatus.IN_PROGRESS, ServiceStatus.SERVING -> {
                        onComplete?.let {
                            Button(
                                onClick = it,
                                modifier = Modifier.height(36.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.secondary
                                )
                            ) {
                                Text("Complete")
                            }
                        }
                    }
                    else -> {}
                }
            }
        }
    }
}

@Composable
private fun ServiceStatusChip(status: ServiceStatus) {
    val (text, color) = when (status) {
        ServiceStatus.PENDING -> "Pending" to MaterialTheme.colorScheme.tertiary
        ServiceStatus.IN_PROGRESS -> "Accepted" to MaterialTheme.colorScheme.primary
        ServiceStatus.SERVING -> "Serving" to MaterialTheme.colorScheme.secondary
        ServiceStatus.COMPLETED -> "Completed" to Color.Gray
        ServiceStatus.CANCELLED -> "Cancelled" to Color.Gray
    }
    
    AssistChip(
        onClick = { },
        label = { Text(text, style = MaterialTheme.typography.labelSmall) },
        colors = AssistChipDefaults.assistChipColors(
            containerColor = color.copy(alpha = 0.2f),
            labelColor = color
        ),
        modifier = Modifier.height(28.dp)
    )
}

@Composable
private fun RequestTypeIcon(type: RequestType) {
    val icon = when (type) {
        RequestType.CALL -> Icons.Default.Call
        RequestType.SERVICE -> Icons.Default.RoomService
        RequestType.EMERGENCY -> Icons.Default.Warning
        RequestType.VOICE -> Icons.Default.Mic
        RequestType.DND -> Icons.Default.DoNotDisturb
        RequestType.LIGHTS -> Icons.Default.LightMode
        RequestType.PREPARE_FOOD -> Icons.Default.Restaurant
        RequestType.BRING_DRINKS -> Icons.Default.LocalBar
    }
    
    Icon(
        imageVector = icon,
        contentDescription = type.name,
        modifier = Modifier.size(20.dp),
        tint = when (type) {
            RequestType.EMERGENCY -> MaterialTheme.colorScheme.error
            else -> MaterialTheme.colorScheme.onSurfaceVariant
        }
    )
}

@Composable
private fun PriorityIndicator(priority: Priority) {
    when (priority) {
        Priority.EMERGENCY -> {
            Icon(
                imageVector = Icons.Default.ErrorOutline,
                contentDescription = "Emergency",
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(20.dp)
            )
        }
        Priority.URGENT -> {
            Icon(
                imageVector = Icons.Default.PriorityHigh,
                contentDescription = "Urgent",
                tint = MaterialTheme.colorScheme.error.copy(alpha = 0.7f),
                modifier = Modifier.size(20.dp)
            )
        }
        else -> {}
    }
}

@Composable
private fun TimeAgoText(createdAt: Instant) {
    val duration = Duration.between(createdAt, Instant.now())
    val text = when {
        duration.toMinutes() < 1 -> "Just now"
        duration.toMinutes() < 60 -> "${duration.toMinutes()} min ago"
        duration.toHours() < 24 -> "${duration.toHours()} hours ago"
        else -> "${duration.toDays()} days ago"
    }
    
    Text(
        text = text,
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}