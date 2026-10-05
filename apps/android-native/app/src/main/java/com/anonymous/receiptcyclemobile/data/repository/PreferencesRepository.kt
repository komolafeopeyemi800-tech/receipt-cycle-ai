package com.anonymous.receiptcyclemobile.data.repository

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.anonymous.receiptcyclemobile.data.ApiClient
import com.anonymous.receiptcyclemobile.data.models.PublicConfig
import com.anonymous.receiptcyclemobile.data.models.UserPreferencesDoc
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.prefsDataStore by preferencesDataStore("receipt_cycle_prefs")

class PreferencesRepository(
    private val context: Context,
    private val api: ApiClient,
) {
    private val currencyKey = stringPreferencesKey("currency")
    private val dateFormatKey = stringPreferencesKey("date_format")
    private val voiceLangKey = stringPreferencesKey("voice_lang")
    private val reimbursementsKey = booleanPreferencesKey("reimbursements")
    private val txnNumberKey = booleanPreferencesKey("txn_number")
    private val scanPaymentKey = booleanPreferencesKey("scan_payment")
    private val requirePayKey = booleanPreferencesKey("require_pay")
    private val requireNotesKey = booleanPreferencesKey("require_notes")

    val localPrefs: Flow<UserPreferencesDoc> = context.prefsDataStore.data.map { p ->
        UserPreferencesDoc(
            currency = p[currencyKey] ?: "USD",
            dateFormat = p[dateFormatKey] ?: "iso",
            voiceInputLanguage = p[voiceLangKey] ?: "auto",
            reimbursements = p[reimbursementsKey] ?: false,
            txnNumber = p[txnNumberKey] ?: false,
            scanPayment = p[scanPaymentKey] ?: true,
            requirePay = p[requirePayKey] ?: false,
            requireNotes = p[requireNotesKey] ?: false,
        )
    }

    @Suppress("UNUSED_PARAMETER")
    fun subscribeRemote(userId: String): Flow<UserPreferencesDoc?> =
        api.live { api.get<UserPreferencesDoc>("/api/preferences", nullOn401 = true) }.map { it.getOrNull() }

    fun subscribePublicConfig(): Flow<PublicConfig?> =
        api.live { api.get<PublicConfig>("/api/config", anonymous = true) }.map { it.getOrNull() }

    suspend fun applyRemote(doc: UserPreferencesDoc) {
        context.prefsDataStore.edit { p ->
            p[currencyKey] = doc.currency
            p[dateFormatKey] = doc.dateFormat
            p[voiceLangKey] = doc.voiceInputLanguage ?: "auto"
            p[reimbursementsKey] = doc.reimbursements ?: false
            p[txnNumberKey] = doc.txnNumber ?: false
            p[scanPaymentKey] = doc.scanPayment ?: true
            p[requirePayKey] = doc.requirePay ?: false
            p[requireNotesKey] = doc.requireNotes ?: false
        }
    }

    suspend fun updateCurrency(userId: String, value: String) {
        context.prefsDataStore.edit { it[currencyKey] = value }
        upsertFromLocal(userId)
    }

    suspend fun updateDateFormat(userId: String, value: String) {
        context.prefsDataStore.edit { it[dateFormatKey] = value }
        upsertFromLocal(userId)
    }

    suspend fun updateVoiceLanguage(userId: String, value: String) {
        context.prefsDataStore.edit { it[voiceLangKey] = value }
        upsertFromLocal(userId)
    }

    suspend fun updateToggle(userId: String, key: String, value: Boolean) {
        context.prefsDataStore.edit { p ->
            when (key) {
                "reimbursements" -> p[reimbursementsKey] = value
                "txnNumber" -> p[txnNumberKey] = value
                "scanPayment" -> p[scanPaymentKey] = value
                "requirePay" -> p[requirePayKey] = value
                "requireNotes" -> p[requireNotesKey] = value
            }
        }
        upsertFromLocal(userId)
    }

    /**
     * Saves the on-device settings. Merchant shortcuts and saved locations are edited in the Expo and
     * web apps, so they are read back from the server and sent unchanged instead of being wiped.
     */
    @Suppress("UNUSED_PARAMETER")
    private suspend fun upsertFromLocal(userId: String) {
        val local = localPrefs.first()
        val remote = runCatching { api.get<UserPreferencesDoc>("/api/preferences", nullOn401 = true) }.getOrNull()
        api.sendUnit(
            "PUT", "/api/preferences",
            mapOf(
                "currency" to local.currency,
                "dateFormat" to local.dateFormat,
                "voiceInputLanguage" to (local.voiceInputLanguage ?: "auto"),
                "reimbursements" to (local.reimbursements ?: false),
                "txnNumber" to (local.txnNumber ?: false),
                "scanPayment" to (local.scanPayment ?: true),
                "requirePay" to (local.requirePay ?: false),
                "requireNotes" to (local.requireNotes ?: false),
                "merchants" to (remote?.merchants ?: emptyList<String>()),
                "locations" to (remote?.locations ?: kotlinx.serialization.json.JsonArray(emptyList())),
            ),
        )
    }
}
