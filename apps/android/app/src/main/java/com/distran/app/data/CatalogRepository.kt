package com.distran.app.data

import android.content.Context
import kotlinx.serialization.json.Json
import java.io.InputStream
import java.util.concurrent.ConcurrentHashMap

class CatalogRepository(
    catalogJson: String,
    aliasesJson: String,
    modelJson: String
) {
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        explicitNulls = false
    }

    val catalog: List<Work> = json.decodeFromString(catalogJson)
    val aliases: Map<String, String> = json.decodeFromString(aliasesJson)
    val modelArtifact: CatalogModelArtifact = json.decodeFromString(modelJson)

    private val remoteWorks = ConcurrentHashMap<String, Work>()

    fun canonicalWorkId(id: String): String = aliases[id] ?: id

    fun isRemoteId(id: String): Boolean = REMOTE_ID_REGEX.matches(id)

    fun registerWorks(works: List<Work>, source: WorkSource = WorkSource.LIVE) {
        for (work in works) {
            if (isRemoteId(work.id) && work.title.isNotBlank()) {
                val seed = catalog.firstOrNull { it.id == work.id }
                if (source == WorkSource.SAVED && seed != null) continue
                remoteWorks[work.id] = if (seed != null) mergeWork(seed, work) else work
            }
        }
    }

    private fun mergeWork(seed: Work, incoming: Work): Work {
        return incoming.copy(
            image = incoming.image.ifBlank { seed.image },
            color = incoming.color.ifBlank { seed.color },
            maker = incoming.maker.ifBlank { seed.maker },
            publisher = incoming.publisher.ifBlank { seed.publisher },
            description = incoming.description.ifBlank { seed.description },
            tags = incoming.tags.ifEmpty { seed.tags },
            rating = incoming.rating.ifBlank { seed.rating },
            duration = incoming.duration.ifBlank { seed.duration },
            related = incoming.related.ifEmpty { seed.related },
            fallbackImage = incoming.fallbackImage ?: seed.fallbackImage,
            themes = incoming.themes ?: seed.themes,
            editorialRelated = incoming.editorialRelated ?: seed.editorialRelated,
            credits = incoming.credits ?: seed.credits,
            creators = incoming.creators ?: seed.creators,
            creatorRole = incoming.creatorRole ?: seed.creatorRole,
            platforms = incoming.platforms ?: seed.platforms,
            franchises = incoming.franchises ?: seed.franchises,
            relatedLabel = incoming.relatedLabel ?: seed.relatedLabel,
            verifiedDurationMinutes = incoming.verifiedDurationMinutes ?: seed.verifiedDurationMinutes
        )
    }

    fun getWork(id: String): Work? {
        val canonical = canonicalWorkId(id)
        return remoteWorks[canonical] ?: catalog.firstOrNull { it.id == canonical }
    }

    fun knownWorks(): List<Work> {
        val map = LinkedHashMap<String, Work>()
        for (work in catalog) {
            map[work.id] = work
        }
        for ((id, work) in remoteWorks) {
            map[id] = work
        }
        return map.values.toList()
    }

    fun searchCatalog(query: String, medium: Medium? = null): List<Work> {
        val term = query.trim().lowercase()
        return catalog
            .map { getWork(it.id) ?: it }
            .filter { work ->
                val mediumMatch = medium == null || work.medium == medium
                if (!mediumMatch) return@filter false
                if (term.isEmpty()) return@filter true
                val haystack = buildString {
                    append(work.title).append(' ')
                    append(work.maker).append(' ')
                    append(work.tags.joinToString(" ")).append(' ')
                    append((work.themes ?: emptyList()).joinToString(" ")).append(' ')
                    append(work.description)
                }.lowercase()
                haystack.contains(term)
            }
    }

    fun clearRemoteCache() {
        remoteWorks.clear()
    }

    enum class WorkSource {
        LIVE,
        SAVED
    }

    companion object {
        private val REMOTE_ID_REGEX = Regex("^(tmdb:(movie|tv)|igdb:game):[1-9]\\d{0,9}$")

        fun fromAndroidAssets(context: Context): CatalogRepository {
            val assets = context.assets
            val catalogJson = assets.open("catalog-data.json").bufferedReader().use { it.readText() }
            val aliasesJson = assets.open("catalog-aliases.json").bufferedReader().use { it.readText() }
            val modelJson = assets.open("catalog-model.json").bufferedReader().use { it.readText() }
            return CatalogRepository(catalogJson, aliasesJson, modelJson)
        }

        fun fromStreams(
            catalogStream: InputStream,
            aliasesStream: InputStream,
            modelStream: InputStream
        ): CatalogRepository {
            return CatalogRepository(
                catalogStream.bufferedReader().use { it.readText() },
                aliasesStream.bufferedReader().use { it.readText() },
                modelStream.bufferedReader().use { it.readText() }
            )
        }
    }
}
