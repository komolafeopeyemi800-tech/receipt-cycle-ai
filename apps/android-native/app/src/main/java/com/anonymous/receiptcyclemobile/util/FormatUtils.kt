package com.anonymous.receiptcyclemobile.util

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Currency
import java.util.Locale

fun formatMoney(amount: Double, currencyCode: String = "USD"): String = formatMoneyAmount(amount, currencyCode)

fun formatMoneyAmount(amount: Double, currencyCode: String = "USD"): String {
    return try {
        val nf = NumberFormat.getCurrencyInstance(Locale.getDefault())
        nf.currency = Currency.getInstance(currencyCode.ifBlank { "USD" })
        nf.format(amount)
    } catch (_: Exception) {
        "$%.2f".format(amount)
    }
}

fun formatMoneyCompact(amount: Double, currencyCode: String = "USD"): String {
    val abs = kotlin.math.abs(amount)
    val sign = if (amount < 0) "-" else ""
    val compact = when {
        abs >= 1_000_000 -> "%.1fM".format(abs / 1_000_000)
        abs >= 1_000 -> "%.1fK".format(abs / 1_000)
        else -> "%.0f".format(abs)
    }
    val sym = try {
        Currency.getInstance(currencyCode.ifBlank { "USD" }).symbol
    } catch (_: Exception) {
        "$"
    }
    return "$sign$sym$compact"
}

fun formatDateYmd(ymd: String, dateFormat: String = "iso"): String {
    return try {
        val parts = ymd.split("-")
        if (parts.size != 3) return ymd
        val y = parts[0].toInt()
        val m = parts[1].toInt() - 1
        val d = parts[2].toInt()
        val cal = java.util.Calendar.getInstance().apply {
            set(y, m, d)
        }
        val pattern = when (dateFormat) {
            "us" -> "MM/dd/yyyy"
            "eu" -> "dd/MM/yyyy"
            else -> "yyyy-MM-dd"
        }
        SimpleDateFormat(pattern, Locale.getDefault()).format(cal.time)
    } catch (_: Exception) {
        ymd
    }
}

fun subscriptionStatusLabel(sub: com.anonymous.receiptcyclemobile.data.models.SubscriptionState?): String {
    if (sub == null) return "Loading..."
    if (sub.pro == true) return "Pro"
    return when (sub.phase) {
        "trial" -> "Free trial"
        "trial_exhausted" -> "Free (limit reached)"
        else -> "Free"
    }
}
