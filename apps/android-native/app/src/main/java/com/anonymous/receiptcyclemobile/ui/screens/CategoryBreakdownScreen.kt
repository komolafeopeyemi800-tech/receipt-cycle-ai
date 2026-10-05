package com.anonymous.receiptcyclemobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.anonymous.receiptcyclemobile.ui.components.ExpensePieChart
import com.anonymous.receiptcyclemobile.ui.components.RcCard
import com.anonymous.receiptcyclemobile.ui.components.ScreenHeader
import com.anonymous.receiptcyclemobile.ui.finance.FinanceViewModel
import com.anonymous.receiptcyclemobile.ui.preferences.PreferencesViewModel
import com.anonymous.receiptcyclemobile.ui.theme.RcColors
import com.anonymous.receiptcyclemobile.util.txKind

@Composable
fun CategoryBreakdownScreen(
    category: String,
    financeViewModel: FinanceViewModel,
    prefsViewModel: PreferencesViewModel,
    onBack: () -> Unit,
) {
    val txs by financeViewModel.transactions.collectAsState()
    val filtered = remember(txs, category) { txs.filter { it.category == category } }
    val total = remember(filtered) {
        filtered.filter { txKind(it.type) == "expense" }.sumOf { kotlin.math.abs(it.amount) }
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(RcColors.Background)
            .padding(16.dp),
    ) {
        ScreenHeader(category, "Category breakdown")
        RcCard {
            Text("Total spent", color = RcColors.Gray600)
            Text(prefsViewModel.formatMoney(total), fontWeight = FontWeight.Bold)
            ExpensePieChart(listOf(category to total))
        }
        Spacer(Modifier.height(12.dp))
        LazyColumn {
            items(filtered, key = { it.id }) { tx ->
                RcCard(Modifier.padding(vertical = 4.dp)) {
                    Text(tx.merchant ?: tx.description ?: "—")
                    Text(prefsViewModel.formatDate(tx.date), color = RcColors.Gray600)
                    Text(
                        prefsViewModel.formatMoney(kotlin.math.abs(tx.amount)),
                        color = if (txKind(tx.type) == "expense") RcColors.Rose600 else RcColors.Green600,
                    )
                }
            }
        }
        TextButton(onClick = onBack) { Text("Back") }
    }
}
