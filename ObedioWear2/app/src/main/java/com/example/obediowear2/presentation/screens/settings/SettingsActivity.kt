package com.example.obediowear2.presentation.screens.settings

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.obediowear2.presentation.theme.ObedioTheme

/**
 * Standalone activity for Settings (can be launched from radar screen).
 */
class SettingsActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            ObedioTheme {
                SettingsScreen(
                    onBackClick = { finish() }
                )
            }
        }
    }
}
