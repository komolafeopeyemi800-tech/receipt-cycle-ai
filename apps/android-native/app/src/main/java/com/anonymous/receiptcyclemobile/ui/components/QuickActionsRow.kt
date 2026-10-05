package com.anonymous.receiptcyclemobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.anonymous.receiptcyclemobile.ui.theme.RcColors

@Composable
fun QuickActionsRow(
    onScan: () -> Unit,
    onUpload: () -> Unit,
    onAdd: () -> Unit,
    onBudgets: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly,
    ) {
        ActionChip("Scan", Icons.Default.CameraAlt, onScan)
        ActionChip("Upload", Icons.Default.Upload, onUpload)
        ActionChip("Add", Icons.Default.Add, onAdd)
        ActionChip("Budget", Icons.Default.PieChart, onBudgets)
    }
}

@Composable
private fun ActionChip(label: String, icon: ImageVector, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(8.dp),
    ) {
        Icon(
            icon,
            contentDescription = label,
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(RcColors.Primary.copy(alpha = 0.12f))
                .padding(10.dp),
            tint = RcColors.Primary,
        )
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = RcColors.Gray900)
    }
}
