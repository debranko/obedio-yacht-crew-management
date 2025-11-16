package com.obedio.app.presentation.screens.service_request_detail

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.obedio.app.R
import com.obedio.app.domain.model.Priority
import com.obedio.app.domain.model.ServiceStatus
import java.time.Duration
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceRequestDetailScreen(
    requestId: String,
    onNavigateBack: () -> Unit,
    onNavigateToGuest: (String) -> Unit,
    viewModel: ServiceRequestDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(requestId) {
        viewModel.loadServiceRequest(requestId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Service Request Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    // Optional: Add actions like share, edit, etc.
                }
            )
        },
        bottomBar = {
            if (uiState.serviceRequest != null) {
                ServiceRequestActionBar(
                    request = uiState.serviceRequest!!,
                    onAccept = { viewModel.acceptRequest() },
                    onComplete = { viewModel.completeRequest() },
                    onCancel = { viewModel.cancelRequest() },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            
            uiState.errorMessage != null -> {
                ErrorState(
                    message = uiState.errorMessage!!,
                    onRetry = { viewModel.loadServiceRequest(requestId) },
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                )
            }
            
            uiState.serviceRequest != null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .verticalScroll(rememberScrollState())
                ) {
                    val request = uiState.serviceRequest
                    
                    // Priority and Status Header
                    RequestHeader(
                        priority = request!!.priority,
                        status = request!!.status,
                        createdAt = formatDuration(
                            Duration.between(request!!.createdAt, java.time.Instant.now())
                        )
                    )
                    
                    // Main Content
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            // Location
                            InfoRow(
                                icon = Icons.Default.LocationOn,
                                label = "Location",
                                value = request!!.location
                            )
                            
                            // Guest
                            InfoRow(
                                icon = Icons.Default.Person,
                                label = "Guest",
                                value = request!!.guestName,
                                onClick = if (request!!.guestId != null) {
                                    { onNavigateToGuest(request!!.guestId!!) }
                                } else null
                            )
                            
                            // Request Type
                            InfoRow(
                                icon = Icons.Default.Category,
                                label = "Type",
                                value = request!!.requestType.name.replace("_", " ")
                            )
                            
                            // Message
                            if (!request!!.message.isNullOrBlank()) {
                                Column {
                                    Row(
                                        verticalAlignment = Alignment.Top
                                    ) {
                                        Icon(
                                            Icons.Default.Message,
                                            contentDescription = null,
                                            modifier = Modifier.size(24.dp),
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Spacer(modifier = Modifier.width(16.dp))
                                        Column {
                                            Text(
                                                "Message",
                                                style = MaterialTheme.typography.labelMedium,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                            Text(
                                                request!!.message!!,
                                                style = MaterialTheme.typography.bodyLarge
                                            )
                                        }
                                    }
                                    
                                    // Voice playback button if voice request
                                    if (request!!.requestType == com.obedio.app.domain.model.RequestType.VOICE) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        OutlinedButton(
                                            onClick = { /* TODO: Implement voice playback */ },
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Icon(Icons.Default.PlayArrow, contentDescription = null)
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text("Play Voice Message")
                                        }
                                    }
                                }
                            }
                            
                            // Notes
                            if (!request!!.notes.isNullOrBlank()) {
                                InfoRow(
                                    icon = Icons.Default.Note,
                                    label = "Notes",
                                    value = request!!.notes!!
                                )
                            }
                            
                            // Assigned To
                            if (request!!.assignedTo != null) {
                                InfoRow(
                                    icon = Icons.Default.Assignment,
                                    label = "Assigned To",
                                    value = request!!.assignedTo!!
                                )
                            }
                        }
                    }
                    
                    // Timeline
                    TimelineCard(
                        createdAt = request!!.createdAt,
                        acceptedAt = request!!.acceptedAt,
                        completedAt = request!!.completedAt,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun RequestHeader(
    priority: Priority,
    status: ServiceStatus,
    createdAt: String
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = getPriorityColor(priority).copy(alpha = 0.1f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = priority.name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = getPriorityColor(priority)
                )
                Text(
                    text = status.name.replace("_", " "),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Text(
                text = createdAt,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun InfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    onClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (onClick != null) {
                    Modifier.clickable(onClick = onClick)
                } else {
                    Modifier
                }
            ),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            icon,
            contentDescription = null,
            modifier = Modifier.size(24.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(
                label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                value,
                style = MaterialTheme.typography.bodyLarge
            )
        }
        if (onClick != null) {
            Spacer(modifier = Modifier.weight(1f))
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun TimelineCard(
    createdAt: java.time.Instant,
    acceptedAt: java.time.Instant?,
    completedAt: java.time.Instant?,
    modifier: Modifier = Modifier
) {
    Card(modifier = modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                "Timeline",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            TimelineItem(
                label = "Created",
                time = createdAt,
                isCompleted = true
            )
            
            if (acceptedAt != null) {
                TimelineItem(
                    label = "Accepted",
                    time = acceptedAt,
                    isCompleted = true
                )
            }
            
            if (completedAt != null) {
                TimelineItem(
                    label = "Completed",
                    time = completedAt,
                    isCompleted = true
                )
            }
        }
    }
}

@Composable
private fun TimelineItem(
    label: String,
    time: java.time.Instant,
    isCompleted: Boolean
) {
    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            if (isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (isCompleted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                label,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                DateTimeFormatter
                    .ofPattern("MMM dd, HH:mm")
                    .withZone(java.time.ZoneId.systemDefault())
                    .format(time),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ServiceRequestActionBar(
    request: com.obedio.app.domain.model.ServiceRequest,
    onAccept: () -> Unit,
    onComplete: () -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            when (request.status) {
                ServiceStatus.PENDING -> {
                    Button(
                        onClick = onAccept,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Accept")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    OutlinedButton(
                        onClick = onCancel,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Cancel")
                    }
                }
                
                ServiceStatus.IN_PROGRESS,
                ServiceStatus.SERVING -> {
                    Button(
                        onClick = onComplete,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Icon(Icons.Default.Done, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Complete")
                    }
                }
                
                ServiceStatus.COMPLETED,
                ServiceStatus.CANCELLED -> {
                    Text(
                        text = "Request ${request.status.name.lowercase()}",
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

@Composable
private fun ErrorState(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            Icons.Default.Error,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}

private fun getPriorityColor(priority: Priority): Color {
    return when (priority) {
        Priority.EMERGENCY -> Color(0xFFD32F2F) // Red
        Priority.URGENT -> Color(0xFFF57C00) // Orange
        Priority.NORMAL -> Color(0xFF1976D2) // Blue
        Priority.LOW -> Color(0xFF388E3C) // Green
    }
}

private fun formatDuration(duration: Duration): String {
    val minutes = duration.toMinutes()
    return when {
        minutes < 1 -> "Just now"
        minutes < 60 -> "$minutes min ago"
        minutes < 1440 -> "${minutes / 60} hours ago"
        else -> "${minutes / 1440} days ago"
    }
}