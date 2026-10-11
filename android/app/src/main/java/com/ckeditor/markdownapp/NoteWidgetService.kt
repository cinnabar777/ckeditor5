package com.ckeditor.markdownapp

import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import java.io.File

class NoteWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return NoteRemoteViewsFactory(this.applicationContext)
    }
}

class NoteRemoteViewsFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {

    private val items = mutableListOf<WidgetNoteItem>()

    override fun onCreate() {}

    override fun onDataSetChanged() {
        items.clear()
        items.addAll(WidgetNoteManager.getItems(context))
    }

    override fun onDestroy() {
        items.clear()
    }

    override fun getCount(): Int = items.size

    override fun getViewAt(position: Int): RemoteViews {
        if (position < 0 || position >= items.size) {
            return RemoteViews(context.packageName, R.layout.widget_item)
        }

        val item = items[position]
        val rv = RemoteViews(context.packageName, R.layout.widget_item)

        if (item.snapshotPath.isNotEmpty()) {
            val file = File(item.snapshotPath)
            if (file.exists()) {
                val bitmap = BitmapFactory.decodeFile(file.absolutePath)
                if (bitmap != null) {
                    rv.setImageViewBitmap(R.id.widget_snapshot_image, bitmap)
                }
            }
        }

        // Fill-in Intent to open file on tap
        if (item.uriString.isNotEmpty()) {
            val fillInIntent = Intent().apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse(item.uriString)
            }
            rv.setOnClickFillInIntent(R.id.widget_item_container, fillInIntent)
        }

        return rv
    }

    override fun getLoadingView(): RemoteViews? = null

    override fun getViewTypeCount(): Int = 1

    override fun getItemId(position: Int): Long = position.toLong()

    override fun hasStableIds(): Boolean = true
}
