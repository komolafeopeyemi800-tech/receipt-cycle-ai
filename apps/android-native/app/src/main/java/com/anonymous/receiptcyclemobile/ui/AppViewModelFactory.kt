package com.anonymous.receiptcyclemobile.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.anonymous.receiptcyclemobile.AppContainer
import com.anonymous.receiptcyclemobile.ui.auth.AuthViewModel
import com.anonymous.receiptcyclemobile.ui.finance.FinanceViewModel
import com.anonymous.receiptcyclemobile.ui.preferences.PreferencesViewModel

class AppViewModelFactory(private val container: AppContainer) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = when {
        modelClass.isAssignableFrom(AuthViewModel::class.java) ->
            AuthViewModel(container.authRepository, container.sessionStorage) as T
        modelClass.isAssignableFrom(FinanceViewModel::class.java) ->
            FinanceViewModel(container.financeRepository, container.authRepository, container.sessionStorage) as T
        modelClass.isAssignableFrom(PreferencesViewModel::class.java) ->
            PreferencesViewModel(container.preferencesRepository) as T
        else -> error("Unknown ViewModel ${modelClass.name}")
    }
}
