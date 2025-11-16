package com.obedio.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import com.obedio.app.presentation.screens.dashboard.DashboardScreen
import com.obedio.app.presentation.screens.guest.GuestDetailScreen
import com.obedio.app.presentation.screens.guest.GuestListScreen
import com.obedio.app.presentation.screens.login.LoginScreen
import com.obedio.app.presentation.screens.service_request_detail.ServiceRequestDetailScreen
import com.obedio.app.presentation.screens.service_requests.ServiceRequestsScreen
import com.obedio.app.presentation.screens.settings.SettingsScreen
import com.obedio.app.presentation.screens.splash.SplashScreen

@Composable
fun ObedioNavigation(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screen.Splash.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // Splash Screen
        composable(route = Screen.Splash.route) {
            SplashScreen(
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToDashboard = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }
        
        // Login Screen
        composable(route = Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        
        // Dashboard Screen (Main)
        composable(
            route = Screen.Dashboard.route,
            deepLinks = listOf(
                navDeepLink {
                    uriPattern = "obedio://dashboard"
                }
            )
        ) {
            DashboardScreen(
                onNavigateToServiceRequests = {
                    navController.navigate(Screen.ServiceRequests.route)
                },
                onNavigateToServiceRequest = { requestId ->
                    navController.navigate(Screen.ServiceRequestDetail.createRoute(requestId))
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        
        // Service Requests List
        composable(route = Screen.ServiceRequests.route) {
            ServiceRequestsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToDetail = { requestId ->
                    navController.navigate(Screen.ServiceRequestDetail.createRoute(requestId))
                }
            )
        }
        
        // Service Request Detail
        composable(
            route = Screen.ServiceRequestDetail.route,
            arguments = listOf(
                navArgument("requestId") { type = NavType.StringType }
            ),
            deepLinks = listOf(
                navDeepLink {
                    uriPattern = "obedio://service-request/{requestId}"
                }
            )
        ) { backStackEntry ->
            val requestId = backStackEntry.arguments?.getString("requestId") ?: ""
            ServiceRequestDetailScreen(
                requestId = requestId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToGuest = { guestId ->
                    navController.navigate(Screen.GuestDetail.createRoute(guestId))
                }
            )
        }
        
        // Guest List
        composable(route = Screen.Guests.route) {
            GuestListScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToGuest = { guestId ->
                    navController.navigate(Screen.GuestDetail.createRoute(guestId))
                }
            )
        }
        
        // Guest Detail
        composable(
            route = Screen.GuestDetail.route,
            arguments = listOf(
                navArgument("guestId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val guestId = backStackEntry.arguments?.getString("guestId") ?: ""
            GuestDetailScreen(
                guestId = guestId,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        // Settings
        composable(route = Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}

// Screen definitions
sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object Dashboard : Screen("dashboard")
    object ServiceRequests : Screen("service_requests")
    object ServiceRequestDetail : Screen("service_request/{requestId}") {
        fun createRoute(requestId: String) = "service_request/$requestId"
    }
    object Guests : Screen("guests")
    object GuestDetail : Screen("guest/{guestId}") {
        fun createRoute(guestId: String) = "guest/$guestId"
    }
    object Settings : Screen("settings")
}