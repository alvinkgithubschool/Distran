package com.distran.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.CloudQueue
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.Link
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.distran.app.DistranViewModel
import com.distran.app.data.ImageUtils
import com.distran.app.data.Role
import com.distran.app.ui.components.AvatarView
import com.distran.app.ui.components.DistranModalDialog
import com.distran.app.ui.components.DistranPrimaryButton
import com.distran.app.ui.components.DistranSecondaryButton
import com.distran.app.ui.components.DistranTextField
import com.distran.app.ui.components.Eyebrow
import com.distran.app.ui.components.PageHeader
import com.distran.app.ui.components.PillTag
import com.distran.app.ui.components.StatusBanner
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    viewModel: DistranViewModel,
    onBackToProfile: () -> Unit,
    onSignedOut: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account ?: return
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    val scope = rememberCoroutineScope()

    var editing by remember { mutableStateOf(false) }
    var exporting by remember { mutableStateOf(false) }
    var deleting by remember { mutableStateOf(false) }

    var apiUrlInput by remember(state.apiBaseUrl) { mutableStateOf(state.apiBaseUrl) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 18.dp)
    ) {
        Row(
            modifier = Modifier
                .clickable(onClick = onBackToProfile)
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
                "YOUR ROOM",
                fontFamily = DmMonoFontFamily,
                fontSize = 9.sp,
                letterSpacing = 1.1.sp,
                color = DistranColors.Muted
            )
        }

        Spacer(Modifier.height(10.dp))
        PageHeader(eyebrow = "MAKE YOURSELF AT HOME", title = "Settings")
        Spacer(Modifier.height(16.dp))

        // Profile summary card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = DistranColors.Panel,
            border = BorderStroke(1.dp, DistranColors.Line)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    AvatarView(name = account.name, image = account.avatar, size = 58.dp)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(account.name, fontFamily = AbelFontFamily, fontSize = 22.sp, color = DistranColors.Ink)
                        Text(account.email, fontFamily = AbelFontFamily, fontSize = 14.sp, color = DistranColors.Muted)
                        Spacer(Modifier.height(6.dp))
                        PillTag(
                            text = if (account.role == Role.CREATOR) "CREATOR · ON DISTRAN" else "LOCAL PREVIEW ACCOUNT"
                        )
                    }
                }
                Spacer(Modifier.height(14.dp))
                DistranSecondaryButton(
                    text = "Edit profile",
                    leadingIcon = Icons.Outlined.Edit,
                    onClick = { editing = true }
                )
            }
        }

        Spacer(Modifier.height(22.dp))
        SettingsGroupHeader(icon = Icons.Outlined.Shield, label = "Your space, your rules")
        Spacer(Modifier.height(10.dp))
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            color = DistranColors.Panel,
            border = BorderStroke(1.dp, DistranColors.Line)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Private profile",
                            fontFamily = AbelFontFamily,
                            fontSize = 17.sp,
                            color = DistranColors.Ink
                        )
                        Text(
                            text = if (account.role == Role.CREATOR) {
                                "Hide your creator page from other accounts on this device."
                            } else {
                                "A little room of your own. Saved as a preference for future sharing."
                            },
                            fontFamily = AbelFontFamily,
                            fontSize = 13.sp,
                            color = DistranColors.Muted
                        )
                    }
                    Switch(
                        checked = account.settings.privateProfile,
                        onCheckedChange = { checked ->
                            runCatching {
                                viewModel.updateAccount(
                                    account.copy(settings = account.settings.copy(privateProfile = checked))
                                )
                            }.onFailure { viewModel.notify(it.message ?: "Could not save.") }
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = DistranColors.GreenDark,
                            checkedTrackColor = DistranColors.Green
                        )
                    )
                }
                HorizontalDivider(color = DistranColors.LineSoft)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Stay in the loop",
                            fontFamily = AbelFontFamily,
                            fontSize = 17.sp,
                            color = DistranColors.Ink
                        )
                        Text(
                            text = "Save your notification preference. Live notifications are not enabled yet.",
                            fontFamily = AbelFontFamily,
                            fontSize = 13.sp,
                            color = DistranColors.Muted
                        )
                    }
                    Switch(
                        checked = account.settings.notifications,
                        onCheckedChange = { checked ->
                            runCatching {
                                viewModel.updateAccount(
                                    account.copy(settings = account.settings.copy(notifications = checked))
                                )
                            }.onFailure { viewModel.notify(it.message ?: "Could not save.") }
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = DistranColors.GreenDark,
                            checkedTrackColor = DistranColors.Green
                        )
                    )
                }
            }
        }

        Spacer(Modifier.height(22.dp))
        SettingsGroupHeader(icon = Icons.Outlined.CloudQueue, label = "Live catalog & Buddy backend")
        Spacer(Modifier.height(10.dp))
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            color = DistranColors.Panel,
            border = BorderStroke(1.dp, DistranColors.Line)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                DistranTextField(
                    value = apiUrlInput,
                    onValueChange = { apiUrlInput = it },
                    label = "Backend API URL",
                    placeholder = "http://10.0.2.2:8000/v1"
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Emulator connects to host localhost via 10.0.2.2. Leave empty for offline curated preview only.",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    color = DistranColors.Subtle
                )
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    DistranSecondaryButton(
                        text = "Save API URL",
                        leadingIcon = Icons.Outlined.Check,
                        onClick = {
                            viewModel.updateApiBaseUrl(apiUrlInput)
                            viewModel.notify("Backend URL updated.")
                        }
                    )
                }
            }
        }

        Spacer(Modifier.height(22.dp))
        SettingsGroupHeader(icon = Icons.Outlined.Link, label = "Your other shelves")
        Spacer(Modifier.height(6.dp))
        Text(
            text = "Bring your worlds together. Connections are coming in a future chapter.",
            fontFamily = AbelFontFamily,
            fontSize = 14.sp,
            color = DistranColors.Muted
        )
        Spacer(Modifier.height(10.dp))
        val externalServices = listOf(
            Triple("Letterboxd", "Your film diary", "●●●"),
            Triple("IMDb", "Your watchlist", "IMDb"),
            Triple("Backloggd", "Your game collection", "b."),
            Triple("Steam", "Your game library", "↗"),
            Triple("Xbox", "Your game library", "X"),
            Triple("PlayStation", "Your game library", "△"),
            Triple("Spotify", "Your listening world", "≋"),
            Triple("Apple Music", "Your music library", "♫")
        )
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            externalServices.chunked(2).forEach { pair ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    pair.forEach { (name, caption, symbol) ->
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            color = Color(0x05FFFFFF),
                            border = BorderStroke(1.dp, DistranColors.LineSoft)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    symbol,
                                    fontFamily = DmMonoFontFamily,
                                    fontSize = 11.sp,
                                    color = DistranColors.Muted
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        name,
                                        fontFamily = AbelFontFamily,
                                        fontSize = 14.sp,
                                        color = DistranColors.InkSoft
                                    )
                                    Text(
                                        caption,
                                        fontFamily = AbelFontFamily,
                                        fontSize = 11.sp,
                                        color = DistranColors.Subtle
                                    )
                                }
                                Icon(
                                    Icons.Outlined.Lock,
                                    contentDescription = null,
                                    tint = DistranColors.Subtle,
                                    modifier = Modifier.size(13.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(22.dp))
        SettingsGroupHeader(icon = Icons.Outlined.Download, label = "Your memory belongs to you")
        Spacer(Modifier.height(10.dp))
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            color = DistranColors.Panel,
            border = BorderStroke(1.dp, DistranColors.Line)
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { exporting = true }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "View and copy your data",
                            fontFamily = AbelFontFamily,
                            fontSize = 17.sp,
                            color = DistranColors.Ink
                        )
                        Text(
                            "Your profile, logs, lists and local messages. All in one place.",
                            fontFamily = AbelFontFamily,
                            fontSize = 13.sp,
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
                HorizontalDivider(color = DistranColors.LineSoft)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { deleting = true }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Delete this local account",
                            fontFamily = AbelFontFamily,
                            fontSize = 17.sp,
                            color = DistranColors.Danger
                        )
                        Text(
                            "Remove this account and its saved data from this device.",
                            fontFamily = AbelFontFamily,
                            fontSize = 13.sp,
                            color = DistranColors.Muted
                        )
                    }
                    Icon(
                        Icons.Outlined.DeleteOutline,
                        contentDescription = null,
                        tint = DistranColors.Danger,
                        modifier = Modifier.size(18.dp)
                    )
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
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Eyebrow("A NOTE ABOUT THIS ROOM")
                Text(
                    text = "Distran is a school project about cultural memory. This Android Jetpack Compose edition uses a curated local catalog plus live TMDB and IGDB search, and saves on this device. Hosted sign-in, messaging and account sync are still being connected. Home recommendations and Buddy are available as a local preview.",
                    fontFamily = AbelFontFamily,
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    color = DistranColors.InkSoft
                )
                Text(
                    text = "Artwork from the supplied Figma designs, Steam and TMDB. This product uses the TMDB API image service but is not endorsed or certified by TMDB. Images belong to their respective rights holders. Preview ratings are illustrative, not live community ratings.",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    lineHeight = 14.sp,
                    color = DistranColors.Subtle
                )
                Text(
                    text = "DISTRAN 0.2 / ANDROID COMPOSE / ONE LEDGER. EVERY FORMAT.",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    color = DistranColors.Green
                )
            }
        }

        Spacer(Modifier.height(18.dp))
        DistranSecondaryButton(
            text = "Sign out · Your memories stay saved.",
            leadingIcon = Icons.AutoMirrored.Outlined.Logout,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                viewModel.signOut()
                onSignedOut()
            }
        )
        Spacer(Modifier.height(24.dp))
    }

    if (editing) {
        var name by remember { mutableStateOf(account.name) }
        var handle by remember { mutableStateOf(account.handle) }
        var bio by remember { mutableStateOf(account.bio) }
        var website by remember { mutableStateOf(account.website ?: "") }
        var avatar by remember { mutableStateOf(account.avatar ?: "") }
        var banner by remember { mutableStateOf(account.banner ?: "") }
        var imageBusy by remember { mutableStateOf(false) }
        var error by remember { mutableStateOf("") }

        val avatarPicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
            if (uri == null) return@rememberLauncherForActivityResult
            scope.launch {
                imageBusy = true
                error = ""
                runCatching { ImageUtils.resizeProfileImage(context, uri, ImageUtils.ProfileImageKind.AVATAR) }
                    .onSuccess { avatar = it }
                    .onFailure { error = it.message ?: "Could not load avatar." }
                imageBusy = false
            }
        }
        val bannerPicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
            if (uri == null) return@rememberLauncherForActivityResult
            scope.launch {
                imageBusy = true
                error = ""
                runCatching { ImageUtils.resizeProfileImage(context, uri, ImageUtils.ProfileImageKind.BANNER) }
                    .onSuccess { banner = it }
                    .onFailure { error = it.message ?: "Could not load banner." }
                imageBusy = false
            }
        }

        DistranModalDialog(
            title = "A little more you.",
            subtitle = "EDIT YOUR PROFILE",
            onDismiss = { editing = false }
        ) {
            Eyebrow("PROFILE IMAGES")
            Spacer(Modifier.height(8.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                AvatarView(name = name.ifBlank { account.name }, image = avatar.ifBlank { null }, size = 56.dp)
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    DistranSecondaryButton(
                        text = "Change photo",
                        leadingIcon = Icons.Outlined.Image,
                        enabled = !imageBusy,
                        onClick = {
                            avatarPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                        }
                    )
                    if (avatar.isNotBlank()) {
                        Text(
                            text = "Remove photo",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 9.sp,
                            color = DistranColors.Danger,
                            modifier = Modifier.clickable { avatar = "" }
                        )
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            if (banner.isNotBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(90.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .border(1.dp, DistranColors.Line, RoundedCornerShape(10.dp))
                ) {
                    BannerImageView(
                        banner = banner,
                        contentDescription = "Banner preview",
                        modifier = Modifier.fillMaxSize()
                    )
                }
                Spacer(Modifier.height(8.dp))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                DistranSecondaryButton(
                    text = if (banner.isBlank()) "Add banner" else "Change banner",
                    leadingIcon = Icons.Outlined.Image,
                    enabled = !imageBusy,
                    onClick = {
                        bannerPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                    }
                )
                if (banner.isNotBlank()) {
                    Text(
                        text = "Remove banner",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 9.sp,
                        color = DistranColors.Danger,
                        modifier = Modifier.clickable { banner = "" }
                    )
                }
            }

            Spacer(Modifier.height(14.dp))
            DistranTextField(
                value = name,
                onValueChange = { if (it.length <= 60) name = it },
                label = "Name"
            )
            Spacer(Modifier.height(12.dp))
            DistranTextField(
                value = handle,
                onValueChange = { if (it.length <= 24) handle = it.lowercase() },
                label = "Handle"
            )
            Spacer(Modifier.height(12.dp))
            DistranTextField(
                value = bio,
                onValueChange = { if (it.length <= 400) bio = it },
                label = "A little about your world",
                singleLine = false,
                minLines = 3,
                maxLines = 5
            )
            if (account.role == Role.CREATOR) {
                Spacer(Modifier.height(12.dp))
                DistranTextField(
                    value = website,
                    onValueChange = { website = it },
                    label = "Studio website",
                    placeholder = "https://your-studio.com"
                )
            }
            if (error.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                StatusBanner(message = error, isError = true)
            }
            Spacer(Modifier.height(18.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                DistranPrimaryButton(
                    text = "Save profile",
                    trailingIcon = Icons.Outlined.Check,
                    enabled = !imageBusy,
                    onClick = {
                        if (name.trim().isEmpty() || !Regex("^[a-z0-9_]{3,24}$").matches(handle)) {
                            error = "Choose a name and a handle with 3–24 letters, numbers or underscores."
                            return@DistranPrimaryButton
                        }
                        if (website.isNotBlank() && !Regex("^https?://", RegexOption.IGNORE_CASE).containsMatchIn(
                                website
                            )
                        ) {
                            error = "Website links should start with https://."
                            return@DistranPrimaryButton
                        }
                        runCatching {
                            viewModel.updateAccount(
                                account.copy(
                                    name = name.trim(),
                                    handle = handle,
                                    bio = bio.trim(),
                                    website = website.trim().ifEmpty { null },
                                    avatar = avatar.ifEmpty { null },
                                    banner = banner.ifEmpty { null }
                                )
                            )
                            editing = false
                            viewModel.notify("Your room, refreshed.")
                        }.onFailure {
                            error = it.message ?: "Could not save profile."
                        }
                    }
                )
            }
        }
    }

    if (exporting) {
        val exportJson = remember(account) { viewModel.store.exportAccountJson(account) }
        DistranModalDialog(
            title = "A little archive of you.",
            subtitle = "YOUR DATA / JSON",
            onDismiss = { exporting = false }
        ) {
            Text(
                text = "Only this account’s data. No passwords or authentication details.",
                fontFamily = AbelFontFamily,
                fontSize = 14.sp,
                color = DistranColors.Muted
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = exportJson,
                onValueChange = {},
                readOnly = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(260.dp),
                textStyle = androidx.compose.ui.text.TextStyle(
                    fontFamily = DmMonoFontFamily,
                    fontSize = 10.sp,
                    color = DistranColors.InkSoft
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color(0xFF0A0A0C),
                    unfocusedContainerColor = Color(0xFF0A0A0C),
                    focusedBorderColor = DistranColors.LineStrong,
                    unfocusedBorderColor = DistranColors.Line
                )
            )
            Spacer(Modifier.height(14.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                DistranPrimaryButton(
                    text = "Copy archive",
                    leadingIcon = Icons.Outlined.ContentCopy,
                    onClick = {
                        clipboard.setText(AnnotatedString(exportJson))
                        viewModel.notify("Your archive is copied.")
                    }
                )
            }
        }
    }

    if (deleting) {
        DistranModalDialog(
            title = "Close this little room?",
            subtitle = "DELETE LOCAL ACCOUNT",
            onDismiss = { deleting = false }
        ) {
            Text(
                text = "This removes ${account.email}, its logs, lists and messages from this device. This cannot be undone.",
                fontFamily = AbelFontFamily,
                fontSize = 15.sp,
                color = DistranColors.Muted
            )
            Spacer(Modifier.height(20.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.End)
            ) {
                DistranSecondaryButton(text = "Keep my room", onClick = { deleting = false })
                DistranSecondaryButton(
                    text = "Delete my local account",
                    danger = true,
                    onClick = {
                        viewModel.deleteActiveAccount()
                        deleting = false
                        onSignedOut()
                    }
                )
            }
        }
    }
}

@Composable
private fun SettingsGroupHeader(icon: ImageVector, label: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(icon, contentDescription = null, tint = DistranColors.Green, modifier = Modifier.size(18.dp))
        Text(label, fontFamily = AbelFontFamily, fontSize = 20.sp, color = DistranColors.Ink)
    }
}
