package com.distran.app.ui.screens

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
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.Pause
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.rounded.Star
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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.distran.app.DistranViewModel
import com.distran.app.data.LogStatus
import com.distran.app.data.Medium
import com.distran.app.data.Work
import com.distran.app.ui.components.AvatarView
import com.distran.app.ui.components.BuddyStrip
import com.distran.app.ui.components.CreatorNameLink
import com.distran.app.ui.components.DistranPrimaryButton
import com.distran.app.ui.components.DistranSecondaryButton
import com.distran.app.ui.components.EmptyState
import com.distran.app.ui.components.Eyebrow
import com.distran.app.ui.components.FormatTabs
import com.distran.app.ui.components.PillTag
import com.distran.app.ui.components.SectionHeading
import com.distran.app.ui.components.WorkArtwork
import com.distran.app.ui.components.WorkCard
import com.distran.app.ui.components.resolveWorkImageModel
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily
import kotlinx.coroutines.delay
import java.time.LocalTime

private data class SpotlightSlide(
    val id: String,
    val caption: String,
    val copy: String,
    val imageOverride: String? = null
)

private val spotlightSlides = listOf(
    SpotlightSlide(
        id = "it-takes-two",
        caption = "BETTER TOGETHER",
        copy = "A little chaos. A little wonder. A whole world made for two.",
        imageOverride = "it-takes-two-hero.jpg"
    ),
    SpotlightSlide(
        id = "dune",
        caption = "SOME WORLDS LEAVE THEIR MARK",
        copy = "Across the sand, a story about power, prophecy and the people caught between."
    ),
    SpotlightSlide(
        id = "severance",
        caption = "SOMETHING BENEATH THE SURFACE",
        copy = "One life inside. Another outside. Follow a thread you won’t want to let go."
    )
)

@Composable
fun HomeScreen(
    viewModel: DistranViewModel,
    onOpenWork: (String) -> Unit,
    onOpenDiscover: (Medium?) -> Unit,
    onOpenLists: () -> Unit,
    onOpenListDetail: (String) -> Unit,
    onOpenChat: () -> Unit,
    onOpenProfile: () -> Unit,
    onOpenCreator: (String) -> Unit,
    onOpenPartnerRoom: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    val publicCreators = remember(state.db) { viewModel.publicCreators() }
    var tab by remember { mutableStateOf("you") }
    var recMedium by remember { mutableStateOf<Medium?>(null) }

    val hour = remember { LocalTime.now().hour }
    val greeting = if (hour < 12) "Good morning" else if (hour < 18) "Good afternoon" else "Good evening"
    val planned = remember(account.logs) { account.logs.filter { it.status == LogStatus.PLANNED } }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 18.dp)
    ) {
        // Greeting Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Eyebrow("YOUR FEED / YOUR FREQUENCY")
                Spacer(Modifier.height(6.dp))
                Text(
                    text = buildAnnotatedString {
                        append("$greeting, ${account.name.substringBefore(' ')}")
                        withStyle(SpanStyle(color = DistranColors.Green)) { append(".") }
                    },
                    fontFamily = AbelFontFamily,
                    fontSize = 30.sp,
                    lineHeight = 34.sp,
                    color = DistranColors.Ink
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "There’s a whole world between the things you love.",
                    fontFamily = AbelFontFamily,
                    fontSize = 14.sp,
                    color = Color(0xFF8B887F)
                )
            }
            AvatarView(
                name = account.name,
                image = account.avatar,
                size = 42.dp,
                modifier = Modifier.clickable(onClick = onOpenProfile)
            )
        }

        Spacer(Modifier.height(20.dp))

        // Home Tabs ("For you 01" / "Up next 00")
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            listOf(
                Triple("you", "For you", "01"),
                Triple("upcoming", "Up next", planned.size.toString().padStart(2, '0'))
            ).forEach { (id, label, badge) ->
                val active = tab == id
                Column(
                    modifier = Modifier.clickable { tab = id }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = label,
                            fontFamily = AbelFontFamily,
                            fontSize = 15.sp,
                            color = if (active) DistranColors.Ink else Color(0xFF77766E)
                        )
                        Text(
                            text = badge,
                            fontFamily = DmMonoFontFamily,
                            fontSize = 8.sp,
                            color = Color(0xFF5D6051)
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .width(26.dp)
                            .height(2.dp)
                            .background(if (active) DistranColors.Green else Color.Transparent)
                    )
                }
            }
            Spacer(Modifier.weight(1f))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "FOLLOW THE THREAD",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 7.sp,
                    color = Color(0xFF55574A)
                )
                Icon(
                    imageVector = Icons.Outlined.NorthEast,
                    contentDescription = null,
                    tint = Color(0xFF55574A),
                    modifier = Modifier.size(11.dp)
                )
            }
        }
        HorizontalDivider(color = DistranColors.Line)
        Spacer(Modifier.height(18.dp))

        if (tab == "you") {
            PillTag(
                text = "Editorial spotlight",
                color = DistranColors.InkSoft,
                borderColor = DistranColors.Line,
                backgroundColor = Color(0x06FFFFFF)
            )
            Spacer(Modifier.height(12.dp))

            FeaturedCarouselCard(
                viewModel = viewModel,
                publicCreators = publicCreators,
                onLogWork = { viewModel.openLog(it) },
                onOpenWork = onOpenWork,
                onOpenCreator = onOpenCreator
            )

            Spacer(Modifier.height(26.dp))

            // Personal Recommendations
            PillTag(
                text = "For you · From your taste",
                color = DistranColors.InkSoft,
                borderColor = DistranColors.Line,
                backgroundColor = Color(0x06FFFFFF)
            )
            Spacer(Modifier.height(10.dp))
            SectionHeading(
                eyebrow = "FOLLOW YOUR CURIOSITY",
                title = "Your next connection."
            )
            Spacer(Modifier.height(10.dp))
            FormatTabs(selected = recMedium, onSelect = { recMedium = it })
            Spacer(Modifier.height(14.dp))

            val picks = remember(account.favorites, account.logs, recMedium) {
                viewModel.recommendForActive(recMedium, 4)
            }
            if (picks.isNotEmpty()) {
                PosterTwoColumnGrid(
                    items = picks.mapIndexed { i, rec -> Triple(rec.work, i, rec.reason) },
                    onOpenWork = onOpenWork,
                    onOpenCreator = onOpenCreator,
                    publicCreators = publicCreators,
                    viewModel = viewModel
                )
            } else {
                Text(
                    text = "You’ve explored this collection. Try another format.",
                    fontFamily = AbelFontFamily,
                    fontSize = 15.sp,
                    color = DistranColors.Muted
                )
            }
            Spacer(Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Based on your favourites and ratings. ",
                    fontFamily = AbelFontFamily,
                    fontSize = 13.sp,
                    color = DistranColors.Muted
                )
                Text(
                    text = "Have a specific theme? Ask Buddy.",
                    fontFamily = AbelFontFamily,
                    fontSize = 13.sp,
                    color = DistranColors.Green,
                    modifier = Modifier.clickable(onClick = onOpenChat)
                )
            }

            Spacer(Modifier.height(22.dp))
            HorizontalDivider(color = DistranColors.Line)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onOpenDiscover(null) }
                    .padding(vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(DistranColors.Green.copy(alpha = 0.08f))
                        .border(1.dp, DistranColors.Green.copy(alpha = 0.25f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Outlined.NorthEast,
                        contentDescription = null,
                        tint = DistranColors.Green,
                        modifier = Modifier.size(14.dp)
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Your taste doesn’t stay in one lane.",
                        fontFamily = AbelFontFamily,
                        fontSize = 14.sp,
                        color = Color(0xFFB7B2A5)
                    )
                    Text(
                        text = "Neither should your next discovery.",
                        fontFamily = AbelFontFamily,
                        fontSize = 12.sp,
                        color = Color(0xFF6D6B63)
                    )
                }
                Icon(
                    imageVector = Icons.AutoMirrored.Outlined.ArrowForward,
                    contentDescription = "Explore every format",
                    tint = Color(0xFF8D947C),
                    modifier = Modifier.size(17.dp)
                )
            }
            HorizontalDivider(color = DistranColors.Line)

            Spacer(Modifier.height(26.dp))

            // Stay for the atmosphere
            SectionHeading(
                eyebrow = "A LITTLE OUTSIDE THE FAMILIAR",
                title = "Stay for the atmosphere.",
                actionLabel = "Keep exploring",
                onAction = { onOpenDiscover(null) }
            )
            Spacer(Modifier.height(14.dp))
            val atmosphereWorks = remember(state.catalogRevision) {
                listOfNotNull("cyberpunk", "dune", "elden-ring", "blade-runner").mapNotNull { viewModel.getWork(it) }
            }
            PosterTwoColumnGrid(
                items = atmosphereWorks.mapIndexed { i, w -> Triple(w, i, null) },
                onOpenWork = onOpenWork,
                onOpenCreator = onOpenCreator,
                publicCreators = publicCreators,
                viewModel = viewModel
            )

            Spacer(Modifier.height(26.dp))

            // Featured List
            SectionHeading(
                eyebrow = "ORDERED. COMBINED. YOURS.",
                title = "A feeling, across formats.",
                actionLabel = "Your shelves",
                onAction = onOpenLists
            )
            Spacer(Modifier.height(14.dp))
            val featuredList = account.lists.firstOrNull()
            if (featuredList != null) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenListDetail(featuredList.id) },
                    shape = RoundedCornerShape(14.dp),
                    color = DistranColors.Panel,
                    border = BorderStroke(1.dp, Color(0x18FFFFFF))
                ) {
                    Row(
                        modifier = Modifier.padding(18.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            PillTag(text = "YOUR CROSS-MEDIA COLLECTION")
                            Spacer(Modifier.height(10.dp))
                            Text(
                                text = featuredList.title,
                                fontFamily = AbelFontFamily,
                                fontSize = 25.sp,
                                color = DistranColors.Ink
                            )
                            Spacer(Modifier.height(6.dp))
                            Text(
                                text = featuredList.description,
                                fontFamily = AbelFontFamily,
                                fontSize = 13.sp,
                                color = Color(0xFF8E887A)
                            )
                            Spacer(Modifier.height(14.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                Text(
                                    text = "${featuredList.workIds.size} WORKS · OPEN THE LIST",
                                    fontFamily = DmMonoFontFamily,
                                    fontSize = 8.sp,
                                    color = Color(0xFFB7A280)
                                )
                                Icon(
                                    imageVector = Icons.Outlined.NorthEast,
                                    contentDescription = null,
                                    tint = Color(0xFFB7A280),
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                        }
                        Spacer(Modifier.width(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy((-18).dp)) {
                            featuredList.workIds.take(3).forEachIndexed { idx, workId ->
                                val w = viewModel.getWork(workId)
                                if (w != null) {
                                    Box(
                                        modifier = Modifier
                                            .rotate(((idx - 1) * 6).toFloat())
                                            .width(52.dp)
                                            .height(78.dp)
                                            .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(5.dp))
                                    ) {
                                        WorkArtwork(work = w, cornerRadius = 5.dp, modifier = Modifier.fillMaxSize())
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                EmptyState(
                    heading = "Everything belongs together.",
                    body = "Start a collection with a game, a film, a feeling.",
                    actionLabel = "Create a list",
                    onAction = onOpenLists
                )
            }

            Spacer(Modifier.height(22.dp))
            BuddyStrip(onClick = onOpenChat)
            Spacer(Modifier.height(22.dp))

            // Editorial Dune Room Card
            SectionHeading(
                eyebrow = "A CHANGE OF PACE",
                title = "A different kind of world.",
                actionLabel = "Explore film",
                onAction = { onOpenDiscover(Medium.MOVIE) }
            )
            Spacer(Modifier.height(14.dp))
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(248.dp)
                    .clickable(onClick = onOpenPartnerRoom),
                shape = RoundedCornerShape(14.dp),
                color = Color(0xFF16120E),
                border = BorderStroke(1.dp, DistranColors.Line)
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data("file:///android_asset/artwork/dune-room.png")
                            .build(),
                        contentDescription = "Dune room artwork",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    listOf(Color(0x44090908), Color(0xEE090908))
                                )
                            )
                    )
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .padding(22.dp)
                    ) {
                        Eyebrow("THE WORLD IS THE STORY", color = Color(0xFFB49D7B))
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "Some worlds don’t end\nwhen the credits do.",
                            fontFamily = AbelFontFamily,
                            fontSize = 28.sp,
                            lineHeight = 31.sp,
                            color = DistranColors.Ink
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "Follow a filmmaker. Find a different perspective.",
                            fontFamily = AbelFontFamily,
                            fontSize = 13.sp,
                            color = Color(0xFFAC9B88)
                        )
                        Spacer(Modifier.height(14.dp))
                        DistranSecondaryButton(
                            text = "Step into the room",
                            trailingIcon = Icons.Outlined.NorthEast,
                            onClick = onOpenPartnerRoom
                        )
                    }
                }
            }

            // Orbit Highlights (mobile adaptation of OrbitPanel)
            Spacer(Modifier.height(28.dp))
            SectionHeading(
                eyebrow = "IN YOUR ORBIT",
                title = "Creators to keep close."
            )
            Spacer(Modifier.height(12.dp))
            val orbitCreators = remember(state.catalogRevision) {
                listOf("cyberpunk", "edgerunners", "dune")
                    .mapNotNull { viewModel.getWork(it)?.creators?.firstOrNull() }
            }
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                orbitCreators.forEachIndexed { idx, creator ->
                    val dotColors = listOf(DistranColors.Green, DistranColors.Amber, DistranColors.Cyan)
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onOpenCreator(creator.id) },
                        shape = RoundedCornerShape(10.dp),
                        color = DistranColors.Panel,
                        border = BorderStroke(1.dp, DistranColors.Line)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(dotColors[idx % dotColors.size].copy(alpha = 0.16f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = creator.name.split(' ').take(2).mapNotNull { it.firstOrNull() }
                                        .joinToString(""),
                                    fontFamily = DmMonoFontFamily,
                                    fontSize = 11.sp,
                                    color = dotColors[idx % dotColors.size]
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    creator.name,
                                    fontFamily = AbelFontFamily,
                                    fontSize = 16.sp,
                                    color = DistranColors.Ink
                                )
                                Text(
                                    (creator.role ?: "CREATOR").uppercase(),
                                    fontFamily = DmMonoFontFamily,
                                    fontSize = 8.sp,
                                    color = DistranColors.Muted
                                )
                            }
                            Icon(
                                Icons.Outlined.NorthEast,
                                contentDescription = null,
                                tint = DistranColors.Muted,
                                modifier = Modifier.size(15.dp)
                            )
                        }
                    }
                }
            }
        } else {
            // Up next tab
            Column(modifier = Modifier.padding(vertical = 8.dp)) {
                Icon(
                    Icons.Outlined.Schedule,
                    contentDescription = null,
                    tint = DistranColors.Green,
                    modifier = Modifier.size(26.dp)
                )
                Spacer(Modifier.height(10.dp))
                Eyebrow("YOUR NEXT CHAPTER")
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "The things you’re\nlooking forward to.",
                    fontFamily = AbelFontFamily,
                    fontSize = 28.sp,
                    lineHeight = 32.sp,
                    color = DistranColors.Ink
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "A place for the worlds you haven’t entered. Yet.",
                    fontFamily = AbelFontFamily,
                    fontSize = 14.sp,
                    color = DistranColors.Muted
                )
            }
            Spacer(Modifier.height(16.dp))
            val plannedWorks = planned.mapNotNull { viewModel.getWork(it.workId) }
            if (plannedWorks.isNotEmpty()) {
                PosterTwoColumnGrid(
                    items = plannedWorks.map { Triple(it, null, null) },
                    onOpenWork = onOpenWork,
                    onOpenCreator = onOpenCreator,
                    publicCreators = publicCreators,
                    viewModel = viewModel
                )
            } else {
                EmptyState(
                    icon = Icons.Outlined.Schedule,
                    heading = "A little anticipation looks good here.",
                    body = "Mark a work as “Want to” and it will be waiting for you in this room.",
                    actionLabel = "Find your next thing",
                    onAction = { onOpenDiscover(null) }
                )
            }
            Spacer(Modifier.height(20.dp))
            BuddyStrip(onClick = onOpenChat)
        }

        // End note
        Spacer(Modifier.height(28.dp))
        HorizontalDivider(color = DistranColors.Line)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 26.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                Icons.Outlined.AutoAwesome,
                contentDescription = null,
                tint = DistranColors.Green,
                modifier = Modifier.size(16.dp)
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Curiosity looks good on you.",
                fontFamily = AbelFontFamily,
                fontSize = 18.sp,
                color = Color(0xFFAAA796),
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "YOU’RE RIGHT WHERE YOU SHOULD BE.",
                fontFamily = DmMonoFontFamily,
                fontSize = 8.sp,
                letterSpacing = 1.1.sp,
                color = Color(0xFF57564C)
            )
        }
        Spacer(Modifier.height(16.dp))
    }
}

@Composable
private fun FeaturedCarouselCard(
    viewModel: DistranViewModel,
    publicCreators: List<com.distran.app.data.Account>,
    onLogWork: (String) -> Unit,
    onOpenWork: (String) -> Unit,
    onOpenCreator: (String) -> Unit
) {
    var index by remember { mutableIntStateOf(0) }
    var playing by remember { mutableStateOf(true) }

    LaunchedEffect(playing, index) {
        if (!playing) return@LaunchedEffect
        delay(8000L)
        index = (index + 1) % spotlightSlides.size
    }

    val slide = spotlightSlides[index]
    val work = viewModel.getWork(slide.id) ?: return
    val imageModel = slide.imageOverride?.let { "file:///android_asset/artwork/$it" }
        ?: resolveWorkImageModel(work)

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFF0D140F),
        border = BorderStroke(1.dp, DistranColors.Green.copy(alpha = 0.2f))
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            if (imageModel != null) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current).data(imageModel).crossfade(true).build(),
                    contentDescription = work.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.matchParentSize()
                )
            }
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0x66060B08), Color(0xEE060906))
                        )
                    )
            )
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    PillTag(
                        text = "FEATURED · ${slide.caption}",
                        leadingDot = true,
                        color = Color(0xFFC3D779),
                        borderColor = DistranColors.Green.copy(alpha = 0.35f),
                        backgroundColor = Color(0x3877893A)
                    )
                    Text(
                        text = "THE SPOTLIGHT / 00${index + 1}",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 8.sp,
                        color = Color(0x99C2D1B3)
                    )
                }

                Spacer(Modifier.height(34.dp))
                Text(
                    text = work.title,
                    fontFamily = AbelFontFamily,
                    fontSize = 40.sp,
                    lineHeight = 42.sp,
                    color = DistranColors.Ink
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = slide.copy,
                    fontFamily = AbelFontFamily,
                    fontSize = 15.sp,
                    color = Color(0xFFB7B9A9)
                )
                Spacer(Modifier.height(12.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "${work.medium.displayName.uppercase()} · ${work.year}",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 9.sp,
                        color = Color(0xFF949987)
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Icon(
                            Icons.Rounded.Star,
                            contentDescription = null,
                            tint = Color(0xFFC1D871),
                            modifier = Modifier.size(12.dp)
                        )
                        Text(work.rating, fontFamily = DmMonoFontFamily, fontSize = 9.sp, color = Color(0xFFC1D871))
                    }
                    val firstCreator = work.creators?.firstOrNull()
                    if (firstCreator != null) {
                        CreatorNameLink(
                            id = firstCreator.id,
                            name = firstCreator.name,
                            publicCreators = publicCreators,
                            creatorDirectory = viewModel.creators,
                            onOpenCreator = onOpenCreator
                        )
                    } else {
                        Text(work.maker, fontFamily = AbelFontFamily, fontSize = 13.sp, color = DistranColors.InkSoft)
                    }
                }

                Spacer(Modifier.height(18.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    DistranPrimaryButton(
                        text = "Log it",
                        leadingIcon = Icons.Outlined.Add,
                        onClick = { onLogWork(work.id) }
                    )
                    DistranSecondaryButton(
                        text = "Enter the world",
                        trailingIcon = Icons.Outlined.NorthEast,
                        onClick = { onOpenWork(work.id) }
                    )
                }

                Spacer(Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = {
                            index = (index - 1 + spotlightSlides.size) % spotlightSlides.size
                            playing = false
                        },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            Icons.AutoMirrored.Outlined.ArrowBack,
                            "Previous recommendation",
                            tint = DistranColors.InkSoft,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 6.dp)
                    ) {
                        spotlightSlides.forEachIndexed { pos, _ ->
                            Box(
                                modifier = Modifier
                                    .width(if (pos == index) 18.dp else 6.dp)
                                    .height(6.dp)
                                    .clip(CircleShape)
                                    .background(if (pos == index) DistranColors.Green else Color(0x44FFFFFF))
                                    .clickable {
                                        index = pos
                                        playing = false
                                    }
                            )
                        }
                    }
                    IconButton(
                        onClick = {
                            index = (index + 1) % spotlightSlides.size
                            playing = false
                        },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            Icons.AutoMirrored.Outlined.ArrowForward,
                            "Next recommendation",
                            tint = DistranColors.InkSoft,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    IconButton(
                        onClick = { playing = !playing },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = if (playing) Icons.Outlined.Pause else Icons.Outlined.PlayArrow,
                            contentDescription = if (playing) "Pause recommendations" else "Play recommendations",
                            tint = DistranColors.InkSoft,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PosterTwoColumnGrid(
    items: List<Triple<Work, Int?, String?>>,
    onOpenWork: (String) -> Unit,
    onOpenCreator: (String) -> Unit,
    publicCreators: List<com.distran.app.data.Account>,
    viewModel: DistranViewModel,
    isBuddy: Boolean = false
) {
    Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
        items.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                row.forEach { (work, idx, reason) ->
                    Column(modifier = Modifier.weight(1f)) {
                        WorkCard(
                            work = work,
                            onOpenWork = onOpenWork,
                            onOpenCreator = onOpenCreator,
                            publicCreators = publicCreators,
                            creatorDirectory = viewModel.creators,
                            index = idx,
                            isBuddy = isBuddy
                        )
                        if (!reason.isNullOrBlank()) {
                            Spacer(Modifier.height(5.dp))
                            Text(
                                text = reason,
                                fontFamily = AbelFontFamily,
                                fontSize = 12.sp,
                                lineHeight = 16.sp,
                                color = DistranColors.Muted
                            )
                        }
                    }
                }
                if (row.size == 1) {
                    Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}
