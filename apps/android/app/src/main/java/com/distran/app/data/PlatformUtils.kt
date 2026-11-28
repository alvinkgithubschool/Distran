package com.distran.app.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.net.Uri
import android.util.Base64
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.net.URL
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class SharedPreferencesStorage(context: Context) : StorageAdapter {
    private val prefs = context.getSharedPreferences("distran_store", Context.MODE_PRIVATE)

    override fun getItem(key: String): String? = prefs.getString(key, null)

    override fun setItem(key: String, value: String) {
        val ok = prefs.edit().putString(key, value).commit()
        if (!ok) {
            throw IllegalStateException("Could not save on this device. Check that storage is available and try again.")
        }
    }

    companion object {
        private const val KEY_API_URL = "distran.api_url"

        fun getApiUrl(context: Context, defaultUrl: String): String {
            val prefs = context.getSharedPreferences("distran_store", Context.MODE_PRIVATE)
            return prefs.getString(KEY_API_URL, defaultUrl) ?: defaultUrl
        }

        fun setApiUrl(context: Context, url: String) {
            val prefs = context.getSharedPreferences("distran_store", Context.MODE_PRIVATE)
            prefs.edit().putString(KEY_API_URL, url).apply()
        }
    }
}

object ImageUtils {
    private val paletteCache = ConcurrentHashMap<String, Color>()

    enum class ProfileImageKind(val width: Int, val height: Int) {
        AVATAR(256, 256),
        BANNER(1200, 400)
    }

    suspend fun resizeProfileImage(
        context: Context,
        uri: Uri,
        kind: ProfileImageKind
    ): String = withContext(Dispatchers.IO) {
        val resolver = context.contentResolver
        val mime = resolver.getType(uri)?.lowercase() ?: ""
        if (mime.isNotEmpty() && mime !in listOf("image/jpeg", "image/jpg", "image/png", "image/webp")) {
            throw IllegalArgumentException("Choose a JPEG, PNG or WebP image.")
        }
        val bytes = resolver.openInputStream(uri)?.use { it.readBytes() }
            ?: throw IllegalArgumentException("Could not read the selected image.")
        if (bytes.size > 8 * 1024 * 1024) {
            throw IllegalArgumentException("Choose an image smaller than 8 MB.")
        }
        val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            ?: throw IllegalArgumentException("Could not decode the selected image.")
        try {
            val out = Bitmap.createBitmap(kind.width, kind.height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(out)
            canvas.drawColor(android.graphics.Color.rgb(20, 20, 20))
            val scale = max(
                kind.width.toFloat() / bitmap.width.toFloat(),
                kind.height.toFloat() / bitmap.height.toFloat()
            )
            val drawW = bitmap.width * scale
            val drawH = bitmap.height * scale
            val left = (kind.width - drawW) / 2f
            val top = (kind.height - drawH) / 2f
            val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
            canvas.drawBitmap(
                bitmap,
                null,
                android.graphics.RectF(left, top, left + drawW, top + drawH),
                paint
            )
            val baos = ByteArrayOutputStream()
            out.compress(Bitmap.CompressFormat.JPEG, 78, baos)
            out.recycle()
            val encoded = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
            val dataUri = "data:image/jpeg;base64,$encoded"
            if (dataUri.length > 650_000) {
                throw IllegalArgumentException("This image is too detailed to save locally. Try another image.")
            }
            dataUri
        } finally {
            bitmap.recycle()
        }
    }

    fun decodeDataUri(dataUri: String): ByteArray? {
        if (!dataUri.startsWith("data:image/")) return null
        val comma = dataUri.indexOf(',')
        if (comma <= 0) return null
        return runCatching { Base64.decode(dataUri.substring(comma + 1), Base64.DEFAULT) }.getOrNull()
    }

    fun parseHexColor(hex: String?, fallback: Color = Color(0xFFB7C96C)): Color {
        if (hex.isNullOrBlank()) return fallback
        val clean = hex.trim().removePrefix("#")
        return runCatching {
            val expanded = when (clean.length) {
                3 -> clean.map { "$it$it" }.joinToString("")
                6 -> clean
                else -> return fallback
            }
            Color(("FF$expanded").toLong(16))
        }.getOrElse { fallback }
    }

    suspend fun extractPosterAccentColor(context: Context, work: Work): Color {
        val fallback = parseHexColor(work.color)
        val src = work.image.ifBlank { work.fallbackImage ?: "" }
        if (src.isBlank()) return fallback
        paletteCache[src]?.let { return it }

        return withContext(Dispatchers.IO) {
            runCatching {
                val bitmap = if (src.startsWith("https://") || src.startsWith("http://")) {
                    URL(src).openStream().use { BitmapFactory.decodeStream(it) }
                } else {
                    context.assets.open("artwork/$src").use { BitmapFactory.decodeStream(it) }
                } ?: return@runCatching fallback

                val scaled = Bitmap.createScaledBitmap(bitmap, 32, 32, true)
                if (scaled !== bitmap) bitmap.recycle()

                data class Bucket(var score: Double = 0.0, var r: Long = 0, var g: Long = 0, var b: Long = 0, var count: Int = 0)
                val buckets = HashMap<String, Bucket>()
                val pixels = IntArray(32 * 32)
                scaled.getPixels(pixels, 0, 32, 0, 0, 32, 32)
                scaled.recycle()

                for (px in pixels) {
                    val r = android.graphics.Color.red(px)
                    val g = android.graphics.Color.green(px)
                    val b = android.graphics.Color.blue(px)
                    val high = max(r, max(g, b))
                    val low = min(r, min(g, b))
                    if (high < 38 || low > 225 || high - low < 18) continue
                    val key = "${r shr 5}:${g shr 5}:${b shr 5}"
                    val bucket = buckets.getOrPut(key) { Bucket() }
                    bucket.score += 1.0 + (high - low) / 128.0
                    bucket.r += r
                    bucket.g += g
                    bucket.b += b
                    bucket.count++
                }
                val winner = buckets.values.maxByOrNull { it.score }
                val color = if (winner != null && winner.count > 0) {
                    Color(
                        red = (winner.r.toDouble() / winner.count).roundToInt(),
                        green = (winner.g.toDouble() / winner.count).roundToInt(),
                        blue = (winner.b.toDouble() / winner.count).roundToInt()
                    )
                } else {
                    fallback
                }
                if (paletteCache.size >= 100) paletteCache.clear()
                paletteCache[src] = color
                color
            }.getOrElse { fallback }
        }
    }
}
