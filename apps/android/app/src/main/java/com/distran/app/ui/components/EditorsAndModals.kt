package com.distran.app.ui.components

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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.Movie
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.SportsEsports
import androidx.compose.material.icons.outlined.StarOutline
import androidx.compose.material.icons.outlined.Tv
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.distran.app.DistranViewModel
import com.distran.app.data.Account
import com.distran.app.data.ClaimInput
import com.distran.app.data.DistranStore
import com.distran.app.data.Log
import com.distran.app.data.LogStatus
import com.distran.app.data.Medium
import com.distran.app.data.Role
import com.distran.app.data.Shelf
import com.distran.app.data.Visibility
import com.distran.app.data.Work
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily
import java.time.LocalDate

@Composable
fun DistranModalDialog(
    title: String,
    subtitle: String = "YOUR CULTURAL MEMORY",
    onDismiss: () -> Unit,
    content: @Composable () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .heightIn(max = 720.dp),
            shape = RoundedCornerShape(20.dp),
            color = DistranColors.CardBg,
            border = BorderStroke(1.dp, Color(0x26FFFFFF))
        ) {
            Column(
                modifier = Modifier
                    .padding(22.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Eyebrow(subtitle)
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = title,
                            fontFamily = AbelFontFamily,
                            fontSize = 27.sp,
                            lineHeight = 31.sp,
                            color = DistranColors.Ink
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Outlined.Close,
                            contentDescription = "Close dialog",
                            tint = DistranColors.Muted
                        )
                    }
                }
                Spacer(Modifier.height(18.dp))
                content()
            }
        }
    }
}

@Composable
fun LogEditorDialog(
    work: Work,
    existing: Log?,
    onDismiss: () -> Unit,
    onSave: (Log) -> Unit,
    onDelete: (() -> Unit)? = null
) {
    var rating by remember(existing?.id) { mutableDoubleStateOf(existing?.rating ?: 0.0) }
    var note by remember(existing?.id) { mutableStateOf(existing?.note ?: "") }
    var status by remember(existing?.id) { mutableStateOf(existing?.status ?: LogStatus.COMPLETED) }
    var visibility by remember(existing?.id) { mutableStateOf(existing?.visibility ?: Visibility.PRIVATE) }
    var date by remember(existing?.id) {
        mutableStateOf(existing?.date?.take(10) ?: LocalDate.now().toString())
    }
    var error by remember { mutableStateOf("") }

    DistranModalDialog(
        title = if (existing != null) "A moment, revisited." else "Make it part of your story.",
        subtitle = "LOG A WORK",
        onDismiss = onDismiss
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            WorkArtwork(work = work, cornerRadius = 7.dp, modifier = Modifier.width(62.dp).height(86.dp))
            Column {
                Text(work.title, fontFamily = AbelFontFamily, fontSize = 24.sp, color = DistranColors.Ink)
                Spacer(Modifier.height(3.dp))
                Text(
                    text = "${work.medium.displayName.uppercase()} · ${if (work.year > 0) work.year else "TBA"}",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    color = DistranColors.Muted
                )
                if (work.maker.isNotBlank()) {
                    Spacer(Modifier.height(3.dp))
                    Text(work.maker, fontFamily = AbelFontFamily, fontSize = 13.sp, color = DistranColors.Subtle)
                }
            }
        }
        HorizontalDivider(color = DistranColors.Line)
        Spacer(Modifier.height(16.dp))

        Eyebrow("YOUR TIME WITH IT")
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            LogStatus.entries.forEach { item ->
                val selected = status == item
                Surface(
                    modifier = Modifier.clickable { status = item },
                    shape = RoundedCornerShape(8.dp),
                    color = if (selected) DistranColors.Green.copy(alpha = 0.16f) else Color(0x06FFFFFF),
                    border = BorderStroke(
                        1.dp,
                        if (selected) DistranColors.Green.copy(alpha = 0.6f) else Color(0x1DFFFFFF)
                    )
                ) {
                    Text(
                        text = item.label,
                        fontFamily = DmMonoFontFamily,
                        fontSize = 10.sp,
                        color = if (selected) DistranColors.Ink else DistranColors.Muted,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        Eyebrow("HOW DID IT STAY WITH YOU?")
        Spacer(Modifier.height(8.dp))
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            (1..5).forEach { n ->
                val active = rating >= n.toDouble()
                IconButton(
                    onClick = { rating = if (rating == n.toDouble()) 0.0 else n.toDouble() },
                    modifier = Modifier.size(40.dp)
                ) {
                    Icon(
                        imageVector = if (active) Icons.Rounded.Star else Icons.Outlined.StarOutline,
                        contentDescription = "Rate $n stars",
                        tint = if (active) DistranColors.Green else DistranColors.Muted,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
            Spacer(Modifier.width(8.dp))
            Text(
                text = if (rating > 0.0) "$rating / 5" else "Unrated",
                fontFamily = DmMonoFontFamily,
                fontSize = 11.sp,
                color = DistranColors.Green
            )
        }
        Spacer(Modifier.height(6.dp))
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            val steps = listOf(0.0) + (1..10).map { it / 2.0 }
            steps.forEach { step ->
                val selected = rating == step
                Surface(
                    modifier = Modifier.clickable { rating = step },
                    shape = RoundedCornerShape(6.dp),
                    color = if (selected) DistranColors.Ink else Color(0x08FFFFFF),
                    border = BorderStroke(1.dp, if (selected) DistranColors.Ink else Color(0x1AFFFFFF))
                ) {
                    Text(
                        text = if (step == 0.0) "Unrated" else "$step",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 9.sp,
                        color = if (selected) DistranColors.GreenDark else DistranColors.Muted,
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        DistranTextField(
            value = note,
            onValueChange = { if (it.length <= 4000) note = it },
            label = "A thought to keep (optional)",
            placeholder = "A feeling, a favourite moment, something you don’t want to forget…",
            singleLine = false,
            minLines = 3,
            maxLines = 5
        )

        Spacer(Modifier.height(14.dp))
        DistranTextField(
            value = date,
            onValueChange = { date = it },
            label = "Date (YYYY-MM-DD)",
            placeholder = LocalDate.now().toString()
        )

        Spacer(Modifier.height(14.dp))
        Eyebrow("WHO CAN SEE THIS?")
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Visibility.entries.forEach { v ->
                val selected = visibility == v
                Surface(
                    modifier = Modifier.clickable { visibility = v },
                    shape = RoundedCornerShape(8.dp),
                    color = if (selected) DistranColors.Green.copy(alpha = 0.14f) else Color(0x06FFFFFF),
                    border = BorderStroke(
                        1.dp,
                        if (selected) DistranColors.Green.copy(alpha = 0.55f) else Color(0x1DFFFFFF)
                    )
                ) {
                    Text(
                        text = v.label,
                        fontFamily = DmMonoFontFamily,
                        fontSize = 10.sp,
                        color = if (selected) DistranColors.Ink else DistranColors.Muted,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            }
        }

        if (error.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            StatusBanner(message = error, isError = true)
        }

        Spacer(Modifier.height(20.dp))
        HorizontalDivider(color = DistranColors.Line)
        Spacer(Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = if (existing != null && onDelete != null) {
                Arrangement.SpaceBetween
            } else {
                Arrangement.End
            },
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (existing != null && onDelete != null) {
                DistranSecondaryButton(
                    text = "Delete log",
                    onClick = {
                        runCatching { onDelete() }.onFailure { error = it.message ?: "Could not delete." }
                    },
                    leadingIcon = Icons.Outlined.DeleteOutline,
                    danger = true
                )
            }
            DistranPrimaryButton(
                text = if (existing != null) "Save changes" else "Save to my ledger",
                leadingIcon = Icons.Outlined.Add,
                onClick = {
                    val log = Log(
                        id = existing?.id ?: DistranStore.uniqueId(),
                        workId = work.id,
                        rating = rating,
                        note = note.trim(),
                        status = status,
                        visibility = visibility,
                        date = date.trim()
                    )
                    runCatching { onSave(log) }
                        .onFailure { error = it.message ?: "Could not save log." }
                }
            )
        }
    }
}

@Composable
fun ListEditorDialog(
    shelf: Shelf?,
    viewModel: DistranViewModel,
    onDismiss: () -> Unit,
    onSave: (Shelf) -> Unit
) {
    var title by remember(shelf?.id) { mutableStateOf(shelf?.title ?: "") }
    var description by remember(shelf?.id) { mutableStateOf(shelf?.description ?: "") }
    var visibility by remember(shelf?.id) { mutableStateOf(shelf?.visibility ?: Visibility.PRIVATE) }
    var ids by remember(shelf?.id) { mutableStateOf(shelf?.workIds ?: emptyList()) }
    var query by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    fun move(index: Int, delta: Int) {
        val next = ids.toMutableList()
        val target = index + delta
        if (target in next.indices) {
            val tmp = next[index]
            next[index] = next[target]
            next[target] = tmp
            ids = next
        }
    }

    DistranModalDialog(
        title = if (shelf != null) "Give it a new order." else "A list of your own.",
        subtitle = "ACROSS FORMATS. AROUND A FEELING.",
        onDismiss = onDismiss
    ) {
        DistranTextField(
            value = title,
            onValueChange = { if (it.length <= 100) title = it },
            label = "Name your list",
            placeholder = "Something like a feeling…"
        )
        Spacer(Modifier.height(14.dp))
        DistranTextField(
            value = description,
            onValueChange = { if (it.length <= 1000) description = it },
            label = "What holds it together?",
            placeholder = "A universe, an atmosphere, a weekend together.",
            singleLine = false,
            minLines = 2,
            maxLines = 4
        )
        Spacer(Modifier.height(14.dp))
        Eyebrow("VISIBILITY")
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Visibility.entries.forEach { v ->
                val selected = visibility == v
                Surface(
                    modifier = Modifier.clickable { visibility = v },
                    shape = RoundedCornerShape(8.dp),
                    color = if (selected) DistranColors.Green.copy(alpha = 0.14f) else Color(0x06FFFFFF),
                    border = BorderStroke(
                        1.dp,
                        if (selected) DistranColors.Green.copy(alpha = 0.55f) else Color(0x1DFFFFFF)
                    )
                ) {
                    Text(
                        text = v.label,
                        fontFamily = DmMonoFontFamily,
                        fontSize = 10.sp,
                        color = if (selected) DistranColors.Ink else DistranColors.Muted,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            }
        }

        if (ids.isNotEmpty()) {
            Spacer(Modifier.height(16.dp))
            Eyebrow("SELECTED ORDER (${ids.size})")
            Spacer(Modifier.height(8.dp))
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                ids.forEachIndexed { index, workId ->
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
                                    text = "${index + 1}",
                                    fontFamily = DmMonoFontFamily,
                                    fontSize = 10.sp,
                                    color = DistranColors.Green,
                                    modifier = Modifier.width(22.dp)
                                )
                                Text(
                                    text = work.title,
                                    fontFamily = AbelFontFamily,
                                    fontSize = 15.sp,
                                    color = DistranColors.Ink,
                                    modifier = Modifier.weight(1f)
                                )
                                IconButton(
                                    onClick = { move(index, -1) },
                                    enabled = index > 0,
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Outlined.ArrowUpward, "Move up", modifier = Modifier.size(16.dp))
                                }
                                IconButton(
                                    onClick = { move(index, 1) },
                                    enabled = index < ids.lastIndex,
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Outlined.ArrowDownward, "Move down", modifier = Modifier.size(16.dp))
                                }
                                IconButton(
                                    onClick = { ids = ids.filter { it != workId } },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        Icons.Outlined.DeleteOutline,
                                        "Remove",
                                        tint = DistranColors.Danger,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        DistranTextField(
            value = query,
            onValueChange = { query = it },
            label = "Find something for this list",
            placeholder = "Search titles…"
        )
        Spacer(Modifier.height(10.dp))
        val works = viewModel.knownWorks()
            .filter { it.title.contains(query.trim(), ignoreCase = true) }
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            works.forEach { w ->
                val included = ids.contains(w.id)
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            ids = if (included) ids.filter { it != w.id } else ids + w.id
                        },
                    shape = RoundedCornerShape(8.dp),
                    color = if (included) DistranColors.Green.copy(alpha = 0.12f) else Color(0x05FFFFFF),
                    border = BorderStroke(
                        1.dp,
                        if (included) DistranColors.Green.copy(alpha = 0.45f) else DistranColors.Line
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        WorkArtwork(work = w, cornerRadius = 4.dp, modifier = Modifier.width(34.dp).height(48.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(w.title, fontFamily = AbelFontFamily, fontSize = 15.sp, color = DistranColors.Ink)
                            Text(
                                w.medium.displayName.uppercase(),
                                fontFamily = DmMonoFontFamily,
                                fontSize = 8.sp,
                                color = DistranColors.Muted
                            )
                        }
                        Icon(
                            imageVector = if (included) Icons.Outlined.Check else Icons.Outlined.Add,
                            contentDescription = null,
                            tint = if (included) DistranColors.Green else DistranColors.Muted,
                            modifier = Modifier.size(18.dp)
                        )
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
                text = if (shelf != null) "Save list" else "Create list",
                trailingIcon = Icons.Outlined.Check,
                onClick = {
                    val next = Shelf(
                        source = shelf?.source,
                        id = shelf?.id ?: DistranStore.uniqueId(),
                        title = title.trim(),
                        description = description.trim(),
                        visibility = visibility,
                        workIds = ids
                    )
                    runCatching { onSave(next) }
                        .onFailure { error = it.message ?: "Could not save list." }
                }
            )
        }
    }
}

@Composable
fun ClaimEditorDialog(
    work: Work,
    account: Account,
    onDismiss: () -> Unit,
    onSubmit: (ClaimInput) -> Unit
) {
    if (account.role != Role.CREATOR) return
    var credit by remember { mutableStateOf("") }
    var evidence by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    DistranModalDialog(
        title = "Your part in ${work.title}",
        subtitle = "CLAIM A CREDIT",
        onDismiss = onDismiss
    ) {
        Text(
            text = "Tell us how you helped make this world. Claims are saved on this device as pending requests; ownership verification is not available in this preview.",
            fontFamily = AbelFontFamily,
            fontSize = 15.sp,
            color = DistranColors.Muted
        )
        Spacer(Modifier.height(16.dp))
        DistranTextField(
            value = credit,
            onValueChange = { if (it.length <= 100) credit = it },
            label = "Your credited role",
            placeholder = "Director, developer, producer…"
        )
        Spacer(Modifier.height(14.dp))
        DistranTextField(
            value = evidence,
            onValueChange = { if (it.length <= 1000) evidence = it },
            label = "Public evidence link",
            placeholder = "https://official-site.com/credits"
        )
        Spacer(Modifier.height(14.dp))
        DistranTextField(
            value = note,
            onValueChange = { if (it.length <= 2000) note = it },
            label = "Anything else we should know?",
            singleLine = false,
            minLines = 3,
            maxLines = 5
        )
        Spacer(Modifier.height(14.dp))
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Outlined.Fingerprint,
                contentDescription = null,
                tint = DistranColors.Green,
                modifier = Modifier.size(16.dp)
            )
            Text(
                text = "A request does not grant editing access or a verified ownership badge.",
                fontFamily = AbelFontFamily,
                fontSize = 13.sp,
                color = DistranColors.Muted
            )
        }
        if (error.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            StatusBanner(message = error, isError = true)
        }
        Spacer(Modifier.height(18.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            DistranPrimaryButton(
                text = "Save claim request",
                trailingIcon = Icons.Outlined.Check,
                onClick = {
                    runCatching {
                        onSubmit(ClaimInput(work.id, credit, evidence, note))
                    }.onFailure { error = it.message ?: "Could not save claim." }
                }
            )
        }
    }
}

@Composable
fun FormatSwitcherDialog(
    catalog: List<Work>,
    onSelectMedium: (Medium?) -> Unit,
    onDismiss: () -> Unit
) {
    DistranModalDialog(
        title = "Every format. One room.",
        subtitle = "FOLLOW YOUR CURIOSITY",
        onDismiss = onDismiss
    ) {
        Text(
            text = "The medium changes. Your taste comes with you.",
            fontFamily = AbelFontFamily,
            fontSize = 15.sp,
            color = DistranColors.Muted
        )
        Spacer(Modifier.height(16.dp))
        val items = listOf(
            Triple(Medium.GAME, "Games", Icons.Outlined.SportsEsports to DistranColors.Green),
            Triple(Medium.MOVIE, "Movies", Icons.Outlined.Movie to DistranColors.AmberBright),
            Triple(Medium.TV, "Television", Icons.Outlined.Tv to DistranColors.Cyan)
        )
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items.forEach { (medium, name, iconColor) ->
                val (icon, color) = iconColor
                val count = catalog.count { it.medium == medium }
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            onSelectMedium(medium)
                            onDismiss()
                        },
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0x07FFFFFF),
                    border = BorderStroke(1.dp, color.copy(alpha = 0.25f))
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Icon(icon, contentDescription = null, tint = color)
                        Column(modifier = Modifier.weight(1f)) {
                            Text(name, fontFamily = AbelFontFamily, fontSize = 20.sp, color = DistranColors.Ink)
                            Text(
                                "$count WORKS TO EXPLORE",
                                fontFamily = DmMonoFontFamily,
                                fontSize = 9.sp,
                                color = DistranColors.Muted
                            )
                        }
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
        Spacer(Modifier.height(16.dp))
        DistranPrimaryButton(
            text = "Explore everything",
            trailingIcon = Icons.Outlined.Explore,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                onSelectMedium(null)
                onDismiss()
            }
        )
        Spacer(Modifier.height(10.dp))
        Text(
            text = "Music, books and social are coming in the next chapter.",
            fontFamily = DmMonoFontFamily,
            fontSize = 10.sp,
            color = DistranColors.Muted
        )
    }
}

@Composable
fun NotificationsDialog(onDismiss: () -> Unit) {
    DistranModalDialog(
        title = "The room is quiet.",
        subtitle = "YOUR NOTIFICATIONS",
        onDismiss = onDismiss
    ) {
        EmptyState(
            icon = Icons.Outlined.Notifications,
            heading = "Nothing new just yet.",
            body = "When live activity is connected, updates from your people and the creators you follow will arrive here."
        )
    }
}

@Composable
fun OrientationHelpDialog(onDismiss: () -> Unit) {
    DistranModalDialog(
        title = "A place for what stays with you.",
        subtitle = "WELCOME TO DISTRAN",
        onDismiss = onDismiss
    ) {
        val steps = listOf(
            "01" to "Find a film, game or series in Discover.",
            "02" to "Log it. Leave a rating or keep a thought.",
            "03" to "Make a list that crosses formats.",
            "04" to "Give your favourites a place in your Top 4."
        )
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            steps.forEach { (num, copy) ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(DistranColors.Green.copy(alpha = 0.12f))
                            .border(1.dp, DistranColors.Green.copy(alpha = 0.35f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(num, fontFamily = DmMonoFontFamily, fontSize = 10.sp, color = DistranColors.Green)
                    }
                    Text(copy, fontFamily = AbelFontFamily, fontSize = 16.sp, color = DistranColors.Ink)
                }
            }
        }
        Spacer(Modifier.height(18.dp))
        Text(
            text = "This preview saves to this device. Live catalogs, messages and hosted authentication are still being connected.",
            fontFamily = DmMonoFontFamily,
            fontSize = 10.sp,
            lineHeight = 16.sp,
            color = DistranColors.Muted
        )
    }
}

@Composable
fun QuickLogDialog(
    works: List<Work>,
    onSelectWork: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var query by remember { mutableStateOf("") }
    DistranModalDialog(
        title = "What stayed with you?",
        subtitle = "ADD TO YOUR LEDGER",
        onDismiss = onDismiss
    ) {
        DistranTextField(
            value = query,
            onValueChange = { query = it },
            label = "Find a work",
            placeholder = "A film, a game, a series…"
        )
        Spacer(Modifier.height(12.dp))
        val matches = works.filter { it.title.contains(query.trim(), ignoreCase = true) }
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            matches.forEach { work ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            onDismiss()
                            onSelectWork(work.id)
                        },
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0x06FFFFFF),
                    border = BorderStroke(1.dp, DistranColors.Line)
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        WorkArtwork(work = work, cornerRadius = 5.dp, modifier = Modifier.width(38.dp).height(54.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(work.title, fontFamily = AbelFontFamily, fontSize = 16.sp, color = DistranColors.Ink)
                            Text(
                                "${work.medium.displayName} · ${work.year}",
                                fontFamily = DmMonoFontFamily,
                                fontSize = 9.sp,
                                color = DistranColors.Muted
                            )
                        }
                        Icon(Icons.Outlined.Add, contentDescription = null, tint = DistranColors.Green)
                    }
                }
            }
        }
    }
}
