package com.anonymous.receiptcyclemobile.data.repository

import com.anonymous.receiptcyclemobile.data.ApiClient
import com.anonymous.receiptcyclemobile.data.SessionStorage
import com.anonymous.receiptcyclemobile.data.models.AuthResult
import com.anonymous.receiptcyclemobile.data.models.AuthUser
import com.anonymous.receiptcyclemobile.data.models.PasswordResetRequestResult
import com.anonymous.receiptcyclemobile.data.models.PublicConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf

class AuthRepository(
    private val api: ApiClient,
    private val sessionStorage: SessionStorage,
) {
    val tokenFlow: Flow<String?> = kotlinx.coroutines.flow.flow {
        emit(sessionStorage.getToken())
    }

    fun currentToken(): String? = sessionStorage.getToken()

    suspend fun currentUserId(): String? {
        sessionStorage.getToken() ?: return null
        return api.get<AuthUser>("/api/me", nullOn401 = true)?.id
    }

    /**
     * `Result.success(null)` means "the server says this token is no longer valid" (the view model then
     * signs out); a failure means we just could not reach the server.
     */
    fun meFlow(token: String?): Flow<Result<AuthUser?>> {
        if (token.isNullOrBlank()) return flowOf(Result.success(null))
        return api.live { api.get<AuthUser>("/api/me", token = token, nullOn401 = true) }
    }

    suspend fun signIn(email: String, password: String): Result<Unit> = runAuth {
        val res = api.send<AuthResult>(
            "POST", "/api/auth/sign-in/email",
            mapOf("email" to email.trim(), "password" to password),
            anonymous = true,
        ) ?: error("Authentication failed")
        persistSession(res)
    }

    suspend fun signUp(email: String, password: String, name: String?): Result<Unit> = runAuth {
        val res = api.send<AuthResult>(
            "POST", "/api/auth/sign-up/email",
            mapOf("email" to email.trim(), "password" to password, "name" to (name?.trim() ?: "")),
            anonymous = true,
        ) ?: error("Authentication failed")
        persistSession(res)
    }

    /** Whether the server has email + password sign-in turned on (off on the free plan). */
    suspend fun passwordsEnabled(): Boolean =
        runCatching { api.get<PublicConfig>("/api/config", anonymous = true)?.passwordAuthEnabled == true }.getOrDefault(false)

    /** Passwordless sign-in, step 1: email a 6-digit code. */
    suspend fun sendEmailCode(email: String): Result<Unit> = runAuth {
        api.sendUnit(
            "POST", "/api/auth/email-otp/send-verification-otp",
            mapOf("email" to email.trim(), "type" to "sign-in"),
            anonymous = true,
        )
    }

    /** Step 2: trade the code for a session. A new email gets an account on its first code. */
    suspend fun signInWithEmailCode(email: String, otp: String): Result<Unit> = runAuth {
        val res = api.send<AuthResult>(
            "POST", "/api/auth/sign-in/email-otp",
            mapOf("email" to email.trim(), "otp" to otp.trim()),
            anonymous = true,
        ) ?: error("Authentication failed")
        persistSession(res)
    }

    suspend fun signInWithGoogle(idToken: String): Result<Unit> = runAuth {
        val res = api.send<AuthResult>("POST", "/api/social/google", mapOf("idToken" to idToken), anonymous = true)
            ?: error("Authentication failed")
        persistSession(res)
    }

    suspend fun signOut(): Result<Unit> = runCatching {
        val token = sessionStorage.getToken() ?: return@runCatching
        runCatching { api.sendUnit("POST", "/api/auth/sign-out", token = token) }
        sessionStorage.setToken(null)
    }

    suspend fun requestPasswordReset(email: String): Result<PasswordResetRequestResult> = runCatching {
        api.sendUnit(
            "POST", "/api/auth/request-password-reset",
            mapOf("email" to email.trim(), "redirectTo" to "${api.webAppUrl}/reset-password"),
            anonymous = true,
        )
        // The server answers the same way whether or not the address exists.
        PasswordResetRequestResult(ok = true, emailSent = true)
    }

    suspend fun resetPasswordWithToken(token: String, newPassword: String): Result<Unit> = runCatching {
        api.sendUnit("POST", "/api/auth/reset-password", mapOf("token" to token, "newPassword" to newPassword), anonymous = true)
    }

    suspend fun bootstrapSubscription() {
        if (sessionStorage.getToken() == null) return
        runCatching { api.sendUnit("POST", "/api/subscription/bootstrap") }
    }

    suspend fun changePassword(currentPassword: String, newPassword: String): Result<Unit> = runCatching {
        sessionStorage.getToken() ?: error("Not signed in")
        api.sendUnit(
            "POST", "/api/auth/change-password",
            mapOf("currentPassword" to currentPassword, "newPassword" to newPassword, "revokeOtherSessions" to false),
        )
    }

    suspend fun resetMyData(): Result<Unit> = runCatching {
        sessionStorage.getToken() ?: error("Not signed in")
        api.sendUnit("POST", "/api/me/reset-data")
    }

    suspend fun deleteMyAccount(): Result<Unit> = runCatching {
        sessionStorage.getToken() ?: error("Not signed in")
        api.sendUnit("DELETE", "/api/me")
        sessionStorage.setToken(null)
    }

    private suspend fun persistSession(res: AuthResult) {
        sessionStorage.setToken(res.token)
        sessionStorage.setRememberedEmail(res.user.email)
        bootstrapSubscription()
    }

    private inline fun runAuth(block: () -> Unit): Result<Unit> = try {
        block()
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(Exception(e.message ?: "Authentication failed", e))
    }
}
