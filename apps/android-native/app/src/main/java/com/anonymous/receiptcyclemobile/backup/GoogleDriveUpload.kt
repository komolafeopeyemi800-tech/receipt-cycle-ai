package com.anonymous.receiptcyclemobile.backup

import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object GoogleDriveUpload {
    fun uploadJson(accessToken: String, fileName: String, jsonBody: String) {
        val createConn = (URL("https://www.googleapis.com/upload/drive/v3/files?uploadType=media").openConnection()
            as HttpURLConnection).apply {
            requestMethod = "POST"
            doOutput = true
            setRequestProperty("Authorization", "Bearer $accessToken")
            setRequestProperty("Content-Type", "application/json")
        }
        val fileId = try {
            OutputStreamWriter(createConn.outputStream).use { it.write(jsonBody) }
            val stream = if (createConn.responseCode in 200..299) createConn.inputStream else createConn.errorStream
            val text = stream.bufferedReader().use(BufferedReader::readText)
            if (createConn.responseCode !in 200..299) {
                error(parseDriveError(text, createConn.responseCode))
            }
            JSONObject(text).optString("id").ifBlank { null }
                ?: error("Drive upload succeeded but no file id was returned.")
        } finally {
            createConn.disconnect()
        }

        val patchConn = (URL("https://www.googleapis.com/drive/v3/files/$fileId?fields=id,name").openConnection()
            as HttpURLConnection).apply {
            requestMethod = "PATCH"
            doOutput = true
            setRequestProperty("Authorization", "Bearer $accessToken")
            setRequestProperty("Content-Type", "application/json")
        }
        try {
            val patchBody = JSONObject().put("name", fileName).toString()
            OutputStreamWriter(patchConn.outputStream).use { it.write(patchBody) }
            if (patchConn.responseCode !in 200..299) {
                val text = patchConn.errorStream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
                error(parseDriveError(text, patchConn.responseCode))
            }
        } finally {
            patchConn.disconnect()
        }
    }

    private fun parseDriveError(text: String, code: Int): String {
        return try {
            val msg = JSONObject(text).optJSONObject("error")?.optString("message")
            msg?.ifBlank { null } ?: (text.ifBlank { "Drive upload failed ($code)" })
        } catch (_: Exception) {
            text.ifBlank { "Drive upload failed ($code)" }
        }
    }
}
