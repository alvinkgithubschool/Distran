package com.distran.app

import com.distran.app.data.BuddyInput
import com.distran.app.data.CreatorDirectory
import com.distran.app.data.DistranApiClient
import com.distran.app.data.DistranStore
import com.distran.app.data.Medium
import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CreatorAndApiTest {

    @Test
    fun hidesPrivateCreatorProfilesAndSeparatesClaimsFromProviderCredits() {
        val repo = loadTestCatalogRepo()
        val store = DistranStore(repo, demoEnabled = true)
        val directory = CreatorDirectory(repo)

        val db = store.freshDatabase()
        val privateCreator = db.accounts[1].copy(
            settings = db.accounts[1].settings.copy(privateProfile = true)
        )
        val updated = db.copy(accounts = listOf(db.accounts[0], privateCreator))

        assertEquals(0, directory.publicCreators(updated).size)
        assertEquals(1, directory.publicCreators(updated.copy(activeId = privateCreator.id)).size)
        assertEquals(0, directory.creditedWorks("Night Room Studio").size)
        assertTrue(directory.creditedWorks("Denis Villeneuve").isNotEmpty())
        assertTrue(directory.localDirectory().isNotEmpty())
    }

    @Test
    fun apiClientCachesGetResponsesAndRegistersReturnedWorks() = runTest {
        val repo = loadTestCatalogRepo()
        val server = MockWebServer()
        server.start()
        try {
            val baseUrl = server.url("/v1").toString().trimEnd('/')
            val api = DistranApiClient(repo, baseUrl)

            server.enqueue(
                MockResponse()
                    .setResponseCode(200)
                    .setBody(
                        """
                        {
                          "items": [
                            {
                              "id": "tmdb:movie:777777",
                              "title": "Orbit Station",
                              "medium": "movie",
                              "year": 2025,
                              "rating": "4.2",
                              "provider": "tmdb"
                            }
                          ],
                          "page": 1,
                          "hasMore": false,
                          "status": "ok",
                          "providers": { "tmdb": { "cache": "miss" } },
                          "errors": []
                        }
                        """.trimIndent()
                    )
            )

            val first = api.searchLiveCatalog("orbit", Medium.MOVIE, 1)
            val second = api.searchLiveCatalog("orbit", Medium.MOVIE, 1)

            assertEquals(1, server.requestCount)
            assertEquals("Orbit Station", first.items.first().title)
            assertEquals(first, second)
            assertEquals("Orbit Station", repo.getWork("tmdb:movie:777777")?.title)

            server.enqueue(
                MockResponse()
                    .setResponseCode(200)
                    .setBody(
                        """
                        {
                          "reply": "Try Orbit Station for quiet loneliness.",
                          "items": [
                            {
                              "work": {
                                "id": "tmdb:movie:777778",
                                "title": "Quiet Orbit",
                                "medium": "movie",
                                "year": 2024,
                                "rating": "4.0",
                                "provider": "tmdb"
                              },
                              "reason": "Shares contemplative orbital isolation.",
                              "evidence": "Matches atmospheric sci-fi tags."
                            }
                          ],
                          "route": "buddy",
                          "degraded": false,
                          "free_only": true
                        }
                        """.trimIndent()
                    )
            )
            val buddy = api.askBuddy(BuddyInput(mode = "chat", prompt = "loneliness in orbit"))
            assertEquals(1, buddy.items.size)
            assertEquals("Quiet Orbit", repo.getWork("tmdb:movie:777778")?.title)
        } finally {
            server.shutdown()
        }
    }
}
