package com.anonymous.receiptcyclemobile.ui.navigation

import android.net.Uri

object Routes {
    const val SIGN_IN = "sign_in"
    const val SIGN_UP = "sign_up"
    const val FORGOT_PASSWORD = "forgot_password"
    const val RESET_PASSWORD = "reset_password/{token}"
    const val ONBOARDING = "onboarding"

    const val MAIN = "main"
    const val TAB_RECORDS = "tab_records"
    const val TAB_ANALYSIS = "tab_analysis"
    const val TAB_BUDGETS = "tab_budgets"
    const val TAB_ACCOUNTS = "tab_accounts"
    const val TAB_CATEGORIES = "tab_categories"

    const val ADD_TRANSACTION = "add_transaction"
    const val ADD_TRANSACTION_EDIT = "add_transaction/{txId}"
    const val TRANSACTION_DETAIL = "transaction_detail/{id}"
    const val CATEGORY_BREAKDOWN = "category_breakdown/{category}"
    const val ACCOUNT_DETAIL = "account_detail/{id}"
    const val NOTIFICATIONS = "notifications"
    const val SCAN_RECEIPT = "scan_receipt"
    const val SCAN_REVIEW = "scan_review"
    const val UPLOAD_STATEMENT = "upload_statement"
    const val SETTINGS = "settings"
    const val GOOGLE_DRIVE = "google_drive"
    const val REGIONAL_PREFS = "regional_prefs"
    const val MERCHANTS = "merchants"
    const val SAVED_LOCATIONS = "saved_locations"
    const val ACCOUNT_SETTINGS = "account_settings"
    const val PRICING = "pricing"
    const val FINANCE_COACH = "finance_coach"

    fun resetPassword(token: String) = "reset_password/$token"
    fun transactionDetail(id: String) = "transaction_detail/$id"
    fun categoryBreakdown(category: String) = "category_breakdown/${Uri.encode(category)}"
    fun accountDetail(id: String) = "account_detail/$id"
    fun addTransactionEdit(txId: String) = "add_transaction/$txId"
}
