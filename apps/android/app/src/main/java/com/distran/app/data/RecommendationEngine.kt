package com.distran.app.data

import kotlin.math.max
import kotlin.math.sqrt

data class Recommendation(
    val work: Work,
    val reason: String,
    val score: Double
)

class RecommendationEngine(private val catalogRepo: CatalogRepository) {

    val recommendationModelId: String
        get() = catalogRepo.modelArtifact.modelId

    private fun dot(a: List<Double>, b: List<Double>): Double {
        var sum = 0.0
        for (i in a.indices) {
            sum += a[i] * b[i]
        }
        return sum
    }

    private fun normalize(v: List<Double>): List<Double> {
        var sumSq = 0.0
        for (x in v) sumSq += x * x
        val norm = sqrt(sumSq)
        return if (norm > 0.0) v.map { it / norm } else v
    }

    /**
     * Local inference: account history never leaves the device. Unknown live IDs are ignored.
     */
    fun recommend(
        favorites: List<String>,
        logs: List<Log>,
        medium: Medium? = null,
        limit: Int = 4
    ): List<Recommendation> {
        val artifact = catalogRepo.modelArtifact
        val dimensions = artifact.vectors.firstOrNull()?.size ?: 0
        val compatible = artifact.schema == 1 &&
            dimensions > 0 &&
            artifact.items.size == artifact.vectors.size &&
            artifact.items.toSet().size == artifact.items.size &&
            artifact.items.all { id -> catalogRepo.catalog.any { it.id == id } } &&
            artifact.vectors.all { v -> v.size == dimensions && v.all { it.isFinite() } }

        val excluded = buildSet {
            favorites.forEach { add(catalogRepo.canonicalWorkId(it)) }
            logs.forEach { add(catalogRepo.canonicalWorkId(it.workId)) }
        }

        fun fallback(): List<Recommendation> {
            return catalogRepo.catalog
                .filter { !excluded.contains(it.id) && (medium == null || it.medium == medium) }
                .take(max(0, limit))
                .map { Recommendation(work = it, reason = "From the curated collection", score = 0.0) }
        }

        if (!compatible) return fallback()

        val weights = LinkedHashMap<String, Double>()
        favorites.forEachIndexed { rank, id ->
            weights[catalogRepo.canonicalWorkId(id)] = 2.0 / (1.0 + rank / 4.0)
        }

        val latest = LinkedHashMap<String, Log>()
        for (original in logs) {
            val canonicalLog = original.copy(workId = catalogRepo.canonicalWorkId(original.workId))
            val prev = latest[canonicalLog.workId]
            if (prev == null || canonicalLog.date > prev.date) {
                latest[canonicalLog.workId] = canonicalLog
            }
        }
        for (log in latest.values) {
            if (log.rating > 0.0 && log.rating <= 2.0) {
                weights[log.workId] = -1.0
            } else if (log.rating >= 4.0) {
                weights[log.workId] = max(weights[log.workId] ?: 0.0, 1.0)
            }
        }

        val positive = DoubleArray(dimensions)
        val negative = DoubleArray(dimensions)
        data class Seed(val id: String, val vector: List<Double>)
        val seeds = mutableListOf<Seed>()

        artifact.items.forEachIndexed { i, id ->
            val weight = weights[id] ?: 0.0
            val vec = artifact.vectors[i]
            if (weight > 0.0) {
                seeds.add(Seed(id, vec))
                for (j in 0 until dimensions) positive[j] += kotlin.math.abs(weight) * vec[j]
            } else if (weight < 0.0) {
                for (j in 0 until dimensions) negative[j] += kotlin.math.abs(weight) * vec[j]
            }
        }

        if (seeds.isEmpty()) return fallback()

        val profile = normalize(positive.toList())
        val dislikes = normalize(negative.toList())

        data class Candidate(
            val work: Work,
            val vector: List<Double>,
            val reason: String,
            val score: Double
        )

        val candidates = mutableListOf<Candidate>()
        artifact.items.forEachIndexed { i, id ->
            val work = catalogRepo.getWork(id)
            if (work != null && !excluded.contains(id) && (medium == null || work.medium == medium)) {
                val vector = artifact.vectors[i]
                val nearest = seeds.maxByOrNull { dot(it.vector, vector) }!!
                val nearestTitle = catalogRepo.getWork(nearest.id)?.title ?: "your favourites"
                val score = dot(profile, vector) - 0.5 * max(0.0, dot(dislikes, vector))
                candidates.add(
                    Candidate(
                        work = work,
                        vector = vector,
                        reason = "Similar themes to $nearestTitle",
                        score = score
                    )
                )
            }
        }

        val selected = mutableListOf<Candidate>()
        val targetCount = max(0, limit)
        while (selected.size < targetCount && candidates.isNotEmpty()) {
            fun utility(c: Candidate): Double {
                val maxSim = selected.maxOfOrNull { dot(c.vector, it.vector) } ?: 0.0
                return 0.85 * c.score - 0.15 * max(0.0, maxSim)
            }
            candidates.sortWith { a, b ->
                val cmp = utility(b).compareTo(utility(a))
                if (cmp != 0) cmp else a.work.id.compareTo(b.work.id)
            }
            selected.add(candidates.removeAt(0))
        }

        return selected.map { Recommendation(it.work, it.reason, it.score) }
    }

    fun recommend(account: Account, medium: Medium? = null, limit: Int = 4): List<Recommendation> =
        recommend(account.favorites, account.logs, medium, limit)
}
