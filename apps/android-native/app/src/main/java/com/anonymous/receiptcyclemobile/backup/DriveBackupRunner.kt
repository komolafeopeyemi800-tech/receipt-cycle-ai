package com.anonymous.receiptcyclemobile.backup

import com.anonymous.receiptcyclemobile.AppContainer
import com.anonymous.receiptcyclemobile.auth.GoogleDriveOAuthHelper
import com.anonymous.receiptcyclemobile.data.appJson
import com.anonymous.receiptcyclemobile.data.models.Transaction
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import java.time.Instant
import java.time.LocalDate

@Serializable
private data class DriveBackupPayload(
    val exportedAt: String,
    val app: String = "Receipt Cycle",
    val transactions: List<Transaction>,
)

class DriveBackupRunner(
    private val container: AppContainer,
    private val storage: DriveBackupStorage,
    private val googleOAuth: GoogleDriveOAuthHelper,
) {
    suspend fun runBackupNow(userId: String): Result<Unit> = runCatching {
        storage.getRefreshToken() ?: error("Google Drive is not linked.")
        container.sessionStorage.getToken() ?: error("Sign in to back up.")
        val access = googleOAuth.refreshAccessToken(storage.getRefreshToken()!!)
        val rows = container.financeRepository.exportBackup(userId)
        val json = appJson.encodeToString(
            DriveBackupPayload(
                exportedAt = Instant.now().toString(),
                transactions = rows,
            ),
        )
        val fileName = "receipt-cycle-backup-${LocalDate.now()}.json"
        GoogleDriveUpload.uploadJson(access, fileName, json)
        storage.setLastBackupAt(System.currentTimeMillis())
        storage.setUserId(userId)
    }

    suspend fun runScheduledIfDue(): Boolean {
        if (!storage.isWeeklyEnabled()) return false
        if (storage.getRefreshToken() == null) return false
        val userId = storage.getUserId() ?: return false
        if (container.sessionStorage.getToken() == null) return false
        val last = storage.getLastBackupAt()
        if (last != null && System.currentTimeMillis() - last < DriveBackupStorage.WEEK_MS) return false
        runBackupNow(userId).getOrThrow()
        return true
    }
}
