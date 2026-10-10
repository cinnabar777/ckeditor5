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

    private lateinit var toolbar: MaterialToolbar
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    private var currentFileUri: Uri? = null
    private var currentFileName: String = "Untitled.md"
    private var isDirty: Boolean = false
    private var isEditorReady: Boolean = false

    private val openDocumentLauncher = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uri?.let { openFile(it) }
    }

    private val createDocumentLauncher = registerForActivityResult(ActivityResultContracts.CreateDocument("text/markdown")) { uri ->
        uri?.let { saveFileToUri(it) }
    }

    private val pickImageLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { insertImageFromUri(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        toolbar = findViewById(R.id.toolbar)
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        setSupportActionBar(toolbar)
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
    }

    override fun onResume() {
        super.onResume()
        if (isEditorReady) {
            applyPluginPreferences()
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
        supportActionBar?.title = "$currentFileName$dirtyIndicator"
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
                startActivity(android.content.Intent(this, SettingsActivity::class.java))
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
        try {
            contentResolver.openInputStream(uri)?.use { inputStream ->
                val reader = BufferedReader(InputStreamReader(inputStream))
                val content = reader.readText()
                currentFileUri = uri
                currentFileName = getFileNameFromUri(uri)
                isDirty = false
                updateTitle()

                val escaped = JSONObjectWrapper.quote(content)
                webView.evaluateJavascript("window.editorBridge.setMarkdown($escaped);", null)
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to open file: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
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
            "heading", "bold", "italic", "strikethrough", "code", "link",
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
            }
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
