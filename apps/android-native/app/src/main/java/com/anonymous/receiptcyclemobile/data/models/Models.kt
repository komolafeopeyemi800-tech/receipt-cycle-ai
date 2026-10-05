package com.anonymous.receiptcyclemobile.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement

@Serializable
data class AuthUser(
    val id: String,
    val email: String,
    val name: String? = null,
)

@Serializable
data class AuthResult(
    val token: String,
    val user: AuthUser,
    val isNewRegistration: Boolean? = null,
)

@Serializable
data class PasswordResetRequestResult(
    val ok: Boolean? = null,
    val emailSent: Boolean? = null,
    val devToken: String? = null,
)

@Serializable
data class Transaction(
    val id: String,
    val workspace: String = "personal",
    val amount: Double,
    val type: String,
    val category: String,
    val merchant: String? = null,
    val date: String,
    val description: String? = null,
    val payment_method: String? = null,
    val accountId: String? = null,
    val tags: List<String>? = null,
    val is_recurring: Boolean? = null,
    val receipt_url: String? = null,
    val receipt_data: JsonElement? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
)

@Serializable
data class Account(
    val id: String,
    val workspace: String = "personal",
    val name: String,
    val balance: Double,
    val iconKey: String? = null,
    val currency: String? = null,
    val color: String? = null,
    val icon: String? = null,
) {
    /** The server stores an icon, not a free-text type; show it as a readable label. */
    val type: String
        get() = iconKey?.replace('-', ' ')?.replaceFirstChar { it.uppercase() } ?: "Account"
}

@Serializable
data class Category(
    val id: String,
    val workspace: String = "personal",
    val name: String,
    val kind: String,
    val color: String? = null,
    val icon: String? = null,
    val budget: Double? = null,
)

@Serializable
data class BudgetRow(
    val id: String,
    val workspace: String = "personal",
    val category: String,
    val month: String,
    val limitAmount: Double,
) {
    val amount: Double get() = limitAmount
}

@Serializable
data class SubscriptionState(
    val userId: String? = null,
    val pro: Boolean? = null,
    val trialEndsAt: Long? = null,
    val trialTimeActive: Boolean? = null,
    val trialAddsUsed: Int? = null,
    val trialAddsLimit: Int? = null,
    val trialAddsRemaining: Int? = null,
    val canCreateTransaction: Boolean? = null,
    val canUseAiFeatures: Boolean? = null,
    val canExportCsv: Boolean? = null,
    val canEditOrDeleteTransaction: Boolean? = null,
    val canMutateBudgets: Boolean? = null,
    val viewOnlyLocked: Boolean? = null,
    val phase: String? = null,
    val blockReason: String? = null,
)

@Serializable
data class PublicConfig(
    val scannerEnabled: Boolean? = true,
    val uploadEnabled: Boolean? = true,
    val manualAddEnabled: Boolean? = true,
    val exportEnabled: Boolean? = true,
    val maintenanceMode: Boolean? = false,
    /** False on the free-plan deployment: sign in with Google or an emailed code instead. */
    val passwordAuthEnabled: Boolean? = false,
)

@Serializable
data class UserPreferencesDoc(
    val userId: String? = null,
    /** Saved locations are edited in the web/Expo apps; kept as-is so a save here never wipes them. */
    val locations: JsonArray? = null,
    val currency: String = "USD",
    val dateFormat: String = "iso",
    val merchants: List<String> = emptyList(),
    val reimbursements: Boolean? = false,
    val txnNumber: Boolean? = false,
    val scanPayment: Boolean? = true,
    val requirePay: Boolean? = false,
    val requireNotes: Boolean? = false,
    val voiceInputLanguage: String? = "auto",
)

@Serializable
data class MoneyLeakFinding(
    val title: String,
    val detail: String,
    val severity: String,
)

@Serializable
data class MoneyLeakResult(
    val ok: Boolean? = null,
    val summary: String? = null,
    val findings: List<MoneyLeakFinding>? = null,
    val tips: List<String>? = null,
    val error: String? = null,
)

@Serializable
data class ScannedExtracted(
    val amount: Double? = null,
    val type: String? = null,
    val category: String? = null,
    val merchant: String? = null,
    val date: String? = null,
    val description: String? = null,
    val payment_method: String? = null,
    val rawText: String? = null,
)

@Serializable
data class ScanResult(
    val extracted: ScannedExtracted? = null,
    val error: String? = null,
    val previewText: String? = null,
)

@Serializable
data class CoachMessage(
    val role: String,
    val content: String,
)

@Serializable
data class CoachChatResult(
    val ok: Boolean? = null,
    val error: String? = null,
    val reply: String? = null,
    val messages: List<CoachMessage>? = null,
)

@Serializable
data class UserPreferencesRow(
    val userId: String? = null,
    val currency: String? = null,
    val locale: String? = null,
    val dateFormat: String? = null,
    val firstDayOfWeek: Int? = null,
)
