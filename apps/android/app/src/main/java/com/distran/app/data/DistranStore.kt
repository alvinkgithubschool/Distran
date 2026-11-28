package com.distran.app.data

import com.distran.app.BuildConfig
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.net.URI
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

class DistranStore(
    private val catalogRepo: CatalogRepository,
    val demoEnabled: Boolean = BuildConfig.DEMO_MODE
) {
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        explicitNulls = false
    }

    private fun seedLists(): List<Shelf> = listOf(
        Shelf(
            id = "night-city",
            title = "Night City Cycle",
            description = "Different lives. The same neon heartbeat.",
            visibility = Visibility.PRIVATE,
            workIds = listOf("cyberpunk", "edgerunners", "blade-runner", "disco-elysium")
        ),
        Shelf(
            id = "beyond-the-signal",
            title = "Somewhere beyond the signal",
            description = "For when you want to feel very small, in the best way.",
            visibility = Visibility.PRIVATE,
            workIds = listOf("outer-wilds", "arrival", "dune")
        ),
        Shelf(
            id = "co-op",
            title = "Better with a second player",
            description = "A little chaos. A lot of company.",
            visibility = Visibility.FRIENDS,
            workIds = listOf("it-takes-two", "baldurs-gate")
        )
    )

    private fun makeAccount(email: String, name: String, role: Role): Account {
        return Account(
            id = email,
            email = email,
            name = name,
            handle = if (role == Role.CREATOR) "nightroom" else "alex",
            bio = if (role == Role.CREATOR) {
                "Independent stories. Unexpected worlds."
            } else {
                "Cyberpunk lifer, corridor-horror apologist, and keeper of too many lists."
            },
            role = role,
            complete = false,
            interests = listOf(Medium.GAME, Medium.MOVIE, Medium.TV),
            favorites = listOf(
                "cyberpunk",
                "elden-ring",
                "it-takes-two",
                "outer-wilds",
                "blade-runner",
                "dune",
                "arrival"
            ),
            logs = emptyList(),
            lists = seedLists(),
            messages = emptyList(),
            followed = listOf("CD PROJEKT RED", "Studio Trigger", "Denis Villeneuve"),
            settings = AccountSettings(privateProfile = false, notifications = true)
        )
    }

    fun freshDatabase(): Database {
        return Database(
            version = 1,
            activeId = null,
            accounts = listOf(
                normalizeAccountWorks(makeAccount("user@distran.test", "Alex", Role.USER)),
                normalizeAccountWorks(makeAccount("creator@distran.test", "Night Room Studio", Role.CREATOR))
            )
        )
    }

    fun normalizeAccountWorks(account: Account): Account {
        fun canonicalUnique(values: List<String>): List<String> =
            values.map { catalogRepo.canonicalWorkId(it) }.distinct()

        return account.copy(
            favorites = canonicalUnique(account.favorites),
            logs = account.logs.map { it.copy(workId = catalogRepo.canonicalWorkId(it.workId)) },
            lists = account.lists.map { it.copy(workIds = canonicalUnique(it.workIds)) },
            claims = account.claims?.map { it.copy(workId = catalogRepo.canonicalWorkId(it.workId)) },
            featuredWorks = account.featuredWorks?.let { canonicalUnique(it) }
        )
    }

    fun loadDatabase(storage: StorageAdapter): Database {
        return try {
            val raw = storage.getItem(STORE_KEY) ?: return freshDatabase()
            val data = json.decodeFromString<Database>(raw)
            if (data.version != 1 || data.accounts.any { it.id.isBlank() }) {
                return freshDatabase()
            }
            data.works?.values?.let {
                catalogRepo.registerWorks(it.toList(), CatalogRepository.WorkSource.SAVED)
            }
            val normalizedAccounts = data.accounts.map { normalizeAccountWorks(it) }
            val activeValid = normalizedAccounts.any { it.id == data.activeId }
            data.copy(
                activeId = if (activeValid) data.activeId else null,
                accounts = normalizedAccounts
            )
        } catch (_: Exception) {
            freshDatabase()
        }
    }

    fun saveDatabase(db: Database, storage: StorageAdapter) {
        val ids = buildSet {
            for (account in db.accounts) {
                account.logs.forEach { add(it.workId) }
                account.favorites.forEach { add(it) }
                account.claims?.forEach { add(it.workId) }
                account.featuredWorks?.forEach { add(it) }
                account.lists.forEach { shelf -> shelf.workIds.forEach { add(it) } }
            }
        }
        val works = buildMap {
            for (id in ids) {
                val work = catalogRepo.getWork(id)
                if (work?.provider != null) {
                    put(id, work)
                }
            }
        }
        storage.setItem(STORE_KEY, json.encodeToString(db.copy(works = works)))
    }

    fun replaceAccount(db: Database, account: Account): Database {
        val trimmedName = account.name.trim()
        require(trimmedName.isNotEmpty() && account.name.length <= 60) {
            "Use a name between 1 and 60 characters."
        }
        require(HANDLE_REGEX.matches(account.handle)) {
            "Use 3–24 lowercase letters, numbers or underscores for your username."
        }
        val taken = db.accounts.any {
            it.id != account.id && it.handle.equals(account.handle, ignoreCase = true)
        }
        require(!taken) { "That username is already taken." }

        val normalized = normalizeAccountWorks(account)
        return db.copy(
            accounts = db.accounts.map { if (it.id == account.id) normalized else it }
        )
    }

    fun validateLog(log: Log) {
        require(catalogRepo.getWork(log.workId) != null) {
            "Choose a title from the catalog."
        }
        val validRating = log.rating.isFinite() &&
            log.rating >= 0.0 &&
            log.rating <= 5.0 &&
            ((log.rating * 2.0) % 1.0 == 0.0)
        require(validRating) { "Choose a rating in half-star steps." }
        require(isValidDate(log.date)) { "Choose a valid date." }
        require(log.note.length <= 4000) { "Keep notes under 4,000 characters." }
    }

    private fun isValidDate(value: String): Boolean {
        if (value.isBlank()) return false
        return runCatching { LocalDate.parse(value.take(10)) }.isSuccess ||
            runCatching { Instant.parse(value) }.isSuccess
    }

    fun addLog(account: Account, log: Log): Account {
        val canonical = log.copy(workId = catalogRepo.canonicalWorkId(log.workId))
        validateLog(canonical)
        return account.copy(logs = listOf(canonical) + account.logs)
    }

    fun toggleFavorite(account: Account, workId: String): Account {
        val canonical = catalogRepo.canonicalWorkId(workId)
        val normalized = normalizeAccountWorks(account)
        val work = catalogRepo.getWork(canonical) ?: return normalized
        if (normalized.favorites.contains(canonical)) {
            return normalized.copy(favorites = normalized.favorites.filter { it != canonical })
        }
        val countInMedium = normalized.favorites.count {
            catalogRepo.getWork(it)?.medium == work.medium
        }
        require(countInMedium < 4) {
            "Your Top 4 is full for this format. Remove one first."
        }
        return normalized.copy(favorites = normalized.favorites + canonical)
    }

    fun validateShelf(shelf: Shelf) {
        require(shelf.title.trim().isNotEmpty()) { "Give your list a name." }
        require(shelf.title.length <= 100) { "Keep the list name under 100 characters." }
        require(shelf.description.length <= 1000) { "Keep the description under 1,000 characters." }
        val invalidWork = shelf.workIds.any { catalogRepo.getWork(it) == null }
        val uniqueCanonical = shelf.workIds.map { catalogRepo.canonicalWorkId(it) }.toSet()
        require(!invalidWork && uniqueCanonical.size == shelf.workIds.size) {
            "A list must contain unique catalog titles."
        }
    }

    fun passwordHash(password: String, salt: String): String {
        val spec = PBEKeySpec(
            password.toCharArray(),
            salt.toByteArray(Charsets.UTF_8),
            PBKDF2_ITERATIONS,
            PBKDF2_KEY_BITS
        )
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val bytes = factory.generateSecret(spec).encoded
        return bytes.joinToString("") { "%02x".format(it) }
    }

    fun authenticate(
        db: Database,
        email: String,
        password: String,
        allowDemo: Boolean = demoEnabled
    ): Database {
        require(allowDemo) { "Hosted sign-in is not configured in this build." }
        val normalizedEmail = email.trim().lowercase()
        val account = db.accounts.firstOrNull { it.email == normalizedEmail }
            ?: throw IllegalArgumentException("Email or password is incorrect.")
        val valid = if (!account.passwordHash.isNullOrEmpty() && !account.salt.isNullOrEmpty()) {
            passwordHash(password, account.salt) == account.passwordHash
        } else {
            password == DEMO_PASSWORD
        }
        require(valid) { "Email or password is incorrect." }
        return db.copy(activeId = account.id)
    }

    fun createAccount(
        db: Database,
        email: String,
        password: String,
        name: String,
        role: Role,
        allowDemo: Boolean = demoEnabled
    ): Database {
        require(allowDemo) { "Hosted account creation is not configured in this build." }
        val cleanEmail = email.trim().lowercase()
        require(EMAIL_REGEX.matches(cleanEmail)) { "Enter a valid email address." }
        require(name.trim().isNotEmpty()) { "Tell us your name." }
        require(password.length >= 8) { "Use at least 8 characters for your password." }
        require(db.accounts.none { it.email == cleanEmail }) {
            "That email already has a local account. Try signing in."
        }

        val salt = uniqueId()
        val base = normalizeAccountWorks(makeAccount(cleanEmail, name.trim(), role))
        var handle = name.lowercase().replace(Regex("[^a-z0-9]"), "").take(20)
        if (handle.isEmpty()) handle = "explorer"
        if (handle.length < 3) handle += "_room"
        val baseHandle = handle
        var suffix = 1
        while (db.accounts.any { it.handle == handle }) {
            handle = "$baseHandle${suffix++}"
        }

        val created = base.copy(
            id = uniqueId(),
            handle = handle,
            passwordHash = passwordHash(password, salt),
            salt = salt,
            lists = emptyList(),
            favorites = emptyList()
        )
        return db.copy(
            activeId = created.id,
            accounts = db.accounts + created
        )
    }

    fun requestClaim(account: Account, input: ClaimInput): Account {
        val canonicalId = catalogRepo.canonicalWorkId(input.workId)
        require(account.role == Role.CREATOR) { "Use a creator account to request a claim." }
        require(catalogRepo.getWork(canonicalId) != null) { "Choose a title from the catalog." }
        val existingClaims = account.claims.orEmpty()
        require(existingClaims.none { it.workId == canonicalId }) {
            "You already have a request for this title."
        }
        require(input.credit.trim().isNotEmpty() && input.credit.length <= 100) {
            "Tell us your credited role (up to 100 characters)."
        }
        val uri = runCatching { URI(input.evidence) }.getOrNull()
        val scheme = uri?.scheme?.lowercase()
        require(uri != null && (scheme == "http" || scheme == "https") && !uri.host.isNullOrBlank() && input.evidence.length <= 1000) {
            "Add a public credit or official website URL."
        }
        require(input.note.length <= 2000) {
            "Keep your note under 2,000 characters."
        }
        val newClaim = Claim(
            id = uniqueId(),
            workId = canonicalId,
            credit = input.credit.trim(),
            evidence = input.evidence,
            note = input.note,
            status = "pending",
            date = Instant.now().toString()
        )
        return account.copy(claims = existingClaims + newClaim)
    }

    fun exportAccountJson(account: Account): String {
        val pretty = Json {
            prettyPrint = true
            encodeDefaults = true
            explicitNulls = false
        }
        return pretty.encodeToString(
            kotlinx.serialization.json.JsonObject(
                buildMap {
                    put("name", kotlinx.serialization.json.JsonPrimitive(account.name))
                    put("handle", kotlinx.serialization.json.JsonPrimitive(account.handle))
                    put("bio", kotlinx.serialization.json.JsonPrimitive(account.bio))
                    put("role", kotlinx.serialization.json.JsonPrimitive(account.role.id))
                    account.website?.let { put("website", kotlinx.serialization.json.JsonPrimitive(it)) }
                    account.avatar?.let { put("avatar", kotlinx.serialization.json.JsonPrimitive(it)) }
                    account.banner?.let { put("banner", kotlinx.serialization.json.JsonPrimitive(it)) }
                    account.accent?.let { put("accent", kotlinx.serialization.json.JsonPrimitive(it)) }
                    account.headline?.let { put("headline", kotlinx.serialization.json.JsonPrimitive(it)) }
                    account.claims?.let { put("claims", pretty.encodeToJsonElement(kotlinx.serialization.builtins.ListSerializer(Claim.serializer()), it)) }
                    account.featuredWorks?.let { put("featuredWorks", pretty.encodeToJsonElement(kotlinx.serialization.builtins.ListSerializer(kotlinx.serialization.serializer<String>()), it)) }
                    put("favorites", pretty.encodeToJsonElement(kotlinx.serialization.builtins.ListSerializer(kotlinx.serialization.serializer<String>()), account.favorites))
                    put("logs", pretty.encodeToJsonElement(kotlinx.serialization.builtins.ListSerializer(Log.serializer()), account.logs))
                    put("lists", pretty.encodeToJsonElement(kotlinx.serialization.builtins.ListSerializer(Shelf.serializer()), account.lists))
                    put("messages", pretty.encodeToJsonElement(kotlinx.serialization.builtins.ListSerializer(Message.serializer()), account.messages))
                    put("followed", pretty.encodeToJsonElement(kotlinx.serialization.builtins.ListSerializer(kotlinx.serialization.serializer<String>()), account.followed))
                    account.followedCreatorNames?.let {
                        put("followedCreatorNames", pretty.encodeToJsonElement(kotlinx.serialization.builtins.MapSerializer(kotlinx.serialization.serializer<String>(), kotlinx.serialization.serializer<String>()), it))
                    }
                    put("settings", pretty.encodeToJsonElement(AccountSettings.serializer(), account.settings))
                    put("exportedAt", kotlinx.serialization.json.JsonPrimitive(Instant.now().toString()))
                }
            )
        )
    }

    companion object {
        const val STORE_KEY = "distran.android.preview.v1"
        const val DEMO_PASSWORD = "DistranDemo2026!"
        private const val PBKDF2_ITERATIONS = 100_000
        private const val PBKDF2_KEY_BITS = 256
        private val HANDLE_REGEX = Regex("^[a-z0-9_]{3,24}$")
        private val EMAIL_REGEX = Regex("^\\S+@\\S+\\.\\S+$")

        fun uniqueId(): String = UUID.randomUUID().toString()
    }
}
