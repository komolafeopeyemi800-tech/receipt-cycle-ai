package com.anonymous.receiptcyclemobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import com.anonymous.receiptcyclemobile.ui.theme.RcColors

enum class PeriodMode { Month, All }

enum class TxFilter { All, Expense, Income }

@Composable
fun FinancialPeriodSummary(
    mode: PeriodMode,
    onModeChange: (PeriodMode) -> Unit,
    monthLabel: String,
    onPrevMonth: (() -> Unit)? = null,
    onNextMonth: (() -> Unit)? = null,
    monthNavDisabled: Boolean = false,
    expense: Double,
    income: Double,
    total: Double,
    formatCompact: (Double) -> String,
    filter: TxFilter? = null,
    onFilterChange: ((TxFilter) -> Unit)? = null,
) {
    var filterOpen by remember { mutableStateOf(false) }
    val showFilter = filter != null && onFilterChange != null

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .padding(16.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(PeriodMode.Month to "Month", PeriodMode.All to "All time").forEach { (m, label) ->
                val on = mode == m
                Text(
                    text = label,
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (on) RcColors.Primary else RcColors.Gray200)
                        .clickable { onModeChange(m) }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    color = if (on) Color.White else RcColors.Gray600,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                )
            }
        }
        Spacer(Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(
                onClick = { if (mode == PeriodMode.Month) onPrevMonth?.invoke() },
                enabled = mode == PeriodMode.Month && !monthNavDisabled,
            ) {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, contentDescription = "Previous month")
            }
            Text(
                text = if (mode == PeriodMode.Month) monthLabel else "All dates in view",
                modifier = Modifier.weight(1f),
                fontWeight = FontWeight.SemiBold,
                fontSize = 16.sp,
            )
            IconButton(
                onClick = { if (mode == PeriodMode.Month) onNextMonth?.invoke() },
                enabled = mode == PeriodMode.Month && !monthNavDisabled,
            ) {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = "Next month")
            }
            if (showFilter) {
                IconButton(onClick = { filterOpen = true }) {
                    Icon(Icons.Default.Tune, contentDescription = "Filter")
                }
            } else {
                Spacer(Modifier.width(48.dp))
            }
        }
        Spacer(Modifier.height(12.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            TotalCol("EXPENSE", formatCompact(expense), RcColors.Rose600, Modifier.weight(1f))
            TotalCol("INCOME", formatCompact(income), RcColors.Green600, Modifier.weight(1f))
            TotalCol(
                "TOTAL",
                formatCompact(total),
                if (total < 0) RcColors.Rose600 else RcColors.Gray900,
                Modifier.weight(1f),
            )
        }
    }

    if (filterOpen && filter != null && onFilterChange != null) {
        AlertDialog(
            onDismissRequest = { filterOpen = false },
            title = { Text("Show transactions") },
            text = {
                Column {
                    TxFilter.entries.forEach { f ->
                        TextButton(onClick = {
                            onFilterChange(f)
                            filterOpen = false
                        }) {
                            Text(
                                when (f) {
                                    TxFilter.All -> "All"
                                    TxFilter.Expense -> "Expenses only"
                                    TxFilter.Income -> "Income only"
                                },
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { filterOpen = false }) { Text("Close") }
            },
        )
    }
}

@Composable
private fun TotalCol(label: String, value: String, color: Color, modifier: Modifier) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, fontSize = 10.sp, color = RcColors.Gray600, fontWeight = FontWeight.Medium)
        Spacer(Modifier.height(4.dp))
        Text(value, fontSize = 18.sp, color = color, fontWeight = FontWeight.Bold, maxLines = 1)
    }
}
