package com.ckeditor.markdownapp

import android.content.Context
import android.util.AttributeSet
import android.view.View
import android.widget.Toast
import androidx.preference.EditTextPreference
import androidx.preference.ListPreference
import androidx.preference.Preference
import androidx.preference.PreferenceViewHolder
import androidx.preference.SeekBarPreference
import androidx.preference.SwitchPreferenceCompat
import java.io.File

object PreferenceResetHelper {
    fun isFontFileModified(context: Context, key: String): Boolean {
        val prefs = androidx.preference.PreferenceManager.getDefaultSharedPreferences(context)
        return prefs.contains("${key}_path")
    }

    fun resetFontFile(context: Context, key: String) {
        val prefs = androidx.preference.PreferenceManager.getDefaultSharedPreferences(context)
        prefs.edit().remove("${key}_path").remove("${key}_name").apply()
        val fontDir = File(context.filesDir, "fonts")
        if (fontDir.exists()) {
            fontDir.listFiles()?.forEach { file ->
                if (file.name.startsWith(key)) {
                    file.delete()
                }
            }
        }
        Toast.makeText(context, "Font reset to default system font", Toast.LENGTH_SHORT).show()
    }

    fun getDefaultSeekBarValue(key: String): Int {
        return when (key) {
            "pref_body_font_size" -> 16
            "pref_heading_scale_percent" -> 100
            "pref_bold_font_weight" -> 700
            "pref_italic_font_weight" -> 400
            "pref_heading_font_weight" -> 700
            "pref_hr_thickness" -> 2
            "pref_hr_width_percent" -> 100
            "pref_blockquote_line_thickness" -> 4
            "pref_callout_line_thickness" -> 4
            else -> 100
        }
    }

    fun getDefaultEditTextValue(key: String): String {
        return when (key) {
            "pref_paragraph_line_height" -> "1.6"
            "pref_letter_spacing" -> "0px"
            "pref_hotkey_new" -> "ctrl+n"
            "pref_hotkey_open" -> "ctrl+o"
            "pref_hotkey_save" -> "ctrl+s"
            "pref_hotkey_save_as" -> "ctrl+shift+s"
            "pref_hotkey_image" -> "ctrl+shift+i"
            "pref_hotkey_settings" -> "ctrl+,"
            "pref_hotkey_toggle_toolbar" -> "ctrl+t"
            "pref_hotkey_toggle_line_wrap" -> "alt+z"
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
            "pref_hotkey_indent" -> "tab"
            "pref_hotkey_outdent" -> "shift+tab"
            "pref_hotkey_horizontalLine" -> "ctrl+shift+h"
            "pref_hotkey_findAndReplace" -> "ctrl+f"
            "pref_hotkey_sourceEditing" -> "ctrl+shift+u ctrl+u"
            "pref_hotkey_heading_p" -> "ctrl+alt+0"
            "pref_hotkey_heading_1" -> "ctrl+alt+1"
            "pref_hotkey_heading_2" -> "ctrl+alt+2"
            "pref_hotkey_heading_3" -> "ctrl+alt+3"
            "pref_hotkey_heading_4" -> "ctrl+alt+4"
            "pref_hotkey_heading_5" -> "ctrl+alt+5"
            "pref_hotkey_heading_6" -> "ctrl+alt+6"
            "pref_hotkey_highlight_yellow" -> "ctrl+alt+y"
            "pref_hotkey_highlight_green" -> "ctrl+alt+g"
            "pref_hotkey_highlight_red" -> "ctrl+alt+r"
            "pref_hotkey_highlight_pink" -> "ctrl+alt+p"
            "pref_hotkey_highlight_blue" -> "ctrl+alt+b"
            "pref_hotkey_highlight_remove" -> "ctrl+alt+x"
            else -> "default"
        }
    }

    fun getDefaultSwitchValue(key: String): Boolean {
        return when (key) {
            "pref_justify_paragraph" -> false
            else -> true
        }
    }
}

class ResetPreference @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : Preference(context, attrs) {
    init {
        widgetLayoutResource = R.layout.preference_reset_widget
    }

    override fun onBindViewHolder(holder: PreferenceViewHolder) {
        super.onBindViewHolder(holder)
        val resetBtn = holder.findViewById(R.id.btn_reset_preference)
        if (resetBtn != null && key != null) {
            val isModified = PreferenceResetHelper.isFontFileModified(context, key)
            resetBtn.visibility = if (isModified) View.VISIBLE else View.GONE
            resetBtn.setOnClickListener {
                PreferenceResetHelper.resetFontFile(context, key)
                resetBtn.visibility = View.GONE
                summary = "Tap to pick a font file (.ttf, .otf, .woff, .woff2)"
            }
        }
    }
}

class ResetSeekBarPreference @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : SeekBarPreference(context, attrs) {
    init {
        widgetLayoutResource = R.layout.preference_reset_widget
    }

    override fun onBindViewHolder(holder: PreferenceViewHolder) {
        super.onBindViewHolder(holder)
        val resetBtn = holder.findViewById(R.id.btn_reset_preference)
        if (resetBtn != null && key != null) {
            val prefs = preferenceManager?.sharedPreferences
            val defaultVal = PreferenceResetHelper.getDefaultSeekBarValue(key)
            val currentVal = prefs?.getInt(key, defaultVal) ?: defaultVal
            val isModified = currentVal != defaultVal

            resetBtn.visibility = if (isModified) View.VISIBLE else View.GONE
            resetBtn.setOnClickListener {
                prefs?.edit()?.remove(key)?.apply()
                value = defaultVal
                resetBtn.visibility = View.GONE
                Toast.makeText(context, "Setting reset to default ↺", Toast.LENGTH_SHORT).show()
            }
        }
    }
}

class ResetEditTextPreference @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : EditTextPreference(context, attrs) {
    init {
        widgetLayoutResource = R.layout.preference_reset_widget
    }

    override fun onBindViewHolder(holder: PreferenceViewHolder) {
        super.onBindViewHolder(holder)
        val resetBtn = holder.findViewById(R.id.btn_reset_preference)
        if (resetBtn != null && key != null) {
            val prefs = preferenceManager?.sharedPreferences
            val defaultVal = PreferenceResetHelper.getDefaultEditTextValue(key)
            val currentVal = prefs?.getString(key, defaultVal) ?: defaultVal
            val isModified = currentVal != defaultVal

            resetBtn.visibility = if (isModified) View.VISIBLE else View.GONE
            resetBtn.setOnClickListener {
                prefs?.edit()?.remove(key)?.apply()
                text = defaultVal
                resetBtn.visibility = View.GONE
                Toast.makeText(context, "Setting reset to default ↺", Toast.LENGTH_SHORT).show()
            }
        }
    }
}

class ResetListPreference @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : ListPreference(context, attrs) {
    init {
        widgetLayoutResource = R.layout.preference_reset_widget
    }

    override fun onBindViewHolder(holder: PreferenceViewHolder) {
        super.onBindViewHolder(holder)
        val resetBtn = holder.findViewById(R.id.btn_reset_preference)
        if (resetBtn != null && key != null) {
            val prefs = preferenceManager?.sharedPreferences
            val defaultVal = entryValues?.firstOrNull()?.toString() ?: ""
            val currentVal = prefs?.getString(key, defaultVal) ?: defaultVal
            val isModified = currentVal != defaultVal

            resetBtn.visibility = if (isModified) View.VISIBLE else View.GONE
            resetBtn.setOnClickListener {
                prefs?.edit()?.remove(key)?.apply()
                value = defaultVal
                resetBtn.visibility = View.GONE
                Toast.makeText(context, "Setting reset to default ↺", Toast.LENGTH_SHORT).show()
            }
        }
    }
}

class ResetSwitchPreference @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : SwitchPreferenceCompat(context, attrs) {
    init {
        widgetLayoutResource = R.layout.preference_reset_widget
    }

    override fun onBindViewHolder(holder: PreferenceViewHolder) {
        super.onBindViewHolder(holder)
        val resetBtn = holder.findViewById(R.id.btn_reset_preference)
        if (resetBtn != null && key != null) {
            val prefs = preferenceManager?.sharedPreferences
            val defaultVal = PreferenceResetHelper.getDefaultSwitchValue(key)
            val currentVal = prefs?.getBoolean(key, defaultVal) ?: defaultVal
            val isModified = currentVal != defaultVal

            resetBtn.visibility = if (isModified) View.VISIBLE else View.GONE
            resetBtn.setOnClickListener {
                prefs?.edit()?.remove(key)?.apply()
                isChecked = defaultVal
                resetBtn.visibility = View.GONE
                Toast.makeText(context, "Setting reset to default ↺", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
