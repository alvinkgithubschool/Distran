package com.distran.app.data

class CreatorDirectory(private val catalogRepo: CatalogRepository) {

    fun isProviderCreator(id: String): Boolean = PROVIDER_CREATOR_REGEX.matches(id)

    fun publicCreators(db: Database): List<Account> {
        return db.accounts.filter {
            it.role == Role.CREATOR && (!it.settings.privateProfile || it.id == db.activeId)
        }
    }

    fun creditedWorks(identity: String): List<Work> {
        val normalized = identity.trim().lowercase()
        val isProvider = isProviderCreator(identity)
        return catalogRepo.knownWorks().filter { work ->
            if (isProvider) {
                work.creators?.any { it.id == identity } == true ||
                    work.credits?.any { it.id == identity } == true
            } else {
                work.maker.split(',').any { it.trim().lowercase() == normalized } ||
                    work.credits?.any { it.name.lowercase() == normalized } == true
            }
        }
    }

    fun localDirectory(): List<Creator> {
        val creators = LinkedHashMap<String, Creator>()
        for (work in catalogRepo.knownWorks()) {
            val workCreators = work.creators
            if (!workCreators.isNullOrEmpty()) {
                for (creator in workCreators) {
                    val kind = creator.role?.takeIf { it.isNotBlank() }
                        ?: work.creatorRole?.takeIf { it.isNotBlank() }
                        ?: if (work.medium == Medium.GAME) "Studio" else "Director"
                    creators[creator.id] = Creator(
                        id = creator.id,
                        name = creator.name,
                        kind = kind,
                        role = creator.role
                    )
                }
            } else {
                for (raw in work.maker.split(',')) {
                    val value = raw.trim()
                    if (value.isNotEmpty() && value != "See title details") {
                        creators[value] = Creator(
                            id = value,
                            name = value,
                            kind = "Catalog creator"
                        )
                    }
                }
            }
        }
        return creators.values.sortedBy { it.name }
    }

    fun catalogCreator(identity: String): Creator? {
        val entries = LinkedHashMap<String, Creator>()
        for (work in catalogRepo.knownWorks()) {
            val combined = buildList {
                work.creators?.forEach { add(Triple(it.id, it.name, it.role)) }
                work.credits?.forEach { credit ->
                    credit.id?.let { add(Triple(it, credit.name, credit.role)) }
                }
            }
            for ((id, name, role) in combined) {
                if (id != identity && !name.equals(identity, ignoreCase = true)) continue
                if (entries.containsKey(id)) continue
                val provider = if (id.startsWith("tmdb:")) "tmdb" else "igdb"
                val number = id.split(':').getOrNull(2)
                entries[id] = Creator(
                    id = id,
                    name = name,
                    kind = role?.takeIf { it.isNotBlank() } ?: "Creator",
                    provider = provider,
                    sourceUrl = if (provider == "tmdb" && number != null) {
                        "https://www.themoviedb.org/person/$number"
                    } else null
                )
            }
        }
        return entries[identity] ?: if (entries.size == 1) entries.values.first() else null
    }

    companion object {
        private val PROVIDER_CREATOR_REGEX = Regex("^(tmdb:person|igdb:company):[1-9]\\d{0,9}$")
    }
}
