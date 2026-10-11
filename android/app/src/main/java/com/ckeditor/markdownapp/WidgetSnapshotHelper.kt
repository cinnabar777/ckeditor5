package com.ckeditor.markdownapp

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.text.Html
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import java.io.File
import java.io.FileOutputStream

object WidgetSnapshotHelper {

    fun generateTextSnapshot(context: Context, rawMarkdown: String, fileName: String, isDark: Boolean = true): String? {
        return try {
            val width = 720
            val height = 1200
            val padding = 32

            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)

            val bgColor = if (isDark) Color.parseColor("#000000") else Color.parseColor("#FFFFFF")
            val textColor = if (isDark) Color.parseColor("#FFFFFF") else Color.parseColor("#111111")
            val titleColor = if (isDark) Color.parseColor("#0288D1") else Color.parseColor("#0277BD")

            canvas.drawColor(bgColor)

            val titlePaint = TextPaint().apply {
                color = titleColor
                textSize = 36f
                isAntiAlias = true
                isFakeBoldText = true
            }

            val titleLayout = StaticLayout.Builder.obtain(fileName, 0, fileName.length, titlePaint, width - (padding * 2))
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setLineSpacing(0f, 1f)
                .setIncludePad(false)
                .build()

            canvas.save()
            canvas.translate(padding.toFloat(), padding.toFloat())
            titleLayout.draw(canvas)
            canvas.restore()

            val textPaint = TextPaint().apply {
                color = textColor
                textSize = 28f
                isAntiAlias = true
            }

            // Convert basic Markdown lines into formatted HTML for StaticLayout
            val htmlString = rawMarkdown
                .replace("\r\n", "\n")
                .replace("\n\n", "<br/><br/>")
                .replace("\n", "<br/>")

            val htmlSpannable = Html.fromHtml(htmlString, Html.FROM_HTML_MODE_LEGACY)
            val startY = padding + titleLayout.height + 24

            val contentLayout = StaticLayout.Builder.obtain(htmlSpannable, 0, htmlSpannable.length, textPaint, width - (padding * 2))
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setLineSpacing(0f, 1.2f)
                .setIncludePad(false)
                .build()

            canvas.save()
            canvas.translate(padding.toFloat(), startY.toFloat())
            contentLayout.draw(canvas)
            canvas.restore()

            val dir = File(context.cacheDir, "widget_snapshots")
            if (!dir.exists()) {
                dir.mkdirs()
            }

            val sanitizedName = fileName.replace("[^a-zA-Z0-9._-]".toRegex(), "_")
            val file = File(dir, "snap_$sanitizedName.png")
            val fos = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.PNG, 90, fos)
            fos.flush()
            fos.close()
            bitmap.recycle()

            file.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun captureWebViewBitmap(context: Context, webView: android.webkit.WebView, fileName: String): String? {
        return try {
            val width = webView.width.let { if (it <= 0) 1080 else it }
            val height = (webView.contentHeight * webView.scale).toInt().let { if (it <= 0) 1920 else it }

            val bitmap = Bitmap.createBitmap(width, height.coerceAtMost(3000), Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            webView.draw(canvas)

            val targetWidth = 720
            val targetHeight = ((bitmap.height.toFloat() / bitmap.width.toFloat()) * targetWidth).toInt().coerceAtMost(2500)
            val scaledBitmap = Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
            bitmap.recycle()

            val dir = File(context.cacheDir, "widget_snapshots")
            if (!dir.exists()) {
                dir.mkdirs()
            }

            val sanitizedName = fileName.replace("[^a-zA-Z0-9._-]".toRegex(), "_")
            val file = File(dir, "snap_$sanitizedName.png")
            val fos = FileOutputStream(file)
            scaledBitmap.compress(Bitmap.CompressFormat.PNG, 85, fos)
            fos.flush()
            fos.close()
            scaledBitmap.recycle()

            file.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
