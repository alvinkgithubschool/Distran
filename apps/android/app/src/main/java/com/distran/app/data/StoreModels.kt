package com.distran.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class Role(val id: String) {
    @SerialName("user")
    USER("user"),

    @SerialName("creator")
    CREATOR("creator")
}

@Serializable
enum class LogStatus(val id: String, val label: String) {
    @SerialName("completed")
    COMPLETED("completed", "Finished"),

    @SerialName("active")
    ACTIVE("active", "In progress"),

    @SerialName("planned")
    PLANNED("planned", "Want to"),

    @SerialName("dropped")
    DROPPED("dropped", "Stopped")
}

@Serializable
enum class Visibility(val id: String, val label: String, val badge: String) {
    @SerialName("private")
    PRIVATE("private", "Only me", "ONLY YOU"),

    @SerialName("friends")
    FRIENDS("friends", "Friends", "FRIENDS"),

    @SerialName("public")
    PUBLIC("public", "Everyone", "PUBLIC")
}

@Serializable
data class Log(
    val id: String,
    val workId: String,
    val rating: Double,
    val note: String,
    val status: LogStatus,
    val visibility: Visibility,
    val date: String
)

@Serializable
data class Shelf(
    val source: String? = null,
    val id: String,
    val title: String,
    val description: String,
    val visibility: Visibility,
    val workIds: List<String>
)

@Serializable
data class Message(
    val id: String,
    val thread: String,
    val text: String,
    val date: String
)

@Serializable
data class Claim(
    val id: String,
    val workId: String,
    val credit: String,
    val evidence: String,
    val note: String,
    val status: String = "pending",
    val date: String
)

data class ClaimInput(
    val workId: String,
    val credit: String,
    val evidence: String,
    val note: String
)

@Serializable
data class AccountSettings(
    val privateProfile: Boolean = false,
    val notifications: Boolean = true
)

@Serializable
data class Account(
    val id: String,
    val email: String,
    val name: String,
    val handle: String,
    val bio: String,
    val role: Role,
    val website: String? = null,
    val avatar: String? = null,
    val banner: String? = null,
    val accent: String? = null,
    val headline: String? = null,
    val featuredWorks: List<String>? = null,
    val claims: List<Claim>? = null,
    val complete: Boolean = false,
    val interests: List<Medium> = listOf(Medium.GAME, Medium.MOVIE, Medium.TV),
    val favorites: List<String> = emptyList(),
    val logs: List<Log> = emptyList(),
    val lists: List<Shelf> = emptyList(),
    val messages: List<Message> = emptyList(),
    val followed: List<String> = emptyList(),
    val followedCreatorNames: Map<String, String>? = null,
    val settings: AccountSettings = AccountSettings(),
    val passwordHash: String? = null,
    val salt: String? = null
)

@Serializable
data class Database(
    val works: Map<String, Work>? = null,
    val version: Int = 1,
    val activeId: String? = null,
    val accounts: List<Account> = emptyList()
)

interface StorageAdapter {
    fun getItem(key: String): String?
    fun setItem(key: String, value: String)
}
