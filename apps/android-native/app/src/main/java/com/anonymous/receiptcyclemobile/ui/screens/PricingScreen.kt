package com.anonymous.receiptcyclemobile.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.anonymous.receiptcyclemobile.ui.components.RcCard
import com.anonymous.receiptcyclemobile.ui.components.ScreenHeader
import com.anonymous.receiptcyclemobile.ui.finance.FinanceViewModel
import com.anonymous.receiptcyclemobile.ui.theme.RcColors

@Composable
fun PricingScreen(financeViewModel: FinanceViewModel, onBack: () -> Unit) {
    val sub by financeViewModel.subscription.collectAsState()

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Pricing & subscription")
        RcCard {
            Text("Plan: ${if (sub?.pro == true) "Pro" else "Free"}", color = RcColors.Gray900)
            Text("Status: ${sub?.phase ?: "—"}", color = RcColors.Gray600)
            Text(
                "AI: ${if (sub?.canUseAiFeatures == true) "enabled" else "limited"}",
                color = RcColors.Gray600,
            )
            Text(
                "Manage billing on the web app or Whop checkout URLs from your account.",
                modifier = Modifier.padding(top = 12.dp),
            )
        }
        TextButton(onClick = onBack) { Text("Back") }
    }
}
