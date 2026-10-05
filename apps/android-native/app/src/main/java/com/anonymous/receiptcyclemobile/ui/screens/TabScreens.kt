package com.anonymous.receiptcyclemobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.anonymous.receiptcyclemobile.data.models.Account
import com.anonymous.receiptcyclemobile.data.models.BudgetRow
import com.anonymous.receiptcyclemobile.data.models.Category
import com.anonymous.receiptcyclemobile.data.models.SubscriptionState
import com.anonymous.receiptcyclemobile.data.models.Transaction
import com.anonymous.receiptcyclemobile.ui.components.ExpensePieChart
import com.anonymous.receiptcyclemobile.ui.components.FinancialPeriodSummary
import com.anonymous.receiptcyclemobile.ui.components.PeriodMode
import com.anonymous.receiptcyclemobile.ui.components.QuickActionsRow
import com.anonymous.receiptcyclemobile.ui.components.RcCard
import com.anonymous.receiptcyclemobile.ui.components.ScreenHeader
import com.anonymous.receiptcyclemobile.ui.components.TxFilter
import com.anonymous.receiptcyclemobile.ui.finance.FinanceViewModel
import com.anonymous.receiptcyclemobile.ui.preferences.PreferencesViewModel
import com.anonymous.receiptcyclemobile.ui.theme.RcColors
import com.anonymous.receiptcyclemobile.util.buildSummary
import com.anonymous.receiptcyclemobile.util.expenseTotalsByCategory
import com.anonymous.receiptcyclemobile.util.formatMonthYearLabel
import com.anonymous.receiptcyclemobile.util.subscriptionStatusLabel
import com.anonymous.receiptcyclemobile.util.sumTotals
import com.anonymous.receiptcyclemobile.util.txKind
import com.anonymous.receiptcyclemobile.util.ymToDateRange

@Composable
fun RecordsScreen(
    financeViewModel: FinanceViewModel,
    prefsViewModel: PreferencesViewModel,
    onOpenSettings: () -> Unit,
    onAdd: () -> Unit,
    onScan: () -> Unit,
    onUpload: () -> Unit,
    onBudgets: () -> Unit,
    onOpenTx: (String) -> Unit,
    onCategoryBreakdown: (String) -> Unit,
) {
    val txs by financeViewModel.transactions.collectAsState()
    val sub by financeViewModel.subscription.collectAsState()
    val periodMode by financeViewModel.periodMode.collectAsState()
    val txFilter by financeViewModel.txFilter.collectAsState()
    val categoryFilter by financeViewModel.categoryFilter.collectAsState()
    val ym by financeViewModel.selectedYm.collectAsState()
    val categories by financeViewModel.categories.collectAsState()
    val (start, end) = remember(ym, periodMode) {
        if (periodMode == PeriodMode.Month) ymToDateRange(ym) else null to null
    }
    val (expense, income, net) = remember(txs) { sumTotals(txs, start, end) }
    val grouped = remember(txs) { txs.groupBy { it.date }.toList().sortedByDescending { it.first } }

    Column(
        Modifier
            .fillMaxSize()
            .background(RcColors.Background),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Records", fontSize = 22.sp, fontWeight = FontWeight.Bold)
            SubscriptionPill(sub, onOpenSettings)
        }
        Column(Modifier.verticalScroll(rememberScrollState())) {
            FinancialPeriodSummary(
                mode = periodMode,
                onModeChange = { financeViewModel.periodMode.value = it },
                monthLabel = formatMonthYearLabel(ym),
                onPrevMonth = { financeViewModel.shiftMonth(-1) },
                onNextMonth = { financeViewModel.shiftMonth(1) },
                expense = expense,
                income = income,
                total = net,
                formatCompact = prefsViewModel::formatMoneyCompact,
                filter = txFilter,
                onFilterChange = { financeViewModel.txFilter.value = it },
            )
            Spacer(Modifier.height(12.dp))
            QuickActionsRow(onScan, onUpload, onAdd, onBudgets)
            Spacer(Modifier.height(8.dp))
            CategoryChips(
                categories = categories,
                selected = categoryFilter,
                onSelect = { financeViewModel.categoryFilter.value = it },
            )
            Spacer(Modifier.height(8.dp))
            if (txs.isEmpty()) {
                Text(
                    "No transactions yet. Scan a receipt or add one manually.",
                    modifier = Modifier.padding(24.dp),
                    color = RcColors.Gray600,
                )
            } else {
                grouped.forEach { (date, dayTxs) ->
                    Text(
                        prefsViewModel.formatDate(date),
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        fontWeight = FontWeight.SemiBold,
                        color = RcColors.Gray600,
                        fontSize = 13.sp,
                    )
                    dayTxs.forEach { tx ->
                        TransactionRow(tx, prefsViewModel::formatMoney, prefsViewModel::formatDate) {
                            onOpenTx(tx.id)
                        }
                    }
                }
            }
            Spacer(Modifier.height(80.dp))
        }
    }
}

@Composable
private fun SubscriptionPill(sub: SubscriptionState?, onSettings: () -> Unit) {
    val pro = sub?.pro == true
    val label = subscriptionStatusLabel(sub)
    Text(
        label,
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (pro) RcColors.Primary else RcColors.Gray200)
            .clickable(onClick = onSettings)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        color = if (pro) Color.White else RcColors.Gray900,
        fontSize = 12.sp,
        fontWeight = FontWeight.Medium,
    )
}

@Composable
private fun CategoryChips(categories: List<Category>, selected: String?, onSelect: (String?) -> Unit) {
    Row(
        Modifier
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        FilterChip(selected = selected == null, onClick = { onSelect(null) }, label = { Text("All") })
        categories.take(12).forEach { c ->
            FilterChip(
                selected = selected == c.name,
                onClick = { onSelect(if (selected == c.name) null else c.name) },
                label = { Text(c.name) },
            )
        }
    }
}

@Composable
private fun TransactionRow(
    tx: Transaction,
    formatMoney: (Double) -> String,
    formatDate: (String) -> String,
    onClick: () -> Unit,
) {
    RcCard(Modifier.padding(horizontal = 16.dp, vertical = 4.dp).clickable(onClick = onClick)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column(Modifier.weight(1f)) {
                Text(tx.merchant?.ifBlank { null } ?: tx.category, fontWeight = FontWeight.Medium)
                Text("${tx.category} · ${formatDate(tx.date)}", color = RcColors.Gray600, fontSize = 12.sp)
            }
            Text(
                formatMoney(kotlin.math.abs(tx.amount)),
                color = if (txKind(tx.type) == "expense") RcColors.Rose600 else RcColors.Green600,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

@Composable
fun AnalysisScreen(
    financeViewModel: FinanceViewModel,
    prefsViewModel: PreferencesViewModel,
    onCoach: () -> Unit,
    onCategory: (String) -> Unit,
    onPricing: () -> Unit,
) {
    val txs by financeViewModel.transactions.collectAsState()
    val periodMode by financeViewModel.periodMode.collectAsState()
    val ym by financeViewModel.selectedYm.collectAsState()
    val sub by financeViewModel.subscription.collectAsState()
    val moneyLeak by financeViewModel.moneyLeak.collectAsState()
    val busy by financeViewModel.busy.collectAsState()
    val (start, end) = remember(ym, periodMode) {
        if (periodMode == PeriodMode.Month) ymToDateRange(ym) else null to null
    }
    val (expense, income, net) = remember(txs) { sumTotals(txs, start, end) }
    val slices = remember(txs, start, end) {
        if (start == null || end == null) {
            expenseTotalsByCategory(txs, "0000-01-01", "9999-12-31").toList().sortedByDescending { it.second }
        } else {
            expenseTotalsByCategory(txs, start, end).toList().sortedByDescending { it.second }
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(RcColors.Background)
            .verticalScroll(rememberScrollState()),
    ) {
        ScreenHeader("Analysis", formatMonthYearLabel(ym))
        FinancialPeriodSummary(
            mode = periodMode,
            onModeChange = { financeViewModel.periodMode.value = it },
            monthLabel = formatMonthYearLabel(ym),
            onPrevMonth = { financeViewModel.shiftMonth(-1) },
            onNextMonth = { financeViewModel.shiftMonth(1) },
            expense = expense,
            income = income,
            total = net,
            formatCompact = prefsViewModel::formatMoneyCompact,
        )
        Spacer(Modifier.height(16.dp))
        RcCard(Modifier.padding(horizontal = 16.dp)) {
            Text("Spending by category", fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(8.dp))
            ExpensePieChart(slices)
            slices.take(6).forEach { (cat, amt) ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .clickable { onCategory(cat) }
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(cat)
                    Text(prefsViewModel.formatMoney(amt), fontWeight = FontWeight.Medium)
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        RcCard(Modifier.padding(horizontal = 16.dp)) {
            Text("Money leak scan", fontWeight = FontWeight.SemiBold)
            Text("AI spots recurring charges and unusual spending.", color = RcColors.Gray600, fontSize = 13.sp)
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    if (financeViewModel.canUseAi()) {
                        financeViewModel.analyzeMoneyLeaks(formatMonthYearLabel(ym), txs)
                    } else {
                        onPricing()
                    }
                },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (sub?.canUseAiFeatures == true) "Run scan" else "Upgrade for AI")
            }
            if (busy) {
                Spacer(Modifier.height(8.dp))
                CircularProgressIndicator()
            }
            moneyLeak?.summary?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, fontSize = 14.sp)
            }
            moneyLeak?.findings?.orEmpty()?.forEach { finding ->
                Spacer(Modifier.height(6.dp))
                Text(finding.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text(finding.detail, color = RcColors.Gray600, fontSize = 13.sp)
            }
            moneyLeak?.tips?.orEmpty()?.take(4)?.forEach { tip ->
                Text("• $tip", color = RcColors.Gray600, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp))
            }
        }
        Spacer(Modifier.height(12.dp))
        Button(onClick = onCoach, modifier = Modifier.padding(horizontal = 16.dp).fillMaxWidth()) {
            Text("Finance Coach")
        }
        Spacer(Modifier.height(80.dp))
    }
}

@Composable
fun BudgetsScreen(financeViewModel: FinanceViewModel, prefsViewModel: PreferencesViewModel) {
    val budgets by financeViewModel.budgets.collectAsState()
    val categories by financeViewModel.categories.collectAsState()
    val txs by financeViewModel.transactions.collectAsState()
    val ym by financeViewModel.selectedYm.collectAsState()
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var amountText by remember { mutableStateOf("") }
    val (start, end) = ymToDateRange(ym)
    val spendByCat = remember(txs, start, end) { expenseTotalsByCategory(txs, start, end) }

    Column(Modifier.fillMaxSize().background(RcColors.Background)) {
        Row(
            Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ScreenHeader("Budgets", formatMonthYearLabel(ym))
            Row {
                Button(onClick = { financeViewModel.shiftMonth(-1) }) { Text("<") }
                Button(onClick = { financeViewModel.shiftMonth(1) }) { Text(">") }
            }
        }
        LazyColumn(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            val budgetMap = budgets.associateBy { it.category }
            val cats = categories.filter { it.kind == "expense" }.map { it.name }.distinct()
            items(cats.ifEmpty { budgetMap.keys.toList() }) { cat ->
                val budget = budgetMap[cat]?.amount ?: 0.0
                val spent = spendByCat[cat] ?: 0.0
                val pct = if (budget > 0) (spent / budget).coerceIn(0.0, 1.0).toFloat() else 0f
                val over = budget > 0 && spent > budget
                RcCard {
                    Text(cat, fontWeight = FontWeight.SemiBold)
                    Text(
                        "${prefsViewModel.formatMoney(spent)} of ${prefsViewModel.formatMoney(budget)}",
                        color = if (over) RcColors.Rose600 else RcColors.Gray600,
                        fontSize = 13.sp,
                    )
                    LinearProgressIndicator(
                        progress = { pct },
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        color = if (over) RcColors.Rose600 else RcColors.Primary,
                    )
                }
            }
        }
        RcCard(Modifier.padding(16.dp)) {
            Text("Set budget", fontWeight = FontWeight.SemiBold)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                categories.filter { it.kind == "expense" }.take(8).forEach { c ->
                    FilterChip(
                        selected = selectedCategory == c.name,
                        onClick = { selectedCategory = c.name },
                        label = { Text(c.name) },
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(amountText, { amountText = it }, label = { Text("Amount") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    val cat = selectedCategory ?: return@Button
                    val amt = amountText.toDoubleOrNull() ?: return@Button
                    financeViewModel.upsertBudget(cat, amt)
                    amountText = ""
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Save budget") }
        }
    }
}

@Composable
fun AccountsScreen(
    financeViewModel: FinanceViewModel,
    prefsViewModel: PreferencesViewModel,
    onOpen: (String) -> Unit,
) {
    val accounts by financeViewModel.accounts.collectAsState()
    var name by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().background(RcColors.Background)) {
        ScreenHeader("Accounts")
        LazyColumn(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(accounts, key = { it.id }) { acc ->
                AccountRow(acc, prefsViewModel::formatMoney) { onOpen(acc.id) }
            }
        }
        RcCard(Modifier.padding(16.dp)) {
            OutlinedTextField(name, { name = it }, label = { Text("New account name") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = { if (name.isNotBlank()) { financeViewModel.createAccount(name.trim(), "checking"); name = "" } },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Add account") }
        }
    }
}

@Composable
private fun AccountRow(acc: Account, formatMoney: (Double) -> String, onClick: () -> Unit) {
    RcCard(Modifier.clickable(onClick = onClick)) {
        Text(acc.name, fontWeight = FontWeight.SemiBold)
        Text("${acc.type} · ${formatMoney(acc.balance)}", color = RcColors.Gray600, fontSize = 13.sp)
    }
}

@Composable
fun CategoriesScreen(
    financeViewModel: FinanceViewModel,
    onBreakdown: (String) -> Unit,
) {
    val categories by financeViewModel.categories.collectAsState()
    var name by remember { mutableStateOf("") }
    var kind by remember { mutableStateOf("expense") }

    Column(Modifier.fillMaxSize().background(RcColors.Background)) {
        ScreenHeader("Categories")
        LazyColumn(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(categories, key = { it.id }) { cat ->
                RcCard(Modifier.clickable { onBreakdown(cat.name) }) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(cat.name, fontWeight = FontWeight.Medium)
                        Text(cat.kind, color = RcColors.Gray600, fontSize = 12.sp)
                    }
                }
            }
        }
        RcCard(Modifier.padding(16.dp)) {
            OutlinedTextField(name, { name = it }, label = { Text("New category") }, modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = kind == "expense", onClick = { kind = "expense" }, label = { Text("Expense") })
                FilterChip(selected = kind == "income", onClick = { kind = "income" }, label = { Text("Income") })
            }
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = { if (name.isNotBlank()) { financeViewModel.createCategory(name.trim(), kind); name = "" } },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Add category") }
        }
    }
}
