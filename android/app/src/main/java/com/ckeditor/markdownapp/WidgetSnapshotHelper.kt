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
            val padding = 24

            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)

            val bgColor = if (isDark) Color.parseColor("#000000") else Color.parseColor("#FFFFFF")
            val textColor = if (isDark) Color.parseColor("#FFFFFF") else Color.parseColor("#111111")

            canvas.drawColor(bgColor)

            val textPaint = TextPaint().apply {
                color = textColor
                textSize = 28f
                isAntiAlias = true
            }

            // Convert Markdown syntax to styled HTML for StaticLayout canvas rendering
            val lines = rawMarkdown.replace("\r\n", "\n").split("\n")
            val htmlBuilder = StringBuilder()

            for (line in lines) {
                var processedLine = line

                // Checkboxes & Bullet lists
                if (processedLine.trim().startsWith("* [x]") || processedLine.trim().startsWith("- [x]")) {
                    processedLine = "  ☑ " + processedLine.trim().substring(5).trim()
                } else if (processedLine.trim().startsWith("* [ ]") || processedLine.trim().startsWith("- [ ]")) {
                    processedLine = "  ☐ " + processedLine.trim().substring(5).trim()
                } else if (processedLine.trim().startsWith("* ") || processedLine.trim().startsWith("- ")) {
                    processedLine = "  • " + processedLine.trim().substring(2).trim()
                }

                // Headings (H1 to H6)
                if (processedLine.startsWith("###### ")) {
                    processedLine = "<h6><b>" + processedLine.substring(7) + "</b></h6>"
                } else if (processedLine.startsWith("##### ")) {
                    processedLine = "<h5><b>" + processedLine.substring(6) + "</b></h5>"
                } else if (processedLine.startsWith("#### ")) {
                    processedLine = "<h4><b>" + processedLine.substring(5) + "</b></h4>"
                } else if (processedLine.startsWith("### ")) {
                    processedLine = "<h3><b>" + processedLine.substring(4) + "</b></h3>"
                } else if (processedLine.startsWith("## ")) {
                    processedLine = "<h2><b>" + processedLine.substring(3) + "</b></h2>"
                } else if (processedLine.startsWith("# ")) {
                    processedLine = "<h1><b>" + processedLine.substring(2) + "</b></h1>"
                }

                // Horizontal rules
                if (processedLine.trim() == "---" || processedLine.trim() == "***" || processedLine.trim() == "___") {
                    processedLine = "<hr/>"
                }

                // Inline markdown: **bold**, *italic*, `code`
                processedLine = processedLine
                    .replace(Regex("\\*\\*(.*?)\\*\\*"), "<b>$1</b>")
                    .replace(Regex("__(.*?)__"), "<b>$1</b>")
                    .replace(Regex("\\*(.*?)\\*"), "<i>$1</i>")
                    .replace(Regex("_(.*?)_"), "<i>$1</i>")
                    .replace(Regex("`(.*?)`"), "<tt>$1</tt>")

                htmlBuilder.append(processedLine).append("<br/>")
            }

            val htmlSpannable = Html.fromHtml(htmlBuilder.toString(), Html.FROM_HTML_MODE_LEGACY)

            val contentLayout = StaticLayout.Builder.obtain(htmlSpannable, 0, htmlSpannable.length, textPaint, width - (padding * 2))
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setLineSpacing(0f, 1.2f)
                .setIncludePad(false)
                .build()

            canvas.save()
            canvas.translate(padding.toFloat(), padding.toFloat())
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
