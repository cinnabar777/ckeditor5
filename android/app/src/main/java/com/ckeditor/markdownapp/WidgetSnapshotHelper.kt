package com.ckeditor.markdownapp

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.webkit.WebView
import java.io.File
import java.io.FileOutputStream

object WidgetSnapshotHelper {

    fun captureAndSaveSnapshot(context: Context, webView: WebView, fileName: String): String? {
        return try {
            val width = webView.width.let { if (it <= 0) 1080 else it }
            val viewHeight = webView.height.let { if (it <= 0) 1920 else it }

            // Capture reasonable height bitmap
            val originalBitmap = Bitmap.createBitmap(width, viewHeight, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(originalBitmap)
            webView.draw(canvas)

            // Scale down to safe RemoteViews IPC size (max width 600px)
            val targetWidth = 600
            val targetHeight = ((viewHeight.toFloat() / width.toFloat()) * targetWidth).toInt().coerceAtMost(1000)

            val scaledBitmap = Bitmap.createScaledBitmap(originalBitmap, targetWidth, targetHeight, true)
            originalBitmap.recycle()

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
