package com.anonymous.receiptcyclemobile.util

import com.anonymous.receiptcyclemobile.data.models.Transaction
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

fun roundMoney(n: Double): Double = kotlin.math.round(n * 100) / 100.0

fun todayIso(): String {
    val c = Calendar.getInstance()
    return "%04d-%02d-%02d".format(c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH))
}

fun todayYm(): String {
    val c = Calendar.getInstance()
    return "%04d-%02d".format(c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1)
}

fun addMonthsYm(ym: String, delta: Int): String {
    val parts = ym.split("-")
    if (parts.size != 2) return todayYm()
    val y = parts[0].toIntOrNull() ?: return todayYm()
    val m = parts[1].toIntOrNull() ?: return todayYm()
    val cal = Calendar.getInstance().apply {
        set(y, m - 1 + delta, 1)
    }
    return "%04d-%02d".format(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1)
}

fun formatMonthYearLabel(ym: String): String {
    val parts = ym.split("-")
    if (parts.size != 2) return ym
    val y = parts[0].toIntOrNull() ?: return ym
    val m = parts[1].toIntOrNull() ?: return ym
    val cal = Calendar.getInstance().apply { set(y, m - 1, 1) }
    return SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(cal.time)
}

fun ymToDateRange(ym: String): Pair<String, String> {
    val parts = ym.split("-")
    if (parts.size != 2) {
        val c = Calendar.getInstance()
        val start = "%04d-%02d-01".format(c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1)
        val last = c.getActualMaximum(Calendar.DAY_OF_MONTH)
        val end = "%04d-%02d-%02d".format(c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, last)
        return start to end
    }
    val y = parts[0].toInt()
    val m = parts[1].toInt()
    val cal = Calendar.getInstance().apply { set(y, m - 1, 1) }
    val last = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
    val start = "%04d-%02d-01".format(y, m)
    val end = "%04d-%02d-%02d".format(y, m, last)
    return start to end
}

fun txKind(type: String): String {
    val k = type.trim().lowercase()
    return when (k) {
        "income" -> "income"
        "expense" -> "expense"
        else -> "other"
    }
}

fun sumTotals(transactions: List<Transaction>, start: String?, end: String?): Triple<Double, Double, Double> {
    var expense = 0.0
    var income = 0.0
    for (t in transactions) {
        if (start != null && end != null && (t.date < start || t.date > end)) continue
        when (txKind(t.type)) {
            "expense" -> expense += kotlin.math.abs(t.amount)
            "income" -> income += kotlin.math.abs(t.amount)
        }
    }
    expense = roundMoney(expense)
    income = roundMoney(income)
    return Triple(expense, income, roundMoney(income - expense))
}

data class FinanceSummary(val expense: Double, val income: Double, val net: Double)

fun buildSummary(transactions: List<Transaction>): FinanceSummary {
    val (e, i, n) = sumTotals(transactions, null, null)
    return FinanceSummary(e, i, n)
}

fun expenseTotalsByCategory(transactions: List<Transaction>, start: String, end: String): Map<String, Double> {
    val map = mutableMapOf<String, Double>()
    for (t in transactions) {
        if (txKind(t.type) != "expense") continue
        if (t.date < start || t.date > end) continue
        map[t.category] = roundMoney((map[t.category] ?: 0.0) + kotlin.math.abs(t.amount))
    }
    return map
}
