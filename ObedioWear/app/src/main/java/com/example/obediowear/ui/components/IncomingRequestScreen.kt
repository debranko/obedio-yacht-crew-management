package com.example.obediowear.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import coil.compose.AsyncImage
import com.example.obediowear.data.model.CrewMember
import com.example.obediowear.data.model.Priority
import com.example.obediowear.data.model.ServiceRequest

/**
 * Full-screen incoming request notification UI
 */
@Composable
fun IncomingRequestScreen(
    request: ServiceRequest,
    crewMembers: List<CrewMember>,
    onAccept: () -> Unit,
    onDelegate: (String) -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showDelegateList by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Background image (location image, dimmed)
        request.location?.image?.let { imageUrl ->
            AsyncImage(
                model = imageUrl,
                contentDescription = "Location background",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
                alpha = 0.25f  // Dimmed for text readability
            )

            // Gradient overlay for better text contrast
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Black.copy(alpha = 0.8f),
                                Color.Black.copy(alpha = 0.5f),
                                Color.Black.copy(alpha = 0.9f)
                            )
                        )
                    )
            )
        }

        if (showDelegateList) {
            // Delegate crew list screen
            DelegateCrewListScreen(
                crewMembers = crewMembers,
                onSelectCrew = { crewId ->
                    onDelegate(crewId)
                    showDelegateList = false
                },
                onBack = { showDelegateList = false }
            )
        } else {
            // Main request screen
            RequestContentScreen(
                request = request,
                onAccept = onAccept,
                onShowDelegateList = { showDelegateList = true }
            )
        }
    }
}

/**
 * Main request content screen
 */
@Composable
private fun RequestContentScreen(
    request: ServiceRequest,
    onAccept: () -> Unit,
    onShowDelegateList: () -> Unit
) {
    val priorityColor = when (request.priority) {
        Priority.EMERGENCY -> Color(0xFFEF4444)  // Red
        Priority.URGENT -> Color(0xFFF59E0B)     // Amber
        else -> Color(0xFFD4AF37)                // Gold
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Priority badge
        Text(
            text = when (request.priority) {
                Priority.EMERGENCY -> "🚨 EMERGENCY"
                Priority.URGENT -> "🔔 URGENT"
                else -> "🔔 NEW REQUEST"
            },
            color = priorityColor,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Location name (large, prominent)
        Text(
            text = request.location?.name ?: "Unknown Location",
            color = Color.White,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )

        Spacer(modifier = Modifier.height(6.dp))

        // Guest name (if exists)
        request.guest?.let { guest ->
            val guestName = guest.preferredName
                ?: "${guest.firstName} ${guest.lastName}"

            Text(
                text = guestName,
                color = Color.White.copy(alpha = 0.8f),
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(8.dp))
        }

        // Voice transcript (if exists)
        request.voiceTranscript?.let { transcript ->
            // Parse "Voice message (3.0s): Text" format
            val text = if (transcript.contains("): ")) {
                transcript.substringAfter("): ")
            } else {
                transcript
            }

            Text(
                text = "\"$text\"",
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(horizontal = 12.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))
        }

        // Priority indicator dot
        Box(
            modifier = Modifier
                .size(6.dp)
                .background(priorityColor, shape = CircleShape)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Action buttons
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Accept button
            Button(
                onClick = onAccept,
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = priorityColor
                ),
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .height(36.dp)
            ) {
                Text(
                    text = "ACCEPT",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            // Delegate button
            Button(
                onClick = onShowDelegateList,
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = Color.White.copy(alpha = 0.15f)
                ),
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .height(36.dp)
            ) {
                Text(
                    text = "DELEGATE",
                    fontSize = 13.sp,
                    color = Color.White
                )
            }
        }
    }
}

/**
 * Delegate crew list screen
 */
@Composable
private fun DelegateCrewListScreen(
    crewMembers: List<CrewMember>,
    onSelectCrew: (String) -> Unit,
    onBack: () -> Unit
) {
    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            top = 24.dp,
            start = 8.dp,
            end = 8.dp,
            bottom = 24.dp
        ),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        // Header
        item {
            Text(
                text = "Delegate to:",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 11.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp)
            )
        }

        // Crew members list
        if (crewMembers.isEmpty()) {
            item {
                Text(
                    text = "No crew available",
                    color = Color.White.copy(alpha = 0.5f),
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp)
                )
            }
        } else {
            items(crewMembers.size) { index ->
                val crew = crewMembers[index]
                Chip(
                    onClick = { onSelectCrew(crew.id) },
                    label = {
                        Column {
                            Text(
                                text = crew.name,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = crew.position,
                                fontSize = 10.sp,
                                color = Color.White.copy(alpha = 0.6f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    },
                    colors = ChipDefaults.chipColors(
                        backgroundColor = Color.White.copy(alpha = 0.1f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // Back button
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Chip(
                onClick = onBack,
                label = {
                    Text(
                        text = "← Back",
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                },
                colors = ChipDefaults.chipColors(
                    backgroundColor = Color.White.copy(alpha = 0.2f)
                ),
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
