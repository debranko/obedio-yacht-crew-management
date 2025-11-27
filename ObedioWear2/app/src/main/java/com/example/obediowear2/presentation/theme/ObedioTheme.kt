package com.example.obediowear2.presentation.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Colors

/**
 * Local composition for Obedio colors
 */
val LocalObedioColors = staticCompositionLocalOf { ObedioColors }

/**
 * Local composition for Obedio typography
 */
val LocalObedioTypography = staticCompositionLocalOf { ObedioTypography }

/**
 * Obedio Wear theme - luxury radar aesthetic
 */
@Composable
fun ObedioTheme(
    content: @Composable () -> Unit
) {
    val wearColors = Colors(
        primary = ObedioColors.ChampagneGold,
        primaryVariant = ObedioColors.ChampagneGoldDim,
        secondary = ObedioColors.SuccessGreen,
        secondaryVariant = ObedioColors.UrgentAmber,
        background = ObedioColors.Background,
        surface = ObedioColors.Background,
        error = ObedioColors.AlertRedBright,
        onPrimary = ObedioColors.Background,
        onSecondary = ObedioColors.Background,
        onBackground = ObedioColors.TextPrimary,
        onSurface = ObedioColors.TextPrimary,
        onError = ObedioColors.TextPrimary
    )

    CompositionLocalProvider(
        LocalObedioColors provides ObedioColors,
        LocalObedioTypography provides ObedioTypography
    ) {
        MaterialTheme(
            colors = wearColors,
            content = content
        )
    }
}

/**
 * Object to access Obedio theme values
 */
object ObedioTheme {
    val colors: ObedioColors
        @Composable
        get() = LocalObedioColors.current

    val typography: ObedioTypography
        @Composable
        get() = LocalObedioTypography.current
}
