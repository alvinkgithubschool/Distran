package com.distran.app.ui.components

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
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.NorthEast
import androidx.compose.material.icons.outlined.Public
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.distran.app.data.Account
import com.distran.app.data.CreatorDirectory
import com.distran.app.data.ImageUtils
import com.distran.app.data.Medium
import com.distran.app.data.Work
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily

@Composable
fun DistranWordmark(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    Row(
        modifier = modifier.then(
            if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
        ),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Box(modifier = Modifier.width(30.dp).height(42.dp)) {
            Text(
                text = "d",
                fontFamily = AbelFontFamily,
                fontSize = 40.sp,
                color = Color(0xFFE9E5D8),
                modifier = Modifier.align(Alignment.BottomStart)
            )
            Text(
                text = "✳",
                fontSize = 15.sp,
                color = DistranColors.Green,
                modifier = Modifier.align(Alignment.TopEnd)
            )
        }
        Column {
            Text(
                text = "DISTRAN",
                fontFamily = DmMonoFontFamily,
                fontSize = 14.sp,
                letterSpacing = 2.6.sp,
                color = DistranColors.Ink
            )
            Text(
                text = "ONE CULTURAL MEMORY",
                fontFamily = DmMonoFontFamily,
                fontSize = 7.sp,
                letterSpacing = 1.0.sp,
                color = DistranColors.Subtle
            )
        }
    }
}

@Composable
fun Eyebrow(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = DistranColors.Subtle
) {
    Text(
        text = text.uppercase(),
        fontFamily = DmMonoFontFamily,
        fontSize = 9.sp,
        lineHeight = 14.sp,
        letterSpacing = 1.7.sp,
        color = color,
        modifier = modifier
    )
}

@Composable
fun PillTag(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = DistranColors.Green,
    borderColor: Color = DistranColors.Green.copy(alpha = 0.25f),
    backgroundColor: Color = DistranColors.Green.copy(alpha = 0.06f),
    leadingDot: Boolean = false,
    icon: ImageVector? = null
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(999.dp),
        color = backgroundColor,
        border = BorderStroke(1.dp, borderColor)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            if (leadingDot) {
                Box(
                    modifier = Modifier
                        .size(5.dp)
                        .clip(CircleShape)
                        .background(color)
                )
            }
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(12.dp)
                )
            }
            Text(
                text = text,
                fontFamily = DmMonoFontFamily,
                fontSize = 8.sp,
                letterSpacing = 1.0.sp,
                color = color,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun PageHeader(
    eyebrow: String,
    title: String,
    modifier: Modifier = Modifier,
    actions: @Composable (() -> Unit)? = null
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Eyebrow(eyebrow)
            Spacer(Modifier.height(6.dp))
            Text(
                text = title,
                fontFamily = AbelFontFamily,
                fontSize = 36.sp,
                lineHeight = 40.sp,
                letterSpacing = (-0.8).sp,
                color = DistranColors.Ink
            )
        }
        if (actions != null) {
            Spacer(Modifier.width(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                actions()
            }
        }
    }
}

@Composable
fun SectionHeading(
    title: String,
    modifier: Modifier = Modifier,
    eyebrow: String? = null,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
    trailing: @Composable (() -> Unit)? = null
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Bottom
    ) {
        Column(modifier = Modifier.weight(1f)) {
            if (!eyebrow.isNullOrBlank()) {
                Eyebrow(eyebrow)
                Spacer(Modifier.height(4.dp))
            }
            Text(
                text = title,
                fontFamily = AbelFontFamily,
                fontSize = 24.sp,
                lineHeight = 28.sp,
                color = DistranColors.Ink
            )
        }
        if (actionLabel != null && onAction != null) {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .clickable(onClick = onAction)
                    .padding(horizontal = 4.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Text(
                    text = actionLabel.uppercase(),
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    letterSpacing = 0.6.sp,
                    color = Color(0xFFA5A29A)
                )
                Icon(
                    imageVector = Icons.Outlined.NorthEast,
                    contentDescription = null,
                    tint = Color(0xFFA5A29A),
                    modifier = Modifier.size(12.dp)
                )
            }
        } else if (trailing != null) {
            trailing()
        }
    }
}

fun resolveWorkImageModel(work: Work, useFallback: Boolean = false): Any? {
    val src = if (useFallback) work.fallbackImage.orEmpty() else work.image
    if (src.isBlank()) return null
    return if (src.startsWith("https://") || src.startsWith("http://")) {
        src
    } else {
        "file:///android_asset/artwork/$src"
    }
}

@Composable
fun WorkArtwork(
    work: Work,
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 10.dp
) {
    val accent = remember(work.color) { ImageUtils.parseHexColor(work.color) }
    var useFallback by remember(work.id, work.image) { mutableStateOf(false) }
    var hideImage by remember(work.id, work.image) { mutableStateOf(false) }
    val model = remember(work.id, work.image, work.fallbackImage, useFallback) {
        resolveWorkImageModel(work, useFallback)
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(cornerRadius))
            .background(
                Brush.radialGradient(
                    colors = listOf(accent.copy(alpha = 0.28f), Color(0xFF131315))
                )
            )
    ) {
        Text(
            text = work.title,
            fontFamily = AbelFontFamily,
            fontSize = 18.sp,
            lineHeight = 20.sp,
            color = accent,
            maxLines = 3,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(12.dp)
        )
        if (model != null && !hideImage) {
            val context = LocalContext.current
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(model)
                    .crossfade(true)
                    .build(),
                contentDescription = work.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
                onError = {
                    if (!useFallback && !work.fallbackImage.isNullOrBlank()) {
                        useFallback = true
                    } else {
                        hideImage = true
                    }
                }
            )
        }
    }
}

@Composable
fun AvatarView(
    name: String,
    image: String? = null,
    size: Dp = 38.dp,
    cornerRadius: Dp = 999.dp,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val decodedBitmap = remember(image) {
        if (image != null && image.startsWith("data:image/")) {
            ImageUtils.decodeDataUri(image)?.let { bytes ->
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
            }
        } else null
    }

    Box(
        modifier = modifier
            .size(size)
            .clip(RoundedCornerShape(cornerRadius))
            .background(
                Brush.linearGradient(listOf(Color(0xFF30312B), Color(0xFF151714)))
            )
            .border(1.dp, Color(0x21FFFFFF), RoundedCornerShape(cornerRadius)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = name.firstOrNull()?.uppercaseChar()?.toString() ?: "D",
            fontFamily = AbelFontFamily,
            fontSize = (size.value * 0.48f).sp,
            color = Color(0xFFE4E2D7)
        )
        if (decodedBitmap != null) {
            Image(
                bitmap = decodedBitmap,
                contentDescription = name,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else if (!image.isNullOrBlank() && !image.startsWith("data:")) {
            AsyncImage(
                model = ImageRequest.Builder(context).data(image).crossfade(true).build(),
                contentDescription = name,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}

@Composable
fun CreatorPageMark(modifier: Modifier = Modifier) {
    Icon(
        imageVector = Icons.Outlined.Public,
        contentDescription = "Creator page on Distran",
        tint = DistranColors.Green,
        modifier = modifier.size(13.dp)
    )
}

@Composable
fun CreatorBadge(modifier: Modifier = Modifier) {
    PillTag(
        text = "On Distran",
        color = DistranColors.Green,
        icon = Icons.Outlined.Fingerprint,
        modifier = modifier
    )
}

@Composable
fun CreatorNameLink(
    id: String?,
    name: String,
    publicCreators: List<Account>,
    creatorDirectory: CreatorDirectory,
    onOpenCreator: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val profile = remember(id, publicCreators) { publicCreators.firstOrNull { it.id == id } }
    val named = remember(name) {
        creatorDirectory.localDirectory().filter { it.name.equals(name, ignoreCase = true) }
    }
    val target = profile?.id
        ?: if (id != null && creatorDirectory.isProviderCreator(id)) id
        else if (named.size == 1) named.first().id
        else null

    if (target == null) {
        Text(
            text = name,
            fontFamily = AbelFontFamily,
            fontSize = 13.sp,
            color = DistranColors.InkSoft,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = modifier
        )
    } else {
        Row(
            modifier = modifier
                .clip(RoundedCornerShape(4.dp))
                .clickable { onOpenCreator(target) },
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = name,
                fontFamily = AbelFontFamily,
                fontSize = 13.sp,
                color = DistranColors.InkSoft,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            CreatorPageMark()
            if (profile != null) {
                CreatorBadge()
            }
        }
    }
}

@Composable
fun WorkCard(
    work: Work,
    onOpenWork: (String) -> Unit,
    onOpenCreator: (String) -> Unit,
    publicCreators: List<Account>,
    creatorDirectory: CreatorDirectory,
    modifier: Modifier = Modifier,
    index: Int? = null,
    isBuddy: Boolean = false
) {
    val borderColor = if (isBuddy) DistranColors.BuddyLine else Color(0x16FFFFFF)
    Column(modifier = modifier) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(2f / 3f)
                .clip(RoundedCornerShape(10.dp))
                .border(1.dp, borderColor, RoundedCornerShape(10.dp))
                .background(Color(0xFF151514))
                .clickable { onOpenWork(work.id) }
        ) {
            WorkArtwork(
                work = work,
                cornerRadius = 10.dp,
                modifier = Modifier.fillMaxSize()
            )
            if (index != null) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(8.dp)
                        .size(24.dp)
                        .clip(CircleShape)
                        .background(Color(0x99000000))
                        .border(1.dp, Color(0x33FFFFFF), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = (index + 1).toString().padStart(2, '0'),
                        fontFamily = DmMonoFontFamily,
                        fontSize = 8.sp,
                        color = DistranColors.Ink
                    )
                }
            }
            if (isBuddy) {
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp),
                    shape = RoundedCornerShape(999.dp),
                    color = Color(0xCC12101A),
                    border = BorderStroke(1.dp, DistranColors.BuddyLine)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.AutoAwesome,
                            contentDescription = null,
                            tint = DistranColors.BuddyInk,
                            modifier = Modifier.size(10.dp)
                        )
                        Text(
                            text = "Buddy pick",
                            fontFamily = DmMonoFontFamily,
                            fontSize = 7.sp,
                            color = DistranColors.BuddyInk
                        )
                    }
                }
            }
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(8.dp),
                shape = RoundedCornerShape(4.dp),
                color = Color(0xB3080808),
                border = BorderStroke(1.dp, Color(0x22FFFFFF))
            ) {
                Text(
                    text = work.medium.displayName.uppercase(),
                    fontFamily = DmMonoFontFamily,
                    fontSize = 7.sp,
                    letterSpacing = 0.8.sp,
                    color = Color(0xFFE9E4D7),
                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                )
            }
        }
        Spacer(Modifier.height(9.dp))
        Text(
            text = work.title,
            fontFamily = AbelFontFamily,
            fontSize = 16.sp,
            lineHeight = 19.sp,
            color = DistranColors.Ink,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.clickable { onOpenWork(work.id) }
        )
        Spacer(Modifier.height(4.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (work.year > 0) work.year.toString() else "TBA",
                fontFamily = DmMonoFontFamily,
                fontSize = 9.sp,
                color = DistranColors.Muted
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Icon(
                    imageVector = Icons.Rounded.Star,
                    contentDescription = null,
                    tint = DistranColors.Green,
                    modifier = Modifier.size(11.dp)
                )
                Text(
                    text = work.rating,
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    color = DistranColors.Green
                )
            }
        }
        val firstCreator = work.creators?.firstOrNull()
        if (firstCreator != null) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = work.creatorRole ?: if (work.medium == Medium.GAME) "Studio" else "Director",
                fontFamily = DmMonoFontFamily,
                fontSize = 8.sp,
                color = DistranColors.Subtle
            )
            CreatorNameLink(
                id = firstCreator.id,
                name = firstCreator.name,
                publicCreators = publicCreators,
                creatorDirectory = creatorDirectory,
                onOpenCreator = onOpenCreator
            )
        }
    }
}

@Composable
fun WorkRow(
    work: Work,
    onOpenWork: (String) -> Unit,
    onOpenCreator: (String) -> Unit,
    publicCreators: List<Account>,
    creatorDirectory: CreatorDirectory,
    modifier: Modifier = Modifier,
    isBuddy: Boolean = false,
    trailing: @Composable (() -> Unit)? = null
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onOpenWork(work.id) }
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        WorkArtwork(
            work = work,
            cornerRadius = 6.dp,
            modifier = Modifier.width(52.dp).height(72.dp)
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = work.title,
                fontFamily = AbelFontFamily,
                fontSize = 19.sp,
                color = DistranColors.Ink,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(Modifier.height(3.dp))
            Text(
                text = "${work.medium.displayName} · ${if (work.year > 0) work.year else "TBA"}",
                fontFamily = DmMonoFontFamily,
                fontSize = 10.sp,
                color = DistranColors.Muted
            )
            Spacer(Modifier.height(3.dp))
            val creators = work.creators
            if (!creators.isNullOrEmpty()) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    creators.take(2).forEach { c ->
                        CreatorNameLink(
                            id = c.id,
                            name = c.name,
                            publicCreators = publicCreators,
                            creatorDirectory = creatorDirectory,
                            onOpenCreator = onOpenCreator
                        )
                    }
                }
            } else if (work.maker.isNotBlank()) {
                Text(
                    text = work.maker,
                    fontFamily = AbelFontFamily,
                    fontSize = 13.sp,
                    color = DistranColors.Muted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            if (isBuddy) {
                Spacer(Modifier.height(6.dp))
                PillTag(
                    text = "Buddy list",
                    color = DistranColors.BuddyInk,
                    borderColor = DistranColors.BuddyLine,
                    backgroundColor = DistranColors.BuddyHalo,
                    icon = Icons.Outlined.AutoAwesome
                )
            }
        }
        if (trailing != null) {
            trailing()
        } else {
            Icon(
                imageVector = Icons.Outlined.NorthEast,
                contentDescription = "Open ${work.title}",
                tint = DistranColors.Muted,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
fun BuddyStrip(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        color = Color(0xFF0E0E11),
        border = BorderStroke(1.dp, DistranColors.BuddyLine)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(listOf(Color(0xFF333432), Color(0xFF1A1B19)))
                    )
                    .border(1.dp, DistranColors.BuddyLine, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "✧",
                    fontSize = 22.sp,
                    color = DistranColors.BuddyInk
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Eyebrow(text = "Buddy · follow a feeling", color = DistranColors.BuddyInk)
                Spacer(Modifier.height(3.dp))
                Text(
                    text = "Find thematic picks and make a list.",
                    fontFamily = AbelFontFamily,
                    fontSize = 15.sp,
                    color = Color(0xFFAAA79E)
                )
            }
            Surface(
                shape = RoundedCornerShape(4.dp),
                color = Color.Transparent,
                border = BorderStroke(1.dp, DistranColors.BuddyLine)
            ) {
                Text(
                    text = "ASK BUDDY",
                    fontFamily = DmMonoFontFamily,
                    fontSize = 8.sp,
                    color = DistranColors.BuddyInk,
                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 4.dp)
                )
            }
        }
    }
}

@Composable
fun EmptyState(
    heading: String,
    body: String,
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Outlined.Add,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFF0B0B0D),
        border = BorderStroke(1.dp, Color(0x1EFFFFFF))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 36.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(DistranColors.Green.copy(alpha = 0.08f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = DistranColors.Green,
                    modifier = Modifier.size(26.dp)
                )
            }
            Text(
                text = heading,
                fontFamily = AbelFontFamily,
                fontSize = 24.sp,
                color = DistranColors.Ink,
                textAlign = TextAlign.Center
            )
            Text(
                text = body,
                fontFamily = AbelFontFamily,
                fontSize = 15.sp,
                color = DistranColors.Muted,
                textAlign = TextAlign.Center
            )
            if (actionLabel != null && onAction != null) {
                Spacer(Modifier.height(4.dp))
                DistranPrimaryButton(
                    text = actionLabel,
                    onClick = onAction,
                    trailingIcon = Icons.AutoMirrored.Outlined.ArrowForward
                )
            }
        }
    }
}

@Composable
fun DistranPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: ImageVector? = null,
    trailingIcon: ImageVector? = null
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(44.dp),
        shape = RoundedCornerShape(999.dp),
        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 10.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = DistranColors.Ink,
            contentColor = DistranColors.GreenDark,
            disabledContainerColor = DistranColors.Ink.copy(alpha = 0.35f),
            disabledContentColor = DistranColors.GreenDark.copy(alpha = 0.6f)
        )
    ) {
        if (leadingIcon != null) {
            Icon(leadingIcon, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(8.dp))
        }
        Text(
            text = text,
            fontFamily = DmMonoFontFamily,
            fontSize = 10.sp,
            letterSpacing = 0.6.sp,
            fontWeight = FontWeight.Normal,
            maxLines = 1
        )
        if (trailingIcon != null) {
            Spacer(Modifier.width(8.dp))
            Icon(trailingIcon, contentDescription = null, modifier = Modifier.size(15.dp))
        }
    }
}

@Composable
fun DistranSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: ImageVector? = null,
    trailingIcon: ImageVector? = null,
    danger: Boolean = false
) {
    val border = if (danger) DistranColors.DangerLine else Color(0x28FFFFFF)
    val container = if (danger) DistranColors.DangerBg else Color(0x0AFFFFFF)
    val content = if (danger) DistranColors.Danger else DistranColors.InkSoft
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(42.dp),
        shape = RoundedCornerShape(999.dp),
        border = BorderStroke(1.dp, border),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = container,
            contentColor = content
        )
    ) {
        if (leadingIcon != null) {
            Icon(leadingIcon, contentDescription = null, modifier = Modifier.size(15.dp))
            Spacer(Modifier.width(7.dp))
        }
        Text(
            text = text,
            fontFamily = DmMonoFontFamily,
            fontSize = 10.sp,
            letterSpacing = 0.5.sp,
            maxLines = 1
        )
        if (trailingIcon != null) {
            Spacer(Modifier.width(7.dp))
            Icon(trailingIcon, contentDescription = null, modifier = Modifier.size(14.dp))
        }
    }
}

@Composable
fun DistranTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    singleLine: Boolean = true,
    minLines: Int = 1,
    maxLines: Int = if (singleLine) 1 else 6,
    prefix: String? = null,
    trailingIcon: @Composable (() -> Unit)? = null
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label.uppercase(),
            fontFamily = DmMonoFontFamily,
            fontSize = 9.sp,
            letterSpacing = 1.1.sp,
            color = Color(0xFFAAA79F)
        )
        Spacer(Modifier.height(7.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = if (placeholder.isNotEmpty()) {
                {
                    Text(
                        text = placeholder,
                        fontFamily = AbelFontFamily,
                        fontSize = 16.sp,
                        color = Color(0xFF67665F)
                    )
                }
            } else null,
            prefix = if (prefix != null) {
                { Text(prefix, fontFamily = DmMonoFontFamily, color = DistranColors.Muted) }
            } else null,
            trailingIcon = trailingIcon,
            singleLine = singleLine,
            minLines = minLines,
            maxLines = maxLines,
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
    }
}

@Composable
fun FormatTabs(
    selected: Medium?,
    onSelect: (Medium?) -> Unit,
    modifier: Modifier = Modifier
) {
    val options: List<Pair<Medium?, String>> = listOf(
        null to "Everything",
        Medium.GAME to "Games",
        Medium.MOVIE to "Films",
        Medium.TV to "Television"
    )
    Row(
        modifier = modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        options.forEach { (medium, label) ->
            val isSelected = selected == medium
            Surface(
                modifier = Modifier.clickable { onSelect(medium) },
                shape = RoundedCornerShape(999.dp),
                color = if (isSelected) DistranColors.Green.copy(alpha = 0.14f) else Color(0x05FFFFFF),
                border = BorderStroke(
                    1.dp,
                    if (isSelected) DistranColors.Green.copy(alpha = 0.5f) else Color(0x18FFFFFF)
                )
            ) {
                Text(
                    text = label,
                    fontFamily = DmMonoFontFamily,
                    fontSize = 10.sp,
                    color = if (isSelected) DistranColors.Ink else DistranColors.Muted,
                    modifier = Modifier.padding(horizontal = 13.dp, vertical = 7.dp)
                )
            }
        }
    }
}

@Composable
fun StatusBanner(
    message: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
    isError: Boolean = false
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        color = if (isError) DistranColors.DangerBg else Color(0xFF141416),
        border = BorderStroke(1.dp, if (isError) DistranColors.DangerLine else DistranColors.LineStrong)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = message,
                fontFamily = AbelFontFamily,
                fontSize = 14.sp,
                color = if (isError) DistranColors.Danger else DistranColors.InkSoft,
                modifier = Modifier.weight(1f)
            )
            if (actionLabel != null && onAction != null) {
                Spacer(Modifier.width(12.dp))
                Text(
                    text = actionLabel.uppercase(),
                    fontFamily = DmMonoFontFamily,
                    fontSize = 9.sp,
                    color = DistranColors.Green,
                    modifier = Modifier.clickable(onClick = onAction)
                )
            }
        }
    }
}
