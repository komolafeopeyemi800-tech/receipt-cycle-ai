package com.anonymous.receiptcyclemobile.auth

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.anonymous.receiptcyclemobile.BuildConfig
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

data class GoogleTokenResult(
    val refreshToken: String,
    val accessToken: String,
    val email: String?,
)

class GoogleDriveOAuthHelper(private val context: Context) {
    private var codeVerifier: String? = null

    val redirectUri: String = "receiptcycle://google-drive-oauth"

    fun isConfigured(): Boolean = BuildConfig.GOOGLE_ANDROID_CLIENT_ID.isNotBlank()

    fun startAuth() {
        val clientId = BuildConfig.GOOGLE_ANDROID_CLIENT_ID
        if (clientId.isBlank()) error("Google OAuth client id is not configured.")
        val verifier = generateCodeVerifier()
        codeVerifier = verifier
        val challenge = codeChallenge(verifier)
        val scopes = listOf(
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.file",
        ).joinToString(" ")
        val uri = Uri.parse("https://accounts.google.com/o/oauth2/v2/auth").buildUpon()
            .appendQueryParameter("client_id", clientId)
            .appendQueryParameter("redirect_uri", redirectUri)
            .appendQueryParameter("response_type", "code")
            .appendQueryParameter("scope", scopes)
            .appendQueryParameter("code_challenge", challenge)
            .appendQueryParameter("code_challenge_method", "S256")
            .appendQueryParameter("access_type", "offline")
            .appendQueryParameter("prompt", "consent")
            .build()
        CustomTabsIntent.Builder().build().launchUrl(context, uri)
    }

    fun consumeCodeVerifier(): String? {
        val v = codeVerifier
        codeVerifier = null
        return v
    }

    fun parseAuthCode(uri: Uri): String? = uri.getQueryParameter("code")

    suspend fun exchangeCode(code: String, verifier: String): GoogleTokenResult {
        val clientId = BuildConfig.GOOGLE_ANDROID_CLIENT_ID
        val body = buildString {
            append("client_id=").append(encode(clientId))
            append("&code=").append(encode(code))
            append("&redirect_uri=").append(encode(redirectUri))
            append("&grant_type=authorization_code")
            append("&code_verifier=").append(encode(verifier))
        }
        val json = postForm("https://oauth2.googleapis.com/token", body)
        val refresh = json.optString("refresh_token").ifBlank { null }
            ?: error("Google did not return a refresh token. Try disconnecting the app in your Google account and linking again.")
        val access = json.getString("access_token")
        val email = fetchEmail(access)
        return GoogleTokenResult(refresh, access, email)
    }

    suspend fun refreshAccessToken(refreshToken: String): String {
        val clientId = BuildConfig.GOOGLE_ANDROID_CLIENT_ID
        val body = buildString {
            append("client_id=").append(encode(clientId))
            append("&refresh_token=").append(encode(refreshToken))
            append("&grant_type=refresh_token")
        }
        val json = postForm("https://oauth2.googleapis.com/token", body)
        return json.getString("access_token")
    }

    private fun fetchEmail(accessToken: String): String? {
        val conn = (URL("https://www.googleapis.com/oauth2/v2/userinfo").openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            setRequestProperty("Authorization", "Bearer $accessToken")
        }
        return try {
            val text = conn.inputStream.bufferedReader().use(BufferedReader::readText)
            JSONObject(text).optString("email").ifBlank { null }
        } catch (_: Exception) {
            null
        } finally {
            conn.disconnect()
        }
    }

    private fun postForm(url: String, body: String): JSONObject {
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            doOutput = true
            setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
        }
        return try {
            OutputStreamWriter(conn.outputStream).use { it.write(body) }
            val stream = if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream
            val text = stream.bufferedReader().use(BufferedReader::readText)
            if (conn.responseCode !in 200..299) {
                error("Google OAuth failed (${conn.responseCode}): $text")
            }
            JSONObject(text)
        } finally {
            conn.disconnect()
        }
    }

    private fun encode(s: String): String = URLEncoder.encode(s, Charsets.UTF_8.name())

    private fun generateCodeVerifier(): String {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun codeChallenge(verifier: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(Charsets.US_ASCII))
        return Base64.getUrlEncoder().withoutPadding().encodeToString(digest)
    }
}
