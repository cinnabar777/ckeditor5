package com.ckeditor.markdownapp

import android.content.Context
import android.net.Uri
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

data class TextPackSession(
    val sessionDir: File,
    var markdownContent: String,
    var sourceUri: Uri?
)

object TextPackManager {

    fun isTextPackFile(context: Context, uri: Uri, fileName: String): Boolean {
        if (fileName.endsWith(".textpack", ignoreCase = true) || fileName.endsWith(".textpack.zip", ignoreCase = true)) {
            return true
        }
        return try {
            context.contentResolver.openInputStream(uri)?.use { inputStream ->
                ZipInputStream(inputStream).use { zip ->
                    var entry = zip.nextEntry
                    var foundMdOrInfo = false
                    while (entry != null) {
                        if (entry.name == "text.md" || entry.name == "info.json") {
                            foundMdOrInfo = true
                            break
                        }
                        entry = zip.nextEntry
                    }
                    foundMdOrInfo
                }
            } ?: false
        } catch (e: Exception) {
            false
        }
    }

    fun openTextPack(context: Context, uri: Uri): TextPackSession {
        val sessionParent = File(context.cacheDir, "textpack_sessions")
        if (!sessionParent.exists()) {
            sessionParent.mkdirs()
        }

        val sessionDir = File(sessionParent, "session_${System.currentTimeMillis()}")
        sessionDir.mkdirs()

        val assetsDir = File(sessionDir, "assets")
        assetsDir.mkdirs()

        var markdownContent = ""

        context.contentResolver.openInputStream(uri)?.use { inputStream ->
            ZipInputStream(inputStream).use { zip ->
                var entry = zip.nextEntry
                while (entry != null) {
                    val entryName = entry.name
                    if (!entry.isDirectory) {
                        val outputFile = File(sessionDir, entryName)
                        outputFile.parentFile?.mkdirs()

                        FileOutputStream(outputFile).use { out ->
                            zip.copyTo(out)
                        }

                        if (entryName == "text.md" || (markdownContent.isEmpty() && entryName.endsWith(".md"))) {
                            markdownContent = outputFile.readText()
                        }
                    }
                    entry = zip.nextEntry
                }
            }
        }

        val infoFile = File(sessionDir, "info.json")
        if (!infoFile.exists()) {
            val json = JSONObject().apply {
                put("version", 2)
                put("type", "net.daringfireball.markdown")
                put("transient", false)
            }
            infoFile.writeText(json.toString(2))
        }

        return TextPackSession(sessionDir, markdownContent, uri)
    }

    fun addAssetImage(session: TextPackSession, imageInputStream: InputStream, originalFileName: String?): String {
        val assetsDir = File(session.sessionDir, "assets")
        if (!assetsDir.exists()) {
            assetsDir.mkdirs()
        }

        val ext = when {
            originalFileName?.contains(".") == true -> originalFileName.substringAfterLast(".")
            else -> "png"
        }

        val assetName = "img_${System.currentTimeMillis()}.$ext"
        val targetFile = File(assetsDir, assetName)

        FileOutputStream(targetFile).use { out ->
            imageInputStream.copyTo(out)
        }

        return "assets/$assetName"
    }

    fun saveTextPack(context: Context, session: TextPackSession, markdownContent: String, targetUri: Uri) {
        val textMdFile = File(session.sessionDir, "text.md")
        textMdFile.writeText(markdownContent)

        val infoFile = File(session.sessionDir, "info.json")
        if (!infoFile.exists()) {
            val json = JSONObject().apply {
                put("version", 2)
                put("type", "net.daringfireball.markdown")
                put("transient", false)
            }
            infoFile.writeText(json.toString(2))
        }

        context.contentResolver.openOutputStream(targetUri, "rwt")?.use { outputStream ->
            ZipOutputStream(outputStream).use { zipOut ->
                compressFolder(session.sessionDir, session.sessionDir, zipOut)
                zipOut.flush()
            }
        }

        session.sourceUri = targetUri
        session.markdownContent = markdownContent
    }

    private fun compressFolder(rootFolder: File, currentFolder: File, zipOut: ZipOutputStream) {
        val files = currentFolder.listFiles() ?: return
        for (file in files) {
            if (file.isDirectory) {
                compressFolder(rootFolder, file, zipOut)
            } else {
                val relativePath = rootFolder.toPath().relativize(file.toPath()).toString().replace("\\", "/")
                val zipEntry = ZipEntry(relativePath)
                zipOut.putNextEntry(zipEntry)
                FileInputStream(file).use { input ->
                    input.copyTo(zipOut)
                }
                zipOut.closeEntry()
            }
        }
    }
}
