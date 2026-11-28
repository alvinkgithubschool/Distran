package com.distran.app.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

class DistranApiClient(
    private val catalogRepo: CatalogRepository,
    initialBaseUrl: String = ""
) {
    var baseUrl: String = initialBaseUrl.trimEnd('/')
        private set

    fun updateBaseUrl(url: String) {
        val cleaned = url.trim().trimEnd('/')
        if (cleaned != baseUrl) {
            baseUrl = cleaned
            invalidateCatalogResponses()
        }
    }

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        explicitNulls = false
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(6, TimeUnit.SECONDS)
        .readTimeout(25, TimeUnit.SECONDS)
        .writeTimeout(25, TimeUnit.SECONDS)
        .build()

    private val buddyClient = client.newBuilder()
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(120, TimeUnit.SECONDS)
        .build()

    private data class CacheEntry(val expiresAtMs: Long, val body: String)
    private val responseCache = object : LinkedHashMap<String, CacheEntry>(100, 0.75f, false) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, CacheEntry>?): Boolean {
            return size > 100
        }
    }

    @Synchronized
    fun invalidateCatalogResponses() {
        responseCache.clear()
    }

    private suspend inline fun <reified T> getJson(path: String): T = withContext(Dispatchers.IO) {
        val url = baseUrl.takeIf { it.isNotEmpty() }
            ?: throw IllegalStateException("Live catalog is not configured.")

        val cached = synchronized(responseCache) {
            val entry = responseCache[path]
            if (entry != null && entry.expiresAtMs > System.currentTimeMillis()) entry.body else null
        }
        if (cached != null) {
            return@withContext json.decodeFromString<T>(cached)
        }

        val request = Request.Builder()
            .url(url + path)
            .header("Accept", "application/json")
            .get()
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IllegalStateException(
                    if (response.code == 404) {
                        "This title is no longer available from the provider."
                    } else {
                        "Live catalog is temporarily unavailable."
                    }
                )
            }
            val body = response.body?.string()
                ?: throw IllegalStateException("Live catalog is temporarily unavailable.")
            synchronized(responseCache) {
                responseCache[path] = CacheEntry(System.currentTimeMillis() + 60_000L, body)
            }
            json.decodeFromString<T>(body)
        }
    }

    suspend fun searchLiveCatalog(query: String, medium: Medium?, page: Int): SearchResult {
        val q = URLEncoder.encode(query.trim(), "UTF-8")
        val m = medium?.id ?: "all"
        val result: SearchResult = getJson("/catalog/search?q=$q&medium=$m&page=$page")
        catalogRepo.registerWorks(result.items)
        return result
    }

    suspend fun fetchWork(id: String): WorkDetail {
        val encoded = URLEncoder.encode(id, "UTF-8")
        val result: WorkDetail = getJson("/works/$encoded")
        catalogRepo.registerWorks(listOf(result.work) + result.related)
        return result
    }

    suspend fun searchCreators(query: String, page: Int): CreatorResult {
        val q = URLEncoder.encode(query.trim(), "UTF-8")
        return getJson("/creators/search?q=$q&page=$page")
    }

    suspend fun fetchCreator(id: String): CreatorDetail {
        val encoded = URLEncoder.encode(id, "UTF-8")
        val result: CreatorDetail = getJson("/creators/$encoded")
        catalogRepo.registerWorks(result.works)
        return result
    }

    suspend fun fetchBuiltinCatalog(): BuiltinsResponse {
        val result: BuiltinsResponse = getJson("/catalog/builtins")
        catalogRepo.registerWorks(result.items)
        return result
    }

    suspend fun askBuddy(input: BuddyInput): BuddyResult = withContext(Dispatchers.IO) {
        val url = baseUrl.takeIf { it.isNotEmpty() }
            ?: throw IllegalStateException("Start the catalog backend to use Buddy.")
        val payload = json.encodeToString(input)
        val request = Request.Builder()
            .url("$url/buddy/query")
            .post(payload.toRequestBody("application/json; charset=utf-8".toMediaType()))
            .build()

        buddyClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IllegalStateException(
                    if (response.code == 429) {
                        "Buddy is busy. Try again shortly."
                    } else {
                        "Buddy is unavailable. Check that the backend is running and enabled."
                    }
                )
            }
            val body = response.body?.string()
                ?: throw IllegalStateException("Buddy is unavailable. Check that the backend is running and enabled.")
            val result = json.decodeFromString<BuddyResult>(body)
            catalogRepo.registerWorks(result.items.map { it.work })
            result
        }
    }
}
