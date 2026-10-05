package com.anonymous.receiptcyclemobile.backup

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.anonymous.receiptcyclemobile.ReceiptCycleApplication
import com.anonymous.receiptcyclemobile.auth.GoogleDriveOAuthHelper

class DriveBackupWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val app = applicationContext as ReceiptCycleApplication
        val storage = DriveBackupStorage(applicationContext)
        val runner = DriveBackupRunner(app.container, storage, GoogleDriveOAuthHelper(applicationContext))
        return runCatching { runner.runScheduledIfDue() }
            .fold(
                onSuccess = { Result.success() },
                onFailure = { Result.retry() },
            )
    }
}
