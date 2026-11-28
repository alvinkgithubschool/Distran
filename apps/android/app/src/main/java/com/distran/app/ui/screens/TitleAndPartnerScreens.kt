package com.distran.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
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
import androidx.compose.material.icons.automirrored.outlined.PlaylistAdd
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.distran.app.DistranViewModel
import com.distran.app.data.ImageUtils
import com.distran.app.data.LogStatus
import com.distran.app.data.Medium
import com.distran.app.data.Role
import com.distran.app.data.Work
import com.distran.app.ui.components.ClaimEditorDialog
import com.distran.app.ui.components.CreatorNameLink
import com.distran.app.ui.components.DistranModalDialog
import com.distran.app.ui.components.DistranPrimaryButton
import com.distran.app.ui.components.DistranSecondaryButton
import com.distran.app.ui.components.EmptyState
import com.distran.app.ui.components.Eyebrow
import com.distran.app.ui.components.PillTag
import com.distran.app.ui.components.SectionHeading
import com.distran.app.ui.components.StatusBanner
import com.distran.app.ui.components.WorkArtwork
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TitleScreen(
    workId: String,
    viewModel: DistranViewModel,
    onBackToDiscover: () -> Unit,
    onOpenWork: (String) -> Unit,
    onOpenCreator: (String) -> Unit,
    onOpenDiscoverTag: (String) -> Unit,
    onOpenLists: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    val publicCreators = remember(state.db) { viewModel.publicCreators() }
    val context = LocalContext.current

    var retryToken by remember { mutableIntStateOf(0) }
    var liveWork by remember(workId) { mutableStateOf<Work?>(null) }
    var cacheState by remember(workId) { mutableStateOf("") }
    var loading by remember(workId) { mutableStateOf(false) }
    var error by remember(workId) { mutableStateOf("") }

    var claimOpen by remember { mutableStateOf(false) }
    var listOpen by remember { mutableStateOf(false) }
    var expanded by remember { mutableStateOf(false) }

    val seedWork = remember(workId, state.catalogRevision) { viewModel.getWork(workId) }

    LaunchedEffect(workId, retryToken, state.apiBaseUrl) {
        error = ""
        cacheState = ""
        if (!viewModel.catalogRepo.isRemoteId(workId) || state.apiBaseUrl.isBlank()) {
            loading = false
            return@LaunchedEffect
        }
        loading = true
        try {
            val detail = viewModel.fetchLiveWork(workId)
            liveWork = detail.work
            cacheState = detail.cache
        } catch (e: Exception) {
            error = e.message ?: "Live metadata is temporarily unavailable."
        } finally {
            loading = false
        }
    }

    val work = liveWork ?: seedWork

    if (work == null && loading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                CircularProgressIndicator(
                    color = DistranColors.Green,
                    modifier = Modifier.size(20.dp),
                    strokeWidth = 2.dp
                )
                Text("Opening this world…", fontFamily = AbelFontFamily, fontSize = 17.sp, color = DistranColors.Muted)
            }
        }
        return
    }

    if (work == null && error.isNotEmpty()) {
        Box(modifier = Modifier.fillMaxSize().padding(18.dp), contentAlignment = Alignment.Center) {
            EmptyState(
                heading = "This world is temporarily out of reach.",
                body = error,
                actionLabel = "Try again",
                onAction = { retryToken++ }
            )
        }
        return
    }

    if (work == null) {
        Box(modifier = Modifier.fillMaxSize().padding(18.dp), contentAlignment = Alignment.Center) {
            EmptyState(
                heading = "This page is still a little out of reach.",
                body = "Find a work in the preview catalog.",
                actionLabel = "Back to Discover",
                onAction = onBackToDiscover
            )
        }
        return
    }

    var posterTone by remember(work.id, work.image) {
        mutableStateOf(ImageUtils.parseHexColor(work.color))
    }
    LaunchedEffect(work.id, work.image) {
        posterTone = ImageUtils.extractPosterAccentColor(context, work)
    }

    val isFavorite = account.favorites.contains(work.id)
    val planned = account.logs.firstOrNull { it.workId == work.id && it.status == LogStatus.PLANNED }
    val logs = account.logs.filter { it.workId == work.id }
    val providerRelated = work.related.mapNotNull { viewModel.getWork(it) }
    val editorialRelated = providerRelated.isEmpty()
    val related = if (editorialRelated) {
        (work.editorialRelated ?: emptyList()).mapNotNull { viewModel.getWork(it) }
    } else {
        providerRelated
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DistranColors.Bg)
    ) {
        // Ambient radial poster glow
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(380.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(posterTone.copy(alpha = 0.28f), DistranColors.Bg)
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp, vertical = 18.dp)
        ) {
            if (error.isNotEmpty()) {
                StatusBanner(
                    message = "$error Showing saved title metadata.",
                    actionLabel = "Retry",
                    onAction = { retryToken++ }
                )
                Spacer(Modifier.height(10.dp))
            }
            if (cacheState == "stale") {
                StatusBanner(message = "Showing cached metadata while the provider recovers.")
                Spacer(Modifier.height(10.dp))
            }

            Row(
                modifier = Modifier
                    .clickable(onClick = onBackToDiscover)
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    Icons.AutoMirrored.Outlined.ArrowBack,
                    contentDescription = null,
                    tint = DistranColors.Muted,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    "BACK TO THE WORLDS",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    letterSpacing = 1.1.sp,
                    color = DistranColors.Muted
                )
            }

            Spacer(Modifier.height(16.dp))
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .width(210.dp)
                        .aspectRatio(2f / 3f)
                        .clip(RoundedCornerShape(14.dp))
                        .border(1.dp, posterTone.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
                ) {
                    WorkArtwork(work = work, cornerRadius = 14.dp, modifier = Modifier.fillMaxSize())
                }
            }

            Spacer(Modifier.height(18.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(7.dp)
                        .clip(CircleShape)
                        .background(posterTone)
                )
                Text(
                    text = "${work.medium.displayName.uppercase()} · ${if (work.year > 0) work.year else "TBA"}",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 10.sp,
                    letterSpacing = 1.2.sp,
                    color = DistranColors.Muted
                )
            }
            Spacer(Modifier.height(6.dp))
            Text(
                text = work.title,
                fontFamily = AbelFontFamily,
                fontSize = 36.sp,
                lineHeight = 40.sp,
                color = DistranColors.Ink
            )
            Spacer(Modifier.height(8.dp))

            val makers = work.creators?.takeIf { it.isNotEmpty() }?.take(3)
                ?: work.maker.split(',').map { it.trim() }.filter { it.isNotEmpty() }
                    .map { com.distran.app.data.CreatorRef(id = it, name = it) }
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = (work.creatorRole ?: if (work.medium == Medium.GAME) "Studio" else "Director") + " ·",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 10.sp,
                    color = DistranColors.Subtle
                )
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    makers.forEach { c ->
                        CreatorNameLink(
                            id = c.id,
                            name = c.name,
                            publicCreators = publicCreators,
                            creatorDirectory = viewModel.creators,
                            onOpenCreator = onOpenCreator
                        )
                    }
                }
            }

            if (work.tags.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    work.tags.forEach { tag ->
                        Surface(
                            modifier = Modifier.clickable { onOpenDiscoverTag(tag) },
                            shape = RoundedCornerShape(999.dp),
                            color = Color(0x07FFFFFF),
                            border = BorderStroke(1.dp, DistranColors.Line)
                        ) {
                            Text(
                                text = tag,
                                fontFamily = DmMonoFontFamily,
                                fontSize = 9.sp,
                                color = DistranColors.InkSoft,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = DistranColors.Panel,
                border = BorderStroke(1.dp, DistranColors.Line)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        Icons.Rounded.Star,
                        contentDescription = null,
                        tint = DistranColors.Green,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(work.rating, fontFamily = DmMonoFontFamily, fontSize = 14.sp, color = DistranColors.Ink)
                    Text(
                        text = if (!work.provider.isNullOrBlank()) "${work.provider.uppercase()} SCORE" else "PREVIEW RATING",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 8.sp,
                        color = DistranColors.Muted
                    )
                    Spacer(Modifier.weight(1f))
                    Icon(
                        Icons.Outlined.Schedule,
                        contentDescription = null,
                        tint = DistranColors.Muted,
                        modifier = Modifier.size(15.dp)
                    )
                    Text(
                        work.duration.ifBlank { "—" },
                        fontFamily = DmMonoFontFamily,
                        fontSize = 10.sp,
                        color = DistranColors.InkSoft
                    )
                }
            }

            Spacer(Modifier.height(16.dp))
            val mediumActionWord = when (work.medium) {
                Medium.GAME -> "game"
                Medium.MOVIE -> "film"
                Medium.TV -> "series"
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                DistranPrimaryButton(
                    text = "Log this $mediumActionWord",
                    leadingIcon = Icons.Outlined.Add,
                    onClick = { viewModel.openLog(work.id) },
                    modifier = Modifier.weight(1f)
                )
                DistranSecondaryButton(
                    text = if (planned != null) "On your horizon" else "Want to",
                    leadingIcon = if (planned != null) Icons.Outlined.Check else Icons.Outlined.BookmarkBorder,
                    onClick = { viewModel.toggleWantTo(work.id) }
                )
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DistranSecondaryButton(
                    text = "Add to list",
                    leadingIcon = Icons.AutoMirrored.Outlined.PlaylistAdd,
                    onClick = { listOpen = true },
                    modifier = Modifier.weight(1f)
                )
                DistranSecondaryButton(
                    text = if (isFavorite) "In Top 4" else "Top 4",
                    leadingIcon = if (isFavorite) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder,
                    onClick = {
                        runCatching { viewModel.toggleFavoriteWork(work.id) }
                            .onFailure { viewModel.notify(it.message ?: "Could not update Top 4.") }
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            if (account.role == Role.CREATOR) {
                Spacer(Modifier.height(14.dp))
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = DistranColors.Panel,
                    border = BorderStroke(1.dp, DistranColors.Green.copy(alpha = 0.25f))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            "HAD A HAND IN THIS WORLD?",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 9.sp,
                            color = DistranColors.Green
                        )
                        val alreadyClaimed = account.claims?.any { it.workId == work.id } == true
                        DistranSecondaryButton(
                            text = if (alreadyClaimed) "Claim pending" else "Claim credit",
                            trailingIcon = Icons.Outlined.NorthEast,
                            onClick = {
                                if (alreadyClaimed) onOpenCreator(account.id) else claimOpen = true
                            }
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))
            Eyebrow("THE WORLD WITHIN")
            Spacer(Modifier.height(6.dp))
            Text(
                text = if (work.medium == Medium.GAME) "Somewhere worth getting lost." else "A story worth staying for.",
                fontFamily = AbelFontFamily,
                fontSize = 24.sp,
                color = DistranColors.Ink
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = work.description,
                fontFamily = AbelFontFamily,
                fontSize = 15.sp,
                lineHeight = 23.sp,
                color = DistranColors.InkSoft
            )
            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier
                    .clickable { expanded = !expanded }
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Text(
                    text = if (expanded) "LESS DETAIL" else "BEHIND THE WORK",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 10.sp,
                    color = DistranColors.Green
                )
                Icon(
                    imageVector = if (expanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                    contentDescription = null,
                    tint = DistranColors.Green,
                    modifier = Modifier.size(16.dp)
                )
            }

            if (expanded) {
                Spacer(Modifier.height(10.dp))
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = DistranColors.Panel,
                    border = BorderStroke(1.dp, DistranColors.Line)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        FactRow(
                            label = (work.creatorRole ?: "Creator").uppercase(),
                            value = work.creators?.takeIf { it.isNotEmpty() }?.joinToString(", ") { it.name }
                                ?: work.maker
                        )
                        FactRow(
                            label = if (work.provider == "tmdb") "PRODUCTION COMPANIES" else "PUBLISHER / DISTRIBUTOR",
                            value = work.publisher
                        )
                        FactRow(label = "RELEASE YEAR", value = if (work.year > 0) work.year.toString() else "TBA")
                        FactRow(
                            label = "CATALOG",
                            value = if (!work.provider.isNullOrBlank()) {
                                "Metadata from ${work.provider.uppercase()}."
                            } else {
                                "Curated local preview; descriptions are editorial summaries."
                            }
                        )
                        if (!work.platforms.isNullOrEmpty()) {
                            FactRow(label = "PLATFORMS", value = work.platforms.joinToString(" · "))
                        }
                        if (!work.franchises.isNullOrEmpty()) {
                            FactRow(label = "SERIES / COLLECTIONS", value = work.franchises.joinToString(" · "))
                        }
                        work.credits?.forEach { c ->
                            FactRow(label = c.role.uppercase(), value = c.name)
                        }
                    }
                }
            }

            Spacer(Modifier.height(22.dp))
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = DistranColors.Panel,
                border = BorderStroke(1.dp, DistranColors.Line)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Eyebrow("YOUR TIME WITH IT")
                    Spacer(Modifier.height(6.dp))
                    if (logs.isNotEmpty()) {
                        Text(
                            text = "${logs.size} moment${if (logs.size == 1) "" else "s"} in your ledger.",
                            fontFamily = AbelFontFamily,
                            fontSize = 20.sp,
                            color = DistranColors.Ink
                        )
                        Spacer(Modifier.height(10.dp))
                        logs.take(2).forEach { log ->
                            val dateLabel = if (log.status == LogStatus.PLANNED) {
                                "On the horizon"
                            } else {
                                runCatching {
                                    if (log.date.length == 10) {
                                        LocalDate.parse(log.date).format(DateTimeFormatter.ofPattern("MMM d, yyyy"))
                                    } else {
                                        DateTimeFormatter.ofPattern("MMM d, yyyy")
                                            .withZone(ZoneId.systemDefault())
                                            .format(Instant.parse(log.date))
                                    }
                                }.getOrElse { log.date.take(10) }
                            }
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .clickable { viewModel.openLog(work.id, log.id) },
                                shape = RoundedCornerShape(10.dp),
                                color = Color(0x07FFFFFF),
                                border = BorderStroke(1.dp, DistranColors.LineSoft)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            dateLabel,
                                            fontFamily = DmMonoFontFamily,
                                            fontSize = 9.sp,
                                            color = DistranColors.Muted
                                        )
                                        Text(
                                            text = if (log.rating > 0.0) "${log.rating} / 5" else "Unrated",
                                            fontFamily = DmMonoFontFamily,
                                            fontSize = 10.sp,
                                            color = DistranColors.Green
                                        )
                                    }
                                    if (log.note.isNotBlank()) {
                                        Spacer(Modifier.height(5.dp))
                                        Text(
                                            log.note,
                                            fontFamily = AbelFontFamily,
                                            fontSize = 14.sp,
                                            color = DistranColors.InkSoft
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        Text(
                            "You haven’t crossed paths. Yet.",
                            fontFamily = AbelFontFamily,
                            fontSize = 20.sp,
                            color = DistranColors.Ink
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "When you do, keep a little of the experience here.",
                            fontFamily = AbelFontFamily,
                            fontSize = 14.sp,
                            color = DistranColors.Muted
                        )
                        Spacer(Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.clickable { viewModel.openLog(work.id) },
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Text(
                                "MAKE A FIRST MEMORY",
                                fontFamily = DmMonoFontFamily,
                                fontSize = 10.sp,
                                color = DistranColors.Green
                            )
                            Icon(
                                Icons.Outlined.Add,
                                contentDescription = null,
                                tint = DistranColors.Green,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                }
            }

            if (related.isNotEmpty()) {
                Spacer(Modifier.height(26.dp))
                SectionHeading(
                    eyebrow = "THE STORY DOESN’T END HERE",
                    title = "Follow the thread.",
                    actionLabel = "Keep exploring",
                    onAction = onBackToDiscover
                )
                Spacer(Modifier.height(8.dp))
                PillTag(
                    text = "Related works · ${if (editorialRelated) "Editorial connections" else work.provider?.uppercase() ?: "Editorial"}"
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = when {
                        !editorialRelated && !work.relatedLabel.isNullOrBlank() -> work.relatedLabel
                        work.id.endsWith("135243") || work.id.endsWith("105248") ->
                            "A shared universe, and a few curated paths beyond it."

                        else -> "Curated connections through atmosphere, creators and ideas."
                    },
                    fontFamily = AbelFontFamily,
                    fontSize = 14.sp,
                    color = DistranColors.Muted
                )
                Spacer(Modifier.height(12.dp))
                PosterTwoColumnGrid(
                    items = related.map { Triple(it, null, null) },
                    onOpenWork = onOpenWork,
                    onOpenCreator = onOpenCreator,
                    publicCreators = publicCreators,
                    viewModel = viewModel
                )
            }
            Spacer(Modifier.height(24.dp))
        }
    }

    if (claimOpen) {
        ClaimEditorDialog(
            work = work,
            account = account,
            onDismiss = { claimOpen = false },
            onSubmit = { input ->
                viewModel.submitClaim(input)
                claimOpen = false
            }
        )
    }

    if (listOpen) {
        DistranModalDialog(
            title = "Find a place on your shelf.",
            subtitle = "ADD TO A LIST",
            onDismiss = { listOpen = false }
        ) {
            if (account.lists.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    account.lists.forEach { list ->
                        val has = list.workIds.contains(work.id)
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    runCatching { viewModel.toggleWorkInShelf(list.id, work.id) }
                                        .onFailure { viewModel.notify(it.message ?: "Could not update list.") }
                                },
                            shape = RoundedCornerShape(10.dp),
                            color = if (has) DistranColors.Green.copy(alpha = 0.14f) else Color(0x06FFFFFF),
                            border = BorderStroke(
                                1.dp,
                                if (has) DistranColors.Green.copy(alpha = 0.5f) else DistranColors.Line
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        list.title,
                                        fontFamily = AbelFontFamily,
                                        fontSize = 17.sp,
                                        color = DistranColors.Ink
                                    )
                                    Text(
                                        "${list.workIds.size} WORKS",
                                        fontFamily = DmMonoFontFamily,
                                        fontSize = 9.sp,
                                        color = DistranColors.Muted
                                    )
                                }
                                Icon(
                                    imageVector = if (has) Icons.Outlined.Check else Icons.Outlined.Add,
                                    contentDescription = null,
                                    tint = if (has) DistranColors.Green else DistranColors.Muted
                                )
                            }
                        }
                    }
                }
            } else {
                EmptyState(
                    heading = "Your first shelf is waiting.",
                    body = "Make a list, then bring this work into it.",
                    actionLabel = "Create a list",
                    onAction = {
                        listOpen = false
                        onOpenLists()
                    }
                )
            }
        }
    }
}

@Composable
private fun FactRow(label: String, value: String) {
    Column {
        Eyebrow(label)
        Spacer(Modifier.height(2.dp))
        Text(value.ifBlank { "—" }, fontFamily = AbelFontFamily, fontSize = 15.sp, color = DistranColors.InkSoft)
    }
}

@Composable
fun PartnerRoomScreen(
    viewModel: DistranViewModel,
    onBackHome: () -> Unit,
    onOpenWork: (String) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090705))
    ) {
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data("file:///android_asset/artwork/dune-room.png")
                .build(),
            contentDescription = "Dune atmospheric artwork from the supplied design",
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0x88090705), Color(0xCC090705), Color(0xF5090705))
                    )
                )
        )
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 22.dp, vertical = 22.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                DistranSecondaryButton(
                    text = "Back to your room",
                    leadingIcon = Icons.AutoMirrored.Outlined.ArrowBack,
                    onClick = onBackHome
                )
                PillTag(text = "A WORLD WORTH ENTERING", color = DistranColors.AmberBright)
            }

            Column {
                Eyebrow("THE DESERT REMEMBERS.", color = DistranColors.Amber)
                Spacer(Modifier.height(10.dp))
                Text(
                    text = buildAnnotatedString {
                        append("Some worlds\nleave their\n")
                        withStyle(SpanStyle(color = DistranColors.AmberBright, fontStyle = FontStyle.Italic)) {
                            append("mark.")
                        }
                    },
                    fontFamily = AbelFontFamily,
                    fontSize = 48.sp,
                    lineHeight = 50.sp,
                    color = DistranColors.Ink
                )
                Spacer(Modifier.height(12.dp))
                Text(
                    text = "Enter the universe of Dune. Follow its makers, trace its ideas, and find the next story beyond the sand.",
                    fontFamily = AbelFontFamily,
                    fontSize = 16.sp,
                    lineHeight = 23.sp,
                    color = Color(0xFFD5C4AD)
                )
                Spacer(Modifier.height(20.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    DistranPrimaryButton(
                        text = "Enter the world",
                        trailingIcon = Icons.Outlined.NorthEast,
                        onClick = { onOpenWork("dune") }
                    )
                    DistranSecondaryButton(
                        text = "Log the film",
                        leadingIcon = Icons.Outlined.Add,
                        onClick = { viewModel.openLog("dune") }
                    )
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    text = "DUNE: PART TWO / DENIS VILLENEUVE / 2024",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    letterSpacing = 1.2.sp,
                    color = Color(0xFFB59F85)
                )
            }
        }
    }
}
