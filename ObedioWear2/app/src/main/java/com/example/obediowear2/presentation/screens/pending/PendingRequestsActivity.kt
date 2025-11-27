package com.example.obediowear2.presentation.screens.pending

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.obediowear2.data.model.Guest
import com.example.obediowear2.data.model.Location
import com.example.obediowear2.data.model.RadarBlip
import com.example.obediowear2.data.model.ServiceRequest
import com.example.obediowear2.presentation.screens.request.FullScreenRequestActivity
import com.example.obediowear2.presentation.theme.ObedioTheme
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * Activity for displaying list of pending service requests.
 * Receives pending blips data via Intent from MainPager.
 */
class PendingRequestsActivity : ComponentActivity() {

    companion object {
        private const val TAG = "PendingRequestsActivity"
    }

    private val gson = Gson()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Get pending blips from Intent
        val blipsJson = intent.getStringExtra("pending_blips")
        val pendingBlips: List<RadarBlip> = if (blipsJson != null) {
            try {
                val type = object : TypeToken<List<RadarBlip>>() {}.type
                gson.fromJson(blipsJson, type) ?: emptyList()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to parse pending blips: ${e.message}", e)
                emptyList()
            }
        } else {
            Log.w(TAG, "No pending blips data in Intent")
            emptyList()
        }

        Log.i(TAG, "Loaded ${pendingBlips.size} pending requests")

        setContent {
            ObedioTheme {
                PendingRequestsScreen(
                    pendingRequests = pendingBlips,
                    onRequestClick = { blip ->
                        // Convert blip to ServiceRequest and launch detail view
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

                        val intent = Intent(this, FullScreenRequestActivity::class.java).apply {
                            putExtra("service_request", gson.toJson(serviceRequest))
                        }
                        startActivity(intent)
                    },
                    onBackClick = { finish() }
                )
            }
        }
    }
}
