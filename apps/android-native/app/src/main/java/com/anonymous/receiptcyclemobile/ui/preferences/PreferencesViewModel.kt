package com.anonymous.receiptcyclemobile.ui.preferences

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.anonymous.receiptcyclemobile.data.models.PublicConfig
import com.anonymous.receiptcyclemobile.data.models.UserPreferencesDoc
import com.anonymous.receiptcyclemobile.data.repository.PreferencesRepository
import com.anonymous.receiptcyclemobile.util.formatDateYmd
import com.anonymous.receiptcyclemobile.util.formatMoneyAmount
import com.anonymous.receiptcyclemobile.util.formatMoneyCompact
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PreferencesUiState(
    val ready: Boolean = false,
    val prefs: UserPreferencesDoc = UserPreferencesDoc(),
    val publicConfig: PublicConfig? = null,
)

class PreferencesViewModel(
    private val repository: PreferencesRepository,
) : ViewModel() {
    private val _ready = MutableStateFlow(false)
    private var bindJob: Job? = null

    val uiState: StateFlow<PreferencesUiState> = combine(
        repository.localPrefs,
        _ready,
    ) { local, ready ->
        PreferencesUiState(ready = ready, prefs = local)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), PreferencesUiState())

    private val _publicConfig = MutableStateFlow<PublicConfig?>(null)
    val publicConfig = _publicConfig.asStateFlow()

    fun bindUser(userId: String) {
        bindJob?.cancel()
        bindJob = viewModelScope.launch {
            launch {
                repository.subscribeRemote(userId).collect { remote ->
                    if (remote != null) repository.applyRemote(remote)
                    _ready.value = true
                }
            }
            launch {
                repository.subscribePublicConfig().collect { _publicConfig.value = it }
            }
        }
    }

    fun formatMoney(n: Double): String = formatMoneyAmount(n, uiState.value.prefs.currency)
    fun formatMoneyCompact(n: Double): String =
        com.anonymous.receiptcyclemobile.util.formatMoneyCompact(n, uiState.value.prefs.currency)
    fun formatDate(ymd: String): String = formatDateYmd(ymd, uiState.value.prefs.dateFormat)

    fun setCurrency(userId: String, code: String) = viewModelScope.launch {
        repository.updateCurrency(userId, code)
    }

    fun setDateFormat(userId: String, format: String) = viewModelScope.launch {
        repository.updateDateFormat(userId, format)
    }

    fun setToggle(userId: String, key: String, value: Boolean) = viewModelScope.launch {
        repository.updateToggle(userId, key, value)
    }
}
