package com.ckeditor.markdownapp

import android.content.Context
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

data class WidgetNoteItem(
    val id: String,
    val title: String,
    val uriString: String,
    val snapshotPath: String
)

object WidgetNoteManager {

    private const val PREF_NAME = "widget_notes_pref"
    private const val KEY_ITEMS = "widget_items_json"
    private const val KEY_THEME = "widget_theme"

    fun getItems(context: Context): MutableList<WidgetNoteItem> {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val jsonStr = prefs.getString(KEY_ITEMS, "[]") ?: "[]"
        val list = mutableListOf<WidgetNoteItem>()
        try {
            val jsonArray = JSONArray(jsonStr)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                list.add(
                    WidgetNoteItem(
                        id = obj.optString("id", System.currentTimeMillis().toString()),
                        title = obj.optString("title", "Untitled.md"),
                        uriString = obj.optString("uriString", ""),
                        snapshotPath = obj.optString("snapshotPath", "")
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }

    fun saveItems(context: Context, items: List<WidgetNoteItem>) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val jsonArray = JSONArray()
        for (item in items) {
            val obj = JSONObject()
            obj.put("id", item.id)
            obj.put("title", item.title)
            obj.put("uriString", item.uriString)
            obj.put("snapshotPath", item.snapshotPath)
            jsonArray.put(obj)
        }
        prefs.edit().putString(KEY_ITEMS, jsonArray.toString()).apply()
    }

    fun addItem(context: Context, title: String, uri: Uri, snapshotPath: String): WidgetNoteItem {
        val items = getItems(context)
        val newItem = WidgetNoteItem(
            id = System.currentTimeMillis().toString(),
            title = title,
            uriString = uri.toString(),
            snapshotPath = snapshotPath
        )
        // Avoid duplicate URIs
        items.removeAll { it.uriString == uri.toString() }
        items.add(newItem)
        saveItems(context, items)
        return newItem
    }

    fun removeItem(context: Context, id: String) {
        val items = getItems(context)
        val target = items.find { it.id == id }
        if (target != null) {
            if (target.snapshotPath.isNotEmpty()) {
                val file = File(target.snapshotPath)
                if (file.exists()) {
                    file.delete()
                }
            }
            items.remove(target)
            saveItems(context, items)
        }
    }

    fun updateSnapshotPath(context: Context, uriString: String, snapshotPath: String) {
        val items = getItems(context)
        var updated = false
        for (i in items.indices) {
            if (items[i].uriString == uriString) {
                items[i] = items[i].copy(snapshotPath = snapshotPath)
                updated = true
            }
        }
        if (updated) {
            saveItems(context, items)
        }
    }

    fun getWidgetTheme(context: Context): String {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_THEME, "amoled") ?: "amoled"
    }

    fun setWidgetTheme(context: Context, theme: String) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_THEME, theme).apply()
    }
}
