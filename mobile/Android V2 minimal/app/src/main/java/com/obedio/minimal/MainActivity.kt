package com.obedio.minimal

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.obedio.minimal.ui.ConnectionStatusScreen
import com.obedio.minimal.ui.theme.ObedioMinimalTheme
import com.obedio.minimal.viewmodel.ConnectionViewModel

/**
 * Main Activity - Entry point of the application
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            ObedioMinimalTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val viewModel: ConnectionViewModel = viewModel()
                    val systemStatus by viewModel.systemStatus.collectAsState()

                    ConnectionStatusScreen(
                        systemStatus = systemStatus,
                        onRefresh = { viewModel.refresh() }
                    )
                }
            }
        }
    }
}
