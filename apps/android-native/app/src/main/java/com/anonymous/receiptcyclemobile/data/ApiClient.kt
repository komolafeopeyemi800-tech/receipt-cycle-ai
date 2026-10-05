package com.anonymous.receiptcyclemobile.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.merge
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

val appJson = Json {
    ignoreUnknownKeys = true
    isLenient = true
    coerceInputValues = true
}

/** An error answer from the API (or a network failure, `status == 0`). `message` is safe to show to the user. */
class ApiException(val status: Int, override val message: String, val code: String? = null) : Exception(message)

/** Better Auth error codes mapped to the wording the apps already show. */
private val AUTH_MESSAGES = mapOf(
    "INVALID_EMAIL_OR_PASSWORD" to "Invalid email or password.",
    "USER_ALREADY_EXISTS" to "Email already registered.",
    "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" to "Email already registered.",
    "PASSWORD_TOO_SHORT" to "Password must be at least 6 characters.",
    "INVALID_PASSWORD" to "Current password is incorrect.",
    "INVALID_TOKEN" to "This reset link has expired. Request a new password reset.",
    "SESSION_EXPIRED" to "Session expired. Sign in again.",
)

/**
 * HTTP client for the Receipt Cycle API Worker (workers/api). Replaces the Convex SDK.
 *
 * Live screens use [live], which re-fetches on a timer and right after any write, standing in for
 * Convex's push subscriptions.
 */
class ApiClient(
    baseUrl: String,
    /** Public website origin; used for password-reset links. */
    val webAppUrl: String,
    private val tokenProvider: () -> String?,
    private val http: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(90, TimeUnit.SECONDS) // AI calls can be slow
        .writeTimeout(60, TimeUnit.SECONDS)
        .build(),
) {
    private val base = baseUrl.trimEnd('/')

    private val _invalidations = MutableSharedFlow<Unit>(extraBufferCapacity = 1, onBufferOverflow = BufferOverflow.DROP_OLDEST)

    /** Emits after every successful write so [live] flows refresh straight away. */
    val invalidations: SharedFlow<Unit> = _invalidations

    /**
     * @param token explicit token (wins over the stored one), e.g. right after sign-in
     * @param anonymous send no Authorization header
     * @param nullOn401 / [nullOn404] return null instead of throwing
     */
    suspend fun request(
        method: String,
        path: String,
        query: Map<String, String?> = emptyMap(),
        body: JsonElement? = null,
        token: String? = null,
        anonymous: Boolean = false,
        nullOn401: Boolean = false,
        nullOn404: Boolean = false,
    ): JsonElement? = withContext(Dispatchers.IO) {
        val url = (base + path).toHttpUrl().newBuilder().apply {
            query.forEach { (k, v) -> if (!v.isNullOrEmpty()) addQueryParameter(k, v) }
        }.build()
        val builder = Request.Builder().url(url).header("Accept", "application/json")
        val bearer = if (anonymous) null else (token?.takeIf { it.isNotBlank() } ?: tokenProvider())
        if (bearer != null) builder.header("Authorization", "Bearer $bearer")
        val payload = body?.toString()?.toRequestBody("application/json".toMediaType())
        builder.method(method, payload ?: if (method == "GET" || method == "HEAD") null else "".toRequestBody(null))

        val text: String
        val status: Int
        try {
            http.newCall(builder.build()).execute().use { res ->
                status = res.code
                text = res.body?.string().orEmpty()
            }
        } catch (e: IOException) {
            throw ApiException(0, "Network error. Check your connection and try again.")
        }

        val json: JsonElement? = if (text.isBlank()) null else runCatching { appJson.parseToJsonElement(text) }.getOrNull()
        if (status == 401 && nullOn401) return@withContext null
        if (status == 404 && nullOn404) return@withContext null
        if (status !in 200..299) {
            val obj = json as? JsonObject
            val code = obj?.get("code")?.jsonPrimitive?.contentOrNull
            val message = code?.let { AUTH_MESSAGES[it] }
                ?: obj?.get("error")?.jsonPrimitive?.contentOrNull
                ?: obj?.get("message")?.jsonPrimitive?.contentOrNull
                ?: text.take(200).ifBlank { "Request failed ($status)." }
            throw ApiException(status, message, code)
        }
        if (method != "GET") _invalidations.tryEmit(Unit)
        json ?: JsonNull
    }

    suspend inline fun <reified T> get(
        path: String,
        query: Map<String, String?> = emptyMap(),
        token: String? = null,
        nullOn401: Boolean = false,
        nullOn404: Boolean = false,
        anonymous: Boolean = false,
    ): T? = request("GET", path, query, null, token, anonymous, nullOn401, nullOn404).decode()

    suspend inline fun <reified T> send(
        method: String,
        path: String,
        body: Map<String, Any?> = emptyMap(),
        token: String? = null,
        anonymous: Boolean = false,
    ): T? = request(method, path, body = body.toJsonObject(), token = token, anonymous = anonymous).decode()

    /** Fire a write and ignore the (small) answer. */
    suspend fun sendUnit(
        method: String,
        path: String,
        body: Map<String, Any?> = emptyMap(),
        token: String? = null,
        anonymous: Boolean = false,
    ) {
        request(method, path, body = if (method == "DELETE") null else body.toJsonObject(), token = token, anonymous = anonymous)
    }

    /**
     * Re-runs [fetch] every [intervalMs] and whenever something was written, emitting each outcome.
     * Failures are emitted as `Result.failure` and the flow keeps going.
     */
    fun <T> live(intervalMs: Long = 30_000, fetch: suspend () -> T?): Flow<Result<T?>> {
        val ticker = flow {
            while (true) {
                delay(intervalMs)
                emit(Unit)
            }
        }
        return flow {
            emit(runCatching { fetch() })
            merge(ticker, invalidations).collect { emit(runCatching { fetch() }) }
        }
    }
}

inline fun <reified T> JsonElement?.decode(): T? =
    if (this == null || this is JsonNull) null else appJson.decodeFromJsonElement<T>(this)

/** Maps plain Kotlin values (and nested maps/lists) to JSON, dropping nulls at the top level. */
fun Map<String, Any?>.toJsonObject(): JsonObject =
    JsonObject(filterValues { it != null }.mapValues { (_, v) -> v.toJsonElement() })

fun Any?.toJsonElement(): JsonElement = when (this) {
    null -> JsonNull
    is JsonElement -> this
    is String -> JsonPrimitive(this)
    is Boolean -> JsonPrimitive(this)
    is Number -> JsonPrimitive(this)
    is Map<*, *> -> JsonObject(entries.associate { (k, v) -> k.toString() to v.toJsonElement() })
    is Iterable<*> -> JsonArray(map { it.toJsonElement() })
    else -> JsonPrimitive(toString())
}

/** `{ "id": "..." }` answers from create endpoints. */
@kotlinx.serialization.Serializable
data class IdResponse(val id: String)

fun JsonElement.stringField(name: String): String? = (this as? JsonObject)?.get(name)?.jsonPrimitive?.contentOrNull
