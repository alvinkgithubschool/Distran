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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.Public
import androidx.compose.material.icons.automirrored.outlined.QueueMusic
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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.distran.app.DistranViewModel
import com.distran.app.data.Shelf
import com.distran.app.data.Visibility
import com.distran.app.ui.components.BuddyStrip
import com.distran.app.ui.components.DistranModalDialog
import com.distran.app.ui.components.DistranPrimaryButton
import com.distran.app.ui.components.DistranSecondaryButton
import com.distran.app.ui.components.EmptyState
import com.distran.app.ui.components.Eyebrow
import com.distran.app.ui.components.ListEditorDialog
import com.distran.app.ui.components.PageHeader
import com.distran.app.ui.components.PillTag
import com.distran.app.ui.components.WorkArtwork
import com.distran.app.ui.components.WorkRow
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily

@Composable
fun ListsScreen(
    viewModel: DistranViewModel,
    onOpenListDetail: (String) -> Unit,
    onOpenChat: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    var creating by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 18.dp)
    ) {
        PageHeader(
            eyebrow = "YOUR SHELF",
            title = "Lists",
            actions = {
                DistranPrimaryButton(
                    text = "New list",
                    leadingIcon = Icons.Outlined.Add,
                    onClick = { creating = true }
                )
            }
        )

        Spacer(Modifier.height(18.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Eyebrow("ORDERED. COMBINED. YOURS.")
                Spacer(Modifier.height(6.dp))
                Text(
                    text = buildAnnotatedString {
                        append("Every list,\n")
                        withStyle(SpanStyle(color = DistranColors.Green)) { append("one shelf.") }
                    },
                    fontFamily = AbelFontFamily,
                    fontSize = 28.sp,
                    lineHeight = 32.sp,
                    color = DistranColors.Ink
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "A game next to a film. A world next to a feeling.\nThe connection is yours to make.",
                    fontFamily = AbelFontFamily,
                    fontSize = 14.sp,
                    color = DistranColors.Muted
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = account.lists.size.toString().padStart(2, '0'),
                    fontFamily = AbelFontFamily,
                    fontSize = 34.sp,
                    color = DistranColors.Green
                )
                Text("COLLECTIONS", fontFamily = DmMonoFontFamily, fontSize = 8.sp, color = DistranColors.Subtle)
            }
        }

        Spacer(Modifier.height(20.dp))
        if (account.lists.isNotEmpty()) {
            val shelfTones = listOf(
                DistranColors.Green,
                DistranColors.Amber,
                DistranColors.Cyan,
                DistranColors.BuddyInk
            )
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                account.lists.forEachIndexed { index, list ->
                    ShelfCard(
                        shelf = list,
                        index = index,
                        accent = if (list.source == "buddy") DistranColors.BuddyInk else shelfTones[index % shelfTones.size],
                        viewModel = viewModel,
                        onClick = { onOpenListDetail(list.id) }
                    )
                }

                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { creating = true },
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0x05FFFFFF),
                    border = BorderStroke(1.dp, DistranColors.LineStrong)
                ) {
                    Column(
                        modifier = Modifier.padding(22.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            Icons.Outlined.Add,
                            contentDescription = null,
                            tint = DistranColors.Green,
                            modifier = Modifier.size(26.dp)
                        )
                        Text(
                            "A new way to connect the dots.",
                            fontFamily = AbelFontFamily,
                            fontSize = 20.sp,
                            color = DistranColors.Ink
                        )
                        Text(
                            "Make a list. Follow a feeling.",
                            fontFamily = AbelFontFamily,
                            fontSize = 14.sp,
                            color = DistranColors.Muted
                        )
                    }
                }
            }
        } else {
            EmptyState(
                icon = Icons.AutoMirrored.Outlined.QueueMusic,
                heading = "A blank shelf is a beginning.",
                body = "Collect the works that belong together. A medium is never a boundary.",
                actionLabel = "Make your first list",
                onAction = { creating = true }
            )
        }

        Spacer(Modifier.height(22.dp))
        BuddyStrip(onClick = onOpenChat)
        Spacer(Modifier.height(24.dp))
    }

    if (creating) {
        ListEditorDialog(
            shelf = null,
            viewModel = viewModel,
            onDismiss = { creating = false },
            onSave = { shelf ->
                viewModel.saveShelf(shelf, isEdit = false)
                creating = false
            }
        )
    }
}

@Composable
private fun ShelfCard(
    shelf: Shelf,
    index: Int,
    accent: Color,
    viewModel: DistranViewModel,
    onClick: () -> Unit
) {
    val isBuddy = shelf.source == "buddy"
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = if (isBuddy) Color(0xFF100E15) else DistranColors.Panel,
        border = BorderStroke(1.dp, if (isBuddy) DistranColors.BuddyLine else accent.copy(alpha = 0.22f))
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (isBuddy) {
                    PillTag(
                        text = "Made with Buddy",
                        color = DistranColors.BuddyInk,
                        borderColor = DistranColors.BuddyLine,
                        backgroundColor = DistranColors.BuddyHalo,
                        icon = Icons.Outlined.AutoAwesome
                    )
                } else {
                    Spacer(Modifier.width(1.dp))
                }
                Text(
                    text = "COLLECTION / ${(index + 1).toString().padStart(2, '0')}",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 8.sp,
                    color = DistranColors.Subtle
                )
            }
            Spacer(Modifier.height(12.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy((-14).dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val works = shelf.workIds.take(4).mapNotNull { viewModel.getWork(it) }
                if (works.isNotEmpty()) {
                    works.forEachIndexed { idx, work ->
                        Box(
                            modifier = Modifier
                                .rotate(((idx - 1) * 4).toFloat())
                                .width(54.dp)
                                .height(78.dp)
                                .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(6.dp))
                        ) {
                            WorkArtwork(work = work, cornerRadius = 6.dp, modifier = Modifier.fillMaxSize())
                        }
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .width(54.dp)
                            .height(78.dp)
                            .border(1.dp, DistranColors.LineStrong, RoundedCornerShape(6.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Add, contentDescription = null, tint = DistranColors.Muted)
                    }
                }
            }
            Spacer(Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = shelf.title,
                    fontFamily = AbelFontFamily,
                    fontSize = 23.sp,
                    color = DistranColors.Ink,
                    modifier = Modifier.weight(1f)
                )
                Icon(
                    Icons.Outlined.NorthEast,
                    contentDescription = null,
                    tint = DistranColors.Muted,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(Modifier.height(6.dp))
            Text(
                text = shelf.description.ifBlank { "A collection waiting for its first connection." },
                fontFamily = AbelFontFamily,
                fontSize = 14.sp,
                color = DistranColors.Muted
            )
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${shelf.workIds.size} WORKS",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    color = accent
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    val visIcon = when (shelf.visibility) {
                        Visibility.PRIVATE -> Icons.Outlined.Lock
                        Visibility.FRIENDS -> Icons.Outlined.Group
                        Visibility.PUBLIC -> Icons.Outlined.Public
                    }
                    Icon(
                        visIcon,
                        contentDescription = null,
                        tint = DistranColors.Subtle,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = shelf.visibility.badge,
                        fontFamily = DmMonoFontFamily,
                        fontSize = 8.sp,
                        color = DistranColors.Subtle
                    )
                }
            }
        }
    }
}

@Composable
fun ListDetailScreen(
    listId: String,
    viewModel: DistranViewModel,
    onBackToLists: () -> Unit,
    onOpenWork: (String) -> Unit,
    onOpenCreator: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    val publicCreators = remember(state.db) { viewModel.publicCreators() }
    val shelf = account.lists.firstOrNull { it.id == listId }

    var editing by remember { mutableStateOf(false) }
    var deleting by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 18.dp)
    ) {
        if (shelf == null) {
            EmptyState(
                heading = "This shelf isn’t here.",
                body = "It may have been removed, or belong to a different local account.",
                actionLabel = "Back to your lists",
                onAction = onBackToLists
            )
            return@Column
        }

        Row(
            modifier = Modifier
                .clickable(onClick = onBackToLists)
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
                "YOUR SHELVES",
                fontFamily = DmMonoFontFamily,
                fontSize = 9.sp,
                letterSpacing = 1.1.sp,
                color = DistranColors.Muted
            )
        }

        Spacer(Modifier.height(14.dp))
        Eyebrow("${shelf.visibility.id.uppercase()} COLLECTION · ${shelf.workIds.size} WORKS")
        Spacer(Modifier.height(6.dp))
        Text(
            text = shelf.title,
            fontFamily = AbelFontFamily,
            fontSize = 34.sp,
            lineHeight = 38.sp,
            color = DistranColors.Ink
        )
        if (shelf.source == "buddy") {
            Spacer(Modifier.height(10.dp))
            PillTag(
                text = "Started with Buddy",
                color = DistranColors.BuddyInk,
                borderColor = DistranColors.BuddyLine,
                backgroundColor = DistranColors.BuddyHalo,
                icon = Icons.Outlined.AutoAwesome
            )
        }
        if (shelf.description.isNotBlank()) {
            Spacer(Modifier.height(8.dp))
            Text(shelf.description, fontFamily = AbelFontFamily, fontSize = 15.sp, color = DistranColors.Muted)
        }

        Spacer(Modifier.height(14.dp))
        Row(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            DistranSecondaryButton(
                text = "Edit list",
                leadingIcon = Icons.Outlined.Edit,
                onClick = { editing = true }
            )
            Surface(
                modifier = Modifier.clickable { deleting = true },
                shape = RoundedCornerShape(999.dp),
                color = DistranColors.DangerBg,
                border = BorderStroke(1.dp, DistranColors.DangerLine)
            ) {
                IconButton(onClick = { deleting = true }, modifier = Modifier.size(40.dp)) {
                    Icon(
                        Icons.Outlined.DeleteOutline,
                        contentDescription = "Delete list",
                        tint = DistranColors.Danger,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(20.dp))
        HorizontalDivider(color = DistranColors.Line)
        if (shelf.workIds.isNotEmpty()) {
            shelf.workIds.forEachIndexed { idx, workId ->
                val work = viewModel.getWork(workId)
                if (work != null) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = (idx + 1).toString().padStart(2, '0'),
                            fontFamily = DmMonoFontFamily,
                            fontSize = 11.sp,
                            color = DistranColors.Subtle,
                            modifier = Modifier.width(28.dp)
                        )
                        WorkRow(
                            work = work,
                            onOpenWork = onOpenWork,
                            onOpenCreator = onOpenCreator,
                            publicCreators = publicCreators,
                            creatorDirectory = viewModel.creators,
                            isBuddy = shelf.source == "buddy",
                            modifier = Modifier.weight(1f)
                        )
                    }
                    HorizontalDivider(color = DistranColors.LineSoft)
                }
            }
        } else {
            Spacer(Modifier.height(16.dp))
            EmptyState(
                heading = "The first connection is yours.",
                body = "Edit this list to find and add some works.",
                actionLabel = "Add a work",
                onAction = { editing = true }
            )
        }

        Spacer(Modifier.height(18.dp))
        Text(
            text = "List visibility is saved as a preference. Sharing becomes available when the backend is connected.",
            fontFamily = DmMonoFontFamily,
            fontSize = 9.sp,
            lineHeight = 14.sp,
            color = DistranColors.Subtle
        )
        Spacer(Modifier.height(24.dp))
    }

    if (editing && shelf != null) {
        ListEditorDialog(
            shelf = shelf,
            viewModel = viewModel,
            onDismiss = { editing = false },
            onSave = { next ->
                viewModel.saveShelf(next, isEdit = true)
                editing = false
            }
        )
    }

    if (deleting && shelf != null) {
        DistranModalDialog(
            title = "Make room on your shelf?",
            subtitle = "DELETE LIST",
            onDismiss = { deleting = false }
        ) {
            Text(
                text = "“${shelf.title}” will be removed from this device. Your logged works stay in your ledger.",
                fontFamily = AbelFontFamily,
                fontSize = 15.sp,
                color = DistranColors.Muted
            )
            Spacer(Modifier.height(20.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.End)
            ) {
                DistranSecondaryButton(text = "Keep the list", onClick = { deleting = false })
                DistranSecondaryButton(
                    text = "Delete list",
                    danger = true,
                    onClick = {
                        viewModel.deleteShelf(shelf.id)
                        deleting = false
                        onBackToLists()
                    }
                )
            }
        }
    }
}
