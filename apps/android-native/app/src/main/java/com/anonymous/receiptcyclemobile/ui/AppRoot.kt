package com.anonymous.receiptcyclemobile.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.anonymous.receiptcyclemobile.AppContainer
import com.anonymous.receiptcyclemobile.data.models.ScannedExtracted
import com.anonymous.receiptcyclemobile.ui.auth.AuthViewModel
import com.anonymous.receiptcyclemobile.ui.components.ReceiptCycleBottomBar
import com.anonymous.receiptcyclemobile.ui.finance.FinanceViewModel
import com.anonymous.receiptcyclemobile.ui.navigation.Routes
import com.anonymous.receiptcyclemobile.ui.preferences.PreferencesViewModel
import com.anonymous.receiptcyclemobile.ui.screens.AccountDetailScreen
import com.anonymous.receiptcyclemobile.ui.screens.AccountSettingsScreen
import com.anonymous.receiptcyclemobile.ui.screens.AddTransactionScreen
import com.anonymous.receiptcyclemobile.ui.screens.AnalysisScreen
import com.anonymous.receiptcyclemobile.ui.screens.BudgetsScreen
import com.anonymous.receiptcyclemobile.ui.screens.CategoriesScreen
import com.anonymous.receiptcyclemobile.ui.screens.CategoryBreakdownScreen
import com.anonymous.receiptcyclemobile.ui.screens.FinanceCoachScreen
import com.anonymous.receiptcyclemobile.ui.screens.ForgotPasswordScreen
import com.anonymous.receiptcyclemobile.ui.screens.GoogleDriveBackupScreen
import com.anonymous.receiptcyclemobile.ui.screens.MerchantsVendorsScreen
import com.anonymous.receiptcyclemobile.ui.screens.NotificationsScreen
import com.anonymous.receiptcyclemobile.ui.screens.OnboardingScreen
import com.anonymous.receiptcyclemobile.ui.screens.RecordsScreen
import com.anonymous.receiptcyclemobile.ui.screens.RegionalPreferencesScreen
import com.anonymous.receiptcyclemobile.ui.screens.ResetPasswordScreen
import com.anonymous.receiptcyclemobile.ui.screens.SavedLocationsScreen
import com.anonymous.receiptcyclemobile.ui.screens.ScanReceiptScreen
import com.anonymous.receiptcyclemobile.ui.screens.ScanReviewScreen
import com.anonymous.receiptcyclemobile.ui.screens.SettingsScreen
import com.anonymous.receiptcyclemobile.ui.screens.SignInScreen
import com.anonymous.receiptcyclemobile.ui.screens.SignUpScreen
import com.anonymous.receiptcyclemobile.ui.screens.TransactionDetailScreen
import com.anonymous.receiptcyclemobile.ui.screens.UploadStatementScreen
import com.anonymous.receiptcyclemobile.ui.screens.AccountsScreen
import com.anonymous.receiptcyclemobile.ui.screens.PricingScreen
import com.anonymous.receiptcyclemobile.ui.theme.ReceiptCycleTheme

@Composable
fun AppRoot(
    container: AppContainer,
    onGoogleSignIn: () -> Unit,
    googleConfigured: Boolean,
    pendingResetToken: String?,
    onResetTokenConsumed: () -> Unit,
    pendingCsv: String?,
    onCsvConsumed: () -> Unit,
    onPickCsv: () -> Unit,
    onPickReceiptImage: () -> Unit,
    pendingScan: ScannedExtracted?,
    onScanConsumed: () -> Unit,
    onScanResult: (ScannedExtracted) -> Unit,
    pendingCheckoutTab: String?,
    onCheckoutTabConsumed: () -> Unit,
    googleDriveConfigured: Boolean,
    onLinkGoogleDrive: () -> Unit,
    driveLinkRefreshNonce: Int = 0,
) {
    val factory = remember { AppViewModelFactory(container) }
    val authViewModel: AuthViewModel = viewModel(factory = factory)
    val financeViewModel: FinanceViewModel = viewModel(factory = factory)
    val prefsViewModel: PreferencesViewModel = viewModel(factory = factory)
    val authState by authViewModel.uiState.collectAsState()
    val navController = rememberNavController()

    LaunchedEffect(authState.user?.id) {
        authState.user?.id?.let {
            financeViewModel.bindUser(it)
            prefsViewModel.bindUser(it)
        }
    }

    LaunchedEffect(pendingResetToken) {
        val token = pendingResetToken ?: return@LaunchedEffect
        navController.navigate(Routes.resetPassword(token))
        onResetTokenConsumed()
    }

    ReceiptCycleTheme {
        when {
            authState.loading && authState.token != null -> Text("Loading…")
            authState.user == null -> {
                NavHost(navController, startDestination = Routes.SIGN_IN) {
                    composable(Routes.SIGN_IN) {
                        SignInScreen(
                            authViewModel,
                            onSignUp = { navController.navigate(Routes.SIGN_UP) },
                            onForgot = { navController.navigate(Routes.FORGOT_PASSWORD) },
                            onGoogle = onGoogleSignIn,
                            googleConfigured = googleConfigured,
                        )
                    }
                    composable(Routes.SIGN_UP) {
                        SignUpScreen(authViewModel, onBack = { navController.popBackStack() }) {
                            navController.popBackStack(Routes.SIGN_IN, false)
                        }
                    }
                    composable(Routes.FORGOT_PASSWORD) {
                        ForgotPasswordScreen(authViewModel, onBack = { navController.popBackStack() })
                    }
                    composable(
                        Routes.RESET_PASSWORD,
                        arguments = listOf(navArgument("token") { type = NavType.StringType }),
                    ) { entry ->
                        val token = entry.arguments?.getString("token") ?: ""
                        ResetPasswordScreen(authViewModel, token) {
                            navController.navigate(Routes.SIGN_IN) { popUpTo(0) }
                        }
                    }
                }
            }
            authState.needsOnboarding -> {
                OnboardingScreen(
                    onDone = { authState.user?.id?.let { authViewModel.completeOnboarding(it) } },
                    onCurrencySelected = { code ->
                        authState.user?.id?.let { prefsViewModel.setCurrency(it, code) }
                    },
                )
            }
            else -> {
                val userId = authState.user!!.id

                LaunchedEffect(pendingScan) {
                    if (pendingScan != null) navController.navigate(Routes.SCAN_REVIEW)
                }

                LaunchedEffect(pendingCheckoutTab) {
                    val tab = pendingCheckoutTab ?: return@LaunchedEffect
                    val route = when (tab) {
                        "Analysis" -> Routes.TAB_ANALYSIS
                        "Budgets" -> Routes.TAB_BUDGETS
                        "Accounts" -> Routes.TAB_ACCOUNTS
                        "Categories" -> Routes.TAB_CATEGORIES
                        else -> Routes.TAB_RECORDS
                    }
                    navController.navigate(route) {
                        popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                        launchSingleTop = true
                    }
                    onCheckoutTabConsumed()
                }

                val tabs = listOf(
                    Routes.TAB_RECORDS,
                    Routes.TAB_ANALYSIS,
                    Routes.TAB_BUDGETS,
                    Routes.TAB_ACCOUNTS,
                    Routes.TAB_CATEGORIES,
                )
                val navBackStack by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStack?.destination?.route
                val showTabs = tabs.any { currentRoute == it }

                Scaffold(
                    bottomBar = {
                        if (showTabs) {
                            ReceiptCycleBottomBar(
                                currentRoute = currentRoute,
                                onTab = { route ->
                                    navController.navigate(route) {
                                        popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                },
                                onFabScan = { navController.navigate(Routes.SCAN_RECEIPT) },
                            )
                        }
                    },
                ) { padding ->
                    NavHost(
                        navController,
                        startDestination = Routes.TAB_RECORDS,
                        modifier = Modifier.padding(padding),
                    ) {
                        composable(Routes.TAB_RECORDS) {
                            RecordsScreen(
                                financeViewModel,
                                prefsViewModel,
                                onOpenSettings = { navController.navigate(Routes.SETTINGS) },
                                onAdd = { navController.navigate(Routes.ADD_TRANSACTION) },
                                onScan = { navController.navigate(Routes.SCAN_RECEIPT) },
                                onUpload = {
                                    onPickCsv()
                                    navController.navigate(Routes.UPLOAD_STATEMENT)
                                },
                                onBudgets = { navController.navigate(Routes.TAB_BUDGETS) },
                                onOpenTx = { navController.navigate(Routes.transactionDetail(it)) },
                                onCategoryBreakdown = { navController.navigate(Routes.categoryBreakdown(it)) },
                            )
                        }
                        composable(Routes.TAB_ANALYSIS) {
                            AnalysisScreen(
                                financeViewModel,
                                prefsViewModel,
                                onCoach = { navController.navigate(Routes.FINANCE_COACH) },
                                onCategory = { navController.navigate(Routes.categoryBreakdown(it)) },
                                onPricing = { navController.navigate(Routes.PRICING) },
                            )
                        }
                        composable(Routes.TAB_BUDGETS) { BudgetsScreen(financeViewModel, prefsViewModel) }
                        composable(Routes.TAB_ACCOUNTS) {
                            AccountsScreen(financeViewModel, prefsViewModel) {
                                navController.navigate(Routes.accountDetail(it))
                            }
                        }
                        composable(Routes.TAB_CATEGORIES) {
                            CategoriesScreen(financeViewModel) {
                                navController.navigate(Routes.categoryBreakdown(it))
                            }
                        }

                        composable(Routes.ADD_TRANSACTION) {
                            AddTransactionScreen(
                                userId,
                                financeViewModel,
                                container.financeRepository,
                                prefsViewModel,
                                scanned = pendingScan,
                                onDone = {
                                    onScanConsumed()
                                    navController.popBackStack()
                                },
                                onBack = { navController.popBackStack() },
                            )
                        }
                        composable(
                            Routes.ADD_TRANSACTION_EDIT,
                            arguments = listOf(navArgument("txId") { type = NavType.StringType }),
                        ) { entry ->
                            val txId = entry.arguments?.getString("txId") ?: ""
                            AddTransactionScreen(
                                userId,
                                financeViewModel,
                                container.financeRepository,
                                prefsViewModel,
                                scanned = null,
                                editTxId = txId,
                                onDone = { navController.popBackStack() },
                                onBack = { navController.popBackStack() },
                            )
                        }
                        composable(
                            Routes.TRANSACTION_DETAIL,
                            arguments = listOf(navArgument("id") { type = NavType.StringType }),
                        ) { entry ->
                            val id = entry.arguments?.getString("id") ?: ""
                            TransactionDetailScreen(
                                userId,
                                id,
                                financeViewModel,
                                prefsViewModel,
                                onEdit = { navController.navigate(Routes.addTransactionEdit(it)) },
                                onBack = { navController.popBackStack() },
                            )
                        }
                        composable(
                            Routes.CATEGORY_BREAKDOWN,
                            arguments = listOf(navArgument("category") { type = NavType.StringType }),
                        ) { entry ->
                            val category = entry.arguments?.getString("category") ?: ""
                            CategoryBreakdownScreen(category, financeViewModel, prefsViewModel) {
                                navController.popBackStack()
                            }
                        }
                        composable(
                            Routes.ACCOUNT_DETAIL,
                            arguments = listOf(navArgument("id") { type = NavType.StringType }),
                        ) { entry ->
                            val id = entry.arguments?.getString("id") ?: ""
                            AccountDetailScreen(id, financeViewModel, prefsViewModel, {
                                navController.navigate(Routes.transactionDetail(it))
                            }) { navController.popBackStack() }
                        }
                        composable(Routes.SCAN_RECEIPT) {
                            ScanReceiptScreen(
                                financeViewModel,
                                container.financeRepository,
                                onPickImage = onPickReceiptImage,
                                onScanned = { extracted ->
                                    onScanResult(extracted)
                                    navController.navigate(Routes.SCAN_REVIEW)
                                },
                                onBack = { navController.popBackStack() },
                            )
                        }
                        composable(Routes.SCAN_REVIEW) {
                            val data = pendingScan
                            if (data != null) {
                                ScanReviewScreen(
                                    data,
                                    onContinue = { navController.navigate(Routes.ADD_TRANSACTION) },
                                    onBack = { navController.popBackStack() },
                                )
                            }
                        }
                        composable(Routes.UPLOAD_STATEMENT) {
                            UploadStatementScreen(
                                userId,
                                financeViewModel,
                                csvText = pendingCsv ?: "",
                                onDone = {
                                    onCsvConsumed()
                                    navController.popBackStack()
                                },
                                onBack = { navController.popBackStack() },
                            )
                        }
                        composable(Routes.SETTINGS) {
                            SettingsScreen(
                                authViewModel,
                                userId,
                                financeViewModel,
                                prefsViewModel,
                                onNavigate = { key ->
                                    val dest = when (key) {
                                        "account_settings" -> Routes.ACCOUNT_SETTINGS
                                        "regional_prefs" -> Routes.REGIONAL_PREFS
                                        "google_drive" -> Routes.GOOGLE_DRIVE
                                        "pricing" -> Routes.PRICING
                                        "merchants" -> Routes.MERCHANTS
                                        "saved_locations" -> Routes.SAVED_LOCATIONS
                                        "notifications" -> Routes.NOTIFICATIONS
                                        else -> return@SettingsScreen
                                    }
                                    navController.navigate(dest)
                                },
                                onSignOut = { authViewModel.signOut() },
                            )
                        }
                        composable(Routes.FINANCE_COACH) {
                            FinanceCoachScreen(financeViewModel, container.financeRepository) {
                                navController.popBackStack()
                            }
                        }
                        composable(Routes.ACCOUNT_SETTINGS) {
                            AccountSettingsScreen(authViewModel, userId) { navController.popBackStack() }
                        }
                        composable(Routes.REGIONAL_PREFS) {
                            RegionalPreferencesScreen(userId, prefsViewModel) { navController.popBackStack() }
                        }
                        composable(Routes.GOOGLE_DRIVE) {
                            GoogleDriveBackupScreen(
                                container,
                                userId,
                                googleDriveConfigured,
                                onLinkGoogleDrive = onLinkGoogleDrive,
                                linkRefreshNonce = driveLinkRefreshNonce,
                                onBack = { navController.popBackStack() },
                            )
                        }
                        composable(Routes.PRICING) {
                            PricingScreen(financeViewModel) { navController.popBackStack() }
                        }
                        composable(Routes.MERCHANTS) {
                            MerchantsVendorsScreen(userId, prefsViewModel) { navController.popBackStack() }
                        }
                        composable(Routes.SAVED_LOCATIONS) {
                            SavedLocationsScreen { navController.popBackStack() }
                        }
                        composable(Routes.NOTIFICATIONS) {
                            NotificationsScreen(userId, prefsViewModel) { navController.popBackStack() }
                        }
                    }
                }
            }
        }
    }
}
