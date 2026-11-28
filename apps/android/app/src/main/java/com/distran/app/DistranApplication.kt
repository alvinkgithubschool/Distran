package com.distran.app

import android.app.Application
import com.distran.app.data.CatalogRepository
import com.distran.app.data.CreatorDirectory
import com.distran.app.data.DistranApiClient
import com.distran.app.data.DistranStore
import com.distran.app.data.RecommendationEngine
import com.distran.app.data.SharedPreferencesStorage

class DistranApplication : Application() {
    lateinit var catalogRepo: CatalogRepository
        private set
    lateinit var store: DistranStore
        private set
    lateinit var storage: SharedPreferencesStorage
        private set
    lateinit var recommendationEngine: RecommendationEngine
        private set
    lateinit var creatorDirectory: CreatorDirectory
        private set
    lateinit var apiClient: DistranApiClient
        private set

    override fun onCreate() {
        super.onCreate()
        catalogRepo = CatalogRepository.fromAndroidAssets(this)
        store = DistranStore(catalogRepo, BuildConfig.DEMO_MODE)
        storage = SharedPreferencesStorage(this)
        recommendationEngine = RecommendationEngine(catalogRepo)
        creatorDirectory = CreatorDirectory(catalogRepo)
        val savedApiUrl = SharedPreferencesStorage.getApiUrl(this, BuildConfig.CATALOG_API_URL)
        apiClient = DistranApiClient(catalogRepo, savedApiUrl)
    }
}
