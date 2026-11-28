package com.distran.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Movie
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.SportsEsports
import androidx.compose.material.icons.outlined.Tv
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.distran.app.DistranViewModel
import com.distran.app.data.DistranStore
import com.distran.app.data.Medium
import com.distran.app.data.Role
import com.distran.app.ui.components.DistranPrimaryButton
import com.distran.app.ui.components.DistranSecondaryButton
import com.distran.app.ui.components.DistranTextField
import com.distran.app.ui.components.DistranWordmark
import com.distran.app.ui.components.Eyebrow
import com.distran.app.ui.components.PillTag
import com.distran.app.ui.components.StatusBanner
import com.distran.app.ui.components.WorkArtwork
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily
import kotlinx.coroutines.launch

private enum class AuthMode { SIGNIN, SIGNUP, FORGOT }

@Composable
fun AuthScreen(
    viewModel: DistranViewModel,
    onAuthenticated: (Boolean) -> Unit
) {
    val scope = rememberCoroutineScope()
    val demoEnabled = viewModel.store.demoEnabled
    var mode by remember { mutableStateOf(AuthMode.SIGNIN) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var role by remember { mutableStateOf(Role.USER) }
    var showPassword by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var showDetails by remember { mutableStateOf(false) }

    fun submitSignIn(targetEmail: String, targetPassword: String) {
        scope.launch {
            busy = true
            error = ""
            try {
                val account = viewModel.signIn(targetEmail, targetPassword)
                onAuthenticated(account.complete)
            } catch (e: Exception) {
                error = e.message ?: "Sign in failed."
            } finally {
                busy = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DistranColors.Bg)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 18.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            DistranWordmark()
            Text(
                text = "EST. 2026",
                fontFamily = DmMonoFontFamily,
                fontSize = 8.sp,
                letterSpacing = 1.4.sp,
                color = DistranColors.Subtle
            )
        }

        Spacer(Modifier.height(20.dp))

        // Story Hero Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            color = Color(0xFF0E1310),
            border = BorderStroke(1.dp, Color(0x22B7C96C))
        ) {
            Box(modifier = Modifier.fillMaxWidth()) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data("file:///android_asset/artwork/forest.jpg")
                        .build(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.matchParentSize()
                )
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0xBB070A08), Color(0xEA070807))
                            )
                        )
                )
                Column(modifier = Modifier.padding(22.dp)) {
                    PillTag(text = "ONE LEDGER. EVERY FORMAT.", leadingDot = true)
                    Spacer(Modifier.height(18.dp))
                    Eyebrow("YOUR CULTURAL MEMORY", color = Color(0xFF9EA296))
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = buildAnnotatedString {
                            append("A game.\nA film.\n")
                            withStyle(SpanStyle(color = DistranColors.Green)) {
                                append("A feeling.")
                            }
                        },
                        fontFamily = AbelFontFamily,
                        fontSize = 36.sp,
                        lineHeight = 40.sp,
                        color = DistranColors.Ink
                    )
                    Spacer(Modifier.height(10.dp))
                    Text(
                        text = "Some things stay with you.\nGive them a place to live.",
                        fontFamily = AbelFontFamily,
                        fontSize = 15.sp,
                        color = Color(0xFFB4B2A9)
                    )
                    Spacer(Modifier.height(18.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy((-14).dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        listOf("cyberpunk", "dune", "elden-ring").forEachIndexed { i, id ->
                            val work = viewModel.getWork(id)
                            if (work != null) {
                                Box(
                                    modifier = Modifier
                                        .rotate(((i - 1) * 7).toFloat())
                                        .width(56.dp)
                                        .height(82.dp)
                                        .border(1.dp, Color(0x33FFFFFF), RoundedCornerShape(6.dp))
                                ) {
                                    WorkArtwork(work = work, cornerRadius = 6.dp, modifier = Modifier.fillMaxSize())
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "LOG IT. LIST IT. LIVE IN IT.",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 8.sp,
                            letterSpacing = 1.2.sp,
                            color = DistranColors.Muted
                        )
                        Icon(
                            imageVector = Icons.Outlined.NorthEast,
                            contentDescription = null,
                            tint = DistranColors.Green,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(24.dp))

        PillTag(text = "DISTRAN / ${if (mode == AuthMode.SIGNUP) "A NEW CHAPTER" else "COME ON IN"}")
        Spacer(Modifier.height(12.dp))
        Text(
            text = when (mode) {
                AuthMode.SIGNUP -> "Make room for your world."
                AuthMode.FORGOT -> "Find your way back."
                AuthMode.SIGNIN -> "Welcome back\nto Distran."
            },
            fontFamily = AbelFontFamily,
            fontSize = 34.sp,
            lineHeight = 38.sp,
            color = DistranColors.Ink
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = when (mode) {
                AuthMode.SIGNUP -> "One place for everything that makes you, you."
                AuthMode.FORGOT -> "Your cultural memory will be right here."
                AuthMode.SIGNIN -> "Games, film, television — one place to log it, list it, and connect the dots."
            },
            fontFamily = AbelFontFamily,
            fontSize = 15.sp,
            color = DistranColors.Muted
        )

        Spacer(Modifier.height(12.dp))
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            listOf(
                Icons.Outlined.SportsEsports to "Games",
                Icons.Outlined.Movie to "Film",
                Icons.Outlined.Tv to "Television"
            ).forEach { (icon, label) ->
                PillTag(
                    text = label,
                    color = DistranColors.InkSoft,
                    borderColor = DistranColors.Line,
                    backgroundColor = Color(0x06FFFFFF),
                    icon = icon
                )
            }
        }

        Spacer(Modifier.height(18.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = DistranColors.Panel,
            border = BorderStroke(1.dp, DistranColors.LineStrong)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                if (mode == AuthMode.FORGOT) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(DistranColors.Green.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Lock, contentDescription = null, tint = DistranColors.Green)
                    }
                    Spacer(Modifier.height(14.dp))
                    Text(
                        text = "This preview stays on your device.",
                        fontFamily = AbelFontFamily,
                        fontSize = 22.sp,
                        color = DistranColors.Ink
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "Email recovery is available once AuthKit is connected. For now, use one of the test accounts below. Your existing profile stays saved.",
                        fontFamily = AbelFontFamily,
                        fontSize = 14.sp,
                        color = DistranColors.Muted
                    )
                    Spacer(Modifier.height(18.dp))
                    DistranPrimaryButton(
                        text = "Back to sign in",
                        leadingIcon = Icons.AutoMirrored.Outlined.ArrowBack,
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { mode = AuthMode.SIGNIN }
                    )
                } else {
                    if (mode == AuthMode.SIGNUP) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf(
                                Role.USER to "I’m here to discover",
                                Role.CREATOR to "I’m a creator"
                            ).forEach { (choice, label) ->
                                val selected = role == choice
                                Surface(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { role = choice },
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (selected) DistranColors.Green.copy(alpha = 0.16f) else Color(0x06FFFFFF),
                                    border = BorderStroke(
                                        1.dp,
                                        if (selected) DistranColors.Green.copy(alpha = 0.6f) else DistranColors.Line
                                    )
                                ) {
                                    Text(
                                        text = label,
                                        fontFamily = AbelFontFamily,
                                        fontSize = 14.sp,
                                        color = if (selected) DistranColors.Ink else DistranColors.Muted,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
                                    )
                                }
                            }
                        }
                        Spacer(Modifier.height(14.dp))
                        DistranTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = if (role == Role.CREATOR) "Studio / creator name" else "Your name",
                            placeholder = "What should we call you?"
                        )
                        Spacer(Modifier.height(14.dp))
                    }

                    DistranTextField(
                        value = email,
                        onValueChange = {
                            email = it
                            error = ""
                        },
                        label = "Email",
                        placeholder = "you@distran.test"
                    )
                    Spacer(Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "PASSWORD",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 9.sp,
                            letterSpacing = 1.1.sp,
                            color = Color(0xFFAAA79F)
                        )
                        if (mode == AuthMode.SIGNIN) {
                            Text(
                                text = "Forgot?",
                                fontFamily = DmMonoFontFamily,
                                fontSize = 9.sp,
                                color = DistranColors.Green,
                                modifier = Modifier.clickable {
                                    mode = AuthMode.FORGOT
                                    error = ""
                                }
                            )
                        }
                    }
                    Spacer(Modifier.height(7.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        placeholder = {
                            Text("Your password", fontFamily = AbelFontFamily, color = Color(0xFF67665F))
                        },
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    imageVector = if (showPassword) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                                    contentDescription = if (showPassword) "Hide password" else "Show password",
                                    tint = DistranColors.Muted
                                )
                            }
                        },
                        textStyle = androidx.compose.ui.text.TextStyle(
                            fontFamily = AbelFontFamily,
                            fontSize = 16.sp,
                            color = DistranColors.Ink
                        ),
                        shape = RoundedCornerShape(8.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = DistranColors.Green.copy(alpha = 0.6f),
                            unfocusedBorderColor = Color(0x1DFFFFFF),
                            focusedContainerColor = Color(0x07FFFFFF),
                            unfocusedContainerColor = Color(0x04FFFFFF),
                            cursorColor = DistranColors.Green
                        )
                    )

                    if (error.isNotEmpty()) {
                        Spacer(Modifier.height(12.dp))
                        StatusBanner(message = error, isError = true)
                    }

                    Spacer(Modifier.height(18.dp))
                    if (busy) {
                        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(
                                color = DistranColors.Green,
                                modifier = Modifier.size(28.dp),
                                strokeWidth = 2.dp
                            )
                        }
                    } else {
                        DistranPrimaryButton(
                            text = if (mode == AuthMode.SIGNIN) "Sign in" else "Create local account",
                            trailingIcon = Icons.AutoMirrored.Outlined.ArrowForward,
                            enabled = demoEnabled,
                            modifier = Modifier.fillMaxWidth(),
                            onClick = {
                                if (mode == AuthMode.SIGNIN) {
                                    submitSignIn(email, password)
                                } else {
                                    scope.launch {
                                        busy = true
                                        error = ""
                                        try {
                                            val account = viewModel.signUp(email, password, name, role)
                                            onAuthenticated(account.complete)
                                        } catch (e: Exception) {
                                            error = e.message ?: "Could not create account."
                                        } finally {
                                            busy = false
                                        }
                                    }
                                }
                            }
                        )
                    }

                    Spacer(Modifier.height(10.dp))
                    DistranSecondaryButton(
                        text = "Continue with a connected app",
                        trailingIcon = Icons.Outlined.Lock,
                        enabled = false,
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {}
                    )

                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = if (mode == AuthMode.SIGNIN) "New to Distran? " else "Already in the room? ",
                            fontFamily = AbelFontFamily,
                            fontSize = 14.sp,
                            color = DistranColors.Muted
                        )
                        Text(
                            text = if (mode == AuthMode.SIGNIN) "Create one" else "Sign in",
                            fontFamily = AbelFontFamily,
                            fontSize = 14.sp,
                            color = DistranColors.Green,
                            modifier = Modifier.clickable {
                                mode = if (mode == AuthMode.SIGNIN) AuthMode.SIGNUP else AuthMode.SIGNIN
                                error = ""
                                password = ""
                            }
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(18.dp))

        if (demoEnabled) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = DistranColors.Panel,
                border = BorderStroke(1.dp, DistranColors.Line)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(DistranColors.Green)
                        )
                        Text(
                            text = "LOCAL PREVIEW",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 9.sp,
                            color = DistranColors.Green
                        )
                        Text(
                            text = "Saved on this device",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 9.sp,
                            color = DistranColors.Subtle
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "Take a look around. Your own little corner is ready.",
                        fontFamily = AbelFontFamily,
                        fontSize = 15.sp,
                        color = DistranColors.InkSoft
                    )
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        DistranSecondaryButton(
                            text = "Try as a user",
                            trailingIcon = Icons.Outlined.NorthEast,
                            enabled = !busy,
                            modifier = Modifier.weight(1f),
                            onClick = { submitSignIn("user@distran.test", DistranStore.DEMO_PASSWORD) }
                        )
                        DistranSecondaryButton(
                            text = "Try as a creator",
                            trailingIcon = Icons.Outlined.NorthEast,
                            enabled = !busy,
                            modifier = Modifier.weight(1f),
                            onClick = { submitSignIn("creator@distran.test", DistranStore.DEMO_PASSWORD) }
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.clickable { showDetails = !showDetails },
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "Test login details",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 10.sp,
                            color = DistranColors.Muted
                        )
                        Icon(
                            imageVector = Icons.Outlined.ExpandMore,
                            contentDescription = null,
                            tint = DistranColors.Muted,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    if (showDetails) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = "user@distran.test\ncreator@distran.test\nPassword: ${DistranStore.DEMO_PASSWORD}",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 10.sp,
                            color = DistranColors.InkSoft
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "These accounts are local fixtures, not hosted accounts. No cross-device sync.",
                            fontFamily = AbelFontFamily,
                            fontSize = 12.sp,
                            color = DistranColors.Subtle
                        )
                    }
                }
            }
        } else {
            Text(
                text = "Hosted authentication is not configured. Ask your administrator to connect AuthKit.",
                fontFamily = DmMonoFontFamily,
                fontSize = 10.sp,
                color = DistranColors.Muted
            )
        }

        Spacer(Modifier.height(22.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "ONE CULTURAL MEMORY.",
                fontFamily = DmMonoFontFamily,
                fontSize = 8.sp,
                color = DistranColors.Subtle
            )
            Text(
                text = "MADE FOR THE THINGS YOU LOVE.",
                fontFamily = DmMonoFontFamily,
                fontSize = 8.sp,
                color = DistranColors.Subtle
            )
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
fun OnboardingScreen(
    viewModel: DistranViewModel,
    onFinished: () -> Unit
) {
    val account = viewModel.uiState.value.account ?: return
    var step by remember { mutableIntStateOf(0) }
    var name by remember(account.id) { mutableStateOf(account.name) }
    var handle by remember(account.id) { mutableStateOf(account.handle) }
    var bio by remember(account.id) { mutableStateOf(account.bio) }
    var website by remember(account.id) { mutableStateOf(account.website ?: "") }
    var interests by remember(account.id) { mutableStateOf(account.interests) }
    var favorites by remember(account.id) { mutableStateOf(account.favorites) }
    var error by remember { mutableStateOf("") }

    fun finish() {
        try {
            if (name.trim().isEmpty() || !Regex("^[a-z0-9_]{3,24}$").matches(handle)) {
                throw IllegalArgumentException("Choose a name and a handle with 3–24 letters, numbers or underscores.")
            }
            if (website.isNotBlank() && !Regex("^https?://", RegexOption.IGNORE_CASE).containsMatchIn(website)) {
                throw IllegalArgumentException("Website links should start with https://.")
            }
            viewModel.updateAccount(
                account.copy(
                    name = name.trim(),
                    handle = handle,
                    bio = bio.trim(),
                    interests = interests,
                    favorites = favorites,
                    website = website.trim().ifEmpty { null },
                    complete = true
                )
            )
            onFinished()
        } catch (e: Exception) {
            error = e.message ?: "Could not save profile."
        }
    }

    fun toggleFavorite(workId: String) {
        val work = viewModel.getWork(workId) ?: return
        if (favorites.contains(workId)) {
            favorites = favorites.filter { it != workId }
            error = ""
            return
        }
        val countInMedium = favorites.count { viewModel.getWork(it)?.medium == work.medium }
        if (countInMedium >= 4) {
            error = "Four favourites per format. Make a little room first."
            return
        }
        favorites = favorites + workId
        error = ""
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DistranColors.Bg)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 18.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            DistranWordmark()
            Row(
                modifier = Modifier
                    .clickable { finish() }
                    .padding(6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Text(
                    text = "SKIP FOR NOW",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    color = DistranColors.Muted
                )
                Icon(
                    imageVector = Icons.AutoMirrored.Outlined.ArrowForward,
                    contentDescription = null,
                    tint = DistranColors.Muted,
                    modifier = Modifier.size(14.dp)
                )
            }
        }

        Spacer(Modifier.height(20.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("A little about you", "Follow your curiosity", "Your cornerstones").forEachIndexed { i, label ->
                val active = i <= step
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(CircleShape)
                            .background(if (active) DistranColors.Green else Color(0x14FFFFFF)),
                        contentAlignment = Alignment.Center
                    ) {
                        if (i < step) {
                            Icon(
                                Icons.Outlined.Check,
                                contentDescription = null,
                                tint = DistranColors.GreenDark,
                                modifier = Modifier.size(12.dp)
                            )
                        } else {
                            Text(
                                text = "${i + 1}",
                                fontFamily = DmMonoFontFamily,
                                fontSize = 9.sp,
                                color = if (active) DistranColors.GreenDark else DistranColors.Muted
                            )
                        }
                    }
                    Text(
                        text = label,
                        fontFamily = DmMonoFontFamily,
                        fontSize = 8.sp,
                        color = if (active) DistranColors.Ink else DistranColors.Subtle,
                        maxLines = 2
                    )
                }
            }
        }

        Spacer(Modifier.height(26.dp))
        Eyebrow("CHAPTER 0${step + 1} / 03")
        Spacer(Modifier.height(8.dp))
        Text(
            text = when (step) {
                0 -> if (account.role == Role.CREATOR) "Every world has a maker." else "Let’s make this your room."
                1 -> "Where does your curiosity go?"
                else -> "The ones that made you, you."
            },
            fontFamily = AbelFontFamily,
            fontSize = 34.sp,
            lineHeight = 38.sp,
            color = DistranColors.Ink
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = when (step) {
                0 -> "A name, a few words, a place to begin. You can change these any time."
                1 -> "Pick the formats you reach for. There are no wrong combinations."
                else -> "Choose up to four favourites per format. This is a starting point, never a box."
            },
            fontFamily = AbelFontFamily,
            fontSize = 15.sp,
            color = DistranColors.Muted
        )

        Spacer(Modifier.height(22.dp))

        when (step) {
            0 -> {
                DistranTextField(
                    value = name,
                    onValueChange = { if (it.length <= 60) name = it },
                    label = if (account.role == Role.CREATOR) "Creator / studio name" else "Display name"
                )
                Spacer(Modifier.height(14.dp))
                DistranTextField(
                    value = handle,
                    onValueChange = { if (it.length <= 24) handle = it.lowercase() },
                    label = "Your handle",
                    prefix = "@"
                )
                Spacer(Modifier.height(14.dp))
                DistranTextField(
                    value = bio,
                    onValueChange = { if (it.length <= 400) bio = it },
                    label = "A little about your world",
                    singleLine = false,
                    minLines = 3,
                    maxLines = 4
                )
                if (account.role == Role.CREATOR) {
                    Spacer(Modifier.height(14.dp))
                    DistranTextField(
                        value = website,
                        onValueChange = { website = it },
                        label = "Website (optional)",
                        placeholder = "https://your-studio.com"
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "Creator profiles are unverified in this preview. Claiming a work requires a separate verification process.",
                        fontFamily = DmMonoFontFamily,
                        fontSize = 10.sp,
                        color = DistranColors.Muted
                    )
                }
            }

            1 -> {
                val options = listOf(
                    Triple(Medium.GAME, "Games", "Worlds to get lost in" to Icons.Outlined.SportsEsports),
                    Triple(Medium.MOVIE, "Film", "A life in two hours" to Icons.Outlined.Movie),
                    Triple(Medium.TV, "Television", "Just one more episode" to Icons.Outlined.Tv)
                )
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    options.forEach { (medium, title, captionIcon) ->
                        val (caption, icon) = captionIcon
                        val selected = interests.contains(medium)
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    interests = if (selected) interests - medium else interests + medium
                                },
                            shape = RoundedCornerShape(14.dp),
                            color = if (selected) DistranColors.Green.copy(alpha = 0.12f) else DistranColors.Panel,
                            border = BorderStroke(
                                1.dp,
                                if (selected) DistranColors.Green.copy(alpha = 0.55f) else DistranColors.Line
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(18.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Icon(
                                    icon,
                                    contentDescription = null,
                                    tint = if (selected) DistranColors.Green else DistranColors.Muted
                                )
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        title,
                                        fontFamily = AbelFontFamily,
                                        fontSize = 20.sp,
                                        color = DistranColors.Ink
                                    )
                                    Text(
                                        caption,
                                        fontFamily = AbelFontFamily,
                                        fontSize = 14.sp,
                                        color = DistranColors.Muted
                                    )
                                }
                                if (selected) {
                                    Icon(Icons.Outlined.Check, contentDescription = null, tint = DistranColors.Green)
                                }
                            }
                        }
                    }
                }
            }

            else -> {
                val works = viewModel.catalogRepo.catalog
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    works.chunked(3).forEach { row ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            row.forEach { work ->
                                val selected = favorites.contains(work.id)
                                Surface(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { toggleFavorite(work.id) },
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (selected) DistranColors.Green.copy(alpha = 0.14f) else DistranColors.Panel,
                                    border = BorderStroke(
                                        1.dp,
                                        if (selected) DistranColors.Green else DistranColors.Line
                                    )
                                ) {
                                    Column(modifier = Modifier.padding(6.dp)) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(110.dp)
                                        ) {
                                            WorkArtwork(
                                                work = work,
                                                cornerRadius = 6.dp,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                            if (selected) {
                                                Box(
                                                    modifier = Modifier
                                                        .align(Alignment.TopEnd)
                                                        .padding(4.dp)
                                                        .size(20.dp)
                                                        .clip(CircleShape)
                                                        .background(DistranColors.Green),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Icon(
                                                        Icons.Outlined.Check,
                                                        contentDescription = null,
                                                        tint = DistranColors.GreenDark,
                                                        modifier = Modifier.size(12.dp)
                                                    )
                                                }
                                            }
                                        }
                                        Spacer(Modifier.height(6.dp))
                                        Text(
                                            text = work.title,
                                            fontFamily = AbelFontFamily,
                                            fontSize = 13.sp,
                                            color = DistranColors.Ink,
                                            maxLines = 1
                                        )
                                    }
                                }
                            }
                            repeat(3 - row.size) {
                                Spacer(Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        }

        if (error.isNotEmpty()) {
            Spacer(Modifier.height(14.dp))
            StatusBanner(message = error, isError = true)
        }

        Spacer(Modifier.height(24.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            if (step > 0) {
                DistranSecondaryButton(
                    text = "Back",
                    leadingIcon = Icons.AutoMirrored.Outlined.ArrowBack,
                    onClick = {
                        step -= 1
                        error = ""
                    }
                )
            } else {
                Spacer(Modifier.width(1.dp))
            }
            DistranPrimaryButton(
                text = if (step == 2) "Enter your room" else "Continue",
                trailingIcon = Icons.AutoMirrored.Outlined.ArrowForward,
                onClick = {
                    if (step == 0 && (name.trim().isEmpty() || !Regex("^[a-z0-9_]{3,24}$").matches(handle))) {
                        error = "Choose a name and a handle with 3–24 letters, numbers or underscores."
                        return@DistranPrimaryButton
                    }
                    if (step == 2) {
                        finish()
                    } else {
                        step += 1
                        error = ""
                    }
                }
            )
        }

        Spacer(Modifier.height(24.dp))
        Text(
            text = "YOUR TASTE IS A THREAD. LET’S SEE WHERE IT GOES.",
            fontFamily = DmMonoFontFamily,
            fontSize = 8.sp,
            color = DistranColors.Subtle
        )
        Spacer(Modifier.height(24.dp))
    }
}
