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
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.distran.app.DistranViewModel
import com.distran.app.data.BuddyContext
import com.distran.app.data.BuddyInput
import com.distran.app.data.BuddyResult
import com.distran.app.data.BuddyTurn
import com.distran.app.data.DistranStore
import com.distran.app.data.Medium
import com.distran.app.data.Shelf
import com.distran.app.data.Visibility
import com.distran.app.ui.components.AvatarView
import com.distran.app.ui.components.DistranPrimaryButton
import com.distran.app.ui.components.DistranSecondaryButton
import com.distran.app.ui.components.DistranTextField
import com.distran.app.ui.components.Eyebrow
import com.distran.app.ui.components.PageHeader
import com.distran.app.ui.components.PillTag
import com.distran.app.ui.components.StatusBanner
import com.distran.app.ui.components.WorkCard
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private data class PreviewContact(val id: String, val name: String, val handle: String, val caption: String)
private data class BuddyExchange(val id: String, val question: String, val reply: String)

private val previewContacts = listOf(
    PreviewContact("ari0825", "Ari", "ari0825", "A room for your next co-op night."),
    PreviewContact("milo", "Milo", "milo", "Films that deserve a second watch.")
)

@Composable
fun ChatScreen(
    viewModel: DistranViewModel,
    onOpenWork: (String) -> Unit,
    onOpenCreator: (String) -> Unit,
    onOpenListDetail: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    var thread by remember { mutableStateOf("buddy") }
    var draft by remember { mutableStateOf("") }
    var contactQuery by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 18.dp)
    ) {
        PageHeader(eyebrow = "THE PEOPLE IN YOUR ROOM", title = "Buddy & friends")
        Spacer(Modifier.height(14.dp))

        // Thread switcher
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                modifier = Modifier.clickable { thread = "buddy" },
                shape = RoundedCornerShape(12.dp),
                color = if (thread == "buddy") Color(0xFF171322) else DistranColors.Panel,
                border = BorderStroke(
                    1.dp,
                    if (thread == "buddy") DistranColors.BuddyLine else DistranColors.Line
                )
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("✧", fontSize = 15.sp, color = DistranColors.BuddyInk)
                    Column {
                        Text("Buddy", fontFamily = AbelFontFamily, fontSize = 15.sp, color = DistranColors.Ink)
                        Text(
                            "FOLLOW A FEELING",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 7.sp,
                            color = DistranColors.BuddyInk
                        )
                    }
                }
            }
            previewContacts
                .filter { "${it.name} ${it.handle}".contains(contactQuery, ignoreCase = true) }
                .forEach { contact ->
                    val selected = thread == contact.id
                    Surface(
                        modifier = Modifier.clickable {
                            thread = contact.id
                            draft = ""
                        },
                        shape = RoundedCornerShape(12.dp),
                        color = if (selected) DistranColors.Green.copy(alpha = 0.14f) else DistranColors.Panel,
                        border = BorderStroke(
                            1.dp,
                            if (selected) DistranColors.Green.copy(alpha = 0.5f) else DistranColors.Line
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            AvatarView(name = contact.name, size = 28.dp)
                            Column {
                                Text(
                                    contact.name,
                                    fontFamily = AbelFontFamily,
                                    fontSize = 15.sp,
                                    color = DistranColors.Ink
                                )
                                Text(
                                    "@${contact.handle}",
                                    fontFamily = DmMonoFontFamily,
                                    fontSize = 8.sp,
                                    color = DistranColors.Muted
                                )
                            }
                        }
                    }
                }
        }

        Spacer(Modifier.height(10.dp))
        DistranTextField(
            value = contactQuery,
            onValueChange = { contactQuery = it },
            label = "Find a conversation",
            placeholder = "Filter preview contacts…",
            trailingIcon = {
                Icon(Icons.Outlined.Search, contentDescription = null, tint = DistranColors.Muted)
            }
        )

        Spacer(Modifier.height(16.dp))
        if (thread == "buddy") {
            BuddyPanel(
                viewModel = viewModel,
                onOpenWork = onOpenWork,
                onOpenCreator = onOpenCreator,
                onOpenListDetail = onOpenListDetail
            )
        } else {
            val active = previewContacts.first { it.id == thread }
            val messages = account.messages.filter { it.thread == thread }
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = DistranColors.Panel,
                border = BorderStroke(1.dp, DistranColors.LineStrong)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        AvatarView(name = active.name, size = 40.dp)
                        Column(modifier = Modifier.weight(1f)) {
                            Text(active.name, fontFamily = AbelFontFamily, fontSize = 20.sp, color = DistranColors.Ink)
                            Text(
                                "@${active.handle} · PREVIEW CONTACT",
                                fontFamily = DmMonoFontFamily,
                                fontSize = 8.sp,
                                color = DistranColors.Muted
                            )
                        }
                        PillTag(text = "LOCAL DRAFTS")
                    }
                    Spacer(Modifier.height(16.dp))
                    HorizontalDivider(color = DistranColors.Line)
                    Spacer(Modifier.height(16.dp))

                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            Icons.Outlined.ChatBubbleOutline,
                            contentDescription = null,
                            tint = DistranColors.Green,
                            modifier = Modifier.size(26.dp)
                        )
                        Eyebrow("EVERY CONVERSATION STARTS SOMEWHERE")
                        Text(
                            "A little room for you and ${active.name}.",
                            fontFamily = AbelFontFamily,
                            fontSize = 20.sp,
                            color = DistranColors.Ink
                        )
                        Text(active.caption, fontFamily = AbelFontFamily, fontSize = 14.sp, color = DistranColors.Muted)
                        Text(
                            "Try the conversation flow. Live delivery is not connected.",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 9.sp,
                            color = DistranColors.Subtle
                        )
                    }

                    if (messages.isNotEmpty()) {
                        Spacer(Modifier.height(16.dp))
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            messages.forEach { msg ->
                                val time = runCatching {
                                    DateTimeFormatter.ofPattern("HH:mm")
                                        .withZone(ZoneId.systemDefault())
                                        .format(Instant.parse(msg.date))
                                }.getOrElse { "" }
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    color = DistranColors.Raised,
                                    border = BorderStroke(1.dp, DistranColors.Line)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(
                                            msg.text,
                                            fontFamily = AbelFontFamily,
                                            fontSize = 15.sp,
                                            color = DistranColors.Ink
                                        )
                                        Spacer(Modifier.height(4.dp))
                                        Text(
                                            "$time · SAVED LOCALLY",
                                            fontFamily = DmMonoFontFamily,
                                            fontSize = 8.sp,
                                            color = DistranColors.Subtle
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            DistranTextField(
                                value = draft,
                                onValueChange = { if (it.length <= 4000) draft = it },
                                label = "Message",
                                placeholder = "A thought for ${active.name}…"
                            )
                        }
                        IconButton(
                            enabled = draft.isNotBlank(),
                            onClick = {
                                viewModel.saveMessageDraft(thread, draft)
                                draft = ""
                            },
                            modifier = Modifier
                                .padding(bottom = 4.dp)
                                .size(46.dp)
                                .clip(CircleShape)
                                .background(if (draft.isNotBlank()) DistranColors.Ink else Color(0x16FFFFFF))
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Outlined.Send,
                                contentDescription = "Save message locally",
                                tint = if (draft.isNotBlank()) DistranColors.GreenDark else DistranColors.Subtle
                            )
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "A conversation preview. Nothing is sent to another person.",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 9.sp,
                        color = DistranColors.Subtle
                    )
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
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    Icons.Outlined.Lock,
                    contentDescription = null,
                    tint = DistranColors.Muted,
                    modifier = Modifier.size(16.dp)
                )
                Column {
                    Text(
                        "A little room to try things.",
                        fontFamily = AbelFontFamily,
                        fontSize = 14.sp,
                        color = DistranColors.InkSoft
                    )
                    Text(
                        "Preview contacts are fictional. Messages stay on this device.",
                        fontFamily = AbelFontFamily,
                        fontSize = 12.sp,
                        color = DistranColors.Muted
                    )
                }
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
fun BuddyPanel(
    viewModel: DistranViewModel,
    onOpenWork: (String) -> Unit,
    onOpenCreator: (String) -> Unit,
    onOpenListDetail: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    val publicCreators = remember(state.db) { viewModel.publicCreators() }
    val scope = rememberCoroutineScope()

    var prompt by remember(account.id) { mutableStateOf("") }
    var refinement by remember(account.id) { mutableStateOf("") }
    var mode by remember(account.id) { mutableStateOf("chat") }
    var medium by remember(account.id) { mutableStateOf<Medium?>(null) }
    var minutes by remember(account.id) { mutableStateOf("") }
    var includeSeen by remember(account.id) { mutableStateOf(false) }
    var optionsExpanded by remember { mutableStateOf(false) }

    var context by remember(account.id) { mutableStateOf<BuddyContext?>(null) }
    var exchanges by remember(account.id) { mutableStateOf<List<BuddyExchange>>(emptyList()) }
    var result by remember(account.id) { mutableStateOf<BuddyResult?>(null) }
    var busy by remember(account.id) { mutableStateOf(false) }
    var error by remember(account.id) { mutableStateOf("") }
    var lastRequest by remember(account.id) { mutableStateOf("") }
    var listTitle by remember(account.id) { mutableStateOf("Your next connection") }
    var savedListId by remember(account.id) { mutableStateOf<String?>(null) }
    var selectedWorkIds by remember(account.id) { mutableStateOf<Set<String>>(emptySet()) }
    var expandedEvidence by remember { mutableStateOf<Set<String>>(emptySet()) }

    fun reset() {
        busy = false
        prompt = ""
        refinement = ""
        context = null
        exchanges = emptyList()
        result = null
        selectedWorkIds = emptySet()
        savedListId = null
        error = ""
        medium = null
        minutes = ""
        lastRequest = ""
    }

    fun submit() {
        val question = prompt.trim().ifEmpty {
            if (refinement.trim().isNotEmpty()) context?.theme.orEmpty().ifEmpty { lastRequest } else ""
        }
        if (question.isBlank() || busy) return
        scope.launch {
            busy = true
            error = ""
            val history = exchanges.takeLast(3).flatMap { turn ->
                listOf(
                    BuddyTurn("user", turn.question.take(2000)),
                    BuddyTurn("assistant", turn.reply.take(2000))
                )
            }
            val excludes = if (includeSeen) {
                emptyList()
            } else {
                (account.favorites + account.logs.map { it.workId }).distinct().takeLast(500)
            }
            val parsedMinutes = minutes.trim().toIntOrNull()?.takeIf { it > 0 }
            val input = BuddyInput(
                mode = mode,
                prompt = question.take(2000),
                refinement = refinement.trim(),
                medium = medium?.id ?: "all",
                excludeIds = excludes,
                maxMinutes = parsedMinutes,
                context = context,
                history = history
            )
            try {
                val next = viewModel.askBuddy(input)
                val asked = listOf(question, refinement.trim()).filter { it.isNotEmpty() }.joinToString(" · ")
                exchanges = (exchanges + BuddyExchange(DistranStore.uniqueId(), asked, next.reply)).takeLast(10)
                result = next
                context = next.context
                selectedWorkIds = next.items.map { it.work.id }.toSet()
                savedListId = null
                Medium.fromId(next.medium)?.let { medium = it }
                next.context?.maxMinutes?.let { minutes = it.toString() }
                lastRequest = next.context?.theme?.takeIf { it.isNotBlank() } ?: asked
                if (mode == "chat") {
                    prompt = ""
                    refinement = ""
                }
            } catch (e: Exception) {
                error = e.message ?: "Buddy is unavailable. Check that the backend is running and enabled."
            } finally {
                busy = false
            }
        }
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = Color(0xFF0E0D13),
        border = BorderStroke(1.dp, DistranColors.BuddyLine)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                PillTag(
                    text = "Buddy · Made for your request",
                    color = DistranColors.BuddyInk,
                    borderColor = DistranColors.BuddyLine,
                    backgroundColor = DistranColors.BuddyHalo,
                    icon = Icons.Outlined.AutoAwesome
                )
                if (exchanges.isNotEmpty()) {
                    Row(
                        modifier = Modifier.clickable { reset() },
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            Icons.Outlined.Refresh,
                            contentDescription = null,
                            tint = DistranColors.BuddyInk,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            "New conversation",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 9.sp,
                            color = DistranColors.BuddyInk
                        )
                    }
                }
            }

            Spacer(Modifier.height(12.dp))
            Text(
                "Follow a feeling with Buddy.",
                fontFamily = AbelFontFamily,
                fontSize = 26.sp,
                color = DistranColors.Ink
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "Talk about a mood, a theme, or something you love. I’ll find catalog picks you can explore and save.",
                fontFamily = AbelFontFamily,
                fontSize = 14.sp,
                color = DistranColors.Muted
            )

            if (exchanges.isEmpty()) {
                Spacer(Modifier.height(14.dp))
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(
                        "Cyberpunk stories across formats",
                        "Hopeful science fiction",
                        "Mysteries with a strange atmosphere"
                    ).forEach { example ->
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { prompt = example },
                            shape = RoundedCornerShape(10.dp),
                            color = Color(0x0AFFFFFF),
                            border = BorderStroke(1.dp, DistranColors.Line)
                        ) {
                            Text(
                                text = example,
                                fontFamily = AbelFontFamily,
                                fontSize = 14.sp,
                                color = DistranColors.InkSoft,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
                            )
                        }
                    }
                }
            }

            if (exchanges.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    exchanges.forEachIndexed { idx, turn ->
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            color = Color(0x08FFFFFF),
                            border = BorderStroke(1.dp, DistranColors.Line)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Eyebrow("YOU")
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    turn.question,
                                    fontFamily = AbelFontFamily,
                                    fontSize = 15.sp,
                                    color = DistranColors.Ink
                                )
                            }
                        }
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF14111D),
                            border = BorderStroke(1.dp, DistranColors.BuddyLine)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                PillTag(
                                    text = if (idx == exchanges.lastIndex && result?.degraded == true) {
                                        "Buddy · Catalog fallback"
                                    } else {
                                        "Buddy"
                                    },
                                    color = DistranColors.BuddyInk,
                                    borderColor = DistranColors.BuddyLine,
                                    backgroundColor = DistranColors.BuddyHalo,
                                    icon = Icons.Outlined.AutoAwesome
                                )
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    turn.reply,
                                    fontFamily = AbelFontFamily,
                                    fontSize = 15.sp,
                                    lineHeight = 21.sp,
                                    color = DistranColors.InkSoft
                                )
                            }
                        }
                    }
                }
            }

            result?.let { current ->
                Spacer(Modifier.height(16.dp))
                if (current.degraded) {
                    Text(
                        text = "The free model is unavailable or its answer couldn’t be verified. These are catalog fallback results.",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 9.sp,
                        color = DistranColors.Muted
                    )
                    Spacer(Modifier.height(10.dp))
                }
                if (current.items.isNotEmpty()) {
                    PillTag(
                        text = "Buddy picks · ${current.items.size} catalog matches",
                        color = DistranColors.BuddyInk,
                        borderColor = DistranColors.BuddyLine,
                        backgroundColor = DistranColors.BuddyHalo,
                        icon = Icons.Outlined.AutoAwesome
                    )
                    Spacer(Modifier.height(12.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        current.items.forEach { pick ->
                            val isEvidenceOpen = expandedEvidence.contains(pick.work.id)
                            val checked = selectedWorkIds.contains(pick.work.id)
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, DistranColors.BuddyLine, RoundedCornerShape(12.dp))
                                    .padding(12.dp)
                            ) {
                                WorkCard(
                                    work = pick.work,
                                    onOpenWork = onOpenWork,
                                    onOpenCreator = onOpenCreator,
                                    publicCreators = publicCreators,
                                    creatorDirectory = viewModel.creators,
                                    isBuddy = true
                                )
                                if (pick.reason.isNotBlank()) {
                                    Spacer(Modifier.height(8.dp))
                                    Text(
                                        pick.reason,
                                        fontFamily = AbelFontFamily,
                                        fontSize = 14.sp,
                                        color = DistranColors.InkSoft
                                    )
                                }
                                if (pick.evidence.isNotBlank()) {
                                    Spacer(Modifier.height(6.dp))
                                    Row(
                                        modifier = Modifier.clickable {
                                            expandedEvidence = if (isEvidenceOpen) {
                                                expandedEvidence - pick.work.id
                                            } else {
                                                expandedEvidence + pick.work.id
                                            }
                                        },
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Text(
                                            "Catalog evidence",
                                            fontFamily = DmMonoFontFamily,
                                            fontSize = 9.sp,
                                            color = DistranColors.BuddyInk
                                        )
                                        Icon(
                                            imageVector = if (isEvidenceOpen) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                                            contentDescription = null,
                                            tint = DistranColors.BuddyInk,
                                            modifier = Modifier.size(15.dp)
                                        )
                                    }
                                    if (isEvidenceOpen) {
                                        Spacer(Modifier.height(4.dp))
                                        Text(
                                            pick.evidence,
                                            fontFamily = AbelFontFamily,
                                            fontSize = 13.sp,
                                            color = DistranColors.Muted
                                        )
                                    }
                                }
                                Spacer(Modifier.height(4.dp))
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.clickable(enabled = !busy && savedListId == null) {
                                        selectedWorkIds = if (checked) {
                                            selectedWorkIds - pick.work.id
                                        } else {
                                            selectedWorkIds + pick.work.id
                                        }
                                    }
                                ) {
                                    Checkbox(
                                        checked = checked,
                                        enabled = !busy && savedListId == null,
                                        onCheckedChange = { on ->
                                            selectedWorkIds =
                                                if (on) selectedWorkIds + pick.work.id else selectedWorkIds - pick.work.id
                                        },
                                        colors = CheckboxDefaults.colors(
                                            checkedColor = DistranColors.BuddyInk,
                                            checkmarkColor = DistranColors.GreenDark
                                        )
                                    )
                                    Text(
                                        "Include in list",
                                        fontFamily = AbelFontFamily,
                                        fontSize = 14.sp,
                                        color = DistranColors.Ink
                                    )
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0x08FFFFFF),
                        border = BorderStroke(1.dp, DistranColors.Line)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            DistranTextField(
                                value = listTitle,
                                onValueChange = { if (it.length <= 100) listTitle = it },
                                label = "List name"
                            )
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = "${selectedWorkIds.size} picks selected. Saved privately on this device.",
                                fontFamily = DmMonoFontFamily,
                                fontSize = 9.sp,
                                color = DistranColors.Muted
                            )
                            Spacer(Modifier.height(10.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                DistranPrimaryButton(
                                    text = "Save list",
                                    enabled = !busy && savedListId == null && selectedWorkIds.isNotEmpty() && listTitle.isNotBlank(),
                                    onClick = {
                                        val shelf = Shelf(
                                            source = "buddy",
                                            id = DistranStore.uniqueId(),
                                            title = listTitle.trim(),
                                            description = lastRequest.take(1000),
                                            visibility = Visibility.PRIVATE,
                                            workIds = current.items.filter { selectedWorkIds.contains(it.work.id) }
                                                .map { it.work.id }
                                        )
                                        runCatching { viewModel.saveBuddyShelf(shelf) }
                                            .onSuccess { savedListId = shelf.id }
                                            .onFailure { viewModel.notify(it.message ?: "Could not save list.") }
                                    }
                                )
                                savedListId?.let { id ->
                                    Row(
                                        modifier = Modifier.clickable { onOpenListDetail(id) },
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Text(
                                            "Open saved list",
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
                            }
                        }
                    }
                }

                current.discovery?.let { disc ->
                    Spacer(Modifier.height(10.dp))
                    val scopeCopy = when (disc.scope) {
                        "live_catalog" -> "Searched ${disc.providers.joinToString(" + ") { it.uppercase() }} · ${disc.candidateCount} catalog candidates considered."
                        "conversation" -> "Using the catalog context from this conversation."
                        else -> "Using cached catalog matches. Live catalog search is unavailable for this turn."
                    }
                    Text(
                        text = scopeCopy + if (disc.errors.isNotEmpty()) " Some provider searches were unavailable." else "",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 9.sp,
                        color = DistranColors.Muted
                    )
                }
            }

            Spacer(Modifier.height(18.dp))
            DistranTextField(
                value = prompt,
                onValueChange = { if (it.length <= 2000) prompt = it },
                label = if (exchanges.isNotEmpty()) "Your next message" else "What are you looking for?",
                placeholder = if (exchanges.isNotEmpty()) {
                    "More hopeful, games only, or tell me why one fits…"
                } else {
                    "Eerie stories about isolation, or something like Cyberpunk…"
                },
                singleLine = false,
                minLines = 3,
                maxLines = 5
            )

            Spacer(Modifier.height(10.dp))
            Row(
                modifier = Modifier
                    .clickable { optionsExpanded = !optionsExpanded }
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    "Formats and preferences",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 10.sp,
                    color = DistranColors.BuddyInk
                )
                Icon(
                    imageVector = if (optionsExpanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                    contentDescription = null,
                    tint = DistranColors.BuddyInk,
                    modifier = Modifier.size(16.dp)
                )
            }

            if (optionsExpanded) {
                Spacer(Modifier.height(8.dp))
                Eyebrow("RESPONSE STYLE")
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(
                        "chat" to "Chat & recommendations",
                        "recommendations" to "List only"
                    ).forEach { (id, label) ->
                        val selected = mode == id
                        Surface(
                            modifier = Modifier.clickable { mode = id },
                            shape = RoundedCornerShape(8.dp),
                            color = if (selected) DistranColors.BuddyHalo else Color(0x06FFFFFF),
                            border = BorderStroke(1.dp, if (selected) DistranColors.BuddyLine else DistranColors.Line)
                        ) {
                            Text(
                                text = label,
                                fontFamily = DmMonoFontFamily,
                                fontSize = 9.sp,
                                color = if (selected) DistranColors.Ink else DistranColors.Muted,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp)
                            )
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
                Eyebrow("FORMAT")
                Spacer(Modifier.height(6.dp))
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(
                        null to "Every format",
                        Medium.GAME to "Games",
                        Medium.MOVIE to "Films",
                        Medium.TV to "Series"
                    ).forEach { (m, label) ->
                        val selected = medium == m
                        Surface(
                            modifier = Modifier.clickable { medium = m },
                            shape = RoundedCornerShape(8.dp),
                            color = if (selected) DistranColors.BuddyHalo else Color(0x06FFFFFF),
                            border = BorderStroke(1.dp, if (selected) DistranColors.BuddyLine else DistranColors.Line)
                        ) {
                            Text(
                                text = label,
                                fontFamily = DmMonoFontFamily,
                                fontSize = 9.sp,
                                color = if (selected) DistranColors.Ink else DistranColors.Muted,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp)
                            )
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
                DistranTextField(
                    value = minutes,
                    onValueChange = { value -> minutes = value.filter { it.isDigit() } },
                    label = "Maximum minutes",
                    placeholder = "Optional · verified durations only"
                )
                Spacer(Modifier.height(10.dp))
                DistranTextField(
                    value = refinement,
                    onValueChange = { if (it.length <= 500) refinement = it },
                    label = "Refine your request",
                    placeholder = "More hopeful, or games only…"
                )
                Spacer(Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Include favourites and logged titles",
                        fontFamily = AbelFontFamily,
                        fontSize = 14.sp,
                        color = DistranColors.InkSoft,
                        modifier = Modifier.weight(1f)
                    )
                    Switch(
                        checked = includeSeen,
                        onCheckedChange = { includeSeen = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = DistranColors.GreenDark,
                            checkedTrackColor = DistranColors.BuddyInk
                        )
                    )
                }
            }

            Spacer(Modifier.height(10.dp))
            Text(
                text = "Your recent Buddy messages and public catalog text go to free AI providers. Notes and account details stay here. Unknown durations are excluded when a time limit is set.",
                fontFamily = DmMonoFontFamily,
                fontSize = 9.sp,
                lineHeight = 14.sp,
                color = DistranColors.Subtle
            )

            Spacer(Modifier.height(14.dp))
            if (busy) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    CircularProgressIndicator(
                        color = DistranColors.BuddyInk,
                        modifier = Modifier.size(18.dp),
                        strokeWidth = 2.dp
                    )
                    Text(
                        "Checking catalog matches and preparing your reply…",
                        fontFamily = AbelFontFamily,
                        fontSize = 14.sp,
                        color = DistranColors.BuddyInk
                    )
                }
            } else {
                DistranPrimaryButton(
                    text = if (exchanges.isNotEmpty()) "Send to Buddy" else "Ask Buddy",
                    enabled = prompt.isNotBlank() || refinement.isNotBlank(),
                    onClick = { submit() }
                )
            }

            if (error.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                StatusBanner(
                    message = "$error Your last results are still available.",
                    isError = true
                )
            }
        }
    }
}
