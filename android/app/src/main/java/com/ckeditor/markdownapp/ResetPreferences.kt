package com.ckeditor.markdownapp

import android.content.Context
import android.util.AttributeSet
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.Toast
import androidx.preference.EditTextPreference
import androidx.preference.ListPreference
import androidx.preference.Preference
import androidx.preference.PreferenceManager
import androidx.preference.PreferenceViewHolder
import androidx.preference.SeekBarPreference
import androidx.preference.SwitchPreferenceCompat
import java.io.File

interface ResettablePreference {
    fun callNotifyChanged()
}

object PreferenceResetHelper {

    fun getDefaultValue(key: String): Any? {
        return when {
            key == "pref_body_font_size" -> 16
            key == "pref_heading_scale_percent" -> 100
            key == "pref_font_weight_bold" -> 700
            key == "pref_font_weight_italic" -> 400
            key == "pref_font_weight_heading" -> 700
            key == "pref_blockquote_line_thickness" -> 4
            key == "pref_blockquote_line_color" -> "default"
            key == "pref_callout_line_thickness" -> 4
            key == "pref_callout_line_color" -> "default"
            key == "pref_hr_thickness" -> 2
            key == "pref_hr_color" -> "default"
            key == "pref_hr_width_percent" -> 100
            key == "pref_justify_paragraph" -> false
            key == "pref_paragraph_line_height" -> "1.6"
            key == "pref_letter_spacing" -> "0px"
            key == "pref_line_wrap" -> true
            key == "pref_bold_color" -> "default"
            key == "pref_italic_color" -> "default"
            key == "pref_link_color" -> "default"
            key == "pref_code_color" -> "default"
            key == "pref_code_bg_color" -> "default"
            key == "pref_code_block_color" -> "default"
            key == "pref_code_block_bg_color" -> "default"
            key.startsWith("pref_heading_") && key.endsWith("_color") -> "default"
            key == "pref_toolbar_bg_color" -> "default"
            key == "pref_toolbar_icon_color" -> "default"
            key == "pref_toolbar_height" -> 48
            key == "pref_app_theme" -> "amoled"
            key == "pref_image_mode" -> "picker"
            key == "pref_startup_document" -> "last_opened"
            key == "pref_auto_save_on_leave" -> true
            key == "pref_multi_window" -> true
            key == "pref_hotkey_new" -> "ctrl+n"
            key == "pref_hotkey_open" -> "ctrl+o"
            key == "pref_hotkey_save" -> "ctrl+s"
            key == "pref_hotkey_save_as" -> "ctrl+shift+s"
            key == "pref_hotkey_image" -> "ctrl+shift+i"
            key == "pref_hotkey_settings" -> "ctrl+,"
            key == "pref_hotkey_toggle_toolbar" -> "ctrl+t"
            key == "pref_hotkey_line_wrap" -> "ctrl+alt+w"
            key == "pref_hotkey_bold" -> "ctrl+b"
            key == "pref_hotkey_italic" -> "ctrl+i"
            key == "pref_hotkey_underline" -> "ctrl+u"
            key == "pref_hotkey_strikethrough" -> "ctrl+shift+x"
            key == "pref_hotkey_code" -> "ctrl+e"
            key == "pref_hotkey_link" -> "ctrl+k"
            key == "pref_hotkey_blockQuote" -> "ctrl+shift+q"
            key == "pref_hotkey_codeBlock" -> "ctrl+shift+c"
            key == "pref_hotkey_bulletedList" -> "ctrl+shift+8"
            key == "pref_hotkey_numberedList" -> "ctrl+shift+7"
            key == "pref_hotkey_todoList" -> "ctrl+shift+l"
            key == "pref_hotkey_indent" -> "tab"
            key == "pref_hotkey_outdent" -> "shift+tab"
            key == "pref_hotkey_horizontalLine" -> "ctrl+shift+h"
            key == "pref_hotkey_findAndReplace" -> "ctrl+f"
            key == "pref_hotkey_sourceEditing" -> "ctrl+shift+u"
            key == "pref_hotkey_heading_p" -> "ctrl+alt+0"
            key == "pref_hotkey_heading_1" -> "ctrl+alt+1"
            key == "pref_hotkey_heading_2" -> "ctrl+alt+2"
            key == "pref_hotkey_heading_3" -> "ctrl+alt+3"
            key == "pref_hotkey_heading_4" -> "ctrl+alt+4"
            key == "pref_hotkey_heading_5" -> "ctrl+alt+5"
            key == "pref_hotkey_heading_6" -> "ctrl+alt+6"
            key == "pref_hotkey_highlight_yellow" -> "ctrl+alt+y"
            key == "pref_hotkey_highlight_green" -> "ctrl+alt+g"
            key == "pref_hotkey_highlight_pink" -> "ctrl+alt+p"
            key == "pref_hotkey_highlight_blue" -> "ctrl+alt+b"
            key == "pref_hotkey_highlight_red" -> "ctrl+alt+r"
            key == "pref_hotkey_highlight_red_pen" -> "ctrl+alt+r"
            key == "pref_hotkey_highlight_green_pen" -> "ctrl+alt+shift+g"
            key == "pref_hotkey_highlight_remove" -> "ctrl+alt+x"
            key.startsWith("pref_plugin_") -> true
            else -> null
        }
    }

    fun isModifiedFromDefault(context: Context, key: String?): Boolean {
        if (key == null) return false
        if (key.startsWith("pref_export") || key.startsWith("pref_import") || key == "pref_reset_all_defaults" || key.startsWith("pref_page_") || key.endsWith("_page")) return false

        val prefs = PreferenceManager.getDefaultSharedPreferences(context)

        if (key.startsWith("pref_font_file_")) {
            val fontPath = prefs.getString("${key}_path", null)
            val fontName = prefs.getString("${key}_name", null)
            return !fontPath.isNullOrEmpty() || !fontName.isNullOrEmpty()
        }

        if (!prefs.contains(key)) return false

        val defaultVal = getDefaultValue(key) ?: return false

        return when (defaultVal) {
            is Int -> prefs.getInt(key, defaultVal) != defaultVal
            is Boolean -> prefs.getBoolean(key, defaultVal) != defaultVal
            is String -> prefs.getString(key, defaultVal) != defaultVal
            else -> false
        }
    }

    fun bindResetButton(holder: PreferenceViewHolder, preference: Preference) {
        val context = preference.context
        val key = preference.key ?: return

        if (key.startsWith("pref_export") || key.startsWith("pref_import") || key == "pref_reset_all_defaults" || key.startsWith("pref_page_") || key.endsWith("_page")) {
            return
        }

        val titleView = holder.findViewById(android.R.id.title) as? View ?: return
        var btnReset = holder.itemView.findViewById<ImageView>(R.id.btn_reset_widget)

        if (btnReset == null) {
            btnReset = ImageView(context).apply {
                id = R.id.btn_reset_widget
                setImageResource(R.drawable.ic_reset)
                val paddingPx = (6 * context.resources.displayMetrics.density).toInt()
                setPadding(paddingPx, paddingPx, paddingPx, paddingPx)
                isClickable = true
                isFocusable = true
                contentDescription = "Reset"
                val typedValue = TypedValue()
                context.theme.resolveAttribute(android.R.attr.selectableItemBackgroundBorderless, typedValue, true)
                setBackgroundResource(typedValue.resourceId)
            }

            val sizePx = (32 * context.resources.displayMetrics.density).toInt()
            val marginPx = (4 * context.resources.displayMetrics.density).toInt()
            val params = LinearLayout.LayoutParams(sizePx, sizePx).apply {
                gravity = Gravity.CENTER_VERTICAL
                marginStart = marginPx
                marginEnd = marginPx
            }

            val titleParent = titleView.parent as? ViewGroup
            if (titleParent is LinearLayout) {
                val index = titleParent.indexOfChild(titleView)
                titleParent.addView(btnReset, index + 1, params)
            } else if (titleParent != null) {
                val row = LinearLayout(context).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER_VERTICAL
                }
                val index = titleParent.indexOfChild(titleView)
                titleParent.removeView(titleView)
                row.addView(titleView, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                row.addView(btnReset, params)
                titleParent.addView(row, index)
            }
        }

        val isModified = isModifiedFromDefault(context, key)
        if (isModified) {
            btnReset.visibility = View.VISIBLE
            btnReset.setOnClickListener {
                resetSinglePreference(context, preference)
            }
        } else {
            btnReset.visibility = View.GONE
        }
    }

    fun resetSinglePreference(context: Context, pref: Preference) {
        val key = pref.key ?: return
        val prefs = PreferenceManager.getDefaultSharedPreferences(context)

        if (key.startsWith("pref_font_file_")) {
            prefs.edit().remove("${key}_path").remove("${key}_name").apply()
            val fontDir = File(context.filesDir, "fonts")
            if (fontDir.exists()) {
                fontDir.listFiles()?.forEach { file ->
                    if (file.name.startsWith(key)) {
                        file.delete()
                    }
                }
            }
            if (pref.summary != null) {
                pref.summary = "Tap to pick a font file (.ttf, .otf, .woff, .woff2)"
            }
            if (pref is ResettablePreference) {
                pref.callNotifyChanged()
            }
            Toast.makeText(context, "Font reset to default system font", Toast.LENGTH_SHORT).show()
            return
        }

        prefs.edit().remove(key).apply()

        val defVal = getDefaultValue(key)
        when (pref) {
            is SeekBarPreference -> {
                if (defVal is Int) pref.value = defVal
            }
            is EditTextPreference -> {
                if (defVal is String) pref.text = defVal
            }
            is ListPreference -> {
                if (defVal is String) pref.value = defVal
            }
            is SwitchPreferenceCompat -> {
                if (defVal is Boolean) pref.isChecked = defVal
            }
        }
        if (pref is ResettablePreference) {
            pref.callNotifyChanged()
        }
        Toast.makeText(context, "Setting reset to default ↺", Toast.LENGTH_SHORT).show()
    }
}

open class ResetPreference @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = androidx.preference.R.attr.preferenceStyle
) : Preference(context, attrs, defStyleAttr), ResettablePreference {
    override fun onBindViewHolder(holder: PreferenceViewHolder) {
        super.onBindViewHolder(holder)
        PreferenceResetHelper.bindResetButton(holder, this)
    }
    override fun callNotifyChanged() {
        notifyChanged()
    }
}

open class ResetSeekBarPreference @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = androidx.preference.R.attr.seekBarPreferenceStyle
) : SeekBarPreference(context, attrs, defStyleAttr), ResettablePreference {
    override fun onBindViewHolder(holder: PreferenceViewHolder) {
        super.onBindViewHolder(holder)
        PreferenceResetHelper.bindResetButton(holder, this)
    }
    override fun callNotifyChanged() {
        notifyChanged()
    }
}

open class ResetEditTextPreference @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = androidx.preference.R.attr.editTextPreferenceStyle
) : EditTextPreference(context, attrs, defStyleAttr), ResettablePreference {
    override fun onBindViewHolder(holder: PreferenceViewHolder) {
        super.onBindViewHolder(holder)
        PreferenceResetHelper.bindResetButton(holder, this)
    }
    override fun callNotifyChanged() {
        notifyChanged()
    }
}

open class ResetListPreference @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = androidx.preference.R.attr.dialogPreferenceStyle
) : ListPreference(context, attrs, defStyleAttr), ResettablePreference {
    override fun onBindViewHolder(holder: PreferenceViewHolder) {
        super.onBindViewHolder(holder)
        PreferenceResetHelper.bindResetButton(holder, this)
    }
    override fun callNotifyChanged() {
        notifyChanged()
    }
}

open class ResetSwitchPreference @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = androidx.preference.R.attr.switchPreferenceCompatStyle
) : SwitchPreferenceCompat(context, attrs, defStyleAttr), ResettablePreference {
    override fun onBindViewHolder(holder: PreferenceViewHolder) {
        super.onBindViewHolder(holder)
        PreferenceResetHelper.bindResetButton(holder, this)
    }
    override fun callNotifyChanged() {
        notifyChanged()
    }
}
