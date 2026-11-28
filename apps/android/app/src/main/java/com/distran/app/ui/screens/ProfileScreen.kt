package com.distran.app.ui.screens

import android.graphics.BitmapFactory
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Book
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.distran.app.DistranViewModel
import com.distran.app.data.ImageUtils
import com.distran.app.data.LogStatus
import com.distran.app.data.Medium
import com.distran.app.data.Role
import com.distran.app.ui.components.AvatarView
import com.distran.app.ui.components.CreatorBadge
import com.distran.app.ui.components.CreatorPageMark
import com.distran.app.ui.components.DistranModalDialog
import com.distran.app.ui.components.DistranPrimaryButton
import com.distran.app.ui.components.DistranSecondaryButton
import com.distran.app.ui.components.EmptyState
import com.distran.app.ui.components.Eyebrow
import com.distran.app.ui.components.SectionHeading
import com.distran.app.ui.components.StatusBanner
import com.distran.app.ui.components.WorkArtwork
import com.distran.app.ui.components.WorkCard
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
fun BannerImageView(
    banner: String,
    contentDescription: String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val decoded = remember(banner) {
        if (banner.startsWith("data:image/")) {
            ImageUtils.decodeDataUri(banner)?.let { bytes ->
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
            }
        } else null
    }
    if (decoded != null) {
        Image(
            bitmap = decoded,
            contentDescription = contentDescription,
            contentScale = ContentScale.Crop,
            modifier = modifier
        )
    } else {
        AsyncImage(
            model = ImageRequest.Builder(context).data(banner).crossfade(true).build(),
            contentDescription = contentDescription,
            contentScale = ContentScale.Crop,
            modifier = modifier
        )
    }
}

@Composable
fun ProfileScreen(
    viewModel: DistranViewModel,
    onOpenSettings: () -> Unit,
    onOpenCreator: (String) -> Unit,
    onOpenWork: (String) -> Unit,
    onOpenListDetail: (String) -> Unit,
    onOpenLists: () -> Unit,
    onOpenDiscover: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    val publicCreators = remember(state.db) { viewModel.publicCreators() }

    var tab by remember { mutableStateOf("cornerstones") }
    var editFavorites by remember { mutableStateOf(false) }
    var favoriteMedium by remember { mutableStateOf(Medium.GAME) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 18.dp)
    ) {
        if (!account.banner.isNullOrBlank()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .border(1.dp, DistranColors.Line, RoundedCornerShape(14.dp))
            ) {
                BannerImageView(
                    banner = account.banner,
                    contentDescription = "Your profile banner",
                    modifier = Modifier.fillMaxSize()
                )
            }
            Spacer(Modifier.height(14.dp))
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Eyebrow("YOUR SHELF / YOUR STORY")
            Surface(
                shape = CircleShape,
                color = DistranColors.Panel,
                border = BorderStroke(1.dp, DistranColors.LineStrong)
            ) {
                IconButton(onClick = onOpenSettings, modifier = Modifier.size(38.dp)) {
                    Icon(
                        Icons.Outlined.Settings,
                        contentDescription = "Profile settings",
                        tint = DistranColors.InkSoft,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        val isCreator = account.role == Role.CREATOR
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = DistranColors.Panel,
            border = BorderStroke(
                1.dp,
                if (isCreator) DistranColors.Green.copy(alpha = 0.35f) else DistranColors.Line
            )
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    AvatarView(name = account.name, image = account.avatar, size = 64.dp)
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(account.name, fontFamily = AbelFontFamily, fontSize = 26.sp, color = DistranColors.Ink)
                            if (isCreator) CreatorPageMark()
                        }
                        Text(
                            "@${account.handle}",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 10.sp,
                            color = DistranColors.Muted
                        )
                        if (isCreator) {
                            Spacer(Modifier.height(6.dp))
                            CreatorBadge()
                        }
                    }
                }
                Spacer(Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    DistranSecondaryButton(
                        text = "Edit profile",
                        leadingIcon = Icons.Outlined.Edit,
                        onClick = onOpenSettings
                    )
                    if (isCreator) {
                        DistranSecondaryButton(
                            text = "Open your creator page",
                            trailingIcon = Icons.Outlined.NorthEast,
                            onClick = { onOpenCreator(account.id) }
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        Text(
            text = account.bio.ifBlank { "A place for the things that make you, you." },
            fontFamily = AbelFontFamily,
            fontSize = 15.sp,
            lineHeight = 22.sp,
            color = DistranColors.InkSoft
        )
        if (!account.website.isNullOrBlank()) {
            Spacer(Modifier.height(6.dp))
            Text(account.website, fontFamily = DmMonoFontFamily, fontSize = 10.sp, color = DistranColors.Green)
        }

        Spacer(Modifier.height(18.dp))
        val plannedCount = account.logs.count { it.status == LogStatus.PLANNED }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf(
                Triple(account.logs.size, "LOGGED") { tab = "ledger" },
                Triple(account.lists.size, "COLLECTIONS") { tab = "lists" },
                Triple(account.followed.size, "IN YOUR ORBIT") {},
                Triple(plannedCount, "ON THE HORIZON") {}
            ).forEach { (count, label, onClick) ->
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clickable(onClick = onClick),
                    shape = RoundedCornerShape(10.dp),
                    color = DistranColors.Panel,
                    border = BorderStroke(1.dp, DistranColors.Line)
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            count.toString().padStart(2, '0'),
                            fontFamily = AbelFontFamily,
                            fontSize = 22.sp,
                            color = DistranColors.Ink
                        )
                        Spacer(Modifier.height(2.dp))
                        Text(
                            label,
                            fontFamily = DmMonoFontFamily,
                            fontSize = 7.sp,
                            color = DistranColors.Muted,
                            maxLines = 1
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(18.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf(
                "cornerstones" to "Your Top 4",
                "ledger" to "The ledger",
                "lists" to "Your collections"
            ).forEach { (id, label) ->
                val selected = tab == id
                Surface(
                    modifier = Modifier.clickable { tab = id },
                    shape = RoundedCornerShape(999.dp),
                    color = if (selected) DistranColors.Green.copy(alpha = 0.14f) else Color(0x05FFFFFF),
                    border = BorderStroke(
                        1.dp,
                        if (selected) DistranColors.Green.copy(alpha = 0.5f) else DistranColors.Line
                    )
                ) {
                    Text(
                        text = label,
                        fontFamily = DmMonoFontFamily,
                        fontSize = 10.sp,
                        color = if (selected) DistranColors.Ink else DistranColors.Muted,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(20.dp))
        when (tab) {
            "cornerstones" -> {
                Eyebrow("THE ONES THAT MADE YOU, YOU.")
                Spacer(Modifier.height(4.dp))
                Text(
                    "Four corners. A whole world.",
                    fontFamily = AbelFontFamily,
                    fontSize = 15.sp,
                    color = DistranColors.Muted
                )
                Spacer(Modifier.height(18.dp))

                Medium.entries.forEach { medium ->
                    val works = account.favorites.mapNotNull { viewModel.getWork(it) }.filter { it.medium == medium }
                    SectionHeading(
                        title = medium.pluralName,
                        actionLabel = "Make it yours",
                        onAction = {
                            favoriteMedium = medium
                            editFavorites = true
                        }
                    )
                    Spacer(Modifier.height(12.dp))
                    val slots = (0 until 4).map { idx -> works.getOrNull(idx) }
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        slots.chunked(2).forEachIndexed { rowIdx, pair ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                pair.forEachIndexed { colIdx, work ->
                                    val absoluteIdx = rowIdx * 2 + colIdx
                                    if (work != null) {
                                        WorkCard(
                                            work = work,
                                            onOpenWork = onOpenWork,
                                            onOpenCreator = onOpenCreator,
                                            publicCreators = publicCreators,
                                            creatorDirectory = viewModel.creators,
                                            index = absoluteIdx,
                                            modifier = Modifier.weight(1f)
                                        )
                                    } else {
                                        Surface(
                                            modifier = Modifier
                                                .weight(1f)
                                                .aspectRatio(2f / 3f)
                                                .clickable {
                                                    favoriteMedium = medium
                                                    editFavorites = true
                                                },
                                            shape = RoundedCornerShape(10.dp),
                                            color = Color(0x05FFFFFF),
                                            border = BorderStroke(1.dp, DistranColors.Line)
                                        ) {
                                            Column(
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .padding(12.dp),
                                                horizontalAlignment = Alignment.CenterHorizontally,
                                                verticalArrangement = Arrangement.Center
                                            ) {
                                                Icon(
                                                    Icons.Outlined.Add,
                                                    contentDescription = null,
                                                    tint = DistranColors.Muted,
                                                    modifier = Modifier.size(22.dp)
                                                )
                                                Spacer(Modifier.height(6.dp))
                                                Text(
                                                    text = "YOUR NEXT FAVOURITE",
                                                    fontFamily = DmMonoFontFamily,
                                                    fontSize = 8.sp,
                                                    color = DistranColors.Subtle
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

                SectionHeading(eyebrow = "THE PEOPLE WHO MAKE YOUR WORLDS", title = "In your orbit")
                Spacer(Modifier.height(12.dp))
                if (account.followed.isNotEmpty()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val dotColors = listOf(DistranColors.Green, DistranColors.Amber, DistranColors.Cyan)
                        account.followed.forEachIndexed { i, key ->
                            val id = if (key.startsWith("profile:")) key.removePrefix("profile:") else key
                            val creator = state.db.accounts.firstOrNull { it.id == id }
                            val name = creator?.name ?: account.followedCreatorNames?.get(key) ?: key
                            val dot = dotColors[i % dotColors.size]
                            Surface(
                                modifier = Modifier.clickable { onOpenCreator(id) },
                                shape = RoundedCornerShape(999.dp),
                                color = DistranColors.Panel,
                                border = BorderStroke(1.dp, DistranColors.LineStrong)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(20.dp)
                                            .clip(CircleShape)
                                            .background(dot.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            name.firstOrNull()?.toString() ?: "D",
                                            fontFamily = DmMonoFontFamily,
                                            fontSize = 9.sp,
                                            color = dot
                                        )
                                    }
                                    Text(name, fontFamily = AbelFontFamily, fontSize = 14.sp, color = DistranColors.Ink)
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
                } else {
                    DistranSecondaryButton(
                        text = "Find your people",
                        trailingIcon = Icons.Outlined.NorthEast,
                        onClick = onOpenDiscover
                    )
                }
            }

            "ledger" -> {
                SectionHeading(eyebrow = "LITTLE MOMENTS, KEPT", title = "Your cultural memory")
                Spacer(Modifier.height(14.dp))
                if (account.logs.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        account.logs.forEach { log ->
                            val work = viewModel.getWork(log.workId)
                            if (work != null) {
                                val dateStr = runCatching {
                                    if (log.date.length == 10) {
                                        LocalDate.parse(log.date).format(DateTimeFormatter.ofPattern("d MMMM yyyy"))
                                    } else {
                                        DateTimeFormatter.ofPattern("d MMMM yyyy")
                                            .withZone(ZoneId.systemDefault())
                                            .format(Instant.parse(log.date))
                                    }
                                }.getOrElse { log.date.take(10) }

                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp),
                                    color = DistranColors.Panel,
                                    border = BorderStroke(1.dp, DistranColors.Line)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(14.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                                    ) {
                                        WorkArtwork(
                                            work = work,
                                            cornerRadius = 6.dp,
                                            modifier = Modifier
                                                .width(56.dp)
                                                .height(80.dp)
                                                .clickable { onOpenWork(work.id) }
                                        )
                                        Column(modifier = Modifier.weight(1f)) {
                                            Eyebrow("$dateStr · ${if (log.status == LogStatus.PLANNED) "WANT TO" else log.status.id.uppercase()}")
                                            Spacer(Modifier.height(3.dp))
                                            Text(
                                                text = work.title,
                                                fontFamily = AbelFontFamily,
                                                fontSize = 19.sp,
                                                color = DistranColors.Ink,
                                                modifier = Modifier.clickable { onOpenWork(work.id) }
                                            )
                                            Spacer(Modifier.height(4.dp))
                                            Text(
                                                text = log.note.ifBlank { "Some moments don’t need words." },
                                                fontFamily = AbelFontFamily,
                                                fontSize = 14.sp,
                                                color = DistranColors.Muted
                                            )
                                            Spacer(Modifier.height(8.dp))
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                                            ) {
                                                if (log.rating > 0.0) {
                                                    Row(
                                                        verticalAlignment = Alignment.CenterVertically,
                                                        horizontalArrangement = Arrangement.spacedBy(3.dp)
                                                    ) {
                                                        Icon(
                                                            Icons.Rounded.Star,
                                                            contentDescription = null,
                                                            tint = DistranColors.Green,
                                                            modifier = Modifier.size(12.dp)
                                                        )
                                                        Text(
                                                            "${log.rating} / 5",
                                                            fontFamily = DmMonoFontFamily,
                                                            fontSize = 10.sp,
                                                            color = DistranColors.Green
                                                        )
                                                    }
                                                } else {
                                                    Text(
                                                        "UNRATED",
                                                        fontFamily = DmMonoFontFamily,
                                                        fontSize = 9.sp,
                                                        color = DistranColors.Subtle
                                                    )
                                                }
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                                ) {
                                                    Icon(
                                                        Icons.Outlined.Lock,
                                                        contentDescription = null,
                                                        tint = DistranColors.Subtle,
                                                        modifier = Modifier.size(11.dp)
                                                    )
                                                    Text(
                                                        log.visibility.id,
                                                        fontFamily = DmMonoFontFamily,
                                                        fontSize = 9.sp,
                                                        color = DistranColors.Subtle
                                                    )
                                                }
                                            }
                                        }
                                        IconButton(onClick = { viewModel.openLog(work.id, log.id) }) {
                                            Icon(
                                                Icons.Outlined.Edit,
                                                contentDescription = "Edit log for ${work.title}",
                                                tint = DistranColors.Muted,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    EmptyState(
                        icon = Icons.Outlined.Book,
                        heading = "A memory waiting to happen.",
                        body = "Log a work you love. Leave a thought, a rating, a little part of you.",
                        actionLabel = "Find something to log",
                        onAction = onOpenDiscover
                    )
                }
            }

            else -> {
                SectionHeading(
                    eyebrow = "DIFFERENT WORKS. A SHARED FEELING.",
                    title = "Your collections",
                    actionLabel = "All lists",
                    onAction = onOpenLists
                )
                Spacer(Modifier.height(14.dp))
                if (account.lists.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        account.lists.forEach { list ->
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onOpenListDetail(list.id) },
                                shape = RoundedCornerShape(12.dp),
                                color = DistranColors.Panel,
                                border = BorderStroke(1.dp, DistranColors.Line)
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            list.title,
                                            fontFamily = AbelFontFamily,
                                            fontSize = 19.sp,
                                            color = DistranColors.Ink
                                        )
                                        Spacer(Modifier.height(3.dp))
                                        Text(
                                            text = "${list.workIds.size} WORKS · ${list.visibility.id.uppercase()}",
                                            fontFamily = DmMonoFontFamily,
                                            fontSize = 9.sp,
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
                    }
                } else {
                    EmptyState(
                        heading = "Find your first connection.",
                        body = "A shelf for the things that belong together.",
                        actionLabel = "Create a collection",
                        onAction = onOpenLists
                    )
                }
            }
        }
        Spacer(Modifier.height(24.dp))
    }

    if (editFavorites) {
        FavoriteEditorDialog(
            medium = favoriteMedium,
            viewModel = viewModel,
            onDismiss = { editFavorites = false }
        )
    }
}

@Composable
private fun FavoriteEditorDialog(
    medium: Medium,
    viewModel: DistranViewModel,
    onDismiss: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    var ids by remember(medium, account.id) {
        mutableStateOf(account.favorites.filter { viewModel.getWork(it)?.medium == medium })
    }
    var error by remember { mutableStateOf("") }

    fun toggle(id: String) {
        if (ids.contains(id)) {
            ids = ids.filter { it != id }
            error = ""
        } else if (ids.size < 4) {
            ids = ids + id
            error = ""
        } else {
            error = "Four favourites, in your order. Remove one to make room."
        }
    }

    DistranModalDialog(
        title = "Four corners of your world.",
        subtitle = "YOUR ${medium.displayName.uppercase()} TOP 4",
        onDismiss = onDismiss
    ) {
        Text(
            "The order is part of the story. Choose up to four.",
            fontFamily = AbelFontFamily,
            fontSize = 15.sp,
            color = DistranColors.Muted
        )
        if (ids.isNotEmpty()) {
            Spacer(Modifier.height(14.dp))
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ids.forEachIndexed { idx, workId ->
                    val work = viewModel.getWork(workId)
                    if (work != null) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color(0x08FFFFFF),
                            border = BorderStroke(1.dp, DistranColors.Line)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    "${idx + 1}",
                                    fontFamily = DmMonoFontFamily,
                                    fontSize = 11.sp,
                                    color = DistranColors.Green,
                                    modifier = Modifier.width(24.dp)
                                )
                                Text(
                                    work.title,
                                    fontFamily = AbelFontFamily,
                                    fontSize = 16.sp,
                                    color = DistranColors.Ink,
                                    modifier = Modifier.weight(1f)
                                )
                                IconButton(
                                    enabled = idx > 0,
                                    onClick = {
                                        val next = ids.toMutableList()
                                        val tmp = next[idx]
                                        next[idx] = next[idx - 1]
                                        next[idx - 1] = tmp
                                        ids = next
                                    },
                                    modifier = Modifier.size(34.dp)
                                ) {
                                    Icon(
                                        Icons.AutoMirrored.Outlined.ArrowBack,
                                        "Move earlier",
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                IconButton(
                                    enabled = idx < ids.lastIndex,
                                    onClick = {
                                        val next = ids.toMutableList()
                                        val tmp = next[idx]
                                        next[idx] = next[idx + 1]
                                        next[idx + 1] = tmp
                                        ids = next
                                    },
                                    modifier = Modifier.size(34.dp)
                                ) {
                                    Icon(
                                        Icons.AutoMirrored.Outlined.ArrowForward,
                                        "Move later",
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        HorizontalDivider(color = DistranColors.Line)
        Spacer(Modifier.height(14.dp))
        val candidates = viewModel.catalogRepo.catalog.filter { it.medium == medium }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            candidates.forEach { w ->
                val selected = ids.contains(w.id)
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { toggle(w.id) },
                    shape = RoundedCornerShape(10.dp),
                    color = if (selected) DistranColors.Green.copy(alpha = 0.14f) else Color(0x06FFFFFF),
                    border = BorderStroke(
                        1.dp,
                        if (selected) DistranColors.Green.copy(alpha = 0.55f) else DistranColors.Line
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        WorkArtwork(work = w, cornerRadius = 5.dp, modifier = Modifier.width(38.dp).height(54.dp))
                        Text(
                            w.title,
                            fontFamily = AbelFontFamily,
                            fontSize = 16.sp,
                            color = DistranColors.Ink,
                            modifier = Modifier.weight(1f)
                        )
                        if (selected) {
                            Icon(Icons.Outlined.Check, contentDescription = null, tint = DistranColors.Green)
                        }
                    }
                }
            }
        }

        if (error.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            StatusBanner(message = error, isError = true)
        }
        Spacer(Modifier.height(18.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            DistranPrimaryButton(
                text = "Save your Top 4",
                trailingIcon = Icons.Outlined.Check,
                onClick = {
                    runCatching {
                        val otherFavorites = account.favorites.filter { viewModel.getWork(it)?.medium != medium }
                        viewModel.updateAccount(account.copy(favorites = otherFavorites + ids))
                        viewModel.notify("Your cornerstones, in your order.")
                        onDismiss()
                    }.onFailure {
                        error = it.message ?: "Could not save favourites."
                    }
                }
            )
        }
    }
}
