package com.anonymous.receiptcyclemobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.Category
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.PieChart
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.anonymous.receiptcyclemobile.ui.navigation.Routes
import com.anonymous.receiptcyclemobile.ui.theme.RcColors

@Composable
fun ReceiptCycleBottomBar(
    currentRoute: String?,
    onTab: (String) -> Unit,
    onFabScan: () -> Unit,
) {
    val tabs = listOf(
        Routes.TAB_RECORDS to ("Records" to Icons.Outlined.Folder),
        Routes.TAB_ANALYSIS to ("Analysis" to Icons.Outlined.Analytics),
        Routes.TAB_BUDGETS to ("Budgets" to Icons.Outlined.PieChart),
        Routes.TAB_ACCOUNTS to ("Accounts" to Icons.Outlined.AccountBalanceWallet),
        Routes.TAB_CATEGORIES to ("Categories" to Icons.Outlined.Category),
    )
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.98f))
            .navigationBarsPadding(),
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp, bottom = 8.dp),
            ) {
                tabs.take(2).forEach { (route, pair) ->
                    TabButton(route, pair.first, pair.second, currentRoute == route, onTab, Modifier.weight(1f))
                }
                Box(Modifier.weight(0.7f))
                tabs.drop(2).forEach { (route, pair) ->
                    TabButton(route, pair.first, pair.second, currentRoute == route, onTab, Modifier.weight(1f))
                }
            }
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = (-20).dp)
                    .size(56.dp)
                    .background(RcColors.Primary, CircleShape)
                    .clickable(onClick = onFabScan),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.Add, contentDescription = "Scan receipt", tint = Color.White)
            }
        }
    }
}

@Composable
private fun TabButton(
    route: String,
    label: String,
    icon: ImageVector,
    selected: Boolean,
    onTab: (String) -> Unit,
    modifier: Modifier,
) {
    Column(
        modifier = modifier.clickable { onTab(route) },
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(icon, contentDescription = label, tint = if (selected) RcColors.Primary else RcColors.Gray600)
        Text(
            label,
            fontSize = 10.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            color = if (selected) RcColors.Primary else RcColors.Gray600,
        )
    }
}
