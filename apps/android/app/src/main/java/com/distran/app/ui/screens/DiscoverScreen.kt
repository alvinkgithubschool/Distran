package com.distran.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AudioFile
import androidx.compose.material.icons.outlined.AutoStories
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Movie
import androidx.compose.material.icons.outlined.MusicNote
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.SportsEsports
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material.icons.outlined.Tv
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.distran.app.DistranViewModel
import com.distran.app.data.Medium
import com.distran.app.data.SearchResult
import com.distran.app.ui.components.BuddyStrip
import com.distran.app.ui.components.DistranSecondaryButton
import com.distran.app.ui.components.EmptyState
import com.distran.app.ui.components.Eyebrow
import com.distran.app.ui.components.FormatTabs
import com.distran.app.ui.components.PageHeader
import com.distran.app.ui.components.PillTag
import com.distran.app.ui.components.SectionHeading
import com.distran.app.ui.components.StatusBanner
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily
import kotlinx.coroutines.delay

private enum class CatalogSort(val id: String, val label: String) {
    CURATED("curated", "Curated order"),
    YEAR("year", "Newest first"),
    TITLE("title", "A–Z")
}

private data class FeaturedDirectoryCreator(
    val name: String,
    val type: String,
    val letter: String,
    val color: Color
)

@Composable
fun DiscoverScreen(
    viewModel: DistranViewModel,
    initialQuery: String,
    initialMedium: Medium?,
    initialCuratedScope: Boolean,
    onOpenWork: (String) -> Unit,
    onOpenCreator: (String) -> Unit,
    onOpenCreatorsDirectory: () -> Unit,
    onOpenChat: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    val publicCreators = remember(state.db) { viewModel.publicCreators() }

    var query by remember { mutableStateOf(initialQuery) }
    var medium by remember { mutableStateOf(initialMedium) }
    var curatedScope by remember { mutableStateOf(initialCuratedScope) }
    var sort by remember { mutableStateOf(CatalogSort.CURATED) }
    var sortMenuExpanded by remember { mutableStateOf(false) }
    var page by remember { mutableIntStateOf(1) }
    var retryToken by remember { mutableIntStateOf(0) }

    var liveResult by remember { mutableStateOf<SearchResult?>(null) }
    var liveLoading by remember { mutableStateOf(false) }
    var liveError by remember { mutableStateOf("") }

    LaunchedEffect(initialQuery, initialMedium, initialCuratedScope) {
        query = initialQuery
        medium = initialMedium
        curatedScope = initialCuratedScope
        page = 1
    }

    LaunchedEffect(query, medium, page, retryToken, curatedScope, state.apiBaseUrl) {
        liveResult = null
        liveError = ""
        if (curatedScope || query.trim().length < 2 || state.apiBaseUrl.isBlank()) {
            liveLoading = false
            return@LaunchedEffect
        }
        liveLoading = true
        delay(300L)
        try {
            val res = viewModel.searchLiveCatalog(query.trim(), medium, page)
            liveResult = res
        } catch (e: Exception) {
            liveError = e.message ?: "Live catalog unavailable. Showing the local preview collection."
        } finally {
            liveLoading = false
        }
    }

    val usingLive = liveResult != null
    val rawFiltered = remember(liveResult, query, medium, state.catalogRevision) {
        liveResult?.items ?: viewModel.catalogRepo.searchCatalog(query, medium)
    }
    val results = remember(rawFiltered, sort) {
        when (sort) {
            CatalogSort.CURATED -> rawFiltered
            CatalogSort.YEAR -> rawFiltered.sortedByDescending { it.year }
            CatalogSort.TITLE -> rawFiltered.sortedBy { it.title.lowercase() }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 18.dp)
    ) {
        PageHeader(
            eyebrow = "FOLLOW YOUR CURIOSITY",
            title = "Discover",
            actions = {
                DistranSecondaryButton(
                    text = "Find creators",
                    trailingIcon = Icons.Outlined.NorthEast,
                    onClick = onOpenCreatorsDirectory
                )
            }
        )
        Spacer(Modifier.height(10.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            Text(
                text = buildAnnotatedString {
                    append("Find your next obsession.\n")
                    withStyle(SpanStyle(color = DistranColors.Muted)) {
                        append("Or something you didn’t know you were looking for.")
                    }
                },
                fontFamily = AbelFontFamily,
                fontSize = 15.sp,
                lineHeight = 20.sp,
                color = DistranColors.InkSoft,
                modifier = Modifier.weight(1f)
            )
            Spacer(Modifier.width(12.dp))
            Text(
                text = "DSTRN / EXPLORE.001",
                fontFamily = DmMonoFontFamily,
                fontSize = 8.sp,
                color = DistranColors.Subtle
            )
        }

        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = query,
            onValueChange = {
                query = it
                curatedScope = false
                page = 1
            },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            leadingIcon = {
                Icon(
                    imageVector = Icons.Outlined.Search,
                    contentDescription = null,
                    tint = DistranColors.Muted
                )
            },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(onClick = {
                        query = ""
                        curatedScope = false
                        page = 1
                    }) {
                        Icon(Icons.Outlined.Close, contentDescription = "Clear search", tint = DistranColors.Muted)
                    }
                }
            },
            placeholder = {
                Text(
                    text = "Search a title, a maker, a feeling…",
                    fontFamily = AbelFontFamily,
                    fontSize = 16.sp,
                    color = DistranColors.Subtle
                )
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

        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            val statusLabel = when {
                usingLive -> "LIVE CATALOG · ${liveResult!!.providers.keys.joinToString(" + ") { it.uppercase() }}"
                liveLoading -> "SEARCHING LIVE CATALOG…"
                else -> "PREVIEW COLLECTION · ${viewModel.catalogRepo.catalog.size} WORKS"
            }
            Text(
                text = statusLabel,
                fontFamily = DmMonoFontFamily,
                fontSize = 8.sp,
                letterSpacing = 0.8.sp,
                color = DistranColors.Green
            )
            Text(
                text = "GAMES / FILM / TELEVISION",
                fontFamily = DmMonoFontFamily,
                fontSize = 8.sp,
                color = DistranColors.Subtle
            )
        }

        if (query.isEmpty() && medium == null) {
            Spacer(Modifier.height(22.dp))
            SectionHeading(
                eyebrow = "THE MEDIUM IS JUST THE BEGINNING",
                title = "Browse by format"
            )
            Spacer(Modifier.height(12.dp))
            val formats = listOf(
                Triple(
                    Medium.GAME,
                    "Games" to "WORLDS TO GET LOST IN",
                    Icons.Outlined.SportsEsports to DistranColors.Green
                ),
                Triple(
                    Medium.MOVIE,
                    "Movies" to "STORIES THAT STAY",
                    Icons.Outlined.Movie to DistranColors.AmberBright
                ),
                Triple(Medium.TV, "Television" to "JUST ONE MORE EPISODE", Icons.Outlined.Tv to DistranColors.Cyan)
            )
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                formats.forEach { (m, copy, visual) ->
                    val (title, sub) = copy
                    val (icon, accent) = visual
                    val count = viewModel.catalogRepo.catalog.count { it.medium == m }
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                medium = m
                                page = 1
                            },
                        shape = RoundedCornerShape(14.dp),
                        color = DistranColors.Panel,
                        border = BorderStroke(1.dp, accent.copy(alpha = 0.25f))
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(accent.copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(22.dp))
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(title, fontFamily = AbelFontFamily, fontSize = 20.sp, color = DistranColors.Ink)
                                Text(sub, fontFamily = DmMonoFontFamily, fontSize = 8.sp, color = DistranColors.Muted)
                            }
                            Text(
                                text = count.toString().padStart(2, '0'),
                                fontFamily = DmMonoFontFamily,
                                fontSize = 14.sp,
                                color = accent
                            )
                            Icon(
                                Icons.Outlined.NorthEast,
                                contentDescription = null,
                                tint = DistranColors.Muted,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(
                    "Music" to Icons.Outlined.MusicNote,
                    "Books" to Icons.Outlined.AutoStories,
                    "Social" to Icons.Outlined.AudioFile
                ).forEach { (label, icon) ->
                    Surface(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        color = Color(0x05FFFFFF),
                        border = BorderStroke(1.dp, DistranColors.LineSoft)
                    ) {
                        Column(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    icon,
                                    contentDescription = null,
                                    tint = DistranColors.Subtle,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(label, fontFamily = AbelFontFamily, fontSize = 14.sp, color = DistranColors.Subtle)
                            }
                            Text(
                                "NEXT CHAPTER",
                                fontFamily = DmMonoFontFamily,
                                fontSize = 7.sp,
                                color = DistranColors.Subtle
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(20.dp))
            Eyebrow("OR START WITH A FEELING")
            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(
                    "Cyberpunk",
                    "Exploration",
                    "Co-op",
                    "Mystery",
                    "Atmospheric",
                    "World-building"
                ).forEach { mood ->
                    Surface(
                        modifier = Modifier.clickable {
                            query = mood
                            curatedScope = true
                            page = 1
                        },
                        shape = RoundedCornerShape(999.dp),
                        color = Color(0x07FFFFFF),
                        border = BorderStroke(1.dp, DistranColors.LineStrong)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Text(mood, fontFamily = AbelFontFamily, fontSize = 14.sp, color = DistranColors.InkSoft)
                            Icon(
                                Icons.Outlined.NorthEast,
                                contentDescription = null,
                                tint = DistranColors.Muted,
                                modifier = Modifier.size(12.dp)
                            )
                        }
                    }
                }
            }
        }

        if (liveError.isNotEmpty() || liveResult?.status == "partial") {
            Spacer(Modifier.height(14.dp))
            StatusBanner(
                message = if (liveError.isNotEmpty()) {
                    "Live catalog unavailable. Showing the local preview collection."
                } else {
                    "Some providers are unavailable (${liveResult!!.errors.joinToString(", ") { it.provider.uppercase() }}). Showing available results."
                },
                actionLabel = "Retry",
                onAction = { retryToken++ }
            )
        }

        if (liveResult?.providers?.values?.any { it.cache == "stale" } == true) {
            Spacer(Modifier.height(10.dp))
            StatusBanner(message = "Showing cached provider data while the service recovers.")
        }

        Spacer(Modifier.height(22.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            FormatTabs(
                selected = medium,
                onSelect = {
                    medium = it
                    page = 1
                },
                modifier = Modifier.weight(1f)
            )
            Spacer(Modifier.width(8.dp))
            Box {
                Surface(
                    modifier = Modifier.clickable { sortMenuExpanded = true },
                    shape = RoundedCornerShape(8.dp),
                    color = DistranColors.Panel,
                    border = BorderStroke(1.dp, DistranColors.LineStrong)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            Icons.Outlined.Tune,
                            contentDescription = "Sort catalog",
                            tint = DistranColors.Muted,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(sort.label, fontFamily = DmMonoFontFamily, fontSize = 9.sp, color = DistranColors.InkSoft)
                    }
                }
                DropdownMenu(
                    expanded = sortMenuExpanded,
                    onDismissRequest = { sortMenuExpanded = false }
                ) {
                    CatalogSort.entries.forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option.label, fontFamily = AbelFontFamily) },
                            onClick = {
                                sort = option
                                sortMenuExpanded = false
                            }
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        PillTag(
            text = if (usingLive) "Catalog results · TMDB / IGDB" else "Editorial collection · Provider metadata",
            color = DistranColors.InkSoft,
            borderColor = DistranColors.Line,
            backgroundColor = Color(0x06FFFFFF)
        )
        Spacer(Modifier.height(10.dp))
        SectionHeading(
            eyebrow = if (query.isNotBlank()) {
                "${results.size} THREAD${if (results.size == 1) "" else "S"} FOUND"
            } else {
                "A FEW PLACES TO BEGIN"
            },
            title = when {
                query.isNotBlank() -> "Following “$query”"
                medium == null -> "Find a world worth entering."
                medium == Medium.GAME -> "Your next world awaits."
                medium == Medium.MOVIE -> "Stay until the credits."
                else -> "One more episode."
            },
            actionLabel = if (query.isNotBlank() || medium != null) "Reset filters" else null,
            onAction = if (query.isNotBlank() || medium != null) {
                {
                    query = ""
                    medium = null
                    curatedScope = false
                    page = 1
                }
            } else null
        )

        Spacer(Modifier.height(14.dp))
        if (liveLoading) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 32.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                CircularProgressIndicator(
                    color = DistranColors.Green,
                    modifier = Modifier.size(20.dp),
                    strokeWidth = 2.dp
                )
                Spacer(Modifier.width(12.dp))
                Text(
                    "Finding your next world…",
                    fontFamily = AbelFontFamily,
                    fontSize = 16.sp,
                    color = DistranColors.Muted
                )
            }
        } else if (results.isNotEmpty()) {
            PosterTwoColumnGrid(
                items = results.map { Triple(it, null, null) },
                onOpenWork = onOpenWork,
                onOpenCreator = onOpenCreator,
                publicCreators = publicCreators,
                viewModel = viewModel
            )
        } else {
            EmptyState(
                icon = Icons.Outlined.Search,
                heading = "A thread we haven’t found. Yet.",
                body = if (usingLive) {
                    "No matching titles on this page. Try a different title or format."
                } else {
                    "This preview has a small, curated catalog. Try a title, creator or mood like “cyberpunk”."
                },
                actionLabel = "Explore everything",
                onAction = {
                    query = ""
                    medium = null
                    curatedScope = false
                    page = 1
                }
            )
        }

        if (usingLive) {
            Spacer(Modifier.height(18.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                DistranSecondaryButton(
                    text = "Previous",
                    enabled = page > 1 && !liveLoading,
                    onClick = { page-- }
                )
                Text("PAGE $page", fontFamily = DmMonoFontFamily, fontSize = 10.sp, color = DistranColors.Muted)
                DistranSecondaryButton(
                    text = "Next page",
                    enabled = (liveResult?.hasMore == true) && page < 50 && !liveLoading,
                    onClick = { page++ }
                )
            }
            Spacer(Modifier.height(10.dp))
            Text(
                text = "Movie and TV metadata: TMDB. Games: IGDB / Twitch. Provider scores are normalized to 5 stars. Sort applies to this page. Creator and mood browsing remains curated; live search matches titles.",
                fontFamily = DmMonoFontFamily,
                fontSize = 9.sp,
                lineHeight = 14.sp,
                color = DistranColors.Subtle
            )
        }

        Spacer(Modifier.height(22.dp))
        BuddyStrip(onClick = onOpenChat)
        Spacer(Modifier.height(26.dp))

        SectionHeading(
            eyebrow = "THE PEOPLE BEHIND THE WORLDS",
            title = "Creators to keep close."
        )
        Spacer(Modifier.height(12.dp))
        val featuredCreators = remember {
            listOf(
                FeaturedDirectoryCreator("CD PROJEKT RED", "GAME STUDIO", "C", DistranColors.AmberBright),
                FeaturedDirectoryCreator("Studio Trigger", "ANIMATION STUDIO", "S", Color(0xFFE07A7A)),
                FeaturedDirectoryCreator("Denis Villeneuve", "FILMMAKER", "D", DistranColors.Amber),
                FeaturedDirectoryCreator("Hazelight Studios", "GAME STUDIO", "H", DistranColors.Green)
            )
        }
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            featuredCreators.forEach { creator ->
                val follows = account.followed.contains(creator.name)
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = DistranColors.Panel,
                    border = BorderStroke(1.dp, creator.color.copy(alpha = 0.22f))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(creator.color.copy(alpha = 0.14f))
                                .border(1.dp, creator.color.copy(alpha = 0.35f), CircleShape)
                                .clickable { onOpenCreator(creator.name) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(creator.letter, fontFamily = AbelFontFamily, fontSize = 18.sp, color = creator.color)
                        }
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { onOpenCreator(creator.name) }
                        ) {
                            Text(creator.name, fontFamily = AbelFontFamily, fontSize = 17.sp, color = DistranColors.Ink)
                            Eyebrow(creator.type)
                        }
                        DistranSecondaryButton(
                            text = if (follows) "Following" else "Follow",
                            leadingIcon = if (follows) Icons.Outlined.Check else Icons.Outlined.Add,
                            onClick = { viewModel.toggleFollowCreator(creator.name, creator.name) }
                        )
                    }
                }
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}
