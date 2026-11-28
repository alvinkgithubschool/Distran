package com.distran.app

import com.distran.app.data.CatalogRepository
import com.distran.app.data.ClaimInput
import com.distran.app.data.DistranStore
import com.distran.app.data.Log
import com.distran.app.data.LogStatus
import com.distran.app.data.Medium
import com.distran.app.data.Role
import com.distran.app.data.Shelf
import com.distran.app.data.StorageAdapter
import com.distran.app.data.Visibility
import com.distran.app.data.Work
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

internal fun loadTestCatalogRepo(): CatalogRepository {
    val cl = Thread.currentThread().contextClassLoader!!
    return CatalogRepository.fromStreams(
        cl.getResourceAsStream("catalog-data.json")!!,
        cl.getResourceAsStream("catalog-aliases.json")!!,
        cl.getResourceAsStream("catalog-model.json")!!
    )
}

internal class MemoryStorage : StorageAdapter {
    private val map = LinkedHashMap<String, String>()
    override fun getItem(key: String): String? = map[key]
    override fun setItem(key: String, value: String) {
        map[key] = value
    }
}

class DistranStoreTest {
    private fun createEnv(demoEnabled: Boolean = true): Pair<CatalogRepository, DistranStore> {
        val repo = loadTestCatalogRepo()
        val store = DistranStore(repo, demoEnabled = demoEnabled)
        return repo to store
    }

    private val sampleLog = Log(
        id = "one",
        workId = "dune",
        rating = 4.5,
        note = "The desert remembers.",
        status = LogStatus.COMPLETED,
        visibility = Visibility.PRIVATE,
        date = "2026-11-07"
    )

    @Test
    fun rejectsIncorrectCredentialsAndDisablesFixturesWhenDemoOff() {
        val (_, store) = createEnv(demoEnabled = true)
        try {
            store.authenticate(store.freshDatabase(), "user@distran.test", "wrong", allowDemo = true)
            fail("Expected incorrect credentials error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("incorrect"))
        }

        try {
            store.authenticate(
                store.freshDatabase(),
                "user@distran.test",
                DistranStore.DEMO_PASSWORD,
                allowDemo = false
            )
            fail("Expected not configured error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("not configured"))
        }
    }

    @Test
    fun restoresActiveSessionAndPerAccountLedgerFromStorage() {
        val (_, store) = createEnv()
        val storage = MemoryStorage()
        var db = store.authenticate(
            store.freshDatabase(),
            " USER@DISTRAN.TEST ",
            DistranStore.DEMO_PASSWORD,
            allowDemo = true
        )
        val user = db.accounts[0]
        db = store.replaceAccount(db, store.addLog(user, sampleLog))
        store.saveDatabase(db, storage)

        val restored = store.loadDatabase(storage)
        assertEquals(user.id, restored.activeId)
        assertEquals(4.5, restored.accounts[0].logs[0].rating, 0.001)
        assertEquals(0, restored.accounts[1].logs.size)
    }

    @Test
    fun keepsSavedMemoriesThroughSignOutAndSwitchingAccounts() {
        val (_, store) = createEnv()
        var db = store.freshDatabase()
        db = store.replaceAccount(db, store.addLog(db.accounts[0], sampleLog))
        db = store.authenticate(db, "creator@distran.test", DistranStore.DEMO_PASSWORD, allowDemo = true)
        assertEquals(0, db.accounts.first { it.id == db.activeId }.logs.size)

        db = db.copy(activeId = null)
        db = store.authenticate(db, "user@distran.test", DistranStore.DEMO_PASSWORD, allowDemo = true)
        val active = db.accounts.first { it.id == db.activeId }
        assertTrue(active.logs[0].note.contains("desert"))
    }

    @Test
    fun hashesLocalSignupPasswordsAndAuthenticatesWithoutPlaintext() {
        val (_, store) = createEnv()
        val db = store.createAccount(
            store.freshDatabase(),
            "new@example.test",
            "MyLocalPassword!",
            "New explorer",
            Role.USER,
            allowDemo = true
        )
        val created = db.accounts.last()
        assertEquals(64, created.passwordHash?.length)
        val serialized = Json.encodeToString(db)
        assertFalse(serialized.contains("MyLocalPassword!"))

        val authed =
            store.authenticate(db.copy(activeId = null), "new@example.test", "MyLocalPassword!", allowDemo = true)
        assertEquals(created.id, authed.activeId)

        try {
            store.createAccount(db, "new@example.test", "MyLocalPassword!", "Copy", Role.USER, allowDemo = true)
            fail("Expected duplicate email error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("already"))
        }
    }

    @Test
    fun recoversCorruptStorageAndRejectsInvalidStaleActiveSessions() {
        val (_, store) = createEnv()
        val storage = MemoryStorage()
        storage.setItem(DistranStore.STORE_KEY, "{bad")
        assertNull(store.loadDatabase(storage).activeId)

        val db = store.freshDatabase().copy(activeId = "missing")
        store.saveDatabase(db, storage)
        assertNull(store.loadDatabase(storage).activeId)
    }

    @Test
    fun surfacesStorageFailuresInsteadOfFailingSilently() {
        val (_, store) = createEnv()
        val failingStorage = object : StorageAdapter {
            override fun getItem(key: String): String? = null
            override fun setItem(key: String, value: String) {
                throw IllegalStateException("Storage full")
            }
        }
        try {
            store.saveDatabase(store.freshDatabase(), failingStorage)
            fail("Expected storage failure")
        } catch (e: IllegalStateException) {
            assertTrue(e.message!!.contains("Storage full"))
        }
    }

    @Test
    fun acceptsHalfStarRatingsAndRejectsInvalidRatingsAndUnknownWorks() {
        val (_, store) = createEnv()
        val account = store.freshDatabase().accounts[0]
        assertEquals(4.5, store.addLog(account, sampleLog).logs[0].rating, 0.001)

        try {
            store.addLog(account, sampleLog.copy(rating = 4.2))
            fail("Expected half-star error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("half-star"))
        }

        try {
            store.addLog(account, sampleLog.copy(workId = "missing"))
            fail("Expected catalog error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("catalog"))
        }
    }

    @Test
    fun enforcesUniqueOrderedTop4PerMedium() {
        val (repo, store) = createEnv()
        var account = store.freshDatabase().accounts[0]
        try {
            store.toggleFavorite(account, "disco-elysium")
            fail("Expected Top 4 full error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("full"))
        }
        account = store.toggleFavorite(account, "cyberpunk")
        account = store.toggleFavorite(account, "disco-elysium")
        assertEquals(1, account.favorites.count { it == repo.canonicalWorkId("disco-elysium") })
        assertEquals(repo.canonicalWorkId("disco-elysium"), account.favorites.last())
    }

    @Test
    fun supportsCrossMediaCollectionsAndRejectsDuplicates() {
        val (repo, store) = createEnv()
        store.validateShelf(
            Shelf(
                id = "mixed",
                title = "Night City",
                description = "",
                visibility = Visibility.PRIVATE,
                workIds = listOf("cyberpunk", "blade-runner", "edgerunners")
            )
        )

        try {
            store.validateShelf(
                Shelf(
                    id = "mixed",
                    title = "Night City",
                    description = "",
                    visibility = Visibility.PRIVATE,
                    workIds = listOf("cyberpunk", "cyberpunk")
                )
            )
            fail("Expected unique error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("unique"))
        }

        try {
            store.validateShelf(
                Shelf(
                    id = "dup-alias",
                    title = "Duplicate",
                    description = "",
                    visibility = Visibility.PRIVATE,
                    workIds = listOf("dune", repo.canonicalWorkId("dune"))
                )
            )
            fail("Expected unique alias duplicate error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("unique"))
        }
    }

    @Test
    fun searchesAcrossTitlesMakersMoodsAndFormatFilters() {
        val (repo, _) = createEnv()
        assertTrue(repo.searchCatalog("cyberpunk").size > 1)
        assertEquals(3, repo.searchCatalog("Denis Villeneuve", Medium.MOVIE).size)
        assertEquals(
            listOf(repo.canonicalWorkId("outer-wilds")),
            repo.searchCatalog("mystery", Medium.GAME).map { it.id }
        )
        assertEquals(0, repo.searchCatalog("no such work").size)
    }

    @Test
    fun persistsProviderMetadataSnapshotsWithSavedWorks() {
        val (repo, store) = createEnv()
        val work = Work(
            id = "tmdb:movie:999999",
            title = "A saved live title",
            medium = Medium.MOVIE,
            year = 2024,
            maker = "Maker",
            publisher = "Studio",
            description = "Description",
            rating = "4.0",
            duration = "2h",
            provider = "tmdb",
            sourceUrl = "https://www.themoviedb.org/movie/999999"
        )
        repo.registerWorks(listOf(work))
        var db = store.freshDatabase()
        db = db.copy(
            accounts = listOf(store.addLog(db.accounts[0], sampleLog.copy(workId = work.id))) + db.accounts.drop(1)
        )
        val storage = MemoryStorage()
        store.saveDatabase(db, storage)
        val restored = store.loadDatabase(storage)
        assertEquals("A saved live title", restored.works?.get(work.id)?.title)
        assertEquals("Maker", repo.getWork(restored.accounts[0].logs[0].workId)?.maker)
    }

    @Test
    fun validatesCreatorClaimsAndPreventsUserOrDuplicateClaims() {
        val (_, store) = createEnv()
        val creator = store.freshDatabase().accounts[1]
        val input = ClaimInput(
            workId = "dune",
            credit = "Producer",
            evidence = "https://example.com/credits",
            note = "A production credit."
        )
        val result = store.requestClaim(creator, input)
        assertEquals("pending", result.claims?.first()?.status)

        try {
            store.requestClaim(result, input)
            fail("Expected duplicate claim error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("already"))
        }

        try {
            store.requestClaim(store.freshDatabase().accounts[0], input)
            fail("Expected creator account error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("creator account"))
        }

        try {
            store.requestClaim(creator, input.copy(evidence = "javascript:alert(1)"))
            fail("Expected URL scheme error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("website URL"))
        }

        try {
            store.requestClaim(creator, input.copy(credit = ""))
            fail("Expected credited role error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("credited role"))
        }
    }

    @Test
    fun enforcesUniqueHandlesAndPreservesCreatorFields() {
        val (repo, store) = createEnv()
        val db = store.freshDatabase()

        try {
            store.replaceAccount(db, db.accounts[1].copy(handle = "alex"))
            fail("Expected taken handle error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("taken"))
        }

        try {
            store.replaceAccount(db, db.accounts[1].copy(handle = "A bad name"))
            fail("Expected username format error")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("username"))
        }

        val dune = repo.getWork("dune")!!
        repo.registerWorks(listOf(dune.copy(id = "tmdb:movie:888", provider = "tmdb")))
        val creator = store.requestClaim(
            db.accounts[1].copy(
                avatar = "data:image/jpeg;base64,preview",
                banner = "data:image/jpeg;base64,banner",
                accent = "#c4a1dd",
                headline = "New worlds",
                featuredWorks = listOf("dune")
            ),
            ClaimInput(
                workId = "tmdb:movie:888",
                credit = "Director",
                evidence = "https://example.com/credits",
                note = ""
            )
        )
        val storage = MemoryStorage()
        store.saveDatabase(store.replaceAccount(db, creator), storage)
        val loaded = store.loadDatabase(storage)
        assertEquals("New worlds", loaded.accounts[1].headline)
        assertEquals("tmdb:movie:888", loaded.accounts[1].claims?.first()?.workId)
        assertNotNull(loaded.works?.get("tmdb:movie:888"))
        assertTrue(loaded.works!!["tmdb:movie:888"]!!.title.contains("Dune"))
    }

    @Test
    fun migratesLegacyIdsWithoutLosingLogsProvenanceOrPendingClaims() {
        val (repo, store) = createEnv()
        val initial = store.freshDatabase()
        val userWithLegacy = initial.accounts[0].copy(
            favorites = listOf("cyberpunk", repo.canonicalWorkId("cyberpunk"), "dune"),
            logs = listOf(
                sampleLog.copy(workId = "dune"),
                sampleLog.copy(id = "repeat", workId = "dune")
            ),
            lists = listOf(
                Shelf(
                    id = "buddy-list",
                    title = "Night city",
                    description = "Kept intact",
                    visibility = Visibility.PRIVATE,
                    source = "buddy",
                    workIds = listOf("cyberpunk", repo.canonicalWorkId("cyberpunk"), "edgerunners")
                )
            )
        )
        val creatorWithClaim = initial.accounts[1].copy(
            claims = listOf(
                com.distran.app.data.Claim(
                    id = "pending",
                    workId = "dune",
                    credit = "Producer",
                    evidence = "https://example.com",
                    note = "Preserve evidence",
                    status = "pending",
                    date = "2026-11-16"
                )
            )
        )
        val rawDb = initial.copy(accounts = listOf(userWithLegacy, creatorWithClaim))
        val storage = MemoryStorage()
        storage.setItem(DistranStore.STORE_KEY, Json.encodeToString(rawDb))

        val loaded = store.loadDatabase(storage)
        assertEquals(
            listOf(repo.canonicalWorkId("cyberpunk"), repo.canonicalWorkId("dune")),
            loaded.accounts[0].favorites
        )
        assertEquals(listOf("one", "repeat"), loaded.accounts[0].logs.map { it.id })
        assertTrue(loaded.accounts[0].logs.all { it.workId == repo.canonicalWorkId("dune") })
        assertEquals("buddy", loaded.accounts[0].lists[0].source)
        assertEquals("Kept intact", loaded.accounts[0].lists[0].description)
        assertEquals(
            listOf(repo.canonicalWorkId("cyberpunk"), repo.canonicalWorkId("edgerunners")),
            loaded.accounts[0].lists[0].workIds
        )
        assertEquals(repo.canonicalWorkId("dune"), loaded.accounts[1].claims?.first()?.workId)
        assertEquals("Preserve evidence", loaded.accounts[1].claims?.first()?.note)

        store.saveDatabase(loaded, storage)
        assertEquals(loaded.accounts, store.loadDatabase(storage).accounts)

        val exportJson = store.exportAccountJson(loaded.accounts[0])
        assertTrue(exportJson.contains("Night city"))
        assertFalse(exportJson.contains("passwordHash"))
    }
}
