package com.distran.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class Medium(val id: String, val displayName: String, val pluralName: String) {
    @SerialName("game")
    GAME("game", "Game", "Games"),

    @SerialName("movie")
    MOVIE("movie", "Film", "Movies"),

    @SerialName("tv")
    TV("tv", "Series", "Television");

    companion object {
        fun fromId(value: String?): Medium? = entries.firstOrNull { it.id == value }
    }
}

@Serializable
data class Credit(
    val id: String? = null,
    val name: String,
    val role: String = ""
)

@Serializable
data class CreatorRef(
    val id: String,
    val name: String,
    val role: String? = null,
    val episodeCount: Int? = null
)

@Serializable
data class Work(
    val id: String,
    val title: String,
    val medium: Medium,
    val year: Int = 0,
    val image: String = "",
    val color: String = "#b7c96c",
    val maker: String = "",
    val publisher: String = "",
    val description: String = "",
    val tags: List<String> = emptyList(),
    val rating: String = "0.0",
    val duration: String = "",
    val related: List<String> = emptyList(),
    val provider: String? = null,
    val sourceUrl: String? = null,
    val credits: List<Credit>? = null,
    val creators: List<CreatorRef>? = null,
    val creatorRole: String? = null,
    val themes: List<String>? = null,
    val fallbackImage: String? = null,
    val metadataFetchedAt: String? = null,
    val editorialRelated: List<String>? = null,
    @SerialName("verified_duration_minutes")
    val verifiedDurationMinutes: Int? = null,
    val platforms: List<String>? = null,
    val franchises: List<String>? = null,
    val relatedLabel: String? = null
)

@Serializable
data class CatalogModelArtifact(
    val schema: Int,
    @SerialName("model_id")
    val modelId: String,
    @SerialName("feature_schema")
    val featureSchema: String = "",
    @SerialName("catalog_sha256")
    val catalogSha256: String = "",
    val items: List<String> = emptyList(),
    val media: List<String> = emptyList(),
    val vectors: List<List<Double>> = emptyList()
)

@Serializable
data class Creator(
    val id: String,
    val name: String,
    val image: String? = null,
    val kind: String = "Creator",
    val bio: String? = null,
    val provider: String? = null,
    val sourceUrl: String? = null,
    val role: String? = null
)

@Serializable
data class ProviderErrorInfo(
    val provider: String,
    val code: String
)

@Serializable
data class ProviderCacheStatus(
    val cache: String = "miss"
)

@Serializable
data class SearchResult(
    val items: List<Work> = emptyList(),
    val page: Int = 1,
    val hasMore: Boolean = false,
    val status: String = "ok",
    val providers: Map<String, ProviderCacheStatus> = emptyMap(),
    val errors: List<ProviderErrorInfo> = emptyList()
)

@Serializable
data class WorkDetail(
    val work: Work,
    val related: List<Work> = emptyList(),
    val cache: String = "miss"
)

@Serializable
data class BuiltinsResponse(
    val items: List<Work> = emptyList(),
    val source: String = "local"
)

@Serializable
data class CreatorResult(
    val items: List<Creator> = emptyList(),
    val hasMore: Boolean = false,
    val status: String = "ok",
    val errors: List<ProviderErrorInfo> = emptyList()
)

@Serializable
data class CreatorDetail(
    val creator: Creator,
    val works: List<Work> = emptyList(),
    val cache: String = "miss"
)

@Serializable
data class BuddyContext(
    val theme: String = "",
    val medium: String = "all",
    @SerialName("max_minutes")
    val maxMinutes: Int? = null,
    @SerialName("work_ids")
    val workIds: List<String> = emptyList()
)

@Serializable
data class BuddyTurn(
    val role: String,
    val content: String
)

@Serializable
data class BuddyInput(
    val mode: String,
    val prompt: String,
    val refinement: String = "",
    val medium: String = "all",
    @SerialName("exclude_ids")
    val excludeIds: List<String> = emptyList(),
    @SerialName("max_minutes")
    val maxMinutes: Int? = null,
    val context: BuddyContext? = null,
    val history: List<BuddyTurn>? = null
)

@Serializable
data class BuddyPick(
    val work: Work,
    val reason: String = "",
    val evidence: String = "",
    val score: Double = 0.0
)

@Serializable
data class BuddyDiscovery(
    val scope: String = "cached_catalog",
    val providers: List<String> = emptyList(),
    @SerialName("candidate_count")
    val candidateCount: Int = 0,
    val errors: List<ProviderErrorInfo> = emptyList()
)

@Serializable
data class BuddyResult(
    val reply: String = "",
    val items: List<BuddyPick> = emptyList(),
    val route: String = "",
    val model: String? = null,
    val degraded: Boolean = false,
    @SerialName("free_only")
    val freeOnly: Boolean = true,
    val medium: String? = null,
    val context: BuddyContext? = null,
    @SerialName("catalog_size")
    val catalogSize: Int? = null,
    val discovery: BuddyDiscovery? = null
)
