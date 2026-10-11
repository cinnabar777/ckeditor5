package com.ckeditor.markdownapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

class NoteWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val action = intent.action
        if (action == ACTION_PREV_NOTE || action == ACTION_NEXT_NOTE) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
            if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                val views = RemoteViews(context.packageName, R.layout.widget_layout)
                if (action == ACTION_PREV_NOTE) {
                    views.showPrevious(R.id.widget_flipper)
                } else {
                    views.showNext(R.id.widget_flipper)
                }
                appWidgetManager.partiallyUpdateAppWidget(appWidgetId, views)
            }
        }
    }

    companion object {
        const val ACTION_PREV_NOTE = "com.ckeditor.markdownapp.ACTION_PREV_NOTE"
        const val ACTION_NEXT_NOTE = "com.ckeditor.markdownapp.ACTION_NEXT_NOTE"

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_layout)

            val serviceIntent = Intent(context, NoteWidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
            }
            views.setRemoteAdapter(R.id.widget_flipper, serviceIntent)

            // Setup Prev / Next PendingIntents
            val prevIntent = Intent(context, NoteWidgetProvider::class.java).apply {
                action = ACTION_PREV_NOTE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            views.setOnClickPendingIntent(
                R.id.widget_btn_prev,
                PendingIntent.getBroadcast(context, appWidgetId * 10 + 1, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            )

            val nextIntent = Intent(context, NoteWidgetProvider::class.java).apply {
                action = ACTION_NEXT_NOTE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            views.setOnClickPendingIntent(
                R.id.widget_btn_next,
                PendingIntent.getBroadcast(context, appWidgetId * 10 + 2, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            )

            // Setup Settings Button PendingIntent
            val settingsIntent = Intent(context, WidgetSettingsActivity::class.java)
            views.setOnClickPendingIntent(
                R.id.widget_btn_settings,
                PendingIntent.getActivity(context, appWidgetId * 10 + 3, settingsIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            )

            // Item click template to open file in MainActivity
            val clickIntent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
            }
            val clickPendingIntent = PendingIntent.getActivity(
                context,
                0,
                clickIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )
            views.setPendingIntentTemplate(R.id.widget_flipper, clickPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val ids = appWidgetManager.getAppWidgetIds(ComponentName(context, NoteWidgetProvider::class.java))
            appWidgetManager.notifyAppWidgetViewDataChanged(ids, R.id.widget_flipper)
            for (id in ids) {
                updateWidget(context, appWidgetManager, id)
            }
        }
    }
}
