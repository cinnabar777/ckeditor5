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
