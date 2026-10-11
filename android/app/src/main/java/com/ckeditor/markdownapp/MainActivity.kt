package com.ckeditor.markdownapp

import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.preference.PreferenceManager
import androidx.webkit.WebViewAssetLoader
import com.google.android.material.appbar.MaterialToolbar
import org.json.JSONArray
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    private var currentFileUri: Uri? = null
    private var currentFileName: String = "Untitled.md"
    private var isDirty: Boolean = false
    private var isEditorReady: Boolean = false
    private var pendingOpenUri: Uri? = null

    private val openDocumentLauncher = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uri?.let { openFile(it) }
    }

    private val createDocumentLauncher = registerForActivityResult(ActivityResultContracts.CreateDocument("text/markdown")) { uri ->
        uri?.let { saveFileToUri(it) }
    }

    private val pickImageLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { insertImageFromUri(it) }
    }

    private val settingsLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        if (isEditorReady) {
            applyPluginPreferences()
            applyThemeAndFullscreenPreferences()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        WebView.enableSlowWholeDocumentDraw()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        updateTitle()

        setupWebView()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (isDirty) {
                    showUnsavedChangesDialog { finish() }
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        handleIntent(intent)
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: android.content.Intent?) {
        val action = intent?.action
        val targetUriExtra = intent?.getStringExtra("open_target_uri")
        val data: Uri? = if (targetUriExtra != null) Uri.parse(targetUriExtra) else intent?.data

        if (data != null) {
            if (isEditorReady) {
                openFile(data)
            } else {
                pendingOpenUri = data
            }
            return
        }

        // Auto-open last opened document if no explicit intent or extra
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val lastUriString = prefs.getString("last_opened_uri", null)
        if (lastUriString != null) {
            val lastUri = Uri.parse(lastUriString)
            if (isEditorReady) {
                openFile(lastUri)
            } else {
                pendingOpenUri = lastUri
            }
        }
    }


    private fun setupWebView() {
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
        }

        webView.addJavascriptInterface(WebAppInterface(), "AndroidNative")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                return request?.url?.let { assetLoader.shouldInterceptRequest(it) }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
            }
        }

        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
    }

    private fun updateTitle() {
        val dirtyIndicator = if (isDirty) " *" else ""
        val titleText = "$currentFileName$dirtyIndicator"
        val escapedTitle = JSONObjectWrapper.quote(titleText)
        webView.evaluateJavascript("window.editorBridge.setDocumentTitle($escapedTitle);", null)
    }

    private fun applyThemeAndFullscreenPreferences() {
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val themeMode = prefs.getString("pref_app_theme", "amoled") ?: "amoled"

        val escapedTheme = JSONObjectWrapper.quote(themeMode)
        webView.evaluateJavascript("window.editorBridge.setTheme($escapedTheme);", null)

        val bodyFontSize = prefs.getInt("pref_body_font_size", 16)
        val headingScalePercent = prefs.getInt("pref_heading_scale_percent", 100)
        val headingScale = headingScalePercent / 100.0
        val boldColor = JSONObjectWrapper.quote(prefs.getString("pref_bold_color", "default"))
        val italicColor = JSONObjectWrapper.quote(prefs.getString("pref_italic_color", "default"))
        val linkColor = JSONObjectWrapper.quote(prefs.getString("pref_link_color", "default"))
        val codeColor = JSONObjectWrapper.quote(prefs.getString("pref_code_color", "default"))
        val codeBgColor = JSONObjectWrapper.quote(prefs.getString("pref_code_bg_color", "default"))
        val codeBlockColor = JSONObjectWrapper.quote(prefs.getString("pref_code_block_color", "default"))
        val codeBlockBgColor = JSONObjectWrapper.quote(prefs.getString("pref_code_block_bg_color", "default"))

        val fontBodyData = loadFontDataUri(prefs.getString("pref_font_file_body_path", null))
        val fontHeadingData = loadFontDataUri(prefs.getString("pref_font_file_heading_path", null))
        val fontBoldData = loadFontDataUri(prefs.getString("pref_font_file_bold_path", null))
        val fontItalicData = loadFontDataUri(prefs.getString("pref_font_file_italic_path", null))
        val fontCodeData = loadFontDataUri(prefs.getString("pref_font_file_code_path", null))

        val escapedBodyFont = JSONObjectWrapper.quote(fontBodyData)
        val escapedHeadingFont = JSONObjectWrapper.quote(fontHeadingData)
        val escapedBoldFont = JSONObjectWrapper.quote(fontBoldData)
        val escapedItalicFont = JSONObjectWrapper.quote(fontItalicData)
        val escapedCodeFont = JSONObjectWrapper.quote(fontCodeData)

        webView.evaluateJavascript(
            "window.editorBridge.setFontSettings($bodyFontSize, $headingScale, $boldColor, $italicColor, $linkColor, $codeColor, $codeBgColor, $codeBlockColor, $codeBlockBgColor, $escapedBodyFont, $escapedHeadingFont, $escapedBoldFont, $escapedItalicFont, $escapedCodeFont);",
            null
        )

        // Pass Horizontal Rule preferences
        val hrThickness = prefs.getInt("pref_hr_thickness", 2)
        val hrColor = JSONObjectWrapper.quote(prefs.getString("pref_hr_color", "default"))
        val hrWidthPercent = prefs.getInt("pref_hr_width_percent", 100)

        webView.evaluateJavascript(
            "window.editorBridge.setHrSettings($hrThickness, $hrColor, $hrWidthPercent);",
            null
        )

        // Read and pass all custom hotkey preferences
        val hotkeys = mapOf(
            "new" to prefs.getString("pref_hotkey_new", "ctrl+n"),
            "open" to prefs.getString("pref_hotkey_open", "ctrl+o"),
            "save" to prefs.getString("pref_hotkey_save", "ctrl+s"),
            "save_as" to prefs.getString("pref_hotkey_save_as", "ctrl+shift+s"),
            "image" to prefs.getString("pref_hotkey_image", "ctrl+shift+i"),
            "settings" to prefs.getString("pref_hotkey_settings", "ctrl+,"),
            "toggle_toolbar" to prefs.getString("pref_hotkey_toggle_toolbar", "ctrl+t"),
            "bold" to prefs.getString("pref_hotkey_bold", "ctrl+b"),
            "italic" to prefs.getString("pref_hotkey_italic", "ctrl+i"),
            "strikethrough" to prefs.getString("pref_hotkey_strikethrough", "ctrl+shift+x"),
            "code" to prefs.getString("pref_hotkey_code", "ctrl+e"),
            "link" to prefs.getString("pref_hotkey_link", "ctrl+k"),
            "blockQuote" to prefs.getString("pref_hotkey_blockQuote", "ctrl+shift+q"),
            "codeBlock" to prefs.getString("pref_hotkey_codeBlock", "ctrl+shift+c"),
            "bulletedList" to prefs.getString("pref_hotkey_bulletedList", "ctrl+shift+8"),
            "numberedList" to prefs.getString("pref_hotkey_numberedList", "ctrl+shift+7"),
            "todoList" to prefs.getString("pref_hotkey_todoList", "ctrl+shift+l"),
            "horizontalLine" to prefs.getString("pref_hotkey_horizontalLine", "ctrl+shift+h"),
            "findAndReplace" to prefs.getString("pref_hotkey_findAndReplace", "ctrl+f"),
            "sourceEditing" to prefs.getString("pref_hotkey_sourceEditing", "ctrl+shift+u"),
            "heading_p" to prefs.getString("pref_hotkey_heading_p", "ctrl+alt+0"),
            "heading_1" to prefs.getString("pref_hotkey_heading_1", "ctrl+alt+1"),
            "heading_2" to prefs.getString("pref_hotkey_heading_2", "ctrl+alt+2"),
            "heading_3" to prefs.getString("pref_hotkey_heading_3", "ctrl+alt+3"),
            "heading_4" to prefs.getString("pref_hotkey_heading_4", "ctrl+alt+4"),
            "heading_5" to prefs.getString("pref_hotkey_heading_5", "ctrl+alt+5"),
            "heading_6" to prefs.getString("pref_hotkey_heading_6", "ctrl+alt+6"),
            "highlight_yellow" to prefs.getString("pref_hotkey_highlight_yellow", "ctrl+alt+y"),
            "highlight_green" to prefs.getString("pref_hotkey_highlight_green", "ctrl+alt+g"),
            "highlight_pink" to prefs.getString("pref_hotkey_highlight_pink", "ctrl+alt+p"),
            "highlight_blue" to prefs.getString("pref_hotkey_highlight_blue", "ctrl+alt+b"),
            "highlight_remove" to prefs.getString("pref_hotkey_highlight_remove", "ctrl+alt+r")
        )
        val hotkeysJson = org.json.JSONObject(hotkeys).toString()
        val escapedHotkeys = JSONObjectWrapper.quote(hotkeysJson)
        webView.evaluateJavascript("window.editorBridge.setHotkeys($escapedHotkeys);", null)
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_new -> {
                handleNewFile()
                true
            }
            R.id.action_open -> {
                handleOpenFile()
                true
            }
            R.id.action_save -> {
                handleSaveFile()
                true
            }
            R.id.action_save_as -> {
                handleSaveAsFile()
                true
            }
            R.id.action_insert_image -> {
                handleInsertImage()
                true
            }
            R.id.action_settings -> {
                settingsLauncher.launch(android.content.Intent(this, SettingsActivity::class.java))
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun handleNewFile() {
        if (isDirty) {
            showUnsavedChangesDialog { createNewDocument() }
        } else {
            createNewDocument()
        }
    }

    private fun createNewDocument() {
        currentFileUri = null
        currentFileName = getString(R.string.untitled_document)
        isDirty = false
        updateTitle()
        webView.evaluateJavascript("window.editorBridge.setMarkdown('');", null)
    }

    private fun handleOpenFile() {
        if (isDirty) {
            showUnsavedChangesDialog { openDocumentLauncher.launch(arrayOf("text/markdown", "text/plain", "*/*")) }
        } else {
            openDocumentLauncher.launch(arrayOf("text/markdown", "text/plain", "*/*"))
        }
    }

    private fun openFile(uri: Uri) {
        if (!isEditorReady) {
            pendingOpenUri = uri
            return
        }
        try {
            try {
                contentResolver.takePersistableUriPermission(
                    uri,
                    android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION or android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                )
            } catch (e: Exception) {
                // Ignore if not a persistable document grant
            }

            contentResolver.openInputStream(uri)?.use { inputStream ->
                val reader = BufferedReader(InputStreamReader(inputStream))
                val content = reader.readText()
                currentFileUri = uri
                currentFileName = getFileNameFromUri(uri)
                isDirty = false
                updateTitle()

                // Save as last opened URI for auto-restore on next launch
                val prefs = PreferenceManager.getDefaultSharedPreferences(this)
                prefs.edit().putString("last_opened_uri", uri.toString()).apply()

                val escaped = JSONObjectWrapper.quote(content)
                webView.evaluateJavascript("window.editorBridge.setMarkdown($escaped);", null)

                // Restore saved cursor selection and scroll position for this document
                restoreCursorAndScrollState()
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to open file: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
        }
    }

    private fun restoreCursorAndScrollState() {
        val fileName = currentFileName
        if (fileName.isEmpty() || fileName == getString(R.string.untitled_document)) return
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val key = "doc_$fileName"
        val savedSelection = prefs.getString("cursor_sel_$key", null)
        val savedScroll = prefs.getInt("cursor_scroll_$key", 0)
        if (savedSelection != null || savedScroll > 0) {
            val escapedSelection = JSONObjectWrapper.quote(savedSelection ?: "")
            webView.evaluateJavascript("window.editorBridge.setSelectionState($escapedSelection, $savedScroll);", null)
        }
    }

    private fun handleSaveFile() {
        if (currentFileUri != null) {
            currentFileUri?.let { saveFileToUri(it) }
        } else {
            handleSaveAsFile()
        }
    }

    private fun handleSaveAsFile() {
        createDocumentLauncher.launch(currentFileName)
    }

    private fun saveFileToUri(uri: Uri) {
        webView.evaluateJavascript("window.editorBridge.getMarkdown();") { result ->
            val markdownText = JSONObjectWrapper.unquote(result)
            try {
                contentResolver.openOutputStream(uri, "rwt")?.use { outputStream ->
                    val writer = OutputStreamWriter(outputStream)
                    writer.write(markdownText)
                    writer.flush()
                }
                currentFileUri = uri
                currentFileName = getFileNameFromUri(uri)
                isDirty = false
                updateTitle()
                Toast.makeText(this, "File saved successfully", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this, "Failed to save file: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun handleInsertImage() {
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val imageMode = prefs.getString("pref_image_mode", "picker")
        if (imageMode == "url") {
            showImageUrlDialog()
        } else {
            pickImageLauncher.launch("image/*")
        }
    }

    private fun showImageUrlDialog() {
        val input = EditText(this)
        input.hint = "https://example.com/image.png"
        AlertDialog.Builder(this)
            .setTitle("Insert Image URL")
            .setView(input)
            .setPositiveButton("Insert") { _, _ ->
                val url = input.text.toString().trim()
                if (url.isNotEmpty()) {
                    val escapedUrl = JSONObjectWrapper.quote(url)
                    webView.evaluateJavascript("window.editorBridge.insertImage($escapedUrl);", null)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun insertImageFromUri(uri: Uri) {
        try {
            contentResolver.openInputStream(uri)?.use { inputStream ->
                val bytes = inputStream.readBytes()
                val mimeType = contentResolver.getType(uri) ?: "image/png"
                val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                val dataUri = "data:$mimeType;base64,$base64"
                val escapedUri = JSONObjectWrapper.quote(dataUri)
                webView.evaluateJavascript("window.editorBridge.insertImage($escapedUri);", null)
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to insert image: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
        }
    }

    private fun applyPluginPreferences() {
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val disabledPlugins = mutableListOf<String>()

        val keys = listOf(
            "heading", "bold", "italic", "strikethrough", "highlight", "code", "link",
            "image", "blockQuote", "codeBlock", "table", "list",
            "todoList", "horizontalLine", "sourceEditing", "findAndReplace"
        )

        for (key in keys) {
            val enabled = prefs.getBoolean("pref_plugin_$key", true)
            if (!enabled) {
                disabledPlugins.add(key)
            }
        }

        val jsonArray = JSONArray(disabledPlugins)
        val escapedJson = JSONObjectWrapper.quote(jsonArray.toString())
        webView.evaluateJavascript("window.editorBridge.configurePlugins($escapedJson);", null)
    }

    private fun showUnsavedChangesDialog(onConfirm: () -> Unit) {
        AlertDialog.Builder(this)
            .setTitle(R.string.unsaved_changes_title)
            .setMessage(R.string.unsaved_changes_message)
            .setPositiveButton(R.string.discard) { _, _ -> onConfirm() }
            .setNegativeButton(R.string.cancel, null)
            .show()
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

    private fun loadFontDataUri(path: String?): String {
        if (path.isNullOrEmpty()) return ""
        return try {
            val file = java.io.File(path)
            if (!file.exists()) return ""
            val bytes = file.readBytes()
            val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
            val mimeType = when {
                path.endsWith(".otf", ignoreCase = true) -> "font/otf"
                path.endsWith(".woff2", ignoreCase = true) -> "font/woff2"
                path.endsWith(".woff", ignoreCase = true) -> "font/woff"
                else -> "font/ttf"
            }
            "data:$mimeType;base64,$base64"
        } catch (e: Exception) {
            ""
        }
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun onContentChanged() {
            runOnUiThread {
                if (!isDirty) {
                    isDirty = true
                    updateTitle()
                }
            }
        }

        @JavascriptInterface
        fun onEditorReady() {
            runOnUiThread {
                isEditorReady = true
                applyPluginPreferences()
                applyThemeAndFullscreenPreferences()
                updateTitle()

                pendingOpenUri?.let { uri ->
                    pendingOpenUri = null
                    openFile(uri)
                }
            }
        }

        @JavascriptInterface
        fun onNativeAction(action: String) {
            runOnUiThread {
                when (action) {
                    "new" -> handleNewFile()
                    "open" -> handleOpenFile()
                    "save" -> handleSaveFile()
                    "save_as" -> handleSaveAsFile()
                    "image" -> handleInsertImage()
                    "settings" -> settingsLauncher.launch(android.content.Intent(this@MainActivity, SettingsActivity::class.java))
                }
            }
        }

        @JavascriptInterface
        fun onSelectionChanged(selectionJson: String) {
            val fileName = currentFileName
            if (fileName.isEmpty() || fileName == getString(R.string.untitled_document)) return
            val key = "doc_$fileName"
            val prefs = PreferenceManager.getDefaultSharedPreferences(this@MainActivity)
            prefs.edit().putString("cursor_sel_$key", selectionJson).apply()
        }

        @JavascriptInterface
        fun onScrollChanged(scrollTop: Int) {
            val fileName = currentFileName
            if (fileName.isEmpty() || fileName == getString(R.string.untitled_document)) return
            val key = "doc_$fileName"
            val prefs = PreferenceManager.getDefaultSharedPreferences(this@MainActivity)
            prefs.edit().putInt("cursor_scroll_$key", scrollTop).apply()
        }
    }

    object JSONObjectWrapper {
        fun quote(string: String?): String {
            return org.json.JSONObject.quote(string ?: "")
        }

        fun unquote(quoted: String): String {
            if (quoted.isEmpty() || quoted == "null") return ""
            return try {
                org.json.JSONTokener(quoted).nextValue().toString()
            } catch (e: Exception) {
                quoted
            }
        }
    }
}
