package com.obedio.app.presentation.screens.guest

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.obedio.app.R
import com.obedio.app.domain.model.GuestStatus
import com.obedio.app.domain.model.GuestType
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GuestDetailScreen(
    guestId: String,
    onNavigateBack: () -> Unit,
    viewModel: GuestDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(guestId) {
        viewModel.loadGuest(guestId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Guest Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    uiState.guest?.let { guest ->
                        IconButton(onClick = { /* TODO: Edit guest */ }) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit")
                        }
                    }
                }
            )
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
                    message = uiState.errorMessage ?: "Unknown error",
                    onRetry = { viewModel.loadGuest(guestId) },
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                )
            }
            
            uiState.guest != null -> {
                val guest = uiState.guest
                
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .verticalScroll(rememberScrollState())
                ) {
                    // Header with photo and basic info
                    GuestHeader(
                        guest = guest!!,
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    // Status and Type
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            StatusChip(
                                label = "Status",
                                value = guest!!.status.name,
                                color = if (guest!!.status == GuestStatus.ONBOARD) {
                                    MaterialTheme.colorScheme.primary
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                }
                            )
                            
                            if (guest!!.type != null) {
                                StatusChip(
                                    label = "Type",
                                    value = guest!!.type!!.name.replace("_", " "),
                                    color = getGuestTypeColor(guest!!.type!!)
                                )
                            }
                        }
                    }
                    
                    // Contact Information
                    if (guest!!.phoneNumber != null || guest.email != null) {
                        InfoSection(
                            title = "Contact Information",
                            icon = Icons.Default.ContactPhone
                        ) {
                            guest!!.phoneNumber?.let {
                                InfoRow(icon = Icons.Default.Phone, label = "Phone", value = it)
                            }
                            guest!!.email?.let {
                                InfoRow(icon = Icons.Default.Email, label = "Email", value = it)
                            }
                        }
                    }
                    
                    // Stay Information
                    InfoSection(
                        title = "Stay Information",
                        icon = Icons.Default.CalendarMonth
                    ) {
                        guest!!.cabin?.let {
                            InfoRow(icon = Icons.Default.Bed, label = "Cabin", value = it)
                        }
                        guest!!.arrivalDate?.let {
                            InfoRow(
                                icon = Icons.Default.FlightLand,
                                label = "Arrival",
                                value = it.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                            )
                        }
                        guest!!.departureDate?.let {
                            InfoRow(
                                icon = Icons.Default.FlightTakeoff,
                                label = "Departure",
                                value = it.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                            )
                        }
                    }
                    
                    // Health & Dietary
                    if (guest!!.allergies.isNotEmpty() || guest.dietaryRestrictions.isNotEmpty()) {
                        InfoSection(
                            title = "Health & Dietary",
                            icon = Icons.Default.HealthAndSafety,
                            isImportant = true
                        ) {
                            if (guest!!.allergies.isNotEmpty()) {
                                ChipGroup(
                                    label = "Allergies",
                                    items = guest!!.allergies,
                                    chipColor = MaterialTheme.colorScheme.error
                                )
                            }
                            if (guest!!.dietaryRestrictions.isNotEmpty()) {
                                ChipGroup(
                                    label = "Dietary Restrictions",
                                    items = guest!!.dietaryRestrictions,
                                    chipColor = MaterialTheme.colorScheme.tertiary
                                )
                            }
                        }
                    }
                    
                    // Preferences
                    guest!!.preferences?.let { prefs ->
                        InfoSection(
                            title = "Preferences",
                            icon = Icons.Default.Favorite
                        ) {
                            prefs.pillowType?.let {
                                InfoRow(icon = Icons.Default.Bed, label = "Pillow", value = it)
                            }
                            prefs.roomTemperature?.let {
                                InfoRow(
                                    icon = Icons.Default.Thermostat,
                                    label = "Room Temperature",
                                    value = "$it°C"
                                )
                            }
                            prefs.wakeUpTime?.let {
                                InfoRow(icon = Icons.Default.Alarm, label = "Wake Up Time", value = it)
                            }
                            if (prefs.favoriteSnacks.isNotEmpty()) {
                                ChipGroup(label = "Favorite Snacks", items = prefs.favoriteSnacks)
                            }
                            if (prefs.favoriteDrinks.isNotEmpty()) {
                                ChipGroup(label = "Favorite Drinks", items = prefs.favoriteDrinks)
                            }
                            prefs.musicPreference?.let {
                                InfoRow(icon = Icons.Default.MusicNote, label = "Music", value = it)
                            }
                            prefs.newspaperPreference?.let {
                                InfoRow(icon = Icons.Default.Newspaper, label = "Newspaper", value = it)
                            }
                        }
                    }
                    
                    // Notes
                    guest!!.notes?.let { notes ->
                        InfoSection(
                            title = "Notes",
                            icon = Icons.Default.Note
                        ) {
                            Text(
                                text = notes,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                    
                    // Service History Button
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        onClick = { /* TODO: Navigate to service history */ }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.History,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(16.dp))
                            Text(
                                text = "View Service History",
                                style = MaterialTheme.typography.titleMedium
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            Icon(
                                Icons.Default.ChevronRight,
                                contentDescription = null
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
private fun GuestHeader(
    guest: com.obedio.app.domain.model.Guest,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.primaryContainer
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Guest Photo
            if (guest.photoUrl != null) {
                AsyncImage(
                    model = guest.photoUrl,
                    contentDescription = "Guest photo",
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop,
                    //placeholder = painterResource(id = R.drawable.ic_person_placeholder),
                    //error = painterResource(id = R.drawable.ic_person_placeholder)
                )
            } else {
                Surface(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape),
                    color = MaterialTheme.colorScheme.primary
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        tint = MaterialTheme.colorScheme.onPrimary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Name and Title
            Text(
                text = "${guest.title ?: ""} ${guest.firstName} ${guest.lastName}".trim(),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun StatusChip(
    label: String,
    value: String,
    color: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(4.dp))
        Surface(
            shape = MaterialTheme.shapes.small,
            color = color.copy(alpha = 0.1f)
        ) {
            Text(
                text = value,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                style = MaterialTheme.typography.bodyMedium,
                color = color,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun InfoSection(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isImportant: Boolean = false,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = if (isImportant) {
            CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
            )
        } else {
            CardDefaults.cardColors()
        }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = if (isImportant) {
                        MaterialTheme.colorScheme.error
                    } else {
                        MaterialTheme.colorScheme.primary
                    }
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun InfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun ChipGroup(
    label: String,
    items: List<String>,
    chipColor: Color = MaterialTheme.colorScheme.primary
) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items.forEach { item ->
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = chipColor.copy(alpha = 0.1f)
                ) {
                    Text(
                        text = item,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.bodySmall,
                        color = chipColor
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
            modifier = Modifier.padding(horizontal = 32.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}

private fun getGuestTypeColor(type: GuestType): Color {
    return when (type) {
        GuestType.OWNER -> Color(0xFF4CAF50)
        GuestType.VIP -> Color(0xFFFFC107)
        GuestType.CHARTER_GUEST -> Color(0xFF2196F3)
        GuestType.FRIENDS_FAMILY -> Color(0xFF9C27B0)
        GuestType.VISITOR -> Color(0xFF607D8B)
        GuestType.CREW_GUEST -> Color(0xFF00BCD4)
    }
}