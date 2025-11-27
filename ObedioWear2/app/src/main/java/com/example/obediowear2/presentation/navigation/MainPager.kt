package com.example.obediowear2.presentation.navigation

import android.content.Intent
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PagerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.obediowear2.data.model.Guest
import com.example.obediowear2.data.model.Location
import com.example.obediowear2.data.model.ServiceRequest
import com.example.obediowear2.presentation.screens.pending.PendingRequestsActivity
import com.example.obediowear2.presentation.screens.radar.RadarScreen
import com.example.obediowear2.presentation.screens.request.FullScreenRequestActivity
import com.example.obediowear2.presentation.screens.roster.RosterScreen
import com.example.obediowear2.presentation.screens.serving.ServingNowScreen
import com.example.obediowear2.presentation.screens.settings.SettingsActivity
import com.example.obediowear2.viewmodel.RadarViewModel
import com.google.gson.Gson

/**
 * Main pager component with 3 screens:
 * - Page 0: Roster (swipe left from center)
 * - Page 1: Home Screen (center/default) - formerly Radar
 * - Page 2: Serving Now (swipe right from center)
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MainPager(
    pagerState: PagerState,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val gson = Gson()

    // Create ViewModel at MainPager level so we can pass blips to PendingRequestsActivity
    val radarViewModel: RadarViewModel = viewModel()
    val radarUiState by radarViewModel.uiState.collectAsState()

    HorizontalPager(
        state = pagerState,
        modifier = modifier.fillMaxSize(),
        beyondViewportPageCount = 1,  // Keep adjacent pages in memory
        pageSpacing = 0.dp
    ) { page ->
        when (page) {
            0 -> RosterScreen()
            1 -> RadarScreen(
                viewModel = radarViewModel,
                onSettingsClick = {
                    // Launch SettingsActivity
                    val intent = Intent(context, SettingsActivity::class.java)
                    context.startActivity(intent)
                },
                onBlipClick = { blip ->
                    // Convert blip back to ServiceRequest and launch full-screen detail
                    val serviceRequest = ServiceRequest(
                        id = blip.id,
                        priority = blip.priority,
                        requestType = blip.requestType,
                        location = Location(
                            name = blip.locationName,
                            image = blip.locationImage
                        ),
                        guest = blip.guestName?.let { name ->
                            Guest(preferredName = name)
                        },
                        audioUrl = blip.audioUrl,
                        voiceTranscript = blip.voiceTranscript
                    )

                    val intent = Intent(context, FullScreenRequestActivity::class.java).apply {
                        putExtra("service_request", gson.toJson(serviceRequest))
                    }
                    context.startActivity(intent)
                },
                onPendingRequestsClick = {
                    // Pass the current blips data to PendingRequestsActivity
                    val intent = Intent(context, PendingRequestsActivity::class.java).apply {
                        putExtra("pending_blips", gson.toJson(radarUiState.blips))
                    }
                    context.startActivity(intent)
                }
            )
            2 -> ServingNowScreen()
        }
    }
}

private val Int.dp: androidx.compose.ui.unit.Dp
    get() = androidx.compose.ui.unit.Dp(this.toFloat())
