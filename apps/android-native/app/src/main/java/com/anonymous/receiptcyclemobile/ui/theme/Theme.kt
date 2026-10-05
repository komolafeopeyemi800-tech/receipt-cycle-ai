package com.anonymous.receiptcyclemobile.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

object RcColors {
    val Primary = Color(0xFF0F766E)
    val PrimaryDark = Color(0xFF0D5C56)
    val Teal600 = Color(0xFF0D9488)
    val Background = Color(0xFFF8FAFC)
    val Surface = Color(0xFFFFFFFF)
    val Gray900 = Color(0xFF0F172A)
    val Gray600 = Color(0xFF475569)
    val Gray200 = Color(0xFFE2E8F0)
    val Rose600 = Color(0xFFE11D48)
    val Green600 = Color(0xFF16A34A)
}

private val LightColors = lightColorScheme(
    primary = RcColors.Primary,
    onPrimary = Color.White,
    background = RcColors.Background,
    surface = RcColors.Surface,
    onBackground = RcColors.Gray900,
    onSurface = RcColors.Gray900,
)

@Composable
fun ReceiptCycleTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = LightColors, content = content)
}
