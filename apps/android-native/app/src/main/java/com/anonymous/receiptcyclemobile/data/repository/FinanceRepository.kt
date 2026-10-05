package com.anonymous.receiptcyclemobile.data.repository

import com.anonymous.receiptcyclemobile.data.ApiClient
import com.anonymous.receiptcyclemobile.data.IdResponse
import com.anonymous.receiptcyclemobile.data.SessionStorage
import com.anonymous.receiptcyclemobile.data.models.Account
import com.anonymous.receiptcyclemobile.data.models.BudgetRow
import com.anonymous.receiptcyclemobile.data.models.Category
import com.anonymous.receiptcyclemobile.data.models.CoachChatResult
import com.anonymous.receiptcyclemobile.data.models.MoneyLeakResult
import com.anonymous.receiptcyclemobile.data.models.ScanResult
import com.anonymous.receiptcyclemobile.data.models.ScannedExtracted
import com.anonymous.receiptcyclemobile.data.models.SubscriptionState
import com.anonymous.receiptcyclemobile.data.models.Transaction
import kotlinx.coroutines.flow.Flow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray

/** `POST /api/ai/scan` and `/scan-text` answer. */
@Serializable
internal data class ScanDto(
    val success: Boolean? = null,
    val extracted_data: ScanExtractedDto? = null,
    val error: String? = null,
)

@Serializable
internal data class ScanExtractedDto(
    val merchant_name: String? = null,
    val total_amount: Double? = null,
    val date: String? = null,
    val payment_method: String? = null,
    val category: String? = null,
    val formatted_receipt_text: String? = null,
)

/** Answers of the voice endpoints under /api/ai/voice. */
@Serializable
internal data class VoiceDto(
    val ok: Boolean? = null,
    val error: String? = null,
    val transcript: String? = null,
    val draft: DraftDto? = null,
)

@Serializable
internal data class DraftDto(
    val amount: Double? = null,
    val type: String? = null,
    val category: String? = null,
    val merchant: String? = null,
    val date: String? = null,
    val description: String? = null,
    val payment_method: String? = null,
)

class FinanceRepository(
    private val api: ApiClient,
    private val sessionStorage: SessionStorage,
) {
    companion object {
        private const val WORKSPACE = "personal"
        private const val DEFAULT_CATEGORY_COLOR = "#64748b"
    }

    private fun requireSignedIn() {
        sessionStorage.getToken() ?: error("Not signed in")
    }

    fun subscriptionFlow(token: String): Flow<Result<SubscriptionState?>> =
        api.live { api.get<SubscriptionState>("/api/subscription", token = token, nullOn401 = true) }

    /** Sign-in decides whose rows come back, so [userId] only keeps the old call shape. */
    @Suppress("UNUSED_PARAMETER")
    fun transactionsFlow(
        userId: String,
        startDate: String? = null,
        endDate: String? = null,
        category: String? = null,
        accountId: String? = null,
    ): Flow<Result<List<Transaction>?>> = api.live {
        api.get<List<Transaction>>(
            "/api/transactions",
            mapOf(
                "workspace" to WORKSPACE,
                "startDate" to startDate,
                "endDate" to endDate,
                "category" to category,
                "accountId" to accountId,
            ),
            nullOn401 = true,
        ) ?: emptyList()
    }

    @Suppress("UNUSED_PARAMETER")
    fun transactionFlow(id: String, userId: String): Flow<Result<Transaction?>> =
        api.live { api.get<Transaction>("/api/transactions/$id", nullOn401 = true, nullOn404 = true) }

    fun accountsFlow(): Flow<Result<List<Account>?>> =
        api.live { api.get<List<Account>>("/api/accounts", mapOf("workspace" to WORKSPACE), nullOn401 = true) ?: emptyList() }

    fun accountFlow(id: String): Flow<Result<Account?>> =
        api.live {
            api.get<Account>("/api/accounts/$id", mapOf("workspace" to WORKSPACE), nullOn401 = true, nullOn404 = true)
        }

    fun categoriesFlow(): Flow<Result<List<Category>?>> =
        api.live { api.get<List<Category>>("/api/categories", mapOf("workspace" to WORKSPACE), nullOn401 = true) ?: emptyList() }

    fun budgetsFlow(month: String): Flow<Result<List<BudgetRow>?>> =
        api.live {
            api.get<List<BudgetRow>>("/api/budgets", mapOf("workspace" to WORKSPACE, "month" to month), nullOn401 = true)
                ?: emptyList()
        }

    suspend fun ensureAccountsAndCategories() {
        requireSignedIn()
        api.sendUnit("POST", "/api/accounts/ensure-seed", mapOf("workspace" to WORKSPACE))
        api.sendUnit("POST", "/api/categories/ensure-seed", mapOf("workspace" to WORKSPACE))
    }

    @Suppress("UNUSED_PARAMETER")
    suspend fun createTransaction(
        userId: String,
        amount: Double,
        type: String,
        category: String,
        date: String,
        merchant: String? = null,
        description: String? = null,
        accountId: String? = null,
        entrySource: String? = "manual",
    ): String {
        requireSignedIn()
        return api.send<IdResponse>(
            "POST", "/api/transactions",
            mapOf(
                "workspace" to WORKSPACE,
                "amount" to amount,
                "type" to type,
                "category" to category,
                "date" to date,
                "merchant" to merchant,
                "description" to description,
                "accountId" to accountId,
                "entrySource" to entrySource,
            ),
        )?.id ?: error("The server did not return the new transaction id.")
    }

    @Suppress("UNUSED_PARAMETER")
    suspend fun updateTransaction(
        userId: String,
        id: String,
        amount: Double,
        type: String,
        category: String,
        date: String,
        merchant: String? = null,
        description: String? = null,
        accountId: String? = null,
    ) {
        requireSignedIn()
        api.sendUnit(
            "PUT", "/api/transactions/$id",
            mapOf(
                "workspace" to WORKSPACE,
                "amount" to amount,
                "type" to type,
                "category" to category,
                "date" to date,
                "merchant" to merchant,
                "description" to description,
                "accountId" to accountId,
            ),
        )
    }

    @Suppress("UNUSED_PARAMETER")
    suspend fun removeTransaction(userId: String, id: String) {
        requireSignedIn()
        api.sendUnit("DELETE", "/api/transactions/$id")
    }

    @Suppress("UNUSED_PARAMETER")
    suspend fun bulkImport(userId: String, rows: List<Map<String, Any?>>) {
        requireSignedIn()
        api.sendUnit("POST", "/api/transactions/bulk-import", mapOf("workspace" to WORKSPACE, "rows" to rows))
    }

    /** Accounts no longer have a free-text type; the server stores an icon, so [type] is ignored. */
    @Suppress("UNUSED_PARAMETER")
    suspend fun createAccount(name: String, type: String, balance: Double = 0.0) {
        requireSignedIn()
        api.sendUnit("POST", "/api/accounts", mapOf("workspace" to WORKSPACE, "name" to name, "balance" to balance))
    }

    @Suppress("UNUSED_PARAMETER")
    suspend fun updateAccount(id: String, name: String, type: String, balance: Double) {
        requireSignedIn()
        api.sendUnit("PATCH", "/api/accounts/$id", mapOf("name" to name, "balance" to balance))
    }

    suspend fun createCategory(name: String, kind: String) {
        requireSignedIn()
        api.sendUnit(
            "POST", "/api/categories",
            mapOf("workspace" to WORKSPACE, "name" to name, "kind" to kind, "color" to DEFAULT_CATEGORY_COLOR),
        )
    }

    suspend fun updateCategory(id: String, name: String, kind: String) {
        requireSignedIn()
        api.sendUnit("PATCH", "/api/categories/$id", mapOf("name" to name, "kind" to kind))
    }

    suspend fun removeCategory(id: String) {
        requireSignedIn()
        api.sendUnit("DELETE", "/api/categories/$id")
    }

    suspend fun upsertBudget(category: String, month: String, amount: Double) {
        requireSignedIn()
        api.sendUnit(
            "PUT", "/api/budgets",
            mapOf("workspace" to WORKSPACE, "category" to category, "month" to month, "limitAmount" to amount),
        )
    }

    /** Pro-only on the server; a free account gets a clear "upgrade" message back. */
    @Suppress("UNUSED_PARAMETER")
    suspend fun exportBackup(userId: String): List<Transaction> {
        requireSignedIn()
        return api.get<List<Transaction>>("/api/transactions/export") ?: emptyList()
    }

    suspend fun voiceFromAudio(audioBase64: String, mimeType: String): ScanResult {
        requireSignedIn()
        val res = api.send<VoiceDto>(
            "POST", "/api/ai/voice/transaction",
            mapOf("audioBase64" to audioBase64, "mimeType" to mimeType),
        )
        return res.toScanResult()
    }

    suspend fun parseSpeech(text: String): ScanResult {
        requireSignedIn()
        return api.send<VoiceDto>("POST", "/api/ai/voice/parse", mapOf("text" to text)).toScanResult()
    }

    suspend fun scanFromBase64(imageBase64: String, mimeType: String): ScanResult {
        requireSignedIn()
        return api.send<ScanDto>(
            "POST", "/api/ai/scan",
            mapOf("imageBase64" to imageBase64, "mimeType" to mimeType),
        ).toScanResult()
    }

    suspend fun scanFromDocumentText(text: String): ScanResult {
        requireSignedIn()
        return api.send<ScanDto>("POST", "/api/ai/scan-text", mapOf("text" to text)).toScanResult()
    }

    suspend fun analyzeMoneyLeaks(periodLabel: String, rows: JsonArray): MoneyLeakResult {
        requireSignedIn()
        return api.send<MoneyLeakResult>("POST", "/api/ai/money-leaks", mapOf("periodLabel" to periodLabel, "rows" to rows))
            ?: MoneyLeakResult(ok = false, error = "Empty response from the server.")
    }

    suspend fun financeCoachChat(
        periodLabel: String,
        rows: JsonArray,
        messages: List<Pair<String, String>>,
    ): CoachChatResult {
        requireSignedIn()
        return api.send<CoachChatResult>(
            "POST", "/api/ai/coach",
            mapOf(
                "periodLabel" to periodLabel,
                "rows" to rows,
                "messages" to messages.map { mapOf("role" to it.first, "content" to it.second) },
            ),
        ) ?: CoachChatResult(ok = false, error = "Empty response from the server.")
    }
}

internal fun ScanDto?.toScanResult(): ScanResult {
    if (this == null) return ScanResult(error = "Empty response from the server.")
    val e = extracted_data
    return ScanResult(
        extracted = e?.let {
            ScannedExtracted(
                amount = it.total_amount,
                type = "expense",
                category = it.category,
                merchant = it.merchant_name,
                date = it.date,
                payment_method = it.payment_method,
                rawText = it.formatted_receipt_text,
            )
        },
        error = error,
        previewText = e?.formatted_receipt_text,
    )
}

internal fun VoiceDto?.toScanResult(): ScanResult {
    if (this == null) return ScanResult(error = "Empty response from the server.")
    return ScanResult(
        extracted = draft?.let {
            ScannedExtracted(
                amount = it.amount,
                type = it.type,
                category = it.category,
                merchant = it.merchant,
                date = it.date,
                description = it.description,
                payment_method = it.payment_method,
                rawText = transcript,
            )
        },
        error = error,
        previewText = transcript,
    )
}
