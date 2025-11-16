package com.obedio.app.presentation.screens.service_requests

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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.obedio.app.R
import com.obedio.app.domain.model.Priority
import com.obedio.app.domain.model.ServiceStatus
import com.obedio.app.presentation.components.ServiceRequestCard
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceRequestsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToDetail: (String) -> Unit,
    viewModel: ServiceRequestsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val requests by viewModel.filteredRequests.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    
    var showFilterMenu by remember { mutableStateOf(false) }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.service_requests_title)) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showFilterMenu = true }) {
                        Badge(
                            containerColor = if (uiState.activeFilters > 0) 
                                MaterialTheme.colorScheme.primary 
                            else 
                                androidx.compose.ui.graphics.Color.Transparent
                        ) {
                            Icon(Icons.Default.FilterList, contentDescription = "Filter")
                        }
                    }
                }
            )
        }
    ) { paddingValues ->
        SwipeRefresh(
            state = rememberSwipeRefreshState(isRefreshing),
            onRefresh = { viewModel.refresh() },
            modifier = Modifier.fillMaxSize()
        ) {
            if (uiState.isLoading && requests.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (requests.isEmpty()) {
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
                    // Group by status
                    val groupedRequests = requests.groupBy { it.status }
                    
                    groupedRequests.forEach { (status, statusRequests) ->
                        item {
                            Text(
                                text = getStatusTitle(status),
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        }
                        
                        items(
                            items = statusRequests,
                            key = { it.id }
                        ) { request ->
                            ServiceRequestCard(
                                request = request,
                                onClick = { onNavigateToDetail(request.id) },
                                onAccept = if (request.status == ServiceStatus.PENDING) {
                                    { viewModel.acceptRequest(request.id) }
                                } else null,
                                onComplete = if (request.status == ServiceStatus.IN_PROGRESS || 
                                               request.status == ServiceStatus.SERVING) {
                                    { viewModel.completeRequest(request.id) }
                                } else null
                            )
                        }
                    }
                }
            }
        }
        
        // Filter bottom sheet
        if (showFilterMenu) {
            FilterBottomSheet(
                currentFilter = uiState.filter,
                onFilterChange = { filter ->
                    viewModel.updateFilter(filter)
                    showFilterMenu = false
                },
                onDismiss = { showFilterMenu = false }
            )
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
private fun EmptyState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Assignment,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No service requests",
            style = MaterialTheme.typography.headlineSmall
        )
        Text(
            text = "Pull down to refresh",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterBottomSheet(
    currentFilter: ServiceRequestFilter,
    onFilterChange: (ServiceRequestFilter) -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
        ) {
            Text(
                text = "Filter Requests",
                style = MaterialTheme.typography.headlineSmall,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            // Status filter
            Text(
                text = "Status",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            FilterChipGroup(
                options = listOf(
                    "All" to null,
                    "Pending" to ServiceStatus.PENDING,
                    "In Progress" to ServiceStatus.IN_PROGRESS,
                    "Serving" to ServiceStatus.SERVING
                ),
                selected = currentFilter.status,
                onSelectionChange = { status ->
                    onFilterChange(currentFilter.copy(status = status))
                }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Priority filter
            Text(
                text = "Priority",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            FilterChipGroup(
                options = listOf(
                    "All" to null,
                    "Emergency" to Priority.EMERGENCY,
                    "Urgent" to Priority.URGENT,
                    "Normal" to Priority.NORMAL
                ),
                selected = currentFilter.priority,
                onSelectionChange = { priority ->
                    onFilterChange(currentFilter.copy(priority = priority))
                }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                TextButton(
                    onClick = { onFilterChange(ServiceRequestFilter()) }
                ) {
                    Text("Clear Filters")
                }
                
                Button(
                    onClick = onDismiss
                ) {
                    Text("Apply")
                }
            }
        }
    }
}

@Composable
private fun <T> FilterChipGroup(
    options: List<Pair<String, T?>>,
    selected: T?,
    onSelectionChange: (T?) -> Unit
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        options.forEach { (label, value) ->
            FilterChip(
                selected = selected == value,
                onClick = { onSelectionChange(value) },
                label = { Text(label) }
            )
        }
    }
}

private fun getStatusTitle(status: ServiceStatus): String {
    return when (status) {
        ServiceStatus.PENDING -> "New Requests"
        ServiceStatus.IN_PROGRESS -> "Accepted"
        ServiceStatus.SERVING -> "Serving Now"
        ServiceStatus.COMPLETED -> "Completed"
        ServiceStatus.CANCELLED -> "Cancelled"
    }
}