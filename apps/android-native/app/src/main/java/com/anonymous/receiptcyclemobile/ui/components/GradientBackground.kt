package com.anonymous.receiptcyclemobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.anonymous.receiptcyclemobile.ui.theme.RcColors

@Composable
fun ReceiptCycleGradientBackground(content: @Composable () -> Unit) {
    Box(
        Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFFCCFBF1),
                        RcColors.Background,
                        Color.White,
                    ),
                ),
            ),
    ) {
        content()
    }
}
