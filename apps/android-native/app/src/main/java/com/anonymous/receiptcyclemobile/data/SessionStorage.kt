package com.anonymous.receiptcyclemobile.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SessionStorage(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        context,
        "receiptcycle_session",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)?.takeIf { it.isNotBlank() }

    fun setToken(token: String?) {
        prefs.edit().apply {
            if (token.isNullOrBlank()) remove(KEY_TOKEN) else putString(KEY_TOKEN, token)
        }.apply()
    }

    fun getRememberedEmail(): String? = prefs.getString(KEY_EMAIL, null)

    fun setRememberedEmail(email: String) {
        prefs.edit().putString(KEY_EMAIL, email).apply()
    }

    fun isOnboardingDone(userId: String): Boolean =
        prefs.getBoolean(onboardingKey(userId), false)

    fun setOnboardingDone(userId: String) {
        prefs.edit().putBoolean(onboardingKey(userId), true).apply()
    }

    private fun onboardingKey(userId: String) = "onboarding_$userId"

    companion object {
        private const val KEY_TOKEN = "session_token"
        private const val KEY_EMAIL = "remembered_email"
    }
}
