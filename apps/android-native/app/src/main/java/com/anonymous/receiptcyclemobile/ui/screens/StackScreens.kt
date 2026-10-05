package com.anonymous.receiptcyclemobile.ui.screens

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.anonymous.receiptcyclemobile.data.models.ScannedExtracted
import com.anonymous.receiptcyclemobile.data.repository.FinanceRepository
import com.anonymous.receiptcyclemobile.ui.auth.AuthViewModel
import com.anonymous.receiptcyclemobile.ui.components.RcCard
import com.anonymous.receiptcyclemobile.ui.components.ReceiptCameraPreview
import com.anonymous.receiptcyclemobile.ui.components.ScreenHeader
import com.anonymous.receiptcyclemobile.ui.finance.FinanceViewModel
import com.anonymous.receiptcyclemobile.ui.preferences.PreferencesViewModel
import com.anonymous.receiptcyclemobile.ui.theme.RcColors
import com.anonymous.receiptcyclemobile.util.parseStatementCsv
import com.anonymous.receiptcyclemobile.util.todayIso
import com.anonymous.receiptcyclemobile.util.userFacingErrorFromUnknown
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.io.ByteArrayOutputStream
import java.io.File

@Composable
fun AddTransactionScreen(
    userId: String,
    financeViewModel: FinanceViewModel,
    financeRepository: FinanceRepository,
    prefsViewModel: PreferencesViewModel,
    scanned: ScannedExtracted?,
    editTxId: String? = null,
    onDone: () -> Unit,
    onBack: () -> Unit,
) {
    val txs by financeViewModel.transactions.collectAsState()
    val existing = remember(txs, editTxId) { txs.find { it.id == editTxId } }
    var amount by remember { mutableStateOf(existing?.amount?.toString() ?: scanned?.amount?.toString() ?: "") }
    var category by remember { mutableStateOf(existing?.category ?: scanned?.category ?: "General") }
    var merchant by remember { mutableStateOf(existing?.merchant ?: scanned?.merchant ?: "") }
    var description by remember { mutableStateOf(existing?.description ?: "") }
    var type by remember { mutableStateOf(existing?.type ?: scanned?.type ?: "expense") }
    var date by remember { mutableStateOf(existing?.date ?: scanned?.date ?: todayIso()) }
    var voiceText by remember { mutableStateOf("") }
    val busy by financeViewModel.busy.collectAsState()
    val sub by financeViewModel.subscription.collectAsState()
    val scope = rememberCoroutineScope()
    val categories by financeViewModel.categories.collectAsState()
    val canSave = financeViewModel.canCreateTransaction() || editTxId != null

    LaunchedEffect(existing) {
        existing?.let {
            amount = kotlin.math.abs(it.amount).toString()
            category = it.category
            merchant = it.merchant ?: ""
            description = it.description ?: ""
            type = it.type
            date = it.date
        }
    }

    Column(Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {
        ScreenHeader(if (editTxId != null) "Edit record" else "Add record")
        if (!canSave) {
            Text(sub?.blockReason ?: "Upgrade to add more transactions.", color = RcColors.Rose600)
        }
        RcCard {
            OutlinedTextField(amount, { amount = it }, label = { Text("Amount") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = type == "expense", onClick = { type = "expense" }, label = { Text("Expense") })
                FilterChip(selected = type == "income", onClick = { type = "income" }, label = { Text("Income") })
            }
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(category, { category = it }, label = { Text("Category") }, modifier = Modifier.fillMaxWidth())
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                categories.take(8).forEach { c ->
                    FilterChip(selected = category == c.name, onClick = { category = c.name }, label = { Text(c.name) })
                }
            }
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(merchant, { merchant = it }, label = { Text("Merchant") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(description, { description = it }, label = { Text("Notes") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(date, { date = it }, label = { Text("Date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(voiceText, { voiceText = it }, label = { Text("Voice / speech text") }, modifier = Modifier.fillMaxWidth())
            TextButton(
                onClick = {
                    if (!financeViewModel.canUseAi() || voiceText.isBlank()) return@TextButton
                    scope.launch {
                        runCatching { financeRepository.parseSpeech(voiceText.trim()) }
                            .onSuccess { r ->
                                r.extracted?.let { e ->
                                    e.amount?.let { amount = kotlin.math.abs(it).toString() }
                                    e.category?.let { category = it }
                                    e.merchant?.let { merchant = it }
                                    e.type?.let { type = it }
                                    e.date?.let { date = it }
                                }
                            }
                    }
                },
            ) { Text("Parse voice text") }
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = {
                    val amt = amount.toDoubleOrNull() ?: return@Button
                    val signed = if (type == "expense") -kotlin.math.abs(amt) else kotlin.math.abs(amt)
                    if (editTxId != null) {
                        financeViewModel.updateTransaction(
                            userId, editTxId, signed, type, category, date,
                            merchant.ifBlank { null }, description.ifBlank { null }, onDone = onDone,
                        )
                    } else {
                        financeViewModel.createTransaction(
                            userId, signed, type, category, date,
                            merchant.ifBlank { null }, description.ifBlank { null },
                            entrySource = if (scanned != null) "camera" else "manual",
                            onDone = onDone,
                        )
                    }
                },
                enabled = !busy && canSave,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Save") }
            TextButton(onClick = onBack) { Text("Cancel") }
        }
    }
}

@Composable
fun TransactionDetailScreen(
    userId: String,
    txId: String,
    financeViewModel: FinanceViewModel,
    prefsViewModel: PreferencesViewModel,
    onEdit: (String) -> Unit,
    onBack: () -> Unit,
) {
    val txs by financeViewModel.transactions.collectAsState()
    val tx = txs.find { it.id == txId }
    val canEdit = financeViewModel.subscription.collectAsState().value?.canEditOrDeleteTransaction != false

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Transaction")
        if (tx == null) {
            Text("Loading…")
        } else {
            RcCard {
                Text(tx.merchant ?: tx.category, color = RcColors.Gray900)
                Text(prefsViewModel.formatMoney(kotlin.math.abs(tx.amount)))
                Text(prefsViewModel.formatDate(tx.date), color = RcColors.Gray600)
                Text("Category: ${tx.category}", color = RcColors.Gray600)
                tx.payment_method?.let { Text("Payment: $it", color = RcColors.Gray600) }
                tx.description?.let { Text(it, color = RcColors.Gray600) }
                Spacer(Modifier.height(12.dp))
                if (canEdit) {
                    Button(onClick = { onEdit(txId) }, modifier = Modifier.fillMaxWidth()) { Text("Edit") }
                    Button(onClick = { financeViewModel.removeTransaction(userId, txId, onBack) }) {
                        Text("Delete")
                    }
                }
            }
        }
        TextButton(onClick = onBack) { Text("Back") }
    }
}

@Composable
fun ScanReceiptScreen(
    financeViewModel: FinanceViewModel,
    financeRepository: FinanceRepository,
    onPickImage: () -> Unit,
    onScanned: (ScannedExtracted) -> Unit,
    onBack: () -> Unit,
) {
    val message by financeViewModel.message.collectAsState()
    var capture by remember { mutableStateOf<((onFile: (File) -> Unit) -> Unit)?>(null) }
    val scope = rememberCoroutineScope()
    val busy by financeViewModel.busy.collectAsState()

    Column(Modifier.fillMaxSize()) {
        ScreenHeader("Scan receipt")
        ReceiptCameraPreview(
            modifier = Modifier.fillMaxWidth().weight(1f),
            onReady = { capture = it },
        )
        Column(Modifier.padding(16.dp)) {
            message?.let { Text(it, color = RcColors.Rose600) }
            Button(
                onClick = {
                    capture?.invoke { file ->
                        scope.launch {
                            val bitmap = BitmapFactory.decodeFile(file.absolutePath) ?: return@launch
                            val b64 = bitmapToBase64Jpeg(bitmap)
                            runCatching {
                                financeRepository.scanFromBase64(b64, "image/jpeg").extracted
                            }.onSuccess { ext ->
                                if (ext != null) onScanned(ext)
                            }.onFailure {
                                financeViewModel.clearMessage()
                            }
                        }
                    }
                },
                enabled = capture != null && !busy,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Capture") }
            Button(onClick = onPickImage, modifier = Modifier.fillMaxWidth()) { Text("Choose from gallery") }
            TextButton(onClick = onBack) { Text("Back") }
        }
    }
}

fun bitmapToBase64Jpeg(bitmap: Bitmap, quality: Int = 85): String {
    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.JPEG, quality, stream)
    return Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
}

@Composable
fun ScanReviewScreen(scanned: ScannedExtracted, onContinue: () -> Unit, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Review scan")
        RcCard {
            OutlinedTextField(
                scanned.amount?.toString() ?: "",
                {},
                label = { Text("Amount") },
                readOnly = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Text("Category: ${scanned.category}")
            Text("Merchant: ${scanned.merchant}")
            Text("Date: ${scanned.date}")
        }
        Spacer(Modifier.height(12.dp))
        Button(onClick = onContinue, modifier = Modifier.fillMaxWidth()) { Text("Continue to add") }
        TextButton(onClick = onBack) { Text("Back") }
    }
}

@Composable
fun UploadStatementScreen(userId: String, financeViewModel: FinanceViewModel, csvText: String, onDone: () -> Unit, onBack: () -> Unit) {
    val rows = remember(csvText) { parseStatementCsv(csvText) }
    val busy by financeViewModel.busy.collectAsState()
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Import statement", "${rows.size} rows detected")
        Button(
            onClick = {
                financeViewModel.bulkImport(
                    userId,
                    rows.map {
                        mapOf(
                            "amount" to it.amount,
                            "type" to it.type,
                            "category" to it.category,
                            "date" to it.date,
                            "merchant" to it.merchant,
                            "description" to it.description,
                        )
                    },
                )
                onDone()
            },
            enabled = !busy && rows.isNotEmpty(),
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Import ${rows.size} rows") }
        TextButton(onClick = onBack) { Text("Cancel") }
    }
}

@Composable
fun FinanceCoachScreen(
    financeViewModel: FinanceViewModel,
    financeRepository: FinanceRepository,
    onBack: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    val messages = remember { mutableStateListOf<Pair<String, String>>() }
    var input by remember { mutableStateOf("") }
    var reply by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Finance Coach")
        Column(
            Modifier.fillMaxWidth().weight(1f).verticalScroll(rememberScrollState()),
        ) {
            messages.forEach { (role, content) ->
                val align = if (role == "user") RcColors.Gray900 else RcColors.Primary
                RcCard(Modifier.padding(vertical = 4.dp)) {
                    Text(if (role == "user") "You" else "Coach", fontWeight = androidx.compose.ui.text.font.FontWeight.Bold, color = align)
                    Text(content)
                }
            }
            reply?.let { Text("Coach: $it", color = RcColors.Primary) }
        }
        OutlinedTextField(input, { input = it }, label = { Text("Ask a question") }, modifier = Modifier.fillMaxWidth())
        Button(
            onClick = {
                scope.launch {
                    messages.add("user" to input)
                    val txs = financeViewModel.transactions.value
                    val rows = buildJsonArray {
                        txs.take(40).forEach { t ->
                            add(
                                buildJsonObject {
                                    put("amount", t.amount)
                                    put("category", t.category)
                                    put("type", t.type)
                                    put("date", t.date)
                                },
                            )
                        }
                    }
                    runCatching {
                        financeRepository.financeCoachChat("This month", rows, messages.toList())
                    }.onSuccess { reply = it.reply ?: "No reply" }
                        .onFailure { reply = userFacingErrorFromUnknown(it) }
                    input = ""
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Send") }
        TextButton(onClick = onBack) { Text("Back") }
    }
}

@Composable
fun SettingsScreen(
    authViewModel: AuthViewModel,
    userId: String,
    financeViewModel: FinanceViewModel,
    prefsViewModel: PreferencesViewModel,
    onNavigate: (String) -> Unit,
    onSignOut: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    val prefs by prefsViewModel.uiState.collectAsState()
    var exportMsg by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        ScreenHeader("Settings")
        RcCard {
            TogglePref("Capture payment method on scan", prefs.prefs.scanPayment == true) {
                prefsViewModel.setToggle(userId, "scanPayment", it)
            }
            TogglePref("Require payment method", prefs.prefs.requirePay == true) {
                prefsViewModel.setToggle(userId, "requirePay", it)
            }
            TogglePref("Require notes", prefs.prefs.requireNotes == true) {
                prefsViewModel.setToggle(userId, "requireNotes", it)
            }
        }
        if (financeViewModel.canExport()) {
            Button(
                onClick = {
                    scope.launch {
                        runCatching { financeViewModel.exportCsv(userId) }
                            .onSuccess { exportMsg = "Exported ${it.lines().size - 1} rows (share from backup screen)" }
                            .onFailure { exportMsg = it.message }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Export CSV backup") }
        }
        exportMsg?.let { Text(it, color = RcColors.Primary) }
        SettingsLink("Account settings") { onNavigate("account_settings") }
        SettingsLink("Regional preferences") { onNavigate("regional_prefs") }
        SettingsLink("Google Drive backup") { onNavigate("google_drive") }
        SettingsLink("Pricing & subscription") { onNavigate("pricing") }
        SettingsLink("Merchants & vendors") { onNavigate("merchants") }
        SettingsLink("Saved locations") { onNavigate("saved_locations") }
        SettingsLink("Notifications") { onNavigate("notifications") }
        Spacer(Modifier.height(16.dp))
        Button(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) { Text("Sign out") }
    }
}

@Composable
private fun TogglePref(label: String, checked: Boolean, onChecked: (Boolean) -> Unit) {
    androidx.compose.foundation.layout.Row(
        Modifier.fillMaxWidth().padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, modifier = Modifier.weight(1f))
        androidx.compose.material3.Switch(checked = checked, onCheckedChange = onChecked)
    }
}

@Composable
private fun SettingsLink(label: String, onClick: () -> Unit) {
    Button(onClick = onClick, modifier = Modifier.fillMaxWidth()) { Text(label) }
}
