package com.distran.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.distran.app.R

object DistranColors {
    val Bg = Color(0xFF070708)
    val Panel = Color(0xFF0E0E10)
    val Raised = Color(0xFF151517)
    val CardBg = Color(0xFF111112)
    val Line = Color(0x1AFFFFFF)
    val LineSoft = Color(0x12FFFFFF)
    val LineStrong = Color(0x33FFFFFF)
    val Ink = Color(0xFFF2EFE8)
    val InkSoft = Color(0xFFC5C3BC)
    val Muted = Color(0xFF96948F)
    val Subtle = Color(0xFF64645F)
    val Green = Color(0xFFB7C96C)
    val GreenDark = Color(0xFF151514)
    val Amber = Color(0xFFDFAC68)
    val AmberBright = Color(0xFFE8AD54)
    val Cyan = Color(0xFF73BDC7)
    val BuddyInk = Color(0xFFDAC8FA)
    val BuddyLine = Color(0x4AB799E5)
    val BuddyHalo = Color(0x14B799E5)
    val Danger = Color(0xFFEF9E92)
    val DangerBg = Color(0x1AB94E42)
    val DangerLine = Color(0x44B94E42)
}

val AbelFontFamily = FontFamily(
    Font(R.font.abel_regular, FontWeight.Normal)
)

val DmMonoFontFamily = FontFamily(
    Font(R.font.dm_mono_regular, FontWeight.Normal),
    Font(R.font.dm_mono_medium, FontWeight.Medium)
)

private val DistranDarkColorScheme = darkColorScheme(
    primary = DistranColors.Ink,
    onPrimary = DistranColors.GreenDark,
    secondary = DistranColors.Green,
    onSecondary = DistranColors.GreenDark,
    tertiary = DistranColors.Amber,
    background = DistranColors.Bg,
    onBackground = DistranColors.Ink,
    surface = DistranColors.Panel,
    onSurface = DistranColors.Ink,
    surfaceVariant = DistranColors.Raised,
    onSurfaceVariant = DistranColors.Muted,
    outline = DistranColors.Line,
    error = DistranColors.Danger,
    onError = DistranColors.Bg
)

val DistranTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = AbelFontFamily,
        fontSize = 42.sp,
        lineHeight = 46.sp,
        letterSpacing = (-0.8).sp,
        color = DistranColors.Ink
    ),
    headlineLarge = TextStyle(
        fontFamily = AbelFontFamily,
        fontSize = 32.sp,
        lineHeight = 36.sp,
        letterSpacing = (-0.6).sp,
        color = DistranColors.Ink
    ),
    headlineMedium = TextStyle(
        fontFamily = AbelFontFamily,
        fontSize = 25.sp,
        lineHeight = 29.sp,
        letterSpacing = (-0.3).sp,
        color = DistranColors.Ink
    ),
    titleLarge = TextStyle(
        fontFamily = AbelFontFamily,
        fontSize = 20.sp,
        lineHeight = 24.sp,
        color = DistranColors.Ink
    ),
    titleMedium = TextStyle(
        fontFamily = AbelFontFamily,
        fontSize = 17.sp,
        lineHeight = 21.sp,
        color = DistranColors.Ink
    ),
    bodyLarge = TextStyle(
        fontFamily = AbelFontFamily,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        color = DistranColors.Ink
    ),
    bodyMedium = TextStyle(
        fontFamily = AbelFontFamily,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        color = DistranColors.Muted
    ),
    labelMedium = TextStyle(
        fontFamily = DmMonoFontFamily,
        fontSize = 10.sp,
        lineHeight = 14.sp,
        letterSpacing = 1.1.sp,
        color = DistranColors.Muted
    ),
    labelSmall = TextStyle(
        fontFamily = DmMonoFontFamily,
        fontSize = 9.sp,
        lineHeight = 13.sp,
        letterSpacing = 1.6.sp,
        color = DistranColors.Subtle
    )
)

@Composable
fun DistranTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DistranDarkColorScheme,
        typography = DistranTypography,
        content = content
    )
}
