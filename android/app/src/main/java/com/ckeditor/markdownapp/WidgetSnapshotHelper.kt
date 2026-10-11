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

    fun generateTextSnapshot(context: Context, markdownContent: String, fileName: String, isDark: Boolean = true): String? {
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

            val htmlSpannable = Html.fromHtml(markdownContent, Html.FROM_HTML_MODE_LEGACY)
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

    fun saveSnapshotBitmap(context: Context, bitmap: Bitmap, fileName: String): String? {
        return try {
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
            file.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
