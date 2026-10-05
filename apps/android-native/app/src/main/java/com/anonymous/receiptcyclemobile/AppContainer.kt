package com.anonymous.receiptcyclemobile

import android.content.Context
import com.anonymous.receiptcyclemobile.data.SessionStorage
import com.anonymous.receiptcyclemobile.data.repository.AuthRepository
import com.anonymous.receiptcyclemobile.data.repository.FinanceRepository
import com.anonymous.receiptcyclemobile.auth.GoogleDriveOAuthHelper
import com.anonymous.receiptcyclemobile.backup.DriveBackupStorage
import com.anonymous.receiptcyclemobile.data.repository.PreferencesRepository
import com.anonymous.receiptcyclemobile.data.ApiClient

class AppContainer(context: Context) {
    val sessionStorage = SessionStorage(context.applicationContext)
    val api = ApiClient(BuildConfig.API_URL, BuildConfig.WEB_APP_URL, tokenProvider = { sessionStorage.getToken() })
    val authRepository = AuthRepository(api, sessionStorage)
    val financeRepository = FinanceRepository(api, sessionStorage)
    val preferencesRepository = PreferencesRepository(context.applicationContext, api)
    val driveBackupStorage = DriveBackupStorage(context.applicationContext)
    val googleDriveOAuthHelper = GoogleDriveOAuthHelper(context.applicationContext)
}
