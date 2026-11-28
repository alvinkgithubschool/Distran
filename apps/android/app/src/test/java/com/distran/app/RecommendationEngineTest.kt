package com.distran.app

import com.distran.app.data.Log
import com.distran.app.data.LogStatus
import com.distran.app.data.Medium
import com.distran.app.data.RecommendationEngine
import com.distran.app.data.Visibility
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RecommendationEngineTest {

    private fun log(workId: String, rating: Double): Log = Log(
        id = workId,
        workId = workId,
        rating = rating,
        note = "",
        status = LogStatus.COMPLETED,
        visibility = Visibility.PRIVATE,
        date = "2026-11-16"
    )

    @Test
    fun usesCuratedFallbackForEmptyAndUnknownProfiles() {
        val repo = loadTestCatalogRepo()
        val engine = RecommendationEngine(repo)
        val cold = engine.recommend(emptyList(), emptyList())
        assertEquals(4, cold.size)
        assertTrue(cold.all { it.reason == "From the curated collection" })
        assertEquals(cold, engine.recommend(listOf("tmdb:movie:1"), emptyList()))
    }

    @Test
    fun excludesFavoritesDislikesAndLoggedTitlesAndRespectsFormat() {
        val repo = loadTestCatalogRepo()
        val engine = RecommendationEngine(repo)
        val favorites = listOf("cyberpunk")
        val logs = listOf(log("edgerunners", 1.0), log("arrival", 5.0))
        val picks = engine.recommend(favorites, logs, Medium.MOVIE)
        assertTrue(picks.isNotEmpty())
        val excluded = listOf("cyberpunk", "edgerunners", "arrival").map { repo.canonicalWorkId(it) }.toSet()
        assertTrue(picks.all { it.work.medium == Medium.MOVIE && !excluded.contains(it.work.id) })
        assertTrue(picks.all { it.score.isFinite() })
    }

    @Test
    fun doesNotCountRepeatedLoggingAsRepeatedPositiveEvidence() {
        val repo = loadTestCatalogRepo()
        val engine = RecommendationEngine(repo)
        val logs = listOf(log("cyberpunk", 5.0))
        assertEquals(
            engine.recommend(emptyList(), logs + logs),
            engine.recommend(emptyList(), logs)
        )
    }

    @Test
    fun returnsUniqueBoundedDeterministicResults() {
        val repo = loadTestCatalogRepo()
        val engine = RecommendationEngine(repo)
        val picks = engine.recommend(listOf("outer-wilds"), emptyList(), null, 3)
        assertEquals(3, picks.size)
        assertEquals(3, picks.map { it.work.id }.toSet().size)
        assertEquals(picks, engine.recommend(listOf("outer-wilds"), emptyList(), null, 3))
        assertEquals(emptyList<Any>(), engine.recommend(listOf("outer-wilds"), emptyList(), null, 0))
    }
}
