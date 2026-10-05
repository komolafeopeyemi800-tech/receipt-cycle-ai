package com.anonymous.receiptcyclemobile.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.anonymous.receiptcyclemobile.ui.theme.RcColors
import kotlin.math.min

private val CHART_COLORS = listOf(
    Color(0xFFEF4444), Color(0xFF2563EB), Color(0xFF7C3AED), Color(0xFF16A34A),
    Color(0xFFF97316), Color(0xFFDB2777), Color(0xFF0EA5E9), Color(0xFFEA580C),
    Color(0xFF0F766E), Color(0xFF64748B),
)

@Composable
fun ExpensePieChart(
    slices: List<Pair<String, Double>>,
    modifier: Modifier = Modifier,
) {
    val total = slices.sumOf { it.second }
    if (total <= 0 || slices.isEmpty()) {
        Box(modifier.fillMaxWidth().height(180.dp), contentAlignment = Alignment.Center) {
            Text("No expense data for this period", color = RcColors.Gray600)
        }
        return
    }
    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(200.dp)
            .padding(16.dp),
    ) {
        val side = min(size.width, size.height)
        val topLeft = Offset((size.width - side) / 2f, (size.height - side) / 2f)
        var startAngle = -90f
        slices.forEachIndexed { i, (_, value) ->
            val sweep = (value / total * 360f).toFloat()
            drawArc(
                color = CHART_COLORS[i % CHART_COLORS.size],
                startAngle = startAngle,
                sweepAngle = sweep,
                useCenter = true,
                topLeft = topLeft,
                size = Size(side, side),
            )
            startAngle += sweep
        }
        val hole = side * 0.45f
        drawCircle(
            color = Color.White,
            radius = hole / 2f,
            center = Offset(size.width / 2f, size.height / 2f),
        )
    }
}
