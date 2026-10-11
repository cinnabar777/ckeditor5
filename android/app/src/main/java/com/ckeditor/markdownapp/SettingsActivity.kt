package com.ckeditor.markdownapp

import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.preference.EditTextPreference
import androidx.preference.ListPreference
import androidx.preference.Preference
import androidx.preference.PreferenceCategory
import androidx.preference.PreferenceFragmentCompat
import androidx.preference.PreferenceManager
import androidx.preference.SeekBarPreference
import androidx.preference.SwitchPreferenceCompat
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

            findPreference<Preference>("pref_reset_all_defaults")?.setOnPreferenceClickListener {
                confirmAndResetAllDefaults()
                true
            }

            // Dynamically attach long-click listener or summary hint to individual preferences for reset ↺
            setupPreferenceResetHandlers()
        }

        private fun setupPreferenceResetHandlers() {
            val context = context ?: return
            val preferenceScreen = preferenceScreen ?: return

            for (i in 0 until preferenceScreen.preferenceCount) {
                val cat = preferenceScreen.getPreference(i)
                if (cat is PreferenceCategory) {
                    for (j in 0 until cat.preferenceCount) {
                        val pref = cat.getPreference(j)
                        val key = pref.key ?: continue
                        if (key.startsWith("pref_export") || key.startsWith("pref_import") || key == "pref_reset_all_defaults") continue

                        val titleStr = pref.title?.toString() ?: ""
                        if (!titleStr.contains("↺")) {
                            pref.title = "$titleStr ↺"
                        }

                        pref.setOnPreferenceClickListener {
                            // Single tap for font pickers launches file picker; long tap or double tap action resets
                            if (key.startsWith("pref_font_file_")) {
                                activeFontTargetKey = key
                                pickFontLauncher.launch("*/*")
                            }
                            false
                        }
                    }
                }
            }
        }

        override fun onPreferenceTreeClick(preference: Preference): Boolean {
            val key = preference.key ?: return super.onPreferenceTreeClick(preference)
            if (key.startsWith("pref_export") || key.startsWith("pref_import") || key == "pref_reset_all_defaults") {
                return super.onPreferenceTreeClick(preference)
            }

            // Show reset dialog for this specific preference
            AlertDialog.Builder(requireContext())
                .setTitle("Reset Preference")
                .setMessage("Reset '${preference.title?.toString()?.replace(" ↺", "")}' to its default value?")
                .setPositiveButton("Reset ↺") { _, _ ->
                    resetSinglePreference(preference)
                }
                .setNegativeButton("Cancel", null)
                .show()
            return true
        }

        private fun resetSinglePreference(pref: Preference) {
            val context = context ?: return
            val key = pref.key ?: return
            val prefs = PreferenceManager.getDefaultSharedPreferences(context)

            if (key.startsWith("pref_font_file_")) {
                prefs.edit().remove("${key}_path").remove("${key}_name").apply()
                val fontDir = File(context.filesDir, "fonts")
                fontDir.listFiles()?.forEach { file ->
                    if (file.name.startsWith(key)) {
                        file.delete()
                    }
                }
                updateFontPrefSummary(pref, key)
                Toast.makeText(context, "Font reset to default system font", Toast.LENGTH_SHORT).show()
                return
            }

            prefs.edit().remove(key).apply()

            when (pref) {
                is SeekBarPreference -> {
                    val defVal = when (key) {
                        "pref_body_font_size" -> 16
                        "pref_heading_scale_percent" -> 100
                        "pref_line_height_percent" -> 160
                        "pref_letter_spacing_em" -> 0
                        else -> 100
                    }
                    pref.value = defVal
                }
                is EditTextPreference -> {
                    val defVal = when (key) {
                        "pref_custom_element_colors_hex" -> ""
                        "pref_hotkey_new" -> "ctrl+n"
                        "pref_hotkey_open" -> "ctrl+o"
                        "pref_hotkey_save" -> "ctrl+s"
                        "pref_hotkey_save_as" -> "ctrl+shift+s"
                        "pref_hotkey_image" -> "ctrl+shift+i"
                        "pref_hotkey_settings" -> "ctrl+,"
                        "pref_hotkey_toggle_toolbar" -> "ctrl+t"
                        "pref_hotkey_bold" -> "ctrl+b"
                        "pref_hotkey_italic" -> "ctrl+i"
                        "pref_hotkey_underline" -> "ctrl+u"
                        "pref_hotkey_strikethrough" -> "ctrl+shift+x"
                        "pref_hotkey_code" -> "ctrl+e"
                        "pref_hotkey_link" -> "ctrl+k"
                        "pref_hotkey_blockQuote" -> "ctrl+shift+q"
                        "pref_hotkey_codeBlock" -> "ctrl+shift+c"
                        "pref_hotkey_bulletedList" -> "ctrl+shift+8"
                        "pref_hotkey_numberedList" -> "ctrl+shift+7"
                        "pref_hotkey_todoList" -> "ctrl+shift+l"
                        "pref_hotkey_horizontalLine" -> "ctrl+shift+h"
                        "pref_hotkey_findAndReplace" -> "ctrl+f"
                        "pref_hotkey_sourceEditing" -> "ctrl+shift+u"
                        "pref_hotkey_heading_p" -> "ctrl+alt+0"
                        "pref_hotkey_heading_1" -> "ctrl+alt+1"
                        "pref_hotkey_heading_2" -> "ctrl+alt+2"
                        "pref_hotkey_heading_3" -> "ctrl+alt+3"
                        "pref_hotkey_heading_4" -> "ctrl+alt+4"
                        "pref_hotkey_heading_5" -> "ctrl+alt+5"
                        "pref_hotkey_heading_6" -> "ctrl+alt+6"
                        "pref_hotkey_highlight_yellow" -> "ctrl+alt+y"
                        "pref_hotkey_highlight_green" -> "ctrl+alt+g"
                        "pref_hotkey_highlight_pink" -> "ctrl+alt+p"
                        "pref_hotkey_highlight_blue" -> "ctrl+alt+b"
                        "pref_hotkey_highlight_remove" -> "ctrl+alt+r"
                        else -> ""
                    }
                    pref.text = defVal
                }
                is ListPreference -> {
                    pref.value = pref.entryValues.firstOrNull()?.toString()
                }
                is SwitchPreferenceCompat -> {
                    pref.isChecked = true
                }
            }
            Toast.makeText(context, "Setting reset to default ↺", Toast.LENGTH_SHORT).show()
        }

        private fun confirmAndResetAllDefaults() {
            val context = context ?: return
            AlertDialog.Builder(context)
                .setTitle("Reset All Settings ↺")
                .setMessage(R.string.reset_defaults_confirm)
                .setPositiveButton("Reset All") { _, _ ->
                    val prefs = PreferenceManager.getDefaultSharedPreferences(context)
                    prefs.edit().clear().apply()

                    val fontDir = File(context.filesDir, "fonts")
                    if (fontDir.exists()) {
                        fontDir.deleteRecursively()
                    }

                    // Refresh Preference Fragment
                    preferenceScreen.removeAll()
                    onCreatePreferences(null, null)
                    Toast.makeText(context, "All settings restored to defaults ↺", Toast.LENGTH_LONG).show()
                }
                .setNegativeButton("Cancel", null)
                .show()
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
