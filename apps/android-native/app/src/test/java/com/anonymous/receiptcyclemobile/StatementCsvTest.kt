package com.anonymous.receiptcyclemobile

import com.anonymous.receiptcyclemobile.util.parseStatementCsv
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class StatementCsvTest {
    @Test
    fun parsesHeaderAndRows() {
        val csv = """
            amount,date,category
            12.50,2026-05-01,Groceries
            -8.00,2026-05-02,Transport
        """.trimIndent()
        val rows = parseStatementCsv(csv)
        assertEquals(2, rows.size)
        assertTrue(rows[0].amount > 0)
    }
}
