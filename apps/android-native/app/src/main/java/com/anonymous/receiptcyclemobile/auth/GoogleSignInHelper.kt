package com.anonymous.receiptcyclemobile.auth

import android.content.Context
import android.content.Intent
import com.anonymous.receiptcyclemobile.BuildConfig
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException

class GoogleSignInHelper(context: Context) {
    private val client: GoogleSignInClient? = run {
        val clientId = BuildConfig.GOOGLE_ANDROID_CLIENT_ID
        if (clientId.isBlank()) return@run null
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(clientId)
            .requestEmail()
            .build()
        GoogleSignIn.getClient(context, gso)
    }

    fun isConfigured(): Boolean = client != null

    fun signInIntent(): Intent? = client?.signInIntent

    fun handleResult(data: Intent?): Result<String> {
        if (client == null) return Result.failure(IllegalStateException("Google Sign-In is not configured."))
        return try {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            val account: GoogleSignInAccount = task.getResult(ApiException::class.java)
            val token = account.idToken
                ?: return Result.failure(IllegalStateException("No Google ID token returned."))
            Result.success(token)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun signOut() {
        client?.signOut()
    }
}
