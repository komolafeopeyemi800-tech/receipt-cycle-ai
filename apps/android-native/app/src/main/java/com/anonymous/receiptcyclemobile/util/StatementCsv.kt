package com.anonymous.receiptcyclemobile.util

data class CsvImportRow(
    val amount: Double,
    val type: String,
    val category: String,
    val date: String,
    val merchant: String? = null,
    val description: String? = null,
)

fun parseStatementCsv(text: String): List<CsvImportRow> {
    val lines = text.lines().map { it.trim() }.filter { it.isNotEmpty() }
    if (lines.isEmpty()) return emptyList()
    val header = lines.first().lowercase()
    val hasHeader = header.contains("amount") || header.contains("date")
    val dataLines = if (hasHeader) lines.drop(1) else lines
    val out = mutableListOf<CsvImportRow>()
    for (line in dataLines) {
        val cols = line.split(",").map { it.trim().removeSurrounding("\"") }
        if (cols.size < 3) continue
        val amount = cols.getOrNull(0)?.replace("$", "")?.toDoubleOrNull()
            ?: cols.getOrNull(2)?.replace("$", "")?.toDoubleOrNull()
            ?: continue
        val date = cols.getOrNull(1)?.takeIf { it.contains("-") }
            ?: cols.getOrNull(3)
            ?: continue
        val category = cols.getOrNull(2)?.takeIf { !it.contains("-") } ?: "Import"
        val type = if (amount < 0) "expense" else "income"
        out.add(
            CsvImportRow(
                amount = kotlin.math.abs(amount),
                type = type,
                category = category,
                date = date,
                merchant = cols.getOrNull(4),
                description = cols.getOrNull(5),
            ),
        )
    }
    return out
}
