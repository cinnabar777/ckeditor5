package com.ckeditor.markdownapp

import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.preference.Preference
import androidx.preference.PreferenceFragmentCompat
import androidx.preference.PreferenceManager
import java.io.File
import java.io.FileOutputStream

class SettingsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = getString(R.string.settings_title)

        if (savedInstanceState == null) {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.settings_container, SettingsFragment())
                .commit()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    class SettingsFragment : PreferenceFragmentCompat() {

        private var activeFontTargetKey: String? = null

        private val pickFontLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
            uri?.let { handleFontPicked(it) }
        }

        override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
            setPreferencesFromResource(R.xml.preferences, rootKey)

            val fontKeys = listOf(
                "pref_font_file_body",
                "pref_font_file_heading",
                "pref_font_file_bold",
                "pref_font_file_italic",
                "pref_font_file_code"
            )

            for (key in fontKeys) {
                val pref: Preference? = findPreference(key)
                updateFontPrefSummary(pref, key)
                pref?.setOnPreferenceClickListener {
                    activeFontTargetKey = key
                    pickFontLauncher.launch("*/*")
                    true
                }
            }

            findPreference<Preference>("pref_export_backup")?.setOnPreferenceClickListener {
                exportBackupLauncher.launch("CKE5_Backup_${System.currentTimeMillis()}.zip")
                true
            }

            findPreference<Preference>("pref_import_backup")?.setOnPreferenceClickListener {
                importBackupLauncher.launch(arrayOf("application/zip", "application/x-zip-compressed", "*/*"))
                true
            }
        }

        private val exportBackupLauncher = registerForActivityResult(ActivityResultContracts.CreateDocument("application/zip")) { uri ->
            uri?.let { performBackupExport(it) }
        }

        private val importBackupLauncher = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            uri?.let { performBackupImport(it) }
        }

        private fun performBackupExport(uri: Uri) {
            val context = context ?: return
            try {
                val prefs = PreferenceManager.getDefaultSharedPreferences(context)
                val allEntries = prefs.all
                val jsonObject = org.json.JSONObject()
                for ((key, value) in allEntries) {
                    jsonObject.put(key, value)
                }

                context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                    java.util.zip.ZipOutputStream(outputStream).use { zipOut ->
                        // Entry 1: preferences.json
                        val prefBytes = jsonObject.toString(2).toByteArray(Charsets.UTF_8)
                        val prefEntry = java.util.zip.ZipEntry("preferences.json")
                        zipOut.putNextEntry(prefEntry)
                        zipOut.write(prefBytes)
                        zipOut.closeEntry()

                        // Entry 2+: fonts/
                        val fontDir = File(context.filesDir, "fonts")
                        if (fontDir.exists() && fontDir.isDirectory) {
                            fontDir.listFiles()?.forEach { fontFile ->
                                if (fontFile.isFile) {
                                    val fontEntry = java.util.zip.ZipEntry("fonts/${fontFile.name}")
                                    zipOut.putNextEntry(fontEntry)
                                    fontFile.inputStream().use { fontIn ->
                                        fontIn.copyTo(zipOut)
                                    }
                                    zipOut.closeEntry()
                                }
                            }
                        }
                    }
                }
                Toast.makeText(context, "Settings & fonts exported to ZIP!", Toast.LENGTH_LONG).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Export failed: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        }

        private fun performBackupImport(uri: Uri) {
            val context = context ?: return
            try {
                val prefs = PreferenceManager.getDefaultSharedPreferences(context)
                val fontDir = File(context.filesDir, "fonts").apply { if (!exists()) mkdirs() }

                context.contentResolver.openInputStream(uri)?.use { inputStream ->
                    java.util.zip.ZipInputStream(inputStream).use { zipIn ->
                        var entry = zipIn.nextEntry
                        while (entry != null) {
                            if (entry.name == "preferences.json") {
                                val jsonStr = zipIn.bufferedReader().readText()
                                val jsonObject = org.json.JSONObject(jsonStr)
                                val editor = prefs.edit()
                                val keys = jsonObject.keys()
                                while (keys.hasNext()) {
                                    val key = keys.next()
                                    val valObj = jsonObject.get(key)
                                    when (valObj) {
                                        is Boolean -> editor.putBoolean(key, valObj)
                                        is Int -> editor.putInt(key, valObj)
                                        is Long -> editor.putLong(key, valObj)
                                        is Float -> editor.putFloat(key, valObj)
                                        is String -> editor.putString(key, valObj)
                                    }
                                }
                                editor.apply()
                            } else if (entry.name.startsWith("fonts/") && !entry.isDirectory) {
                                val fileName = entry.name.substring("fonts/".length)
                                if (fileName.isNotEmpty()) {
                                    val targetFile = File(fontDir, fileName)
                                    FileOutputStream(targetFile).use { out ->
                                        zipIn.copyTo(out)
                                    }
                                }
                            }
                            zipIn.closeEntry()
                            entry = zipIn.nextEntry
                        }
                    }
                }

                // Refresh font summaries
                val fontKeys = listOf("pref_font_file_body", "pref_font_file_heading", "pref_font_file_bold", "pref_font_file_italic", "pref_font_file_code")
                for (key in fontKeys) {
                    updateFontPrefSummary(findPreference(key), key)
                }

                Toast.makeText(context, "Settings & fonts restored from ZIP!", Toast.LENGTH_LONG).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Import failed: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        }

        private fun updateFontPrefSummary(pref: Preference?, key: String) {
            if (pref == null) return
            val context = context ?: return
            val prefs = PreferenceManager.getDefaultSharedPreferences(context)
            val savedFileName = prefs.getString("${key}_name", null)
            if (savedFileName != null) {
                pref.summary = "Loaded: $savedFileName (Tap to change)"
            } else {
                pref.summary = "Tap to pick a font file (.ttf, .otf, .woff, .woff2)"
            }
        }

        private fun handleFontPicked(uri: Uri) {
            val targetKey = activeFontTargetKey ?: return
            val context = context ?: return

            try {
                val fontDir = File(context.filesDir, "fonts").apply { if (!exists()) mkdirs() }
                val fileName = getFileName(uri) ?: "font_${System.currentTimeMillis()}"
                val targetFile = File(fontDir, "${targetKey}_$fileName")

                context.contentResolver.openInputStream(uri)?.use { inputStream ->
                    FileOutputStream(targetFile).use { outputStream ->
                        inputStream.copyTo(outputStream)
                    }
                }

                val prefs = PreferenceManager.getDefaultSharedPreferences(context)
                prefs.edit()
                    .putString("${targetKey}_path", targetFile.absolutePath)
                    .putString("${targetKey}_name", fileName)
                    .apply()

                val pref: Preference? = findPreference(targetKey)
                updateFontPrefSummary(pref, targetKey)
                Toast.makeText(context, "Font saved successfully: $fileName", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Failed to load font: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        }

        private fun getFileName(uri: Uri): String? {
            val context = context ?: return null
            var result: String? = null
            if (uri.scheme == "content") {
                context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                        if (nameIndex != -1) {
                            result = cursor.getString(nameIndex)
                        }
                    }
                }
            }
            if (result == null) {
                result = uri.path
                val cut = result?.lastIndexOf('/') ?: -1
                if (cut != -1) {
                    result = result?.substring(cut + 1)
                }
            }
            return result
        }
    }
}
