package com.anonymous.receiptcyclemobile.data

import com.anonymous.receiptcyclemobile.data.models.AuthResult
import com.anonymous.receiptcyclemobile.data.models.Transaction
import com.anonymous.receiptcyclemobile.data.repository.DraftDto
import com.anonymous.receiptcyclemobile.data.repository.ScanDto
import com.anonymous.receiptcyclemobile.data.repository.ScanExtractedDto
import com.anonymous.receiptcyclemobile.data.repository.VoiceDto
import com.anonymous.receiptcyclemobile.data.repository.toScanResult
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test

class ApiClientTest {
    private lateinit var server: MockWebServer
    private var token: String? = "stored-token"
    private lateinit var api: ApiClient

    @Before
    fun setUp() {
        server = MockWebServer().also { it.start() }
        api = ApiClient(server.url("/").toString(), "https://example.com", tokenProvider = { token })
    }

    @After
    fun tearDown() {
        runCatching { server.shutdown() }
    }

    private fun json(body: String, code: Int = 200) = MockResponse().setResponseCode(code).setBody(body)

    @Test
    fun sendsTheStoredBearerTokenAndDecodesTheAnswer() = runBlocking {
        server.enqueue(json("""[{"id":"t1","amount":5.5,"type":"expense","category":"Food","date":"2026-10-01","merchant":null}]"""))
        val rows = api.get<List<Transaction>>("/api/transactions", mapOf("workspace" to "personal", "startDate" to null))!!
        assertEquals("t1", rows.single().id)
        val req = server.takeRequest()
        assertEquals("Bearer stored-token", req.getHeader("Authorization"))
        assertEquals("/api/transactions?workspace=personal", req.path)
    }

    @Test
    fun explicitTokenWinsAndAnonymousSendsNone() = runBlocking {
        server.enqueue(json("{}"))
        server.enqueue(json("{}"))
        api.sendUnit("POST", "/x", token = "fresh")
        api.sendUnit("POST", "/y", anonymous = true)
        assertEquals("Bearer fresh", server.takeRequest().getHeader("Authorization"))
        assertNull(server.takeRequest().getHeader("Authorization"))
    }

    @Test
    fun mapsBetterAuthErrorCodesToFriendlyMessages() = runBlocking {
        server.enqueue(json("""{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}""", 401))
        try {
            api.send<AuthResult>("POST", "/api/auth/sign-in/email", mapOf("email" to "a@b.c", "password" to "x"), anonymous = true)
            fail("expected an error")
        } catch (e: ApiException) {
            assertEquals(401, e.status)
            assertEquals("Invalid email or password.", e.message)
        }
    }

    @Test
    fun usesTheWorkerErrorFieldAndReportsNetworkFailures() = runBlocking {
        server.enqueue(json("""{"error":"CSV export is available for Pro subscribers."}""", 402))
        val e = runCatching { api.get<List<Transaction>>("/api/transactions/export") }.exceptionOrNull() as ApiException
        assertEquals(402, e.status)
        assertEquals("CSV export is available for Pro subscribers.", e.message)

        server.shutdown()
        val net = runCatching { api.get<List<Transaction>>("/api/transactions") }.exceptionOrNull() as ApiException
        assertEquals(0, net.status)
        assertTrue(net.message.startsWith("Network error"))
    }

    @Test
    fun a401AndA404CanBecomeNull() = runBlocking {
        server.enqueue(json("""{"error":"Sign in required."}""", 401))
        server.enqueue(json("""{"error":"Transaction not found"}""", 404))
        assertNull(api.get<Transaction>("/api/me", nullOn401 = true))
        assertNull(api.get<Transaction>("/api/transactions/nope", nullOn404 = true))
    }

    @Test
    fun buildsJsonBodiesFromPlainValuesAndDropsNulls() {
        val body = mapOf(
            "name" to "Cash",
            "balance" to 12.5,
            "skip" to null,
            "tags" to listOf("a", "b"),
            "nested" to mapOf("ok" to true),
        ).toJsonObject()
        assertEquals(setOf("name", "balance", "tags", "nested"), body.keys)
        assertEquals(JsonPrimitive("Cash"), body["name"])
        assertTrue(body["tags"] is JsonArray)
        assertTrue(body["nested"] is JsonObject)
    }

    @Test
    fun liveFlowsRefreshRightAfterAWrite() = runBlocking {
        server.enqueue(json("""["one"]"""))
        server.enqueue(json("{}")) // the write
        server.enqueue(json("""["one","two"]"""))
        var calls = 0
        val seen = api.live(intervalMs = 60_000) {
            calls++
            api.get<List<String>>("/list")
        }
        val results = coroutineScope {
            val collected = async { seen.take(2).toList() }
            delay(500) // let the first fetch finish
            api.sendUnit("POST", "/write")
            collected.await()
        }
        assertEquals(listOf("one"), results[0].getOrNull())
        assertEquals(listOf("one", "two"), results[1].getOrNull())
        assertEquals(2, calls)
    }

    @Test
    fun liveFlowsEmitFailuresInsteadOfCrashing() = runBlocking {
        server.enqueue(json("""{"error":"boom"}""", 500))
        val first = api.live { api.get<List<String>>("/list") }.first()
        assertTrue(first.isFailure)
        assertNotNull(first.exceptionOrNull())
    }

    @Test
    fun scanAnswersMapToTheModelsTheScreensUse() {
        val scan = ScanDto(
            success = true,
            extracted_data = ScanExtractedDto(
                merchant_name = "Cafe",
                total_amount = 12.5,
                date = "2026-10-01",
                category = "Food",
                formatted_receipt_text = "CAFE\nTOTAL 12.50",
            ),
        ).toScanResult()
        assertEquals(12.5, scan.extracted!!.amount!!, 0.0)
        assertEquals("Cafe", scan.extracted!!.merchant)
        assertEquals("expense", scan.extracted!!.type)
        assertEquals("CAFE\nTOTAL 12.50", scan.previewText)

        val voice = VoiceDto(
            ok = true,
            transcript = "coffee ten dollars",
            draft = DraftDto(amount = 10.0, type = "expense", category = "Food"),
        ).toScanResult()
        assertEquals(10.0, voice.extracted!!.amount!!, 0.0)
        assertEquals("coffee ten dollars", voice.previewText)

        assertEquals("Empty response from the server.", (null as ScanDto?).toScanResult().error)
        assertNull(ScanDto(error = "no keys").toScanResult().extracted)
    }
}
