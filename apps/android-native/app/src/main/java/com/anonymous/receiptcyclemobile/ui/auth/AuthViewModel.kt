package com.anonymous.receiptcyclemobile.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.anonymous.receiptcyclemobile.data.SessionStorage
import com.anonymous.receiptcyclemobile.data.models.AuthUser
import com.anonymous.receiptcyclemobile.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class AuthUiState(
    val loading: Boolean = true,
    val token: String? = null,
    val user: AuthUser? = null,
    val needsOnboarding: Boolean = false,
    val error: String? = null,
)

class AuthViewModel(
    private val authRepository: AuthRepository,
    private val sessionStorage: SessionStorage,
) : ViewModel() {
    private val _passwordsEnabled = MutableStateFlow(false)

    /** Password fields are shown only when the server has them on. */
    val passwordsEnabled: StateFlow<Boolean> = _passwordsEnabled.asStateFlow()

    private val tokenState = MutableStateFlow(sessionStorage.getToken())
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val meResult = tokenState.flatMapLatest { token ->
        authRepository.meFlow(token)
    }

    val uiState: StateFlow<AuthUiState> = combine(
        tokenState,
        meResult,
    ) { token, me ->
        val user = me.getOrNull()
        val loading = token != null && me.isFailure
        AuthUiState(
            loading = loading && token != null,
            token = token,
            user = user,
            needsOnboarding = user != null && !sessionStorage.isOnboardingDone(user.id),
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AuthUiState(loading = true))

    init {
        viewModelScope.launch { _passwordsEnabled.value = authRepository.passwordsEnabled() }
        viewModelScope.launch {
            meResult.collect { result ->
                val token = tokenState.value ?: return@collect
                if (result.getOrNull() == null && result.isSuccess) {
                    sessionStorage.setToken(null)
                    tokenState.value = null
                }
            }
        }
    }

    fun refreshToken() {
        tokenState.value = sessionStorage.getToken()
    }

    fun setToken(token: String) {
        sessionStorage.setToken(token)
        tokenState.value = token
    }

    fun clearError() {
        _error.value = null
    }

    fun setError(message: String) {
        _error.value = message
    }

    fun completeOnboarding(userId: String) {
        sessionStorage.setOnboardingDone(userId)
        tokenState.value = sessionStorage.getToken()
    }

    fun signIn(email: String, password: String, onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.signIn(email, password)
                .onSuccess { refreshToken(); onDone() }
                .onFailure { _error.value = it.message }
        }
    }

    fun signUp(email: String, password: String, name: String?, onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.signUp(email, password, name)
                .onSuccess { refreshToken(); onDone() }
                .onFailure { _error.value = it.message }
        }
    }

    fun sendEmailCode(email: String, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            _error.value = null
            authRepository.sendEmailCode(email)
                .onSuccess { onResult(true) }
                .onFailure { _error.value = it.message; onResult(false) }
        }
    }

    fun signInWithEmailCode(email: String, otp: String, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            _error.value = null
            authRepository.signInWithEmailCode(email, otp)
                .onSuccess { refreshToken(); onResult(true) }
                .onFailure { _error.value = it.message; onResult(false) }
        }
    }

    fun signInWithGoogle(idToken: String, onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.signInWithGoogle(idToken)
                .onSuccess { refreshToken(); onDone() }
                .onFailure { _error.value = it.message }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
            tokenState.value = null
        }
    }

    fun requestPasswordReset(email: String, onResult: (String?) -> Unit) {
        viewModelScope.launch {
            authRepository.requestPasswordReset(email)
                .onSuccess { onResult(it.devToken) }
                .onFailure { _error.value = it.message }
        }
    }

    fun resetPassword(token: String, newPassword: String, onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.resetPasswordWithToken(token, newPassword)
                .onSuccess { onDone() }
                .onFailure { _error.value = it.message }
        }
    }

    fun rememberedEmail(): String? = sessionStorage.getRememberedEmail()

    fun changePassword(current: String, newPass: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            authRepository.changePassword(current, newPass)
                .onSuccess { onResult(true, null) }
                .onFailure { onResult(false, it.message) }
        }
    }

    fun resetMyData(onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            authRepository.resetMyData()
                .onSuccess { onResult(true, null) }
                .onFailure { onResult(false, it.message) }
        }
    }

    fun deleteAccount(onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            authRepository.deleteMyAccount()
                .onSuccess {
                    tokenState.value = null
                    onResult(true, null)
                }
                .onFailure { onResult(false, it.message) }
        }
    }
}
