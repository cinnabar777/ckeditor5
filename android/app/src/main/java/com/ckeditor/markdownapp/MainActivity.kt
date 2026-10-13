package com.ckeditor.markdownapp

import android.content.Context
import android.graphics.Color
import android.net.Uri
import android.os.Build
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
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.preference.PreferenceManager
import androidx.webkit.WebViewAssetLoader
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
    private var latestMarkdownContent: String? = null
    private var pendingOpenUri: Uri? = null
    private var currentToast: Toast? = null
    private val documentHistoryStack = java.util.ArrayDeque<Uri>()

    private fun showCustomToast(message: String) {
        runOnUiThread {
            try {
                currentToast?.cancel()
            } catch (e: Exception) {}

            val prefs = PreferenceManager.getDefaultSharedPreferences(this)
            val isLightTheme = prefs.getString("pref_app_theme", "amoled") == "light"

            val textView = android.widget.TextView(this).apply {
                text = message
                textSize = 14f
                setPadding(
                    (16 * resources.displayMetrics.density).toInt(),
                    (10 * resources.displayMetrics.density).toInt(),
                    (16 * resources.displayMetrics.density).toInt(),
                    (10 * resources.displayMetrics.density).toInt()
                )
                gravity = android.view.Gravity.CENTER

                val bgDrawable = android.graphics.drawable.GradientDrawable().apply {
                    cornerRadius = 20 * resources.displayMetrics.density
                    if (isLightTheme) {
                        setColor(Color.parseColor("#E0E0E0"))
                    } else {
                        setColor(Color.parseColor("#282828"))
                    }
                }
                background = bgDrawable
                setTextColor(if (isLightTheme) Color.parseColor("#111111") else Color.parseColor("#FFFFFF"))
            }

            val toast = Toast(this).apply {
                duration = Toast.LENGTH_SHORT
                view = textView
            }
            currentToast = toast
            toast.show()
        }
    }

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
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        applySystemBarDimming()

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        updateTitle()

        setupWebView()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val prefs = PreferenceManager.getDefaultSharedPreferences(this@MainActivity)
                val isMultiWindowEnabled = prefs.getBoolean("pref_multi_window", true)

                if (!isMultiWindowEnabled && documentHistoryStack.isNotEmpty()) {
                    if (isDirty) {
                        showUnsavedChangesDialog { navigateBackOrFinish() }
                    } else {
                        navigateBackOrFinish()
                    }
                } else {
                    if (isDirty) {
                        showUnsavedChangesDialog { finish() }
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
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

    private fun applySystemBarDimming() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.statusBarColor = Color.BLACK
            window.navigationBarColor = Color.BLACK
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LOW_PROFILE
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            )
            val insetsController = WindowCompat.getInsetsController(window, window.decorView)
            insetsController.isAppearanceLightStatusBars = false
            insetsController.isAppearanceLightNavigationBars = false
            insetsController.show(WindowInsetsCompat.Type.systemBars())
        }
    }

    private fun handleIntent(intent: android.content.Intent?) {
        if (intent == null) return
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val isMultiWindowEnabled = prefs.getBoolean("pref_multi_window", true)

        if (intent.getBooleanExtra("is_new_document", false)) {
            currentFileUri = null
            currentFileName = getString(R.string.untitled_document)
            isDirty = false
            updateTitle()
            if (isEditorReady) {
                webView.evaluateJavascript("window.editorBridge.setMarkdown('');", null)
            }
            return
        }

        val targetUriExtra = intent.getStringExtra("open_target_uri")
        val data: Uri? = if (targetUriExtra != null) Uri.parse(targetUriExtra) else intent.data

        if (data != null) {
            if (currentFileUri == data) {
                return
            }

            if (isMultiWindowEnabled) {
                val am = getSystemService(Context.ACTIVITY_SERVICE) as? android.app.ActivityManager
                if (am != null) {
                    for (appTask in am.appTasks) {
                        val baseIntent = appTask.taskInfo.baseIntent
                        val taskData = baseIntent.data ?: (baseIntent.getStringExtra("open_target_uri")?.let { Uri.parse(it) })
                        if (taskData == data && appTask.taskInfo.taskId != taskId) {
                            appTask.moveToFront()
                            if (currentFileUri == null) {
                                finish()
                            }
                            return
                        }
                    }
                }

                if (currentFileUri != null && (intent.flags and android.content.Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY == 0)) {
                    val newIntent = android.content.Intent(this, MainActivity::class.java).apply {
                        action = android.content.Intent.ACTION_VIEW
                        setDataAndType(data, "text/markdown")
                        putExtra("open_target_uri", data.toString())
                        addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_DOCUMENT or android.content.Intent.FLAG_ACTIVITY_MULTIPLE_TASK)
                    }
                    startActivity(newIntent)
                    finish()
                    return
                }
            } else {
                val am = getSystemService(Context.ACTIVITY_SERVICE) as? android.app.ActivityManager
                if (am != null) {
                    for (appTask in am.appTasks) {
                        if (appTask.taskInfo.taskId != taskId) {
                            appTask.moveToFront()
                            val passIntent = android.content.Intent(this, MainActivity::class.java).apply {
                                action = android.content.Intent.ACTION_VIEW
                                setDataAndType(data, "text/markdown")
                                putExtra("open_target_uri", data.toString())
                                addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP or android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                            }
                            startActivity(passIntent)
                            if (currentFileUri == null) {
                                finish()
                            }
                            return
                        }
                    }
                }
            }

            if (isEditorReady) {
                openFile(data)
            } else {
                pendingOpenUri = data
            }
            return
        }

        if (currentFileUri != null) {
            return
        }

        val startupMode = prefs.getString("pref_startup_document", "last_opened") ?: "last_opened"
        when (startupMode) {
            "last_opened" -> {
                val lastUriString = prefs.getString("last_opened_uri", null)
                if (lastUriString != null) {
                    val lastUri = Uri.parse(lastUriString)
                    if (isEditorReady) {
                        openFile(lastUri)
                    } else {
                        pendingOpenUri = lastUri
                    }
                } else {
                    createNewDocument()
                }
            }
            "custom" -> {
                val customUriString = prefs.getString("pref_startup_custom_document_uri", null)
                if (customUriString != null) {
                    val customUri = Uri.parse(customUriString)
                    if (isEditorReady) {
                        openFile(customUri)
                    } else {
                        pendingOpenUri = customUri
                    }
                } else {
                    createNewDocument()
                }
            }
            else -> {
                createNewDocument()
            }
        }
    }

    override fun onPause() {
        super.onPause()
        performAutoSaveOnLeave()
    }

    override fun onStop() {
        super.onStop()
        performAutoSaveOnLeave()
    }

    private fun performAutoSaveOnLeave() {
        if (!isDirty || currentFileUri == null) return
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val autoSaveEnabled = prefs.getBoolean("pref_auto_save_on_leave", true)
        if (autoSaveEnabled) {
            val contentToSave = latestMarkdownContent
            if (contentToSave != null) {
                try {
                    currentFileUri?.let { uri ->
                        contentResolver.openOutputStream(uri, "rwt")?.use { outputStream ->
                            val writer = OutputStreamWriter(outputStream)
                            writer.write(contentToSave)
                            writer.flush()
                        }
                        isDirty = false
                        updateTitle()
                    }
                } catch (e: Exception) {
                    currentFileUri?.let { saveFileToUri(it) }
                }
            } else {
                currentFileUri?.let { saveFileToUri(it) }
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

    private fun saveCurrentStateBeforeSettings() {
        if (!isEditorReady) return
        webView.evaluateJavascript("window.editorBridge.getSelectionState();") { selectionJson ->
            val fileName = currentFileName
            if (fileName.isNotEmpty() && fileName != getString(R.string.untitled_document)) {
                val key = "doc_$fileName"
                val prefs = PreferenceManager.getDefaultSharedPreferences(this)
                prefs.edit().putString("cursor_sel_$key", selectionJson).apply()
            }
        }
    }

    private fun applyThemeAndFullscreenPreferences() {
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val themeMode = prefs.getString("pref_app_theme", "amoled") ?: "amoled"

        val escapedTheme = JSONObjectWrapper.quote(themeMode)
        webView.evaluateJavascript("window.editorBridge.setTheme($escapedTheme);", null)

        val bodyFontSize = prefs.getInt("pref_body_font_size", 16)
        val headingScalePercent = prefs.getInt("pref_heading_scale_percent", 100)
        val headingScale = headingScalePercent / 100.0
        val fontWeightBold = prefs.getInt("pref_font_weight_bold", 700)
        val fontWeightItalic = prefs.getInt("pref_font_weight_italic", 400)
        val fontWeightHeading = prefs.getInt("pref_font_weight_heading", 700)

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
            "window.editorBridge.setFontSettings($bodyFontSize, $headingScale, $boldColor, $italicColor, $linkColor, $codeColor, $codeBgColor, $codeBlockColor, $codeBlockBgColor, $escapedBodyFont, $escapedHeadingFont, $escapedBoldFont, $escapedItalicFont, $escapedCodeFont, $fontWeightBold, $fontWeightItalic, $fontWeightHeading);",
            null
        )

        val lineWrap = prefs.getBoolean("pref_line_wrap", true)
        webView.evaluateJavascript("window.editorBridge.setLineWrap($lineWrap);", null)

        val h1Color = JSONObjectWrapper.quote(prefs.getString("pref_heading_1_color", "default"))
        val h2Color = JSONObjectWrapper.quote(prefs.getString("pref_heading_2_color", "default"))
        val h3Color = JSONObjectWrapper.quote(prefs.getString("pref_heading_3_color", "default"))
        val h4Color = JSONObjectWrapper.quote(prefs.getString("pref_heading_4_color", "default"))
        val h5Color = JSONObjectWrapper.quote(prefs.getString("pref_heading_5_color", "default"))
        val h6Color = JSONObjectWrapper.quote(prefs.getString("pref_heading_6_color", "default"))

        webView.evaluateJavascript("window.editorBridge.setHeadingColors($h1Color, $h2Color, $h3Color, $h4Color, $h5Color, $h6Color);", null)

        // Pass Toolbar preferences
        val toolbarBgColor = JSONObjectWrapper.quote(prefs.getString("pref_toolbar_bg_color", "default"))
        val toolbarIconColor = JSONObjectWrapper.quote(prefs.getString("pref_toolbar_icon_color", "default"))
        val toolbarHeight = prefs.getInt("pref_toolbar_height", 48)

        webView.evaluateJavascript("window.editorBridge.setToolbarSettings($toolbarBgColor, $toolbarIconColor, $toolbarHeight);", null)

        // Pass Horizontal Rule preferences
        val hrThickness = prefs.getInt("pref_hr_thickness", 2)
        val hrColor = JSONObjectWrapper.quote(prefs.getString("pref_hr_color", "default"))
        val hrWidthPercent = prefs.getInt("pref_hr_width_percent", 100)

        webView.evaluateJavascript(
            "window.editorBridge.setHrSettings($hrThickness, $hrColor, $hrWidthPercent);",
            null
        )

        // Pass Typography settings
        val justifyParagraph = prefs.getBoolean("pref_justify_paragraph", false)
        val paragraphLineHeight = JSONObjectWrapper.quote(prefs.getString("pref_paragraph_line_height", "1.6"))
        val letterSpacing = JSONObjectWrapper.quote(prefs.getString("pref_letter_spacing", "0px"))

        webView.evaluateJavascript(
            "window.editorBridge.setTypographySettings($justifyParagraph, $paragraphLineHeight, $letterSpacing);",
            null
        )

        // Pass Blockquote & Callout line settings
        val bqThickness = prefs.getInt("pref_blockquote_line_thickness", 4)
        val bqColor = JSONObjectWrapper.quote(prefs.getString("pref_blockquote_line_color", "default"))
        val calloutThickness = prefs.getInt("pref_callout_line_thickness", 4)
        val calloutColor = JSONObjectWrapper.quote(prefs.getString("pref_callout_line_color", "default"))

        webView.evaluateJavascript(
            "window.editorBridge.setBlockquoteAndCalloutSettings($bqThickness, $bqColor, $calloutThickness, $calloutColor);",
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
            "line_wrap" to prefs.getString("pref_hotkey_line_wrap", "ctrl+alt+w"),
            "bold" to prefs.getString("pref_hotkey_bold", "ctrl+b"),
            "italic" to prefs.getString("pref_hotkey_italic", "ctrl+i"),
            "underline" to prefs.getString("pref_hotkey_underline", "ctrl+u"),
            "strikethrough" to prefs.getString("pref_hotkey_strikethrough", "ctrl+shift+x"),
            "code" to prefs.getString("pref_hotkey_code", "ctrl+e"),
            "link" to prefs.getString("pref_hotkey_link", "ctrl+k"),
            "blockQuote" to prefs.getString("pref_hotkey_blockQuote", "ctrl+shift+q"),
            "codeBlock" to prefs.getString("pref_hotkey_codeBlock", "ctrl+shift+c"),
            "bulletedList" to prefs.getString("pref_hotkey_bulletedList", "ctrl+shift+8"),
            "numberedList" to prefs.getString("pref_hotkey_numberedList", "ctrl+shift+7"),
            "todoList" to prefs.getString("pref_hotkey_todoList", "ctrl+shift+l"),
            "indent" to prefs.getString("pref_hotkey_indent", "tab"),
            "outdent" to prefs.getString("pref_hotkey_outdent", "shift+tab"),
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
            "highlight_red" to prefs.getString("pref_hotkey_highlight_red", "ctrl+alt+r"),
            "highlight_red_pen" to prefs.getString("pref_hotkey_highlight_red_pen", "ctrl+alt+r"),
            "highlight_green_pen" to prefs.getString("pref_hotkey_highlight_green_pen", "ctrl+alt+shift+g"),
            "highlight_remove" to prefs.getString("pref_hotkey_highlight_remove", "ctrl+alt+x")
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
                saveCurrentStateBeforeSettings()
                settingsLauncher.launch(android.content.Intent(this, SettingsActivity::class.java))
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun handleNewFile() {
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val isMultiWindowEnabled = prefs.getBoolean("pref_multi_window", true)

        if (isMultiWindowEnabled && currentFileUri != null) {
            handleNewWindow()
            return
        }

        if (isDirty) {
            showUnsavedChangesDialog { createNewDocument() }
        } else {
            createNewDocument()
        }
    }

    private fun createNewDocument() {
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val isMultiWindowEnabled = prefs.getBoolean("pref_multi_window", true)
        if (!isMultiWindowEnabled && currentFileUri != null) {
            documentHistoryStack.push(currentFileUri)
        }
        currentFileUri = null
        currentFileName = getString(R.string.untitled_document)
        isDirty = false
        updateTitle()
        webView.evaluateJavascript("window.editorBridge.setMarkdown('');", null)
    }

    private fun navigateBackOrFinish() {
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val isMultiWindowEnabled = prefs.getBoolean("pref_multi_window", true)

        if (!isMultiWindowEnabled && documentHistoryStack.isNotEmpty()) {
            val previousUri = documentHistoryStack.pop()
            openFileFromHistory(previousUri)
        } else {
            finish()
        }
    }

    private fun openFileFromHistory(uri: Uri) {
        if (!isEditorReady) return
        try {
            contentResolver.openInputStream(uri)?.use { inputStream ->
                val reader = BufferedReader(InputStreamReader(inputStream))
                val content = reader.readText()
                currentFileUri = uri
                currentFileName = getFileNameFromUri(uri)
                isDirty = false
                updateTitle()

                val prefs = PreferenceManager.getDefaultSharedPreferences(this)
                prefs.edit().putString("last_opened_uri", uri.toString()).apply()

                val escaped = JSONObjectWrapper.quote(content)
                webView.evaluateJavascript("window.editorBridge.setMarkdown($escaped);") {
                    restoreCursorAndScrollState()
                }
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to open file from history: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            if (documentHistoryStack.isNotEmpty()) {
                navigateBackOrFinish()
            }
        }
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

        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val isMultiWindowEnabled = prefs.getBoolean("pref_multi_window", true)

        if (isMultiWindowEnabled) {
            if (currentFileUri == uri) {
                return
            }

            val am = getSystemService(Context.ACTIVITY_SERVICE) as? android.app.ActivityManager
            if (am != null) {
                for (appTask in am.appTasks) {
                    val baseIntent = appTask.taskInfo.baseIntent
                    val taskData = baseIntent.data ?: (baseIntent.getStringExtra("open_target_uri")?.let { Uri.parse(it) })
                    if (taskData == uri && appTask.taskInfo.taskId != taskId) {
                        appTask.moveToFront()
                        return
                    }
                }
            }

            if (currentFileUri != null) {
                val newIntent = android.content.Intent(this, MainActivity::class.java).apply {
                    action = android.content.Intent.ACTION_VIEW
                    setDataAndType(uri, "text/markdown")
                    putExtra("open_target_uri", uri.toString())
                    addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_DOCUMENT or android.content.Intent.FLAG_ACTIVITY_MULTIPLE_TASK)
                }
                startActivity(newIntent)
                return
            }
        } else {
            if (currentFileUri != null && currentFileUri != uri) {
                documentHistoryStack.push(currentFileUri)
            }
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

                prefs.edit().putString("last_opened_uri", uri.toString()).apply()

                val escaped = JSONObjectWrapper.quote(content)
                webView.evaluateJavascript("window.editorBridge.setMarkdown($escaped);") {
                    restoreCursorAndScrollState()
                }
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

    private fun handleNewWindow() {
        val prefs = PreferenceManager.getDefaultSharedPreferences(this)
        val isMultiWindowEnabled = prefs.getBoolean("pref_multi_window", true)

        if (!isMultiWindowEnabled) {
            Toast.makeText(this, "Multi-window mode is disabled in Settings", Toast.LENGTH_SHORT).show()
            return
        }

        val intent = android.content.Intent(this, MainActivity::class.java).apply {
            action = android.content.Intent.ACTION_MAIN
            addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_DOCUMENT or android.content.Intent.FLAG_ACTIVITY_MULTIPLE_TASK)
            putExtra("is_new_document", true)
        }
        startActivity(intent)
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
            "todoList", "indent", "horizontalLine", "sourceEditing", "findAndReplace", "autoformat"
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
        fun showToast(message: String) {
            showCustomToast(message)
        }

        @JavascriptInterface
        fun onContentChanged(markdownText: String) {
            latestMarkdownContent = markdownText
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
                    "new_window" -> handleNewWindow()
                    "settings" -> settingsLauncher.launch(android.content.Intent(this@MainActivity, SettingsActivity::class.java))
                }
            }
        }

        @JavascriptInterface
        fun onSelectionChanged(selectionJson: String) {
            val fileName = currentFileName
            if (fileName.isEmpty() || fileName == getString(R.string.untitled_document)) return
            if (selectionJson.isEmpty() || selectionJson == "{\"path\":[],\"offset\":0}" || selectionJson == "{}") return
            val key = "doc_$fileName"
            val prefs = PreferenceManager.getDefaultSharedPreferences(this@MainActivity)
            prefs.edit().putString("cursor_sel_$key", selectionJson).apply()
        }

        @JavascriptInterface
        fun restoreNativeCursorAndScrollState() {
            runOnUiThread {
                restoreCursorAndScrollState()
            }
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
