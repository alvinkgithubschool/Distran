package com.distran.app

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.distran.app.data.Account
import com.distran.app.data.BuddyInput
import com.distran.app.data.BuddyResult
import com.distran.app.data.CatalogRepository
import com.distran.app.data.ClaimInput
import com.distran.app.data.Creator
import com.distran.app.data.CreatorDetail
import com.distran.app.data.CreatorDirectory
import com.distran.app.data.CreatorResult
import com.distran.app.data.Database
import com.distran.app.data.DistranApiClient
import com.distran.app.data.DistranStore
import com.distran.app.data.Log
import com.distran.app.data.Medium
import com.distran.app.data.Recommendation
import com.distran.app.data.RecommendationEngine
import com.distran.app.data.Role
import com.distran.app.data.SearchResult
import com.distran.app.data.SharedPreferencesStorage
import com.distran.app.data.Shelf
import com.distran.app.data.Work
import com.distran.app.data.WorkDetail
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class LogTarget(val workId: String, val logId: String? = null)

data class AppUiState(
    val db: Database,
    val catalogRevision: Int = 0,
    val toast: String = "",
    val logTarget: LogTarget? = null,
    val apiBaseUrl: String = ""
) {
    val account: Account?
        get() = db.accounts.firstOrNull { it.id == db.activeId }
}

class DistranViewModel(application: Application) : AndroidViewModel(application) {
    private val app = application as DistranApplication
    val catalogRepo: CatalogRepository = app.catalogRepo
    val store: DistranStore = app.store
    val recommendations: RecommendationEngine = app.recommendationEngine
    val creators: CreatorDirectory = app.creatorDirectory
    val api: DistranApiClient = app.apiClient

    private val _uiState = MutableStateFlow(
        AppUiState(
            db = store.loadDatabase(app.storage),
            apiBaseUrl = api.baseUrl
        )
    )
    val uiState: StateFlow<AppUiState> = _uiState.asStateFlow()

    init {
        refreshBuiltins()
    }

    fun refreshBuiltins() {
        viewModelScope.launch {
            runCatching { api.fetchBuiltinCatalog() }
                .onSuccess {
                    _uiState.update { it.copy(catalogRevision = it.catalogRevision + 1) }
                }
        }
    }

    fun commit(next: Database) {
        try {
            store.saveDatabase(next, app.storage)
        } catch (_: Exception) {
            throw IllegalStateException(
                "Could not save on this device. Check that storage is available and try again."
            )
        }
        _uiState.update { it.copy(db = next) }
    }

    fun updateAccount(account: Account) {
        commit(store.replaceAccount(_uiState.value.db, account))
    }

    fun notify(message: String) {
        _uiState.update { it.copy(toast = message) }
    }

    fun clearToast() {
        _uiState.update { it.copy(toast = "") }
    }

    fun openLog(workId: String, logId: String? = null) {
        _uiState.update { it.copy(logTarget = LogTarget(workId, logId)) }
    }

    fun closeLog() {
        _uiState.update { it.copy(logTarget = null) }
    }

    suspend fun signIn(email: String, password: String): Account {
        val currentDb = _uiState.value.db
        val next = withContext(Dispatchers.Default) {
            store.authenticate(currentDb, email, password)
        }
        commit(next)
        return next.accounts.first { it.id == next.activeId }
    }

    suspend fun signUp(email: String, password: String, name: String, role: Role): Account {
        val currentDb = _uiState.value.db
        val next = withContext(Dispatchers.Default) {
            store.createAccount(currentDb, email, password, name, role)
        }
        commit(next)
        return next.accounts.first { it.id == next.activeId }
    }

    fun signOut() {
        val currentDb = _uiState.value.db
        commit(currentDb.copy(activeId = null))
    }

    fun deleteActiveAccount() {
        val currentDb = _uiState.value.db
        val active = _uiState.value.account ?: return
        commit(
            currentDb.copy(
                activeId = null,
                accounts = currentDb.accounts.filter { it.id != active.id }
            )
        )
    }

    fun updateApiBaseUrl(url: String) {
        val cleaned = url.trim().trimEnd('/')
        SharedPreferencesStorage.setApiUrl(app, cleaned)
        api.updateBaseUrl(cleaned)
        _uiState.update { it.copy(apiBaseUrl = cleaned) }
        if (cleaned.isNotEmpty()) {
            refreshBuiltins()
        }
    }

    fun recommendForActive(medium: Medium? = null, limit: Int = 4): List<Recommendation> {
        val account = _uiState.value.account ?: return emptyList()
        return recommendations.recommend(account, medium, limit)
    }

    fun toggleFollowCreator(followKey: String, displayName: String) {
        val account = _uiState.value.account ?: return
        val follows = account.followed.contains(followKey)
        val nextFollowed = if (follows) {
            account.followed.filter { it != followKey }
        } else {
            account.followed + followKey
        }
        val nextNames = account.followedCreatorNames.orEmpty().toMutableMap().apply {
            this[followKey] = displayName
        }
        updateAccount(account.copy(followed = nextFollowed, followedCreatorNames = nextNames))
        notify(if (follows) "Removed from your orbit." else "Added to your orbit.")
    }

    fun toggleWantTo(workId: String) {
        val account = _uiState.value.account ?: return
        val canonical = catalogRepo.canonicalWorkId(workId)
        val planned = account.logs.firstOrNull {
            it.workId == canonical && it.status == com.distran.app.data.LogStatus.PLANNED
        }
        val nextAccount = if (planned != null) {
            account.copy(logs = account.logs.filter { it.id != planned.id })
        } else {
            store.addLog(
                account,
                Log(
                    id = DistranStore.uniqueId(),
                    workId = canonical,
                    rating = 0.0,
                    note = "",
                    status = com.distran.app.data.LogStatus.PLANNED,
                    visibility = com.distran.app.data.Visibility.PRIVATE,
                    date = java.time.Instant.now().toString()
                )
            )
        }
        updateAccount(nextAccount)
        notify(if (planned != null) "Removed from Up next." else "Saved for your next chapter.")
    }

    fun toggleFavoriteWork(workId: String) {
        val account = _uiState.value.account ?: return
        val canonical = catalogRepo.canonicalWorkId(workId)
        val wasFavorite = account.favorites.contains(canonical)
        val updated = store.toggleFavorite(account, canonical)
        updateAccount(updated)
        notify(if (wasFavorite) "Removed from your Top 4." else "One of your cornerstones.")
    }

    fun saveLog(log: Log, isEdit: Boolean) {
        val account = _uiState.value.account ?: return
        val canonical = log.copy(workId = catalogRepo.canonicalWorkId(log.workId))
        store.validateLog(canonical)
        val next = if (isEdit) {
            account.copy(logs = account.logs.map { if (it.id == canonical.id) canonical else it })
        } else {
            store.addLog(account, canonical)
        }
        updateAccount(next)
        notify(if (isEdit) "Your log has been updated." else "Added to your cultural memory.")
        closeLog()
    }

    fun deleteLog(logId: String) {
        val account = _uiState.value.account ?: return
        updateAccount(account.copy(logs = account.logs.filter { it.id != logId }))
        notify("Log removed.")
        closeLog()
    }

    fun saveShelf(shelf: Shelf, isEdit: Boolean) {
        val account = _uiState.value.account ?: return
        store.validateShelf(shelf)
        val nextLists = if (isEdit) {
            account.lists.map { if (it.id == shelf.id) shelf else it }
        } else {
            listOf(shelf) + account.lists
        }
        updateAccount(account.copy(lists = nextLists))
        notify(if (isEdit) "List updated." else "A new shelf, all yours.")
    }

    fun saveBuddyShelf(shelf: Shelf) {
        val account = _uiState.value.account ?: return
        store.validateShelf(shelf)
        updateAccount(account.copy(lists = account.lists + shelf))
        notify("Buddy list saved on this device.")
    }

    fun deleteShelf(shelfId: String) {
        val account = _uiState.value.account ?: return
        updateAccount(account.copy(lists = account.lists.filter { it.id != shelfId }))
        notify("List removed.")
    }

    fun toggleWorkInShelf(shelfId: String, workId: String) {
        val account = _uiState.value.account ?: return
        val canonical = catalogRepo.canonicalWorkId(workId)
        val target = account.lists.firstOrNull { it.id == shelfId } ?: return
        val has = target.workIds.contains(canonical)
        val nextLists = account.lists.map { list ->
            if (list.id == shelfId) {
                list.copy(
                    workIds = if (has) {
                        list.workIds.filter { it != canonical }
                    } else {
                        list.workIds + canonical
                    }
                )
            } else list
        }
        updateAccount(account.copy(lists = nextLists))
        notify(if (has) "Removed from the list." else "Added to the list.")
    }

    fun submitClaim(input: ClaimInput) {
        val account = _uiState.value.account ?: return
        updateAccount(store.requestClaim(account, input))
        notify("Claim request saved. Pending verification.")
    }

    fun withdrawClaim(claimId: String) {
        val account = _uiState.value.account ?: return
        updateAccount(account.copy(claims = account.claims?.filter { it.id != claimId }))
        notify("Claim request withdrawn.")
    }

    fun saveMessageDraft(thread: String, text: String) {
        val account = _uiState.value.account ?: return
        val clean = text.trim()
        if (clean.isEmpty()) return
        val msg = com.distran.app.data.Message(
            id = DistranStore.uniqueId(),
            thread = thread,
            text = clean,
            date = java.time.Instant.now().toString()
        )
        updateAccount(account.copy(messages = account.messages + msg))
    }

    suspend fun searchLiveCatalog(query: String, medium: Medium?, page: Int): SearchResult =
        api.searchLiveCatalog(query, medium, page)

    suspend fun fetchLiveWork(id: String): WorkDetail {
        val detail = api.fetchWork(id)
        _uiState.update { it.copy(catalogRevision = it.catalogRevision + 1) }
        return detail
    }

    suspend fun searchLiveCreators(query: String, page: Int): CreatorResult =
        api.searchCreators(query, page)

    suspend fun fetchLiveCreator(id: String): CreatorDetail {
        val detail = api.fetchCreator(id)
        _uiState.update { it.copy(catalogRevision = it.catalogRevision + 1) }
        return detail
    }

    suspend fun askBuddy(input: BuddyInput): BuddyResult {
        val result = api.askBuddy(input)
        _uiState.update { it.copy(catalogRevision = it.catalogRevision + 1) }
        return result
    }

    fun getWork(id: String): Work? = catalogRepo.getWork(id)
    fun knownWorks(): List<Work> = catalogRepo.knownWorks()
    fun publicCreators(): List<Account> = creators.publicCreators(_uiState.value.db)
    fun localCreators(): List<Creator> = creators.localDirectory()
}
