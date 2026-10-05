package com.anonymous.receiptcyclemobile.ui.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.anonymous.receiptcyclemobile.data.SessionStorage
import com.anonymous.receiptcyclemobile.data.models.Account
import com.anonymous.receiptcyclemobile.data.models.BudgetRow
import com.anonymous.receiptcyclemobile.data.models.Category
import com.anonymous.receiptcyclemobile.data.models.MoneyLeakResult
import com.anonymous.receiptcyclemobile.data.models.SubscriptionState
import com.anonymous.receiptcyclemobile.data.models.Transaction
import com.anonymous.receiptcyclemobile.data.repository.AuthRepository
import com.anonymous.receiptcyclemobile.data.repository.FinanceRepository
import com.anonymous.receiptcyclemobile.ui.components.PeriodMode
import com.anonymous.receiptcyclemobile.ui.components.TxFilter
import com.anonymous.receiptcyclemobile.util.addMonthsYm
import com.anonymous.receiptcyclemobile.util.todayYm
import com.anonymous.receiptcyclemobile.util.txKind
import com.anonymous.receiptcyclemobile.util.ymToDateRange
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class FinanceViewModel(
    private val financeRepository: FinanceRepository,
    private val authRepository: AuthRepository,
    private val sessionStorage: SessionStorage,
) : ViewModel() {
    private val userId = MutableStateFlow<String?>(null)
    val selectedYm = MutableStateFlow(todayYm())
    val periodMode = MutableStateFlow(PeriodMode.Month)
    val txFilter = MutableStateFlow(TxFilter.All)
    val categoryFilter = MutableStateFlow<String?>(null)

    private val subscriptionToken = MutableStateFlow<String?>(null)

    val subscription: StateFlow<SubscriptionState?> = subscriptionToken
        .flatMapLatest { t ->
            if (t == null) flowOf<SubscriptionState?>(null)
            else financeRepository.subscriptionFlow(t)
                .flatMapLatest { kotlinx.coroutines.flow.flow { emit(it.getOrNull()) } }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    private val allTransactions: StateFlow<List<Transaction>> = userId.flatMapLatest { uid ->
        if (uid == null) return@flatMapLatest flowOf(emptyList())
        financeRepository.transactionsFlow(userId = uid)
            .flatMapLatest { kotlinx.coroutines.flow.flow { emit(it.getOrNull() ?: emptyList()) } }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val transactions: StateFlow<List<Transaction>> = combine(
        allTransactions,
        selectedYm,
        periodMode,
        txFilter,
        categoryFilter,
    ) { txs, ym, mode, filter, cat ->
        var list = txs
        if (mode == PeriodMode.Month) {
            val (s, e) = ymToDateRange(ym)
            list = list.filter { it.date >= s && it.date <= e }
        }
        if (cat != null) list = list.filter { it.category == cat }
        list = when (filter) {
            TxFilter.All -> list
            TxFilter.Expense -> list.filter { txKind(it.type) == "expense" }
            TxFilter.Income -> list.filter { txKind(it.type) == "income" }
        }
        list.sortedByDescending { it.date }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val accounts: StateFlow<List<Account>> = financeRepository.accountsFlow()
        .flatMapLatest { kotlinx.coroutines.flow.flow { emit(it.getOrNull() ?: emptyList()) } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val categories: StateFlow<List<Category>> = financeRepository.categoriesFlow()
        .flatMapLatest { kotlinx.coroutines.flow.flow { emit(it.getOrNull() ?: emptyList()) } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val budgets: StateFlow<List<BudgetRow>> = selectedYm.flatMapLatest { ym ->
        financeRepository.budgetsFlow(ym)
            .flatMapLatest { kotlinx.coroutines.flow.flow { emit(it.getOrNull() ?: emptyList()) } }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _busy = MutableStateFlow(false)
    val busy = _busy.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message = _message.asStateFlow()

    private val _moneyLeak = MutableStateFlow<MoneyLeakResult?>(null)
    val moneyLeak = _moneyLeak.asStateFlow()

    fun bindUser(id: String) {
        if (userId.value == id) return
        userId.value = id
        subscriptionToken.value = sessionStorage.getToken()
        viewModelScope.launch {
            runCatching { financeRepository.ensureAccountsAndCategories() }
        }
    }

    fun shiftMonth(delta: Int) {
        selectedYm.value = addMonthsYm(selectedYm.value, delta)
    }

    fun setMonth(ym: String) {
        selectedYm.value = ym
    }

    fun currentYm(): String = selectedYm.value

    fun clearMessage() {
        _message.value = null
    }

    fun canCreateTransaction(): Boolean = subscription.value?.canCreateTransaction != false
    fun canUseAi(): Boolean = subscription.value?.canUseAiFeatures == true
    fun canExport(): Boolean = subscription.value?.canExportCsv == true

    fun createTransaction(
        userId: String,
        amount: Double,
        type: String,
        category: String,
        date: String,
        merchant: String? = null,
        description: String? = null,
        accountId: String? = null,
        entrySource: String = "manual",
        onDone: () -> Unit,
    ) {
        viewModelScope.launch {
            _busy.value = true
            runCatching {
                financeRepository.createTransaction(
                    userId, amount, type, category, date, merchant, description, accountId, entrySource,
                )
            }.onSuccess { onDone() }
                .onFailure { _message.value = it.message }
            _busy.value = false
        }
    }

    fun updateTransaction(
        userId: String,
        id: String,
        amount: Double,
        type: String,
        category: String,
        date: String,
        merchant: String? = null,
        description: String? = null,
        accountId: String? = null,
        onDone: () -> Unit,
    ) {
        viewModelScope.launch {
            _busy.value = true
            runCatching {
                financeRepository.updateTransaction(userId, id, amount, type, category, date, merchant, description, accountId)
            }.onSuccess { onDone() }
                .onFailure { _message.value = it.message }
            _busy.value = false
        }
    }

    fun removeTransaction(userId: String, id: String, onDone: () -> Unit) {
        viewModelScope.launch {
            _busy.value = true
            runCatching { financeRepository.removeTransaction(userId, id) }
                .onSuccess { onDone() }
                .onFailure { _message.value = it.message }
            _busy.value = false
        }
    }

    fun upsertBudget(category: String, amount: Double) {
        viewModelScope.launch {
            runCatching { financeRepository.upsertBudget(category, selectedYm.value, amount) }
                .onFailure { _message.value = it.message }
        }
    }

    fun createAccount(name: String, type: String) {
        viewModelScope.launch {
            runCatching { financeRepository.createAccount(name, type) }
                .onFailure { _message.value = it.message }
        }
    }

    fun updateAccount(id: String, name: String, type: String, balance: Double) {
        viewModelScope.launch {
            runCatching { financeRepository.updateAccount(id, name, type, balance) }
                .onFailure { _message.value = it.message }
        }
    }

    fun createCategory(name: String, kind: String) {
        viewModelScope.launch {
            runCatching { financeRepository.createCategory(name, kind) }
                .onFailure { _message.value = it.message }
        }
    }

    fun removeCategory(id: String) {
        viewModelScope.launch {
            runCatching { financeRepository.removeCategory(id) }
                .onFailure { _message.value = it.message }
        }
    }

    fun bulkImport(userId: String, rows: List<Map<String, Any?>>) {
        viewModelScope.launch {
            _busy.value = true
            runCatching { financeRepository.bulkImport(userId, rows) }
                .onFailure { _message.value = it.message }
            _busy.value = false
        }
    }

    fun analyzeMoneyLeaks(periodLabel: String, txs: List<Transaction>) {
        if (!canUseAi()) {
            _message.value = subscription.value?.blockReason ?: "AI features require Pro or trial."
            return
        }
        viewModelScope.launch {
            _busy.value = true
            _moneyLeak.value = null
            val rows: JsonArray = buildJsonArray {
                txs.take(200).forEach { t ->
                    add(
                        buildJsonObject {
                            put("amount", t.amount)
                            put("type", t.type)
                            put("category", t.category)
                            put("date", t.date)
                            put("merchant", t.merchant ?: "")
                        },
                    )
                }
            }
            runCatching {
                financeRepository.analyzeMoneyLeaks(periodLabel, rows)
            }.onSuccess { result ->
                if (result.ok == false && !result.error.isNullOrBlank()) {
                    _message.value = result.error
                } else {
                    _moneyLeak.value = result
                }
            }.onFailure { _message.value = it.message }
            _busy.value = false
        }
    }

    suspend fun exportCsv(userId: String): String {
        val rows = financeRepository.exportBackup(userId)
        val header = "date,amount,type,category,merchant,description\n"
        return header + rows.joinToString("\n") { t ->
            listOf(
                t.date,
                t.amount,
                t.type,
                "\"${t.category.replace("\"", "\"\"")}\"",
                "\"${(t.merchant ?: "").replace("\"", "\"\"")}\"",
                "\"${(t.description ?: "").replace("\"", "\"\"")}\"",
            ).joinToString(",")
        }
    }
}
