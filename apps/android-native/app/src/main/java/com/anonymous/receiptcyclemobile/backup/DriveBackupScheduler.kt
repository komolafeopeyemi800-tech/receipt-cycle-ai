package com.anonymous.receiptcyclemobile.backup

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

object DriveBackupScheduler {
    private const val WORK_NAME = "receipt_cycle_drive_backup_weekly"

    fun setWeeklyEnabled(context: Context, enabled: Boolean) {
        val wm = WorkManager.getInstance(context)
        if (enabled) {
            val request = PeriodicWorkRequestBuilder<DriveBackupWorker>(7, TimeUnit.DAYS)
                .build()
            wm.enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request)
        } else {
            wm.cancelUniqueWork(WORK_NAME)
        }
    }
}
