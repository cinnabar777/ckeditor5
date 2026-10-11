package com.ckeditor.markdownapp

import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class WidgetSettingsActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyTextView: TextView
    private lateinit var adapter: WidgetNotesAdapter
    private val items = mutableListOf<WidgetNoteItem>()

    private val addDocumentLauncher = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uri?.let { handleAddDocument(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_widget_settings)

        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Home Screen Widget Settings"

        recyclerView = findViewById(R.id.recycler_widget_notes)
        emptyTextView = findViewById(R.id.text_empty_widget)

        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = WidgetNotesAdapter(
            items,
            onMoveUp = { index -> moveItem(index, index - 1) },
            onMoveDown = { index -> moveItem(index, index + 1) },
            onDelete = { index -> removeItem(index) }
        )
        recyclerView.adapter = adapter

        findViewById<Button>(R.id.btn_add_widget_note).setOnClickListener {
            addDocumentLauncher.launch(arrayOf("text/markdown", "text/plain", "*/*"))
        }

        loadItems()
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private fun loadItems() {
        items.clear()
        items.addAll(WidgetNoteManager.getItems(this))
        updateListUI()
    }

    private fun handleAddDocument(uri: Uri) {
        try {
            contentResolver.takePersistableUriPermission(
                uri,
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION or android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }

        val fileName = getFileNameFromUri(uri)
        var snapshotPath = ""

        try {
            contentResolver.openInputStream(uri)?.use { inputStream ->
                val reader = java.io.BufferedReader(java.io.InputStreamReader(inputStream))
                val content = reader.readText()
                val prefs = androidx.preference.PreferenceManager.getDefaultSharedPreferences(this)
                val isDark = prefs.getString("pref_app_theme", "amoled") != "light"
                val generated = WidgetSnapshotHelper.generateTextSnapshot(this, content, fileName, isDark)
                if (generated != null) {
                    snapshotPath = generated
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        WidgetNoteManager.addItem(this, fileName, uri, snapshotPath)
        loadItems()
        NoteWidgetProvider.updateAllWidgets(this)
    }

    private fun moveItem(from: Int, to: Int) {
        if (to < 0 || to >= items.size) return
        val temp = items[from]
        items[from] = items[to]
        items[to] = temp
        WidgetNoteManager.saveItems(this, items)
        adapter.notifyDataSetChanged()
        NoteWidgetProvider.updateAllWidgets(this)
    }

    private fun removeItem(index: Int) {
        if (index < 0 || index >= items.size) return
        val item = items[index]
        WidgetNoteManager.removeItem(this, item.id)
        loadItems()
        NoteWidgetProvider.updateAllWidgets(this)
    }

    private fun updateListUI() {
        adapter.notifyDataSetChanged()
        if (items.isEmpty()) {
            emptyTextView.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        } else {
            emptyTextView.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
        }
    }

    private fun getFileNameFromUri(uri: Uri): String {
        var result: String? = null
        if (uri.scheme == "content") {
            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
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
        return result ?: "Document.md"
    }

    class WidgetNotesAdapter(
        private val items: List<WidgetNoteItem>,
        private val onMoveUp: (Int) -> Unit,
        private val onMoveDown: (Int) -> Unit,
        private val onDelete: (Int) -> Unit
    ) : RecyclerView.Adapter<WidgetNotesAdapter.ViewHolder>() {

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val titleText: TextView = view.findViewById(R.id.item_title)
            val btnUp: Button = view.findViewById(R.id.btn_move_up)
            val btnDown: Button = view.findViewById(R.id.btn_move_down)
            val btnDelete: Button = view.findViewById(R.id.btn_delete)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_widget_setting_note, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val item = items[position]
            holder.titleText.text = item.title
            holder.btnUp.setOnClickListener { onMoveUp(position) }
            holder.btnDown.setOnClickListener { onMoveDown(position) }
            holder.btnDelete.setOnClickListener { onDelete(position) }
        }

        override fun getItemCount(): Int = items.size
    }
}
