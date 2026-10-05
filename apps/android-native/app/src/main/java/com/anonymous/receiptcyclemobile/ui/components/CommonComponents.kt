package com.anonymous.receiptcyclemobile.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.anonymous.receiptcyclemobile.ui.theme.RcColors

@Composable
fun ScreenHeader(title: String, subtitle: String? = null) {
    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp)) {
        Text(text = title, style = MaterialTheme.typography.headlineSmall, color = RcColors.Gray900)
        if (subtitle != null) {
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = RcColors.Gray600,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}

@Composable
fun RcCard(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = RcColors.Surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        content = { Column(Modifier.padding(16.dp)) { content() } },
    )
}
