package com.anonymous.receiptcyclemobile.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.anonymous.receiptcyclemobile.ui.components.RcCard
import com.anonymous.receiptcyclemobile.ui.components.ScreenHeader
import com.anonymous.receiptcyclemobile.ui.finance.FinanceViewModel
import com.anonymous.receiptcyclemobile.ui.preferences.PreferencesViewModel
import com.anonymous.receiptcyclemobile.ui.theme.RcColors
import com.anonymous.receiptcyclemobile.util.txKind

@Composable
fun AccountDetailScreen(
    accountId: String,
    financeViewModel: FinanceViewModel,
    prefsViewModel: PreferencesViewModel,
    onOpenTx: (String) -> Unit,
    onBack: () -> Unit,
) {
    val accounts by financeViewModel.accounts.collectAsState()
    val allTxs by financeViewModel.transactions.collectAsState()
    val accountTxs = remember(allTxs, accountId) { allTxs.filter { it.accountId == accountId } }
    val acc = accounts.find { it.id == accountId }
    var editing by remember { mutableStateOf(false) }
    var name by remember(acc) { mutableStateOf(acc?.name ?: "") }
    var balance by remember(acc) { mutableStateOf(acc?.balance?.toString() ?: "0") }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader(acc?.name ?: "Account")
        if (acc == null) {
            Text("Loading…")
        } else {
            RcCard {
                if (!editing) {
                    Text(acc.type, color = RcColors.Gray600)
                    Text("Balance: ${prefsViewModel.formatMoney(acc.balance)}")
                    Button(onClick = { editing = true }) { Text("Edit account") }
                } else {
                    OutlinedTextField(name, { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(balance, { balance = it }, label = { Text("Balance") }, modifier = Modifier.fillMaxWidth())
                    Button(onClick = {
                        financeViewModel.updateAccount(acc.id, name, acc.type, balance.toDoubleOrNull() ?: acc.balance)
                        editing = false
                    }) { Text("Save") }
                }
            }
            Text("Transactions", modifier = Modifier.padding(vertical = 8.dp))
            LazyColumn {
                items(accountTxs, key = { it.id }) { tx ->
                    RcCard(Modifier.clickable { onOpenTx(tx.id) }.padding(vertical = 4.dp)) {
                        Text(tx.merchant ?: tx.category)
                        Text(
                            prefsViewModel.formatMoney(kotlin.math.abs(tx.amount)),
                            color = if (txKind(tx.type) == "expense") RcColors.Rose600 else RcColors.Green600,
                        )
                    }
                }
            }
        }
        TextButton(onClick = onBack) { Text("Back") }
    }
}
