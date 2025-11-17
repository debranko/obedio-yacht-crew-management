@file:OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.obedio.app.presentation.screens.guest

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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.obedio.app.R
import com.obedio.app.domain.model.Guest
import com.obedio.app.domain.model.GuestStatus
import com.obedio.app.domain.model.GuestType
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun GuestListScreen(
    onNavigateBack: () -> Unit,
    onNavigateToGuest: (String) -> Unit,
    viewModel: GuestListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    
    var showFilterMenu by remember { mutableStateOf(false) }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Guests") },
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search Bar
            SearchBar(
                query = searchQuery,
                onQueryChange = viewModel::updateSearchQuery,
                placeholder = { Text("Search by name or cabin") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { viewModel.updateSearchQuery("") }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear")
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                active = false,
                onActiveChange = {},
                onSearch = {}
            ) {}
            
            SwipeRefresh(
                state = rememberSwipeRefreshState(isRefreshing),
                onRefresh = { viewModel.refresh() },
                modifier = Modifier.fillMaxSize()
            ) {
                if (uiState.isLoading && uiState.guests.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                } else if (uiState.filteredGuests.isEmpty()) {
                    EmptyState(
                        modifier = Modifier.fillMaxSize(),
                        hasFilters = searchQuery.isNotEmpty() || uiState.activeFilters > 0
                    )
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Group by status
                        val groupedGuests = uiState.filteredGuests.groupBy { it.status }
                        
                        groupedGuests.forEach { (status, statusGuests) ->
                            item {
                                Text(
                                    text = when (status) {
                                        GuestStatus.ONBOARD -> "Onboard (${statusGuests.size})"
                                        GuestStatus.DEPARTED -> "Departed (${statusGuests.size})"
                                        else -> "Other (${statusGuests.size})"
                                    },
                                    style = MaterialTheme.typography.titleMedium,
                                    modifier = Modifier.padding(vertical = 8.dp)
                                )
                            }
                            
                            items(
                                items = statusGuests,
                                key = { it.id }
                            ) { guest ->
                                GuestCard(
                                    guest = guest,
                                    onClick = { onNavigateToGuest(guest.id) }
                                )
                            }
                        }
                    }
                }
            }
        }
        
        // Filter bottom sheet
        if (showFilterMenu) {
            GuestFilterBottomSheet(
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
private fun GuestCard(
    guest: Guest,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (guest.status == GuestStatus.ONBOARD) {
                MaterialTheme.colorScheme.surface
            } else {
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Guest icon based on type
            Surface(
                shape = MaterialTheme.shapes.small,
                color = getGuestTypeColor(guest.type!!).copy(alpha = 0.1f),
                modifier = Modifier.size(48.dp)
            ) {
                Icon(
                    imageVector = getGuestTypeIcon(guest.type!!),
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(12.dp),
                    tint = getGuestTypeColor(guest.type!!)
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // Guest info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${guest.firstName} ${guest.lastName}",
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (!guest.cabin.isNullOrBlank()) {
                    Text(
                        text = guest.cabin,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (guest.type != null) {
                    Text(
                        text = guest.type!!.name.replace("_", " "),
                        style = MaterialTheme.typography.bodySmall,
                        color = getGuestTypeColor(guest.type!!)
                    )
                }
            }
            
            // Indicators
            Row {
                if (guest.allergies.isNotEmpty()) {
                    Icon(
                        Icons.Default.Warning,
                        contentDescription = "Has allergies",
                        modifier = Modifier.size(20.dp),
                        tint = MaterialTheme.colorScheme.error
                    )
                }
                if (guest.dietaryRestrictions.isNotEmpty()) {
                    Icon(
                        Icons.Default.Restaurant,
                        contentDescription = "Dietary restrictions",
                        modifier = Modifier.size(20.dp),
                        tint = MaterialTheme.colorScheme.tertiary
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(8.dp))
            Icon(Icons.Default.ChevronRight, contentDescription = null)
        }
    }
}

@Composable
private fun EmptyState(
    modifier: Modifier = Modifier,
    hasFilters: Boolean = false
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Group,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = if (hasFilters) "No guests match filters" else "No guests",
            style = MaterialTheme.typography.headlineSmall
        )
        Text(
            text = if (hasFilters) "Try adjusting your filters" else "Pull down to refresh",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GuestFilterBottomSheet(
    currentFilter: GuestFilter,
    onFilterChange: (GuestFilter) -> Unit,
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
                text = "Filter Guests",
                style = MaterialTheme.typography.headlineSmall,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            // Status filter
            Text(
                text = "Status",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                FilterChip(
                    selected = currentFilter.status == null,
                    onClick = { onFilterChange(currentFilter.copy(status = null)) },
                    label = { Text("All") }
                )
                FilterChip(
                    selected = currentFilter.status == GuestStatus.ONBOARD,
                    onClick = { onFilterChange(currentFilter.copy(status = GuestStatus.ONBOARD)) },
                    label = { Text("Onboard") }
                )
                FilterChip(
                    selected = currentFilter.status == GuestStatus.DEPARTED,
                    onClick = { onFilterChange(currentFilter.copy(status = GuestStatus.DEPARTED)) },
                    label = { Text("Departed") }
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Type filter
            Text(
                text = "Guest Type",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                FilterChip(
                    selected = currentFilter.type == null,
                    onClick = { onFilterChange(currentFilter.copy(type = null)) },
                    label = { Text("All") }
                )
                GuestType.values().forEach { type ->
                    FilterChip(
                        selected = currentFilter.type == type,
                        onClick = { onFilterChange(currentFilter.copy(type = type)) },
                        label = { Text(type.name.replace("_", " ")) }
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                TextButton(
                    onClick = { onFilterChange(GuestFilter()) }
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


private fun getGuestTypeColor(type: GuestType?): androidx.compose.ui.graphics.Color {
    return when (type) {
        GuestType.OWNER -> androidx.compose.ui.graphics.Color(0xFF4CAF50)
        GuestType.VIP -> androidx.compose.ui.graphics.Color(0xFFFFC107)
        GuestType.CHARTER_GUEST -> androidx.compose.ui.graphics.Color(0xFF2196F3)
        GuestType.FRIENDS_FAMILY -> androidx.compose.ui.graphics.Color(0xFF9C27B0)
        GuestType.VISITOR -> androidx.compose.ui.graphics.Color(0xFF607D8B)
        GuestType.CREW_GUEST -> androidx.compose.ui.graphics.Color(0xFF00BCD4)
        else -> androidx.compose.ui.graphics.Color(0xFF757575)
    }
}

private fun getGuestTypeIcon(type: GuestType?): androidx.compose.ui.graphics.vector.ImageVector {
    return when (type) {
        GuestType.OWNER -> Icons.Default.Star
        GuestType.VIP -> Icons.Default.WorkspacePremium
        GuestType.CHARTER_GUEST -> Icons.Default.Sailing
        GuestType.FRIENDS_FAMILY -> Icons.Default.FamilyRestroom
        GuestType.VISITOR -> Icons.Default.PersonAdd
        GuestType.CREW_GUEST -> Icons.Default.Badge
        else -> Icons.Default.Person
    }
}