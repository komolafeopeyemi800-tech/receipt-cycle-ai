package com.anonymous.receiptcyclemobile.backup

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class DriveBackupStorage(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        context,
        "drive_backup_secure",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH, null)
    fun setRefreshToken(value: String?) {
        prefs.edit().putString(KEY_REFRESH, value).apply()
    }

    fun getDriveEmail(): String? = prefs.getString(KEY_EMAIL, null)
    fun setDriveEmail(value: String?) {
        prefs.edit().putString(KEY_EMAIL, value).apply()
    }

    fun isWeeklyEnabled(): Boolean = prefs.getBoolean(KEY_WEEKLY, false)
    fun setWeeklyEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_WEEKLY, enabled).apply()
    }

    fun getLastBackupAt(): Long? {
        val v = prefs.getLong(KEY_LAST_AT, -1L)
        return if (v < 0) null else v
    }

    fun setLastBackupAt(ms: Long) {
        prefs.edit().putLong(KEY_LAST_AT, ms).apply()
    }

    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)
    fun setUserId(value: String?) {
        prefs.edit().putString(KEY_USER_ID, value).apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_REFRESH = "refresh_token"
        private const val KEY_EMAIL = "drive_email"
        private const val KEY_WEEKLY = "weekly_enabled"
        private const val KEY_LAST_AT = "last_backup_at"
        /** Key name predates the API move; kept so existing Drive links on devices keep working. */
        private const val KEY_USER_ID = "convex_user_id"
        const val WEEK_MS = 7L * 24 * 60 * 60 * 1000
    }
}
