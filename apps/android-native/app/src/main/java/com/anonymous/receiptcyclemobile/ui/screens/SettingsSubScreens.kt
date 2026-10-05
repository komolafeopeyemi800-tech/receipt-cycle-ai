package com.anonymous.receiptcyclemobile.ui.screens

import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.anonymous.receiptcyclemobile.AppContainer
import com.anonymous.receiptcyclemobile.backup.DriveBackupRunner
import com.anonymous.receiptcyclemobile.backup.DriveBackupScheduler
import com.anonymous.receiptcyclemobile.backup.DriveBackupStorage
import com.anonymous.receiptcyclemobile.ui.auth.AuthViewModel
import com.anonymous.receiptcyclemobile.ui.components.RcCard
import com.anonymous.receiptcyclemobile.ui.components.ScreenHeader
import com.anonymous.receiptcyclemobile.ui.finance.FinanceViewModel
import com.anonymous.receiptcyclemobile.ui.preferences.PreferencesViewModel
import com.anonymous.receiptcyclemobile.ui.theme.RcColors
import kotlinx.coroutines.launch
import java.text.DateFormat
import java.util.Date

@Composable
fun AccountSettingsScreen(
    authViewModel: AuthViewModel,
    userId: String,
    onBack: () -> Unit,
) {
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {
        ScreenHeader("Account settings")
        RcCard {
            OutlinedTextField(currentPassword, { currentPassword = it }, label = { Text("Current password") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(newPassword, { newPassword = it }, label = { Text("New password") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    scope.launch {
                        authViewModel.changePassword(currentPassword, newPassword) { ok, err ->
                            message = if (ok) "Password updated" else err
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Change password") }
        }
        Spacer(Modifier.height(12.dp))
        Button(
            onClick = {
                scope.launch {
                    authViewModel.resetMyData { ok, err -> message = if (ok) "Data reset" else err }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Reset my data") }
        Button(
            onClick = {
                scope.launch {
                    authViewModel.deleteAccount { ok, err -> message = if (ok) "Account deleted" else err }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Delete account") }
        message?.let { Text(it, color = RcColors.Primary, modifier = Modifier.padding(top = 8.dp)) }
        TextButton(onClick = onBack) { Text("Back") }
    }
}

@Composable
fun RegionalPreferencesScreen(
    userId: String,
    prefsViewModel: PreferencesViewModel,
    onBack: () -> Unit,
) {
    val prefs by prefsViewModel.uiState.collectAsState()
    var currency by remember(prefs.prefs.currency) { mutableStateOf(prefs.prefs.currency) }
    var dateFormat by remember(prefs.prefs.dateFormat) { mutableStateOf(prefs.prefs.dateFormat) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Regional preferences")
        RcCard {
            OutlinedTextField(currency, { currency = it.uppercase() }, label = { Text("Currency (ISO)") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Text("Date format")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("iso", "us", "eu").forEach { f ->
                    FilterChip(selected = dateFormat == f, onClick = { dateFormat = f }, label = { Text(f.uppercase()) })
                }
            }
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = {
                    prefsViewModel.setCurrency(userId, currency)
                    prefsViewModel.setDateFormat(userId, dateFormat)
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Save") }
        }
        TextButton(onClick = onBack) { Text("Back") }
    }
}

@Composable
fun MerchantsVendorsScreen(
    userId: String,
    prefsViewModel: PreferencesViewModel,
    onBack: () -> Unit,
) {
    var merchant by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Merchants & vendors")
        Text("Merchant shortcuts sync with your account preferences.", color = RcColors.Gray600)
        RcCard {
            OutlinedTextField(merchant, { merchant = it }, label = { Text("Add merchant name") }, modifier = Modifier.fillMaxWidth())
            Button(onClick = { merchant = "" }, modifier = Modifier.fillMaxWidth()) { Text("Save (sync on next settings change)") }
        }
        TextButton(onClick = onBack) { Text("Back") }
    }
}

@Composable
fun SavedLocationsScreen(onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Saved locations")
        Text("Location shortcuts for receipts and expenses. Manage labels in Regional preferences sync.", color = RcColors.Gray600)
        TextButton(onClick = onBack) { Text("Back") }
    }
}

@Composable
fun NotificationsScreen(
    userId: String,
    prefsViewModel: PreferencesViewModel,
    onBack: () -> Unit,
) {
    val prefs by prefsViewModel.uiState.collectAsState()
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Notifications")
        RcCard {
            ToggleRow("Show transaction numbers", prefs.prefs.txnNumber == true) {
                prefsViewModel.setToggle(userId, "txnNumber", it)
            }
            ToggleRow("Reimbursement tracking", prefs.prefs.reimbursements == true) {
                prefsViewModel.setToggle(userId, "reimbursements", it)
            }
        }
        TextButton(onClick = onBack) { Text("Back") }
    }
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onChecked: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label)
        Switch(checked = checked, onCheckedChange = onChecked)
    }
}

@Composable
fun GoogleDriveBackupScreen(
    container: AppContainer,
    userId: String,
    googleDriveConfigured: Boolean,
    onLinkGoogleDrive: () -> Unit,
    linkRefreshNonce: Int = 0,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    val storage = container.driveBackupStorage
    var linked by remember { mutableStateOf(storage.getRefreshToken() != null) }
    var driveEmail by remember { mutableStateOf(storage.getDriveEmail()) }
    var weekly by remember { mutableStateOf(storage.isWeeklyEnabled()) }
    var lastAt by remember { mutableStateOf(storage.getLastBackupAt()) }
    var status by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val runner = remember { DriveBackupRunner(container, storage, container.googleDriveOAuthHelper) }

    fun refreshState() {
        linked = storage.getRefreshToken() != null
        driveEmail = storage.getDriveEmail()
        weekly = storage.isWeeklyEnabled()
        lastAt = storage.getLastBackupAt()
    }

    LaunchedEffect(linkRefreshNonce) {
        refreshState()
    }

    Column(Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {
        ScreenHeader("Google Drive backup")
        if (!googleDriveConfigured) {
            Text(
                "Set GOOGLE_ANDROID_CLIENT_ID in local.properties (same OAuth client as Expo, with redirect receiptcycle://google-drive-oauth).",
                color = RcColors.Rose600,
            )
        } else {
            Text(
                if (linked) "Linked as ${driveEmail ?: "Google account"}" else "Link Google Drive to upload encrypted JSON backups.",
                color = RcColors.Gray600,
            )
            Spacer(Modifier.height(8.dp))
            Text("Last backup: ${formatWhen(lastAt)}", color = RcColors.Gray600)
            Spacer(Modifier.height(12.dp))
            if (!linked) {
                Button(onClick = onLinkGoogleDrive, modifier = Modifier.fillMaxWidth()) {
                    Text("Link Google Drive")
                }
            } else {
                ToggleRow("Weekly automatic backup", weekly) { enabled ->
                    weekly = enabled
                    storage.setWeeklyEnabled(enabled)
                    storage.setUserId(userId)
                    DriveBackupScheduler.setWeeklyEnabled(context, enabled)
                }
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = {
                        busy = true
                        scope.launch {
                            runCatching { runner.runBackupNow(userId) }
                                .onSuccess {
                                    status = "Backup uploaded to Drive."
                                    refreshState()
                                }
                                .onFailure { status = it.message }
                            busy = false
                        }
                    },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Back up now") }
                OutlinedButton(
                    onClick = {
                        storage.clear()
                        DriveBackupScheduler.setWeeklyEnabled(context, false)
                        refreshState()
                        status = "Disconnected Google Drive."
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Disconnect") }
            }
        }
        status?.let { Text(it, modifier = Modifier.padding(top = 8.dp), color = RcColors.Primary) }
        TextButton(onClick = onBack) { Text("Back") }
    }
}

private fun formatWhen(ms: Long?): String {
    if (ms == null) return "Never"
    return DateFormat.getDateTimeInstance().format(Date(ms))
}
