package com.obedio.app.presentation.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.obedio.app.R
import com.obedio.app.domain.model.Priority
import com.obedio.app.domain.model.ServiceRequest
import com.obedio.app.presentation.components.ServiceRequestCard
import java.time.Duration
import java.time.Instant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToServiceRequests: () -> Unit,
    onNavigateToServiceRequest: (String) -> Unit,
    onLogout: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val activeRequests by viewModel.activeRequests.collectAsState()
    
    var showMenu by remember { mutableStateOf(false) }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text(
                            text = "Hello, ${uiState.userName}",
                            style = MaterialTheme.typography.titleLarge
                        )
                        Text(
                            text = "${activeRequests.size} active requests",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { /* TODO: Notifications */ }) {
                        Icon(Icons.Default.Notifications, contentDescription = "Notifications")
                    }
                    Box {
                        IconButton(onClick = { showMenu = true }) {
                            Icon(Icons.Default.MoreVert, contentDescription = "Menu")
                        }
                        DropdownMenu(
                            expanded = showMenu,
                            onDismissRequest = { showMenu = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("Settings") },
                                onClick = { 
                                    showMenu = false
                                    // TODO: Navigate to settings
                                },
                                leadingIcon = { Icon(Icons.Default.Settings, contentDescription = null) }
                            )
                            DropdownMenuItem(
                                text = { Text("Logout") },
                                onClick = { 
                                    showMenu = false
                                    onLogout()
                                },
                                leadingIcon = { Icon(Icons.Default.ExitToApp, contentDescription = null) }
                            )
                        }
                    }
                }
            )
        },
        floatingActionButton = {
            if (activeRequests.isNotEmpty()) {
                ExtendedFloatingActionButton(
                    onClick = { viewModel.acceptNearestRequest() },
                    icon = { Icon(Icons.Default.Check, contentDescription = null) },
                    text = { Text(stringResource(R.string.accept_nearest)) },
                    containerColor = MaterialTheme.colorScheme.primary
                )
            }
        }
    ) { paddingValues ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (activeRequests.isEmpty()) {
            EmptyState(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Quick stats
                item {
                    QuickStatsRow(activeRequests)
                }
                
                // View all button
                item {
                    TextButton(
                        onClick = onNavigateToServiceRequests,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("View All Requests")
                        Icon(Icons.Default.KeyboardArrowRight, contentDescription = null)
                    }
                }
                
                // Active requests
                items(
                    items = activeRequests.take(5), // Show only first 5
                    key = { it.id }
                ) { request ->
                    ServiceRequestCard(
                        request = request,
                        onClick = { onNavigateToServiceRequest(request.id) },
                        onAccept = { viewModel.acceptRequest(request.id) },
                        onComplete = { viewModel.completeRequest(request.id) }
                    )
                }
            }
        }
    }
    
    // Handle errors
    uiState.errorMessage?.let { error ->
        LaunchedEffect(error) {
            // Show snackbar or handle error
        }
    }
}

@Composable
private fun QuickStatsRow(requests: List<ServiceRequest>) {
    val urgentCount = requests.count { it.priority == Priority.URGENT || it.priority == Priority.EMERGENCY }
    val servingCount = requests.count { it.status == com.obedio.app.domain.model.ServiceStatus.SERVING }
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        StatCard(
            title = "Urgent",
            value = urgentCount.toString(),
            color = MaterialTheme.colorScheme.error,
            modifier = Modifier.weight(1f)
        )
        Spacer(modifier = Modifier.width(8.dp))
        StatCard(
            title = "Serving",
            value = servingCount.toString(),
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.weight(1f)
        )
        Spacer(modifier = Modifier.width(8.dp))
        StatCard(
            title = "Total",
            value = requests.size.toString(),
            color = MaterialTheme.colorScheme.tertiary,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    color: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                color = color
            )
        }
    }
}

@Composable
private fun EmptyState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = stringResource(R.string.no_active_requests),
            style = MaterialTheme.typography.headlineSmall
        )
        Text(
            text = "All caught up!",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}