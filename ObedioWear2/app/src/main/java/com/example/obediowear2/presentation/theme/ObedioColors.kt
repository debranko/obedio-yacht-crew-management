package com.example.obediowear2.presentation.theme

import androidx.compose.ui.graphics.Color

/**
 * Luxury color palette for Obedio Radar (OLED Optimized)
 */
object ObedioColors {
    // Primary colors
    val Background = Color(0xFF000000)         // Pure black for OLED
    val ChampagneGold = Color(0xFFD4AF37)      // Primary accent
    val ChampagneGoldDim = Color(0x80D4AF37)   // 50% opacity gold

    // Alert colors
    val AlertRed = Color(0xFFB00020)           // Standard urgent
    val AlertRedBright = Color(0xFFFF1744)     // Emergency/attention
    val SuccessGreen = Color(0xFF10B981)       // Connected/success
    val UrgentAmber = Color(0xFFF59E0B)        // Urgent priority

    // Text colors
    val TextPrimary = Color(0xFFFFFFFF)        // Pure white
    val TextSecondary = Color(0xB3FFFFFF)      // 70% white
    val TextMuted = Color(0x66FFFFFF)          // 40% white

    // Status colors
    val StatusOnline = Color(0xFF10B981)       // Green
    val StatusOffline = Color(0xFFEF4444)      // Red
    val StatusBusy = Color(0xFFF59E0B)         // Amber

    // Request type colors
    val TypeLights = Color(0xFF3B82F6)         // Blue
    val TypeFood = Color(0xFFF97316)           // Orange
    val TypeDrinks = Color(0xFF06B6D4)         // Cyan
    val TypeEmergency = Color(0xFFFF1744)      // Bright red
    val TypeDnd = Color(0xFF6B7280)            // Gray

    // Battery colors
    val BatteryGood = Color(0xFF10B981)        // Green (>50%)
    val BatteryMedium = Color(0xFFF59E0B)      // Amber (20-50%)
    val BatteryLow = Color(0xFFEF4444)         // Red (<20%)

    // Radar specific
    val RadarGrid = Color(0x33D4AF37)          // 20% gold for grid lines
    val RadarSweep = Color(0x66D4AF37)         // 40% gold for sweep
    val RadarBezel = Color(0xFFD4AF37)         // Full gold for outer bezel
}
