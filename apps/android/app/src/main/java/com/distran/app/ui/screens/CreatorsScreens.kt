package com.distran.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.distran.app.DistranViewModel
import com.distran.app.data.Creator
import com.distran.app.data.CreatorDetail
import com.distran.app.data.CreatorResult
import com.distran.app.data.ImageUtils
import com.distran.app.ui.components.AvatarView
import com.distran.app.ui.components.CreatorBadge
import com.distran.app.ui.components.CreatorPageMark
import com.distran.app.ui.components.DistranModalDialog
import com.distran.app.ui.components.DistranPrimaryButton
import com.distran.app.ui.components.DistranSecondaryButton
import com.distran.app.ui.components.DistranTextField
import com.distran.app.ui.components.EmptyState
import com.distran.app.ui.components.Eyebrow
import com.distran.app.ui.components.PageHeader
import com.distran.app.ui.components.SectionHeading
import com.distran.app.ui.components.StatusBanner
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily
import kotlinx.coroutines.delay
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
fun CreatorsScreen(
    viewModel: DistranViewModel,
    initialQuery: String,
    onOpenDiscover: () -> Unit,
    onOpenCreator: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var query by remember(initialQuery) { mutableStateOf(initialQuery) }
    var scope by remember { mutableStateOf("all") }
    var page by remember { mutableIntStateOf(1) }
    var attempt by remember { mutableIntStateOf(0) }
    var result by remember { mutableStateOf<CreatorResult?>(null) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }

    LaunchedEffect(query, scope, page, attempt, state.apiBaseUrl) {
        result = null
        error = ""
        loading = false
        if (scope == "distran" || query.trim().length < 2 || state.apiBaseUrl.isBlank()) {
            return@LaunchedEffect
        }
        loading = true
        delay(350L)
        try {
            result = viewModel.searchLiveCreators(query.trim(), page)
        } catch (_: Exception) {
            error = "Live creator search is unavailable. Showing matching creators from this device."
        } finally {
            loading = false
        }
    }

    val term = query.trim().lowercase()
    val accounts = remember(state.db, term) {
        viewModel.publicCreators().filter { creator ->
            "${creator.name} ${creator.handle} ${creator.headline.orEmpty()}".lowercase().contains(term)
        }
    }
    val local = remember(state.catalogRevision, term) {
        viewModel.localCreators().filter { it.name.lowercase().contains(term) }
    }
    val directory = remember(result, local) {
        val providerNames = result?.items?.map { it.name.lowercase() }?.toSet() ?: emptySet()
        (result?.items ?: emptyList()) + local.filter { !providerNames.contains(it.name.lowercase()) }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 18.dp)
    ) {
        PageHeader(
            eyebrow = "THE PEOPLE BEHIND YOUR WORLDS",
            title = "Find your people.",
            actions = {
                DistranSecondaryButton(
                    text = "Explore works",
                    trailingIcon = Icons.Outlined.NorthEast,
                    onClick = onOpenDiscover
                )
            }
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Follow a filmmaker. Find a studio. See where their worlds connect.",
            fontFamily = AbelFontFamily,
            fontSize = 15.sp,
            color = DistranColors.Muted
        )

        Spacer(Modifier.height(14.dp))
        OutlinedTextField(
            value = query,
            onValueChange = {
                if (it.length <= 100) {
                    query = it
                    page = 1
                }
            },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null, tint = DistranColors.Muted) },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(onClick = { query = ""; page = 1 }) {
                        Icon(
                            Icons.Outlined.Close,
                            contentDescription = "Clear creator search",
                            tint = DistranColors.Muted
                        )
                    }
                }
            },
            placeholder = {
                Text("Search a creator, studio or username…", fontFamily = AbelFontFamily, color = DistranColors.Subtle)
            },
            textStyle = androidx.compose.ui.text.TextStyle(
                fontFamily = AbelFontFamily,
                fontSize = 16.sp,
                color = DistranColors.Ink
            ),
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = DistranColors.Green.copy(alpha = 0.6f),
                unfocusedBorderColor = DistranColors.LineStrong,
                focusedContainerColor = DistranColors.Panel,
                unfocusedContainerColor = DistranColors.Panel,
                cursorColor = DistranColors.Green
            )
        )

        Spacer(Modifier.height(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("all" to "All creators", "distran" to "On Distran").forEach { (value, label) ->
                val active = scope == value
                Surface(
                    modifier = Modifier.clickable {
                        scope = value
                        page = 1
                    },
                    shape = RoundedCornerShape(999.dp),
                    color = if (active) DistranColors.Green.copy(alpha = 0.14f) else Color(0x05FFFFFF),
                    border = BorderStroke(
                        1.dp,
                        if (active) DistranColors.Green.copy(alpha = 0.5f) else DistranColors.Line
                    )
                ) {
                    Text(
                        text = label,
                        fontFamily = DmMonoFontFamily,
                        fontSize = 10.sp,
                        color = if (active) DistranColors.Ink else DistranColors.Muted,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(20.dp))
        SectionHeading(eyebrow = "A LITTLE CLOSER", title = "Here on Distran")
        Spacer(Modifier.height(12.dp))
        if (accounts.isNotEmpty()) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                accounts.forEach { creator ->
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onOpenCreator(creator.id) },
                        shape = RoundedCornerShape(14.dp),
                        color = DistranColors.Panel,
                        border = BorderStroke(1.dp, DistranColors.Green.copy(alpha = 0.35f))
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            AvatarView(name = creator.name, image = creator.avatar, size = 54.dp)
                            Column(modifier = Modifier.weight(1f)) {
                                CreatorBadge()
                                Spacer(Modifier.height(5.dp))
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                                ) {
                                    Text(
                                        creator.name,
                                        fontFamily = AbelFontFamily,
                                        fontSize = 19.sp,
                                        color = DistranColors.Ink
                                    )
                                    CreatorPageMark()
                                }
                                Text(
                                    "@${creator.handle}",
                                    fontFamily = DmMonoFontFamily,
                                    fontSize = 9.sp,
                                    color = DistranColors.Muted
                                )
                                Spacer(Modifier.height(3.dp))
                                Text(
                                    text = creator.headline?.takeIf { it.isNotBlank() }
                                        ?: "Independent stories. Unexpected worlds.",
                                    fontFamily = AbelFontFamily,
                                    fontSize = 13.sp,
                                    color = DistranColors.InkSoft
                                )
                            }
                            Icon(
                                Icons.Outlined.NorthEast,
                                contentDescription = null,
                                tint = DistranColors.Muted,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        } else {
            Text(
                "No matching Distran profiles. Try another name or username.",
                fontFamily = AbelFontFamily,
                fontSize = 14.sp,
                color = DistranColors.Muted
            )
        }

        if (scope == "all") {
            Spacer(Modifier.height(26.dp))
            SectionHeading(
                eyebrow = if (result != null) "TMDB PEOPLE + IGDB COMPANIES" else "FROM YOUR CATALOG",
                title = "Makers, across mediums"
            )
            if (error.isNotEmpty()) {
                Spacer(Modifier.height(10.dp))
                StatusBanner(message = error, actionLabel = "Retry", onAction = { attempt++ })
            }
            if (result?.status == "partial") {
                Spacer(Modifier.height(10.dp))
                StatusBanner(message = "Some providers are unavailable. Showing available creators.")
            }
            Spacer(Modifier.height(12.dp))
            if (loading) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    CircularProgressIndicator(
                        color = DistranColors.Green,
                        modifier = Modifier.size(18.dp),
                        strokeWidth = 2.dp
                    )
                    Text(
                        "Finding the people behind the worlds…",
                        fontFamily = AbelFontFamily,
                        fontSize = 15.sp,
                        color = DistranColors.Muted
                    )
                }
            } else if (directory.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    directory.forEach { creator ->
                        DirectoryCreatorCard(creator = creator, onClick = { onOpenCreator(creator.id) })
                    }
                }
            } else {
                EmptyState(
                    heading = "Still looking for your people?",
                    body = "Try a different name or studio."
                )
            }

            result?.let { res ->
                Spacer(Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    DistranSecondaryButton(text = "Previous", enabled = page > 1 && !loading, onClick = { page-- })
                    Text("PAGE $page", fontFamily = DmMonoFontFamily, fontSize = 10.sp, color = DistranColors.Muted)
                    DistranSecondaryButton(
                        text = "Next page",
                        enabled = res.hasMore && page < 50 && !loading,
                        onClick = { page++ })
                }
            }

            Spacer(Modifier.height(16.dp))
            Text(
                text = "The orbit icon opens a creator page. On Distran identifies a local member profile; neither proves verified ownership.",
                fontFamily = DmMonoFontFamily,
                fontSize = 9.sp,
                lineHeight = 14.sp,
                color = DistranColors.Subtle
            )
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun DirectoryCreatorCard(creator: Creator, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        color = DistranColors.Panel,
        border = BorderStroke(1.dp, DistranColors.Line)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            AvatarView(name = creator.name, image = creator.image, size = 50.dp)
            Column(modifier = Modifier.weight(1f)) {
                Eyebrow(creator.kind)
                Spacer(Modifier.height(3.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Text(creator.name, fontFamily = AbelFontFamily, fontSize = 18.sp, color = DistranColors.Ink)
                    CreatorPageMark()
                }
                Text(
                    text = creator.provider?.uppercase() ?: "CATALOG DIRECTORY",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 8.sp,
                    color = DistranColors.Muted
                )
            }
            Icon(
                Icons.Outlined.NorthEast,
                contentDescription = null,
                tint = DistranColors.Muted,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
fun CreatorDetailScreen(
    creatorId: String,
    viewModel: DistranViewModel,
    onBackToCreators: () -> Unit,
    onOpenWork: (String) -> Unit,
    onOpenCreator: (String) -> Unit,
    onOpenDiscover: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    val publicCreators = remember(state.db) { viewModel.publicCreators() }
    val profile = remember(publicCreators, creatorId) { publicCreators.firstOrNull { it.id == creatorId } }
    val own = profile?.id == account.id
    val context = LocalContext.current

    var detail by remember(creatorId) { mutableStateOf<CreatorDetail?>(null) }
    var loading by remember(creatorId) { mutableStateOf(false) }
    var error by remember(creatorId) { mutableStateOf("") }
    var attempt by remember { mutableIntStateOf(0) }
    var editing by remember { mutableStateOf(false) }

    LaunchedEffect(creatorId, attempt, state.apiBaseUrl) {
        detail = null
        error = ""
        loading = false
        if (!viewModel.creators.isProviderCreator(creatorId) || state.apiBaseUrl.isBlank()) {
            return@LaunchedEffect
        }
        loading = true
        try {
            detail = viewModel.fetchLiveCreator(creatorId)
        } catch (_: Exception) {
            error = "This creator could not be loaded. Please try again."
        } finally {
            loading = false
        }
    }

    val creator = profile?.let {
        Creator(
            id = it.id,
            name = it.name,
            image = it.avatar,
            kind = "Creator",
            bio = it.bio
        )
    } ?: detail?.creator ?: viewModel.creators.catalogCreator(creatorId)

    if (loading && creator == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(
                "Opening this creator’s room…",
                fontFamily = AbelFontFamily,
                fontSize = 17.sp,
                color = DistranColors.Muted
            )
        }
        return
    }

    if (error.isNotEmpty() && creator == null) {
        Box(modifier = Modifier.fillMaxSize().padding(18.dp), contentAlignment = Alignment.Center) {
            EmptyState(
                heading = "A connection out of reach.",
                body = error,
                actionLabel = "Try again",
                onAction = { attempt++ }
            )
        }
        return
    }

    if (creator == null) {
        Box(modifier = Modifier.fillMaxSize().padding(18.dp), contentAlignment = Alignment.Center) {
            EmptyState(
                heading = "This creator page is unavailable.",
                body = "The profile may be private, or the creator has not joined this directory.",
                actionLabel = "Find creators",
                onAction = onBackToCreators
            )
        }
        return
    }

    val accent = remember(profile?.accent) { ImageUtils.parseHexColor(profile?.accent, DistranColors.Green) }
    val works = if (profile != null) emptyList() else (detail?.works ?: viewModel.creators.creditedWorks(creator.id))
    val featured = (profile?.featuredWorks ?: emptyList()).mapNotNull { viewModel.getWork(it) }
    val followKey = when {
        profile != null -> "profile:${profile.id}"
        !creator.provider.isNullOrBlank() -> creator.id
        else -> creator.name
    }
    val follows = account.followed.contains(followKey)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(170.dp)
                .background(
                    Brush.verticalGradient(
                        listOf(accent.copy(alpha = 0.25f), DistranColors.Bg)
                    )
                )
        ) {
            if (!profile?.banner.isNullOrBlank()) {
                BannerImageView(
                    banner = profile!!.banner!!,
                    contentDescription = "${creator.name}’s banner",
                    modifier = Modifier.fillMaxSize()
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Brush.verticalGradient(listOf(Color(0x55070708), Color(0xEE070708))))
                )
            }
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(18.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier
                        .clickable(onClick = onBackToCreators)
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        Icons.AutoMirrored.Outlined.ArrowBack,
                        contentDescription = null,
                        tint = DistranColors.Ink,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        "ALL CREATORS",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 9.sp,
                        letterSpacing = 1.1.sp,
                        color = DistranColors.Ink
                    )
                }
                Text("WORLDS BEGIN WITH PEOPLE.", fontFamily = DmMonoFontFamily, fontSize = 9.sp, color = accent)
            }
        }

        Column(modifier = Modifier.padding(horizontal = 18.dp, vertical = 14.dp)) {
            if (error.isNotEmpty()) {
                StatusBanner(
                    message = "Provider details are unavailable. Showing cached catalog credits.",
                    actionLabel = "Retry",
                    onAction = { attempt++ }
                )
                Spacer(Modifier.height(12.dp))
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                AvatarView(name = creator.name, image = creator.image, size = 64.dp)
                Column(modifier = Modifier.weight(1f)) {
                    if (profile != null) CreatorBadge() else Eyebrow("${creator.kind.uppercase()} · DIRECTORY")
                    Spacer(Modifier.height(5.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(creator.name, fontFamily = AbelFontFamily, fontSize = 28.sp, color = DistranColors.Ink)
                        CreatorPageMark()
                    }
                    if (profile != null) {
                        Text(
                            "@${profile.handle}",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 10.sp,
                            color = DistranColors.Muted
                        )
                    }
                }
            }

            Spacer(Modifier.height(14.dp))
            if (own) {
                DistranSecondaryButton(
                    text = "Customize page",
                    leadingIcon = Icons.Outlined.Edit,
                    onClick = { editing = true }
                )
            } else {
                DistranPrimaryButton(
                    text = if (follows) "Following" else "Follow creator",
                    leadingIcon = if (follows) Icons.Outlined.Check else Icons.Outlined.AutoAwesome,
                    onClick = { viewModel.toggleFollowCreator(followKey, creator.name) }
                )
            }

            if (!profile?.headline.isNullOrBlank()) {
                Spacer(Modifier.height(14.dp))
                Text(profile!!.headline!!, fontFamily = AbelFontFamily, fontSize = 21.sp, color = accent)
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = creator.bio?.takeIf { it.isNotBlank() } ?: "Follow the work. Find a new thread.",
                fontFamily = AbelFontFamily,
                fontSize = 15.sp,
                lineHeight = 22.sp,
                color = DistranColors.InkSoft
            )

            profile?.website?.takeIf { it.isNotBlank() }?.let { url ->
                Spacer(Modifier.height(10.dp))
                Row(
                    modifier = Modifier.clickable {
                        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
                    },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Text("Official website", fontFamily = DmMonoFontFamily, fontSize = 10.sp, color = accent)
                    Icon(
                        Icons.Outlined.NorthEast,
                        contentDescription = null,
                        tint = accent,
                        modifier = Modifier.size(13.dp)
                    )
                }
            }
            detail?.creator?.sourceUrl?.takeIf { it.isNotBlank() }?.let { url ->
                Spacer(Modifier.height(8.dp))
                Row(
                    modifier = Modifier.clickable {
                        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
                    },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Text(
                        text = "View on ${detail?.creator?.provider?.uppercase() ?: "SOURCE"}",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 10.sp,
                        color = DistranColors.Green
                    )
                    Icon(
                        Icons.Outlined.NorthEast,
                        contentDescription = null,
                        tint = DistranColors.Green,
                        modifier = Modifier.size(13.dp)
                    )
                }
            }

            Spacer(Modifier.height(24.dp))
            if (profile != null) {
                SectionHeading(eyebrow = "SELECTED BY THE CREATOR", title = "From this room")
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "A personal selection of works and inspirations. Selection does not imply an ownership claim.",
                    fontFamily = AbelFontFamily,
                    fontSize = 14.sp,
                    color = DistranColors.Muted
                )
                Spacer(Modifier.height(12.dp))
                if (featured.isNotEmpty()) {
                    PosterTwoColumnGrid(
                        items = featured.map { Triple(it, null, null) },
                        onOpenWork = onOpenWork,
                        onOpenCreator = onOpenCreator,
                        publicCreators = publicCreators,
                        viewModel = viewModel
                    )
                } else {
                    Text(
                        "A new room, waiting for its first selections.",
                        fontFamily = AbelFontFamily,
                        fontSize = 14.sp,
                        color = DistranColors.Muted
                    )
                }
            } else {
                SectionHeading(eyebrow = "PROVIDER CREDITS / CATALOG CONNECTIONS", title = "Follow the work.")
                Spacer(Modifier.height(12.dp))
                if (works.isNotEmpty()) {
                    PosterTwoColumnGrid(
                        items = works.map { Triple(it, null, null) },
                        onOpenWork = onOpenWork,
                        onOpenCreator = onOpenCreator,
                        publicCreators = publicCreators,
                        viewModel = viewModel
                    )
                } else {
                    Text(
                        "No connected works loaded yet. Search the catalog to explore more.",
                        fontFamily = AbelFontFamily,
                        fontSize = 14.sp,
                        color = DistranColors.Muted
                    )
                }
            }

            if (own) {
                Spacer(Modifier.height(28.dp))
                SectionHeading(
                    eyebrow = "YOUR CREATOR DESK · ONLY YOU",
                    title = "Your credit claims",
                    actionLabel = "Find a work to claim",
                    onAction = onOpenDiscover
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "Open any film, show or game and choose “Claim your credit”. These requests stay on this device until hosted verification is connected.",
                    fontFamily = AbelFontFamily,
                    fontSize = 14.sp,
                    color = DistranColors.Muted
                )
                Spacer(Modifier.height(12.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    (profile?.claims ?: emptyList()).forEach { claim ->
                        val date = runCatching {
                            DateTimeFormatter.ofPattern("MMM d, yyyy")
                                .withZone(ZoneId.systemDefault())
                                .format(Instant.parse(claim.date))
                        }.getOrElse { claim.date.take(10) }
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            color = DistranColors.Panel,
                            border = BorderStroke(1.dp, DistranColors.Line)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(
                                    text = viewModel.getWork(claim.workId)?.title ?: "Saved title",
                                    fontFamily = AbelFontFamily,
                                    fontSize = 18.sp,
                                    color = DistranColors.Ink,
                                    modifier = Modifier.clickable { onOpenWork(claim.workId) }
                                )
                                Text(
                                    "${claim.credit} · $date",
                                    fontFamily = DmMonoFontFamily,
                                    fontSize = 9.sp,
                                    color = DistranColors.Muted
                                )
                                Spacer(Modifier.height(6.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        modifier = Modifier.clickable {
                                            runCatching {
                                                context.startActivity(
                                                    Intent(
                                                        Intent.ACTION_VIEW,
                                                        Uri.parse(claim.evidence)
                                                    )
                                                )
                                            }
                                        },
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Text(
                                            "Evidence",
                                            fontFamily = DmMonoFontFamily,
                                            fontSize = 9.sp,
                                            color = DistranColors.Green
                                        )
                                        Icon(
                                            Icons.Outlined.NorthEast,
                                            contentDescription = null,
                                            tint = DistranColors.Green,
                                            modifier = Modifier.size(12.dp)
                                        )
                                    }
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Icon(
                                                Icons.Outlined.Fingerprint,
                                                contentDescription = null,
                                                tint = DistranColors.Muted,
                                                modifier = Modifier.size(12.dp)
                                            )
                                            Text(
                                                "Pending verification",
                                                fontFamily = DmMonoFontFamily,
                                                fontSize = 8.sp,
                                                color = DistranColors.Muted
                                            )
                                        }
                                        Text(
                                            text = "Withdraw",
                                            fontFamily = DmMonoFontFamily,
                                            fontSize = 9.sp,
                                            color = DistranColors.Danger,
                                            modifier = Modifier.clickable { viewModel.withdrawClaim(claim.id) }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }

    if (editing && profile != null) {
        var headline by remember { mutableStateOf(account.headline ?: "") }
        var chosenAccent by remember { mutableStateOf(account.accent ?: "#b7c96c") }
        var featuredIds by remember { mutableStateOf(account.featuredWorks ?: emptyList()) }
        var pickerQuery by remember { mutableStateOf("") }
        var editorError by remember { mutableStateOf("") }

        DistranModalDialog(
            title = "Make this room yours.",
            subtitle = "CREATOR PAGE",
            onDismiss = { editing = false }
        ) {
            Row(
                modifier = Modifier.clickable {
                    editing = false
                    onOpenSettings()
                },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Text(
                    "Edit name, username, photo and banner",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 10.sp,
                    color = DistranColors.Green
                )
                Icon(
                    Icons.Outlined.NorthEast,
                    contentDescription = null,
                    tint = DistranColors.Green,
                    modifier = Modifier.size(13.dp)
                )
            }
            Spacer(Modifier.height(14.dp))
            DistranTextField(
                value = headline,
                onValueChange = { if (it.length <= 120) headline = it },
                label = "Your headline",
                placeholder = "Independent stories. Unexpected worlds."
            )
            Spacer(Modifier.height(14.dp))
            Eyebrow("YOUR ROOM’S ACCENT")
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("#b7c96c", "#e5b17f", "#8bbfc9", "#c4a1dd", "#e5a3b2").forEach { hex ->
                    val color = ImageUtils.parseHexColor(hex)
                    val selected = chosenAccent.equals(hex, ignoreCase = true)
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(color)
                            .border(2.dp, if (selected) DistranColors.Ink else Color.Transparent, CircleShape)
                            .clickable { chosenAccent = hex },
                        contentAlignment = Alignment.Center
                    ) {
                        if (selected) {
                            Icon(
                                Icons.Outlined.Check,
                                contentDescription = null,
                                tint = DistranColors.GreenDark,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
            Spacer(Modifier.height(14.dp))
            DistranTextField(
                value = pickerQuery,
                onValueChange = { pickerQuery = it },
                label = "Find a featured work"
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "Select up to six inspirations or works, in selection order. Search Discover first to bring a live title into this picker.",
                fontFamily = AbelFontFamily,
                fontSize = 13.sp,
                color = DistranColors.Muted
            )
            Spacer(Modifier.height(10.dp))
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                viewModel.knownWorks()
                    .filter { it.title.contains(pickerQuery.trim(), ignoreCase = true) }
                    .take(30)
                    .forEach { w ->
                        val selected = featuredIds.contains(w.id)
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    if (selected) {
                                        featuredIds = featuredIds.filter { it != w.id }
                                        editorError = ""
                                    } else if (featuredIds.size < 6) {
                                        featuredIds = featuredIds + w.id
                                        editorError = ""
                                    } else {
                                        editorError = "Choose up to six featured works."
                                    }
                                },
                            shape = RoundedCornerShape(8.dp),
                            color = if (selected) DistranColors.Green.copy(alpha = 0.14f) else Color(0x06FFFFFF),
                            border = BorderStroke(
                                1.dp,
                                if (selected) DistranColors.Green.copy(alpha = 0.5f) else DistranColors.Line
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(w.title, fontFamily = AbelFontFamily, fontSize = 15.sp, color = DistranColors.Ink)
                                Text(
                                    text = if (selected) "0${featuredIds.indexOf(w.id) + 1} ✓" else "+",
                                    fontFamily = DmMonoFontFamily,
                                    fontSize = 10.sp,
                                    color = if (selected) DistranColors.Green else DistranColors.Muted
                                )
                            }
                        }
                    }
            }
            if (editorError.isNotEmpty()) {
                Spacer(Modifier.height(10.dp))
                StatusBanner(message = editorError, isError = true)
            }
            Spacer(Modifier.height(18.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                DistranPrimaryButton(
                    text = "Save creator page",
                    trailingIcon = Icons.Outlined.Check,
                    onClick = {
                        runCatching {
                            viewModel.updateAccount(
                                account.copy(
                                    headline = headline.trim(),
                                    accent = chosenAccent,
                                    featuredWorks = featuredIds
                                )
                            )
                            viewModel.notify("Your creator page is refreshed.")
                            editing = false
                        }.onFailure {
                            editorError = it.message ?: "Could not save creator page."
                        }
                    }
                )
            }
        }
    }
}
