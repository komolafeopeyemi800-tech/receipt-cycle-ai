package com.anonymous.receiptcyclemobile

import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.CompositionLocalProvider
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.anonymous.receiptcyclemobile.auth.GoogleSignInHelper
import com.anonymous.receiptcyclemobile.ui.AppRoot
import com.anonymous.receiptcyclemobile.ui.AppViewModelFactory
import com.anonymous.receiptcyclemobile.ui.LocalAppContainer
import com.anonymous.receiptcyclemobile.ui.auth.AuthViewModel
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var googleHelper: GoogleSignInHelper
    private var pendingResetToken by mutableStateOf<String?>(null)
    private var pendingCsv by mutableStateOf<String?>(null)
    private var pendingGoogleIdToken by mutableStateOf<String?>(null)
    private var authRefreshNonce by mutableStateOf(0)
    private var pendingScan by mutableStateOf<com.anonymous.receiptcyclemobile.data.models.ScannedExtracted?>(null)
    private var pendingCheckoutTab by mutableStateOf<String?>(null)
    private var driveLinkRefreshNonce by mutableStateOf(0)

    private val csvPicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri == null) return@registerForActivityResult
        pendingCsv = contentResolver.openInputStream(uri)?.bufferedReader()?.readText()
    }

    private val imagePicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri == null) return@registerForActivityResult
        processReceiptUri(uri)
    }

    private val googleLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        googleHelper.handleResult(result.data)
            .onSuccess { pendingGoogleIdToken = it }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        googleHelper = GoogleSignInHelper(this)
        handleDeepLink(intent)

        val app = application as ReceiptCycleApplication

        setContent {
            CompositionLocalProvider(LocalAppContainer provides app.container) {
                val factory = AppViewModelFactory(app.container)
                val authViewModel: AuthViewModel = viewModel(factory = factory)

                pendingGoogleIdToken?.let { idToken ->
                    LaunchedEffect(idToken) {
                        authViewModel.signInWithGoogle(idToken) { pendingGoogleIdToken = null }
                    }
                }

                LaunchedEffect(authRefreshNonce) {
                    if (authRefreshNonce > 0) authViewModel.refreshToken()
                }

                AppRoot(
                    container = app.container,
                    onGoogleSignIn = {
                        googleHelper.signInIntent()?.let { googleLauncher.launch(it) }
                    },
                    googleConfigured = googleHelper.isConfigured(),
                    pendingResetToken = pendingResetToken,
                    onResetTokenConsumed = { pendingResetToken = null },
                    pendingCsv = pendingCsv,
                    onCsvConsumed = { pendingCsv = null },
                    onPickCsv = { csvPicker.launch("text/*") },
                    onPickReceiptImage = { imagePicker.launch("image/*") },
                    pendingScan = pendingScan,
                    onScanConsumed = { pendingScan = null },
                    onScanResult = { pendingScan = it },
                    pendingCheckoutTab = pendingCheckoutTab,
                    onCheckoutTabConsumed = { pendingCheckoutTab = null },
                    googleDriveConfigured = app.container.googleDriveOAuthHelper.isConfigured(),
                    onLinkGoogleDrive = { app.container.googleDriveOAuthHelper.startAuth() },
                    driveLinkRefreshNonce = driveLinkRefreshNonce,
                )
            }
        }
    }

    private fun processReceiptUri(uri: Uri) {
        val app = application as ReceiptCycleApplication
        lifecycleScope.launch {
            val bitmap = contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) } ?: return@launch
            runCatching {
                val b64 = com.anonymous.receiptcyclemobile.ui.screens.bitmapToBase64Jpeg(bitmap)
                app.container.financeRepository.scanFromBase64(b64, "image/jpeg").extracted
            }.onSuccess {
                pendingScan = it
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleDeepLink(intent)
    }

    private fun handleDeepLink(intent: Intent?) {
        val uri = intent?.data ?: return
        when {
            uri.host == "reset-password" -> {
                val token = uri.getQueryParameter("token")
                if (!token.isNullOrBlank()) pendingResetToken = token
            }
            uri.host == "post-checkout" -> {
                val screen = uri.getQueryParameter("screen")
                pendingCheckoutTab = screen ?: "Records"
            }
            uri.host == "google-drive-oauth" -> {
                val app = application as ReceiptCycleApplication
                val code = app.container.googleDriveOAuthHelper.parseAuthCode(uri) ?: return
                val verifier = app.container.googleDriveOAuthHelper.consumeCodeVerifier() ?: return
                lifecycleScope.launch {
                    runCatching {
                        val tokens = app.container.googleDriveOAuthHelper.exchangeCode(code, verifier)
                        val storage = app.container.driveBackupStorage
                        storage.setRefreshToken(tokens.refreshToken)
                        storage.setDriveEmail(tokens.email)
                        app.container.authRepository.currentUserId()?.let { storage.setUserId(it) }
                        driveLinkRefreshNonce++
                    }
                }
            }
        }
    }

}
